require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('시드 데이터 생성 중...\n');

  // 교사 계정
  const hashed = await bcrypt.hash('teacher123', 10);
  const teacher = await prisma.teacher.upsert({
    where: { email: 'teacher@wordday.kr' },
    update: {},
    create: { email: 'teacher@wordday.kr', password: hashed, name: '김선생' },
  });
  console.log('교사 계정 생성');
  console.log('  이메일: teacher@wordday.kr');
  console.log('  비밀번호: teacher123\n');

  // 학급
  const cls = await prisma.class.upsert({
    where: { code: 'TEST01' },
    update: {},
    create: { name: '2학년 3반', code: 'TEST01', teacherId: teacher.id },
  });
  console.log(`학급 생성: ${cls.name}  (입장코드: ${cls.code})\n`);

  // 학생 3명
  const students = [
    { name: '홍길동', studentCode: '2301' },
    { name: '이영희', studentCode: '2302' },
    { name: '박철수', studentCode: '2303' },
  ];
  const stuPw = await bcrypt.hash('1234', 10);
  for (const s of students) {
    await prisma.student.upsert({
      where: { studentCode_classId: { studentCode: s.studentCode, classId: cls.id } },
      update: {},
      create: { name: s.name, studentCode: s.studentCode, password: stuPw, classId: cls.id },
    });
  }
  console.log('학생 계정 생성 (비밀번호: 1234)');
  students.forEach(s => console.log(`  학번: ${s.studentCode}  이름: ${s.name}`));

  // 단어장
  const wb = await prisma.wordBook.upsert({
    where: { id: 'seed-wb-01' },
    update: {},
    create: { id: 'seed-wb-01', title: '1주차 수능 어휘', week: 1, classId: cls.id },
  });
  console.log(`\n단어장 생성: ${wb.title}`);

  // 단어 10개
  const words = [
    { english: 'ambiguous',    korean: '모호한',      example: 'The result was ambiguous.' },
    { english: 'meticulous',   korean: '꼼꼼한',      example: 'She is meticulous.' },
    { english: 'eloquent',     korean: '유창한',      example: 'He gave an eloquent speech.' },
    { english: 'contemplate',  korean: '심사숙고하다', example: 'He contemplated the decision.' },
    { english: 'exemplify',    korean: '예시하다',    example: 'This story exemplifies courage.' },
    { english: 'persevere',    korean: '인내하다',    example: 'You must persevere.' },
    { english: 'inevitable',   korean: '불가피한',    example: 'Change is inevitable.' },
    { english: 'concise',      korean: '간결한',      example: 'Be concise in your writing.' },
    { english: 'diligent',     korean: '근면한',      example: 'She is a diligent student.' },
    { english: 'profound',     korean: '심오한',      example: 'A profound silence fell.' },
  ];

  await prisma.word.deleteMany({ where: { wordBookId: wb.id } });
  for (let i = 0; i < words.length; i++) {
    await prisma.word.create({ data: { ...words[i], wordBookId: wb.id, order: i } });
  }
  console.log(`단어 ${words.length}개 추가 완료\n`);

  console.log('=============================');
  console.log('시드 완료! 로그인 정보:');
  console.log('');
  console.log('[교사]');
  console.log('  이메일:   teacher@wordday.kr');
  console.log('  비밀번호: teacher123');
  console.log('');
  console.log('[학생] 학급 코드: TEST01');
  console.log('  학번: 2301 / 이름: 홍길동 / 비밀번호: 1234');
  console.log('  학번: 2302 / 이름: 이영희 / 비밀번호: 1234');
  console.log('  학번: 2303 / 이름: 박철수 / 비밀번호: 1234');
  console.log('=============================');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
