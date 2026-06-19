const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function teacherRegister(req, res, next) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: '이메일, 비밀번호, 이름은 필수입니다.' });
    }

    const existing = await prisma.teacher.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const teacher = await prisma.teacher.create({
      data: { email, password: hashed, name },
      select: { id: true, email: true, name: true },
    });

    const token = signToken({ sub: teacher.id, role: 'teacher', name: teacher.name });
    res.status(201).json({ token, teacher });
  } catch (err) {
    next(err);
  }
}

async function teacherLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력하세요.' });
    }

    const teacher = await prisma.teacher.findUnique({ where: { email } });
    if (!teacher || !(await bcrypt.compare(password, teacher.password))) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = signToken({ sub: teacher.id, role: 'teacher', name: teacher.name });
    res.json({ token, teacher: { id: teacher.id, email: teacher.email, name: teacher.name } });
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

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: '이메일을 입력하세요.' });

    const teacher = await prisma.teacher.findUnique({ where: { email } });
    if (!teacher) return res.json({ message: '이메일을 확인하세요.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1시간

    await prisma.teacher.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    await resend.emails.send({
      from: `WordDay <${from}>`,
      to: email,
      subject: '[WordDay] 비밀번호 재설정',
      html: `
        <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:40px 20px;">
          <h2 style="font-size:28px;font-weight:900;margin-bottom:8px;">WordDay.</h2>
          <p style="color:#555;margin-bottom:32px;">비밀번호 재설정을 요청하셨습니다.<br/>아래 버튼을 눌러 1시간 이내에 재설정하세요.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#000;color:#fff;padding:14px 28px;border-radius:100px;text-decoration:none;font-weight:700;font-size:15px;">비밀번호 재설정</a>
          <p style="color:#bbb;font-size:12px;margin-top:32px;">요청하지 않으셨다면 이 이메일을 무시하세요.</p>
        </div>
      `,
    });

    res.json({ message: '이메일을 확인하세요.' });
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

module.exports = { teacherRegister, teacherLogin, studentLogin, forgotPassword, resetPassword, changeStudentPassword };
