import client from './client';

export const teacherRegister        = data => client.post('/auth/teacher/register', data);
export const teacherLogin           = data => client.post('/auth/teacher/login', data);
export const studentLogin           = data => client.post('/auth/student/login', data);
export const forgotPassword         = data => client.post('/auth/teacher/forgot-password', data);
export const resetPasswordApi       = data => client.post('/auth/teacher/reset-password', data);
export const changeStudentPassword  = data => client.patch('/auth/student/password', data);
