import client from './client';

export const createClass         = data             => client.post('/classes', data);
export const getClasses          = ()               => client.get('/classes');
export const getClass            = id               => client.get(`/classes/${id}`);
export const bulkCreateStudents  = (id, data)       => client.post(`/classes/${id}/students/bulk`, data);
export const deleteStudent       = (classId, stuId) => client.delete(`/classes/${classId}/students/${stuId}`);
