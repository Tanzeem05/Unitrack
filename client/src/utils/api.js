const BASE_URL = 'http://localhost:5000/api';

export const api = async (url, method = 'GET', body, isFormData = false) => {
  const fullUrl = `${BASE_URL}${url}`;
  const token = localStorage.getItem('token');

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let requestBody = body;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const res = await fetch(fullUrl, {
    method,
    headers,
    ...(body && { body: requestBody })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};