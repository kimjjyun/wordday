const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// 보안 질문 답변 정규화(공백/대소문자 무시)
const normalizeAnswer = a => String(a || '').trim().toLowerCase();

// FRONTEND_URL은 콤마로 여러 도메인이 들어올 수 있으므로 999 도메인 우선, 없으면 첫 항목 사용
function frontendBase() {
  const bases = (process.env.FRONTEND_URL || 'https://wordday999.netlify.app')
    .split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
  return bases.find(u => u.includes('999')) || bases[0];
}

// 재설정 토큰 발급 후 링크 생성
async function issueResetUrl(teacherId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1시간
  await prisma.teacher.update({
    where: { id: teacherId },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });
  return `${frontendBase()}/reset-password?token=${token}`;
}

async function teacherRegister(req, res, next) {
  try {
    const { email, password, name, securityQuestion, securityAnswer } = req.body;
    if (!email || !password || !name || !securityQuestion || !securityAnswer) {
      return res.status(400).json({ error: '아이디, 비밀번호, 이름, 보안 질문/답변은 필수입니다.' });
    }

    const existing = await prisma.teacher.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: '이미 사용 중인 아이디입니다.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(normalizeAnswer(securityAnswer), 10);
    const teacher = await prisma.teacher.create({
      data: { email, password: hashed, name, securityQuestion, securityAnswer: hashedAnswer },
      select: { id: true, email: true, name: true },
    });

    const token = signToken({ sub: teacher.id, role: 'teacher', name: teacher.name });
    res.status(201).json({ token, teacher: { ...teacher, hasSecurityQuestion: true } });
  } catch (err) {
    next(err);
  }
}

async function teacherLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '아이디와 비밀번호를 입력하세요.' });
    }

    const teacher = await prisma.teacher.findUnique({ where: { email } });
    if (!teacher || !(await bcrypt.compare(password, teacher.password))) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = signToken({ sub: teacher.id, role: 'teacher', name: teacher.name });
    res.json({
      token,
      teacher: {
        id: teacher.id, email: teacher.email, name: teacher.name,
        hasSecurityQuestion: !!(teacher.securityQuestion && teacher.securityAnswer),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function studentLogin(req, res, next) {
  try {
    const { studentCode, password, classCode } = req.body;
    if (!studentCode || !password) {
      return res.status(400).json({ error: '학번과 비밀번호를 입력하세요.' });
    }

    // classCode로 학급 찾기 (선택적 — 없으면 studentCode만으로 검색)
    let student;
    if (classCode) {
      const cls = await prisma.class.findUnique({ where: { code: classCode } });
      if (!cls) return res.status(404).json({ error: '존재하지 않는 학급 코드입니다.' });
      student = await prisma.student.findFirst({
        where: { studentCode, classId: cls.id },
        include: { class: { select: { id: true, name: true } } },
      });
    } else {
      student = await prisma.student.findFirst({
        where: { studentCode },
        include: { class: { select: { id: true, name: true } } },
      });
    }

    if (!student || !(await bcrypt.compare(password, student.password))) {
      return res.status(401).json({ error: '학번 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = signToken({
      sub: student.id,
      role: 'student',
      name: student.name,
      classId: student.classId,
    });
    res.json({
      token,
      student: { id: student.id, name: student.name, studentCode: student.studentCode, classId: student.classId, class: student.class },
    });
  } catch (err) {
    next(err);
  }
}

// 1단계: 이메일로 보안 질문 조회
//  - 질문이 설정된 계정 → 질문 반환(2단계에서 답 검증 필요)
//  - 질문이 없는 기존 계정 → 재설정 링크 직접 반환(설정 전까지 하위호환), 설정 안내 플래그 포함
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: '아이디를 입력하세요.' });

    const teacher = await prisma.teacher.findUnique({ where: { email } });
    if (!teacher) return res.status(404).json({ error: '가입되지 않은 아이디입니다.' });

    if (teacher.securityQuestion && teacher.securityAnswer) {
      return res.json({ securityQuestion: teacher.securityQuestion });
    }

    // 보안 질문 미설정(기존 계정): 즉시 재설정 링크 발급 + 설정 권장
    const resetUrl = await issueResetUrl(teacher.id);
    return res.json({ resetUrl, needsSecuritySetup: true });
  } catch (err) {
    next(err);
  }
}

// 2단계: 보안 질문 답 검증 → 통과 시 재설정 링크 발급
async function verifySecurityAnswer(req, res, next) {
  try {
    const { email, answer } = req.body;
    if (!email || !answer) return res.status(400).json({ error: '답변을 입력하세요.' });

    const teacher = await prisma.teacher.findUnique({ where: { email } });
    if (!teacher || !teacher.securityAnswer) {
      return res.status(404).json({ error: '계정을 찾을 수 없습니다.' });
    }
    const ok = await bcrypt.compare(normalizeAnswer(answer), teacher.securityAnswer);
    if (!ok) return res.status(401).json({ error: '보안 질문의 답이 올바르지 않습니다.' });

    const resetUrl = await issueResetUrl(teacher.id);
    return res.json({ resetUrl });
  } catch (err) {
    next(err);
  }
}

// 로그인한 교사가 보안 질문 설정/변경
async function setSecurityQuestion(req, res, next) {
  try {
    const { securityQuestion, securityAnswer } = req.body;
    if (!securityQuestion || !securityAnswer) {
      return res.status(400).json({ error: '질문과 답변을 모두 입력하세요.' });
    }
    const hashedAnswer = await bcrypt.hash(normalizeAnswer(securityAnswer), 10);
    await prisma.teacher.update({
      where: { id: req.user.sub },
      data: { securityQuestion, securityAnswer: hashedAnswer },
    });
    res.json({ message: '보안 질문이 저장되었습니다.', hasSecurityQuestion: true });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: '올바르지 않은 요청입니다.' });
    if (password.length < 6) return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다.' });

    const teacher = await prisma.teacher.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });
    if (!teacher) return res.status(400).json({ error: '링크가 만료되었거나 올바르지 않습니다.' });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: { password: hashed, resetToken: null, resetTokenExpiry: null },
    });

    res.json({ message: '비밀번호가 변경되었습니다.' });
  } catch (err) {
    next(err);
  }
}

async function changeStudentPassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호를 입력하세요.' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ error: '새 비밀번호는 4자 이상이어야 합니다.' });
    }
    const student = await prisma.student.findUnique({ where: { id: req.user.sub } });
    if (!student || !(await bcrypt.compare(currentPassword, student.password))) {
      return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다.' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.student.update({ where: { id: student.id }, data: { password: hashed } });
    res.json({ message: '비밀번호가 변경되었습니다.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { teacherRegister, teacherLogin, studentLogin, forgotPassword, verifySecurityAnswer, setSecurityQuestion, resetPassword, changeStudentPassword };
