import client from './client';

export const teacherRegister = data => client.post('/auth/teacher/register', data);
export const teacherLogin    = data => client.post('/auth/teacher/login', data);
export const studentLogin    = data => client.post('/auth/student/login', data);
