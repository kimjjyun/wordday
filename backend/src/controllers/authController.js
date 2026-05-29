const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
      student: { id: student.id, name: student.name, studentCode: student.studentCode, class: student.class },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { teacherRegister, teacherLogin, studentLogin };
