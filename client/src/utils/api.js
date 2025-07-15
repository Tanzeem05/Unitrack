const BASE_URL = 'http://localhost:5000/api';

export const api = async (url, method = 'GET', body = null, isFormData = false) => {
  // Validate parameters
  if (typeof url !== 'string') {
    throw new Error(`URL must be a string, got ${typeof url}: ${url}`);
  }
  
  if (typeof method !== 'string') {
    console.error('Invalid method type:', typeof method, method);
    console.error('All parameters:', { url, method, body, isFormData });
    throw new Error(`Method must be a string, got ${typeof method}: ${method}`);
  }
  
  const fullUrl = `${BASE_URL}${url}`;
  const token = localStorage.getItem('token');

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let requestBody = body;
  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const res = await fetch(fullUrl, {
    method: method.toUpperCase(),
    headers,
    ...(body && { body: requestBody })
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

// Get total unread message count for authenticated user
export const getUnreadMessageCount = async () => {
  return await api('/messages/unread-count');
};

// Get current courses for a student
export const getCurrentCourses = async (username) => {
  return await api(`/courses/user/${username}/current`);
};

// Get completed courses for a student
export const getCompletedCourses = async (username) => {
  return await api(`/courses/user/${username}/completed`);
};

// Get courses taught by a teacher
export const getTeacherCourses = async (username) => {
  return await api(`/courses/teacher/${username}`);
};