import client from './client';

export const createWordBook = data          => client.post('/wordbooks', data);
export const getWordBook    = id            => client.get(`/wordbooks/${id}`);
export const getWords       = id            => client.get(`/wordbooks/${id}/words`);
export const addWord        = (id, data)    => client.post(`/wordbooks/${id}/words`, data);
export const importCSV      = (id, file)    => {
  const form = new FormData();
  form.append('file', file);
  return client.post(`/wordbooks/${id}/import`, form);
};
