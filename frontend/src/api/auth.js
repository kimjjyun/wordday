import client from './client';

export const teacherRegister  = data => client.post('/auth/teacher/register', data);
export const teacherLogin     = data => client.post('/auth/teacher/login', data);
export const studentLogin     = data => client.post('/auth/student/login', data);
export const forgotPassword   = data => client.post('/auth/teacher/forgot-password', data);
export const verifySecurity   = data => client.post('/auth/teacher/verify-security', data);
export const setSecurityQuestion = data => client.post('/auth/teacher/security-question', data);
export const resetPasswordApi        = data => client.post('/auth/teacher/reset-password', data);
export const changeStudentPassword   = data => client.post('/auth/student/change-password', data);
