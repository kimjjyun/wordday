const { z } = require('zod');

const teacherRegisterSchema = z.object({
  email: z.string().min(1, '아이디를 입력하세요.').max(50),
  password: z.string().min(4, '비밀번호는 4자 이상이어야 합니다.').max(100),
  name: z.string().min(1, '이름을 입력하세요.').max(50),
  securityQuestion: z.string().min(1, '보안 질문을 선택하세요.'),
  securityAnswer: z.string().min(1, '보안 답변을 입력하세요.').max(100),
});

const teacherLoginSchema = z.object({
  email: z.string().min(1, '아이디를 입력하세요.'),
  password: z.string().min(1, '비밀번호를 입력하세요.'),
});

const studentLoginSchema = z.object({
  studentCode: z.string().min(1, '학생 코드를 입력하세요.').max(20),
  password: z.string().min(1, '비밀번호를 입력하세요.'),
  classCode: z.string().optional(),
});

const changeStudentPasswordSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력하세요.'),
  newPassword: z.string().min(4, '새 비밀번호는 4자 이상이어야 합니다.').max(100),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, '토큰이 필요합니다.'),
  password: z.string().min(4, '비밀번호는 4자 이상이어야 합니다.').max(100),
});

const createClassSchema = z.object({
  name: z.string().min(1, '학급 이름을 입력하세요.').max(100),
});

const createWordBookSchema = z.object({
  classId: z.string().min(1, 'classId는 필수입니다.'),
  title: z.string().min(1, '단어장 이름을 입력하세요.').max(100),
  week: z.number({ required_error: 'week는 필수입니다.' }).int().min(0),
});

const addWordSchema = z.object({
  english: z.string().min(1, '영단어를 입력하세요.').max(200),
  korean: z.string().min(1, '뜻을 입력하세요.').max(200),
  example: z.string().max(500).optional().nullable(),
  pronunciation: z.string().max(200).optional().nullable(),
});

module.exports = {
  teacherRegisterSchema,
  teacherLoginSchema,
  studentLoginSchema,
  changeStudentPasswordSchema,
  resetPasswordSchema,
  createClassSchema,
  createWordBookSchema,
  addWordSchema,
};
