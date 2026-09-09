const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbywkEazy2EG_zcA_F_W4wqkXPvs9HvBhXG8KnTvs4DLI-NOB75rjUDQh-3bhh2H7fzC/exec';
const AUTH_KEY = 'vigven_dbc_admin_password';

export const getToken = () => localStorage.getItem(AUTH_KEY) || '';
export const setToken = (value) => localStorage.setItem(AUTH_KEY, value);
export const clearToken = () => localStorage.removeItem(AUTH_KEY);

async function post(action, payload = {}, auth = false) {
  const body = { action, ...payload };
  if (auth) body.password = getToken();
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (data.error) throw new Error(data.error);
  return data;
}

async function getCard(id) {
  const res = await fetch(`${APPS_SCRIPT_URL}?action=card&id=${encodeURIComponent(id)}`);
  const data = await res.json().catch(() => ({}));
  if (data.error) throw new Error(data.error);
  return data;
}

export const api = {
  login: async (password) => { await post('login', { password }); return password; },
  list: () => post('list', {}, true),
  create: (employee) => post('create', { employee }, true),
  update: (id, employee) => post('update', { id, employee }, true),
  remove: (id) => post('delete', { id }, true),
  card: getCard,
};
