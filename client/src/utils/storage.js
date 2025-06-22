export const saveUser = (user, token) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
};

export const clearUser = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};