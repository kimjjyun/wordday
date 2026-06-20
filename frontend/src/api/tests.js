import client from './client';

export const createTest          = data    => client.post('/tests', data);
export const createTestWithWords = data    => client.post('/tests/with-words', data);
export const startTest           = id      => client.patch(`/tests/${id}/start`);
export const finishTest          = id      => client.patch(`/tests/${id}/finish`);
export const submitAnswers       = (id, data) => client.post(`/tests/${id}/submit`, data);
export const getResults          = id  => client.get(`/tests/${id}/results`);
export const getClassActiveTest  = ()  => client.get('/tests/class/active');
