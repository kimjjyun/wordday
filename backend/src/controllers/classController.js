const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function generateClassCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function createClass(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: '학급 이름은 필수입니다.' });

    let code;
    let exists = true;
    while (exists) {
      code = generateClassCode();
      exists = await prisma.class.findUnique({ where: { code } });
    }

    const cls = await prisma.class.create({
      data: { name, code, teacherId: req.user.sub },
      select: { id: true, name: true, code: true, createdAt: true },
    });
    res.status(201).json(cls);
  } catch (err) {
    next(err);
  }
}

async function getClasses(req, res, next) {
  try {
    const classes = await prisma.class.findMany({
      where: { teacherId: req.user.sub },
      include: { _count: { select: { students: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(classes.map(c => ({
      id: c.id,
      name: c.name,
      code: c.code,
      studentCount: c._count.students,
      createdAt: c.createdAt,
    })));
  } catch (err) {
    next(err);
  }
}

async function getClass(req, res, next) {
  try {
    const cls = await prisma.class.findFirst({
      where: { id: req.params.id, teacherId: req.user.sub },
      include: {
        students: { select: { id: true, name: true, studentCode: true, createdAt: true } },
        wordBooks: { select: { id: true, title: true, week: true, isActive: true } },
      },
    });
    if (!cls) return res.status(404).json({ error: '학급을 찾을 수 없습니다.' });
    res.json(cls);
  } catch (err) {
    next(err);
  }
}

async function bulkCreateStudents(req, res, next) {
  try {
    const students = req.body; // [{ name, studentCode, password? }]
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: '학생 목록이 비어있습니다.' });
    }

    const cls = await prisma.class.findFirst({
      where: { id: req.params.id, teacherId: req.user.sub },
    });
    if (!cls) return res.status(404).json({ error: '학급을 찾을 수 없습니다.' });

    const errors = [];
    const created = [];

    for (const s of students) {
      if (!s.name || !s.studentCode) {
        errors.push({ studentCode: s.studentCode, reason: '이름 또는 학번 누락' });
        continue;
      }
      try {
        const hashed = await bcrypt.hash(s.password || '1234', 10);
        const student = await prisma.student.create({
          data: { name: s.name, studentCode: String(s.studentCode), password: hashed, classId: cls.id },
        });
        created.push(student);
      } catch (e) {
        errors.push({ studentCode: s.studentCode, reason: '이미 등록된 학번' });
      }
    }

    res.status(201).json({ created: created.length, errors });
  } catch (err) {
    next(err);
  }
}

module.exports = { createClass, getClasses, getClass, bulkCreateStudents };
