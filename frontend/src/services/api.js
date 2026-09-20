const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TOKEN_KEY = 'buildtrack_jwt_token';
const USER_KEY = 'buildtrack_user_data';

export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export const getStoredUser = () => {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try { return JSON.parse(data); } catch { return null; }
};
export const setStoredUser = (user) => {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
};
export const removeStoredUser = () => localStorage.removeItem(USER_KEY);

export const formatApiError = (status, errorBody, defaultMsg = 'An unexpected error occurred.') => {
  const serverMsg = errorBody?.message || errorBody?.error;
  switch (status) {
    case 400: return serverMsg || 'Invalid request. Please check the submitted data.';
    case 401: return serverMsg || 'Please log in again.';
    case 403: return serverMsg || 'You do not have permission for this action.';
    case 404: return serverMsg || 'The requested item was not found.';
    case 409: return serverMsg || 'The requested change conflicts with existing data.';
    case 500: return serverMsg || 'The server could not complete the request.';
    default: return serverMsg || defaultMsg;
  }
};

async function request(endpoint, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const urls = [];
  if (API_BASE_URL) urls.push(`${API_BASE_URL}${endpoint}`);
  if (endpoint.startsWith('/api')) urls.push(endpoint);

  let response;
  let lastError;
  for (const url of [...new Set(urls)]) {
    try {
      response = await fetch(url, { ...options, headers });
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!response) throw new Error(lastError?.message || 'Unable to connect to BuildTrack backend.');

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    try { data = await response.json(); } catch { data = null; }
  } else {
    try { data = await response.text(); } catch { data = null; }
  }

  if (!response.ok) {
    const message = formatApiError(response.status, typeof data === 'object' ? data : { message: data });
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

const get = (path) => request(path, { method: 'GET' });
const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });
const put = (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) });
const patch = (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) });
const del = (path) => request(path, { method: 'DELETE' });

export const api = {
  login: async ({ email, password }) => {
    const data = await post('/api/auth/login', { email, password });
    if (data?.token) {
      setToken(data.token);
      if (data.user) setStoredUser(data.user);
    }
    return data;
  },
  signup: ({ name, email, password, role }) => post('/api/auth/signup', { name, email, password, role }),
  logout: () => { removeToken(); removeStoredUser(); },

  getProfile: () => get('/api/profile'),

  getProjects: () => get('/api/projects'),
  getProjectById: (id) => get(`/api/projects/${id}`),
  createProject: (body) => post('/api/projects', body),
  updateProject: (id, body) => put(`/api/projects/${id}`, body),
  closeProject: (id) => patch(`/api/projects/${id}/close`, {}),
  deleteProject: (id) => del(`/api/projects/${id}`),

  getProgress: () => get('/api/progress'),
  getProgressById: (id) => get(`/api/progress/${id}`),
  createProgress: (body) => post('/api/progress', body),
  updateProgress: (id, body) => put(`/api/progress/${id}`, body),
  deleteProgress: (id) => del(`/api/progress/${id}`),

  getWorkers: () => get('/api/worker'),
  getWorkerById: (id) => get(`/api/worker/${id}`),
  createWorker: (body) => post('/api/worker', body),
  updateWorker: (id, body) => put(`/api/worker/${id}`, body),
  deleteWorker: (id) => del(`/api/worker/${id}`),

  getAttendance: () => get('/api/attendance'),
  getAttendanceById: (id) => get(`/api/attendance/${id}`),
  createAttendance: (body) => post('/api/attendance', body),
  updateAttendance: (id, body) => put(`/api/attendance/${id}`, body),
  deleteAttendance: (id) => del(`/api/attendance/${id}`),

  getInventory: (page = 1, limit = 100) => get(`/api/inventory?page=${page}&limit=${limit}`),
  getInventoryById: (id) => get(`/api/inventory/${id}`),
  createInventory: (body) => post('/api/inventory', body),
  updateInventory: (id, body) => put(`/api/inventory/${id}`, body),
  deleteInventory: (id) => del(`/api/inventory/${id}`),

  getProcurements: (page = 1, limit = 100) => get(`/api/procurement?page=${page}&limit=${limit}`),
  getProcurementById: (id) => get(`/api/procurement/${id}`),
  createProcurement: (body) => post('/api/procurement', body),
  updateProcurement: (id, body) => put(`/api/procurement/${id}`, body),
  deleteProcurement: (id) => del(`/api/procurement/${id}`),

  getResources: (page = 1, limit = 100) => get(`/api/resources?page=${page}&limit=${limit}`),
  getResourceById: (id) => get(`/api/resources/${id}`),
  createResource: (body) => post('/api/resources', body),
  updateResource: (id, body) => put(`/api/resources/${id}`, body),
  deleteResource: (id) => del(`/api/resources/${id}`),

  getMaterialRequests: () => get('/api/material-requests'),
  createMaterialRequest: (body) => post('/api/material-requests', body),
  updateMaterialRequest: (id, body) => put(`/api/material-requests/${id}`, body),
  deleteMaterialRequest: (id) => del(`/api/material-requests/${id}`),

  getMaterialAllocations: () => get('/api/material-allocations'),
  createMaterialAllocation: (body) => post('/api/material-allocations', body),
  deleteMaterialAllocation: (id) => del(`/api/material-allocations/${id}`),

  getWorkforceAllocations: () => get('/api/workforce-allocations'),
  createWorkforceAllocation: (body) => post('/api/workforce-allocations', body),
  updateWorkforceAllocation: (id, body) => put(`/api/workforce-allocations/${id}`, body),
  deleteWorkforceAllocation: (id) => del(`/api/workforce-allocations/${id}`),

  getShifts: () => get('/api/shifts'),
  createShift: (body) => post('/api/shifts', body),
  updateShift: (id, body) => put(`/api/shifts/${id}`, body),
  deleteShift: (id) => del(`/api/shifts/${id}`),

  getPayroll: () => get('/api/payroll'),
  createPayroll: (body) => post('/api/payroll', body),
  updatePayroll: (id, body) => put(`/api/payroll/${id}`, body),
  deletePayroll: (id) => del(`/api/payroll/${id}`),

  getNotifications: () => get('/api/notifications'),
  updateNotification: (id, body) => put(`/api/notifications/${id}`, body),
  createNotification: (body) => post('/api/notifications', body),
  deleteNotification: (id) => del(`/api/notifications/${id}`),

  getProjectReport: () => get('/api/reports/projects'),
  getProgressReport: () => get('/api/reports/progress'),
  getResourceReport: () => get('/api/reports/resources'),
  getMaterialReport: () => get('/api/reports/materials'),

  getDocuments: () => get('/api/documents'),
  uploadDocument: (formData) => request('/api/documents/upload', { method: 'POST', body: formData }),
  deleteDocument: (id) => del(`/api/documents/${id}`),
};

export default api;
