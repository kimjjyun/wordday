import client from './client';

export const getTodayWords  = ()           => client.get('/study/today');
export const submitReview   = data         => client.post('/study/review', data);
export const getStats       = ()           => client.get('/study/stats');
export const getWrongWords  = ()           => client.get('/study/wrong');
