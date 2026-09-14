// Centralized API Client for BuildTrack Frontend
// Configured to communicate with http://localhost:5000 or via VITE_API_URL

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TOKEN_KEY = 'buildtrack_jwt_token';
const USER_KEY = 'buildtrack_user_data';

// Token Management
export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

// User Profile Management
export const getStoredUser = () => {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};
export const setStoredUser = (user) => {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
};
export const removeStoredUser = () => localStorage.removeItem(USER_KEY);

// Format user-friendly error messages based on status codes and response bodies
export const formatApiError = (status, errorBody, defaultMsg = 'An unexpected error occurred.') => {
  const serverMsg = errorBody?.message || errorBody?.error;

  switch (status) {
    case 400:
      return serverMsg || 'Invalid request. Please verify the submitted data.';
    case 401:
      return serverMsg || 'Unauthorized access. Please log in with valid credentials.';
    case 403:
      return serverMsg || 'Access denied. You do not have permission for this resource.';
    case 404:
      return serverMsg || 'Requested resource was not found on the server.';
    case 409:
      return serverMsg || 'Conflict. The specified resource or user already exists.';
    case 500:
      return serverMsg || 'Server error. The backend database or service encountered an issue.';
    default:
      return serverMsg || defaultMsg;
  }
};

// Generic HTTP Request Wrapper
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const primaryUrl = `${API_BASE_URL}${endpoint}`;

  let response;
  try {
    response = await fetch(primaryUrl, {
      ...options,
      headers,
    });
  } catch (netErr) {
    // If direct cross-origin fetch fails (e.g. CORS preflight blocked or offline),
    // attempt fallback through the Vite development proxy (/api/...)
    if (endpoint.startsWith('/api') && API_BASE_URL.startsWith('http')) {
      try {
        response = await fetch(endpoint, {
          ...options,
          headers,
        });
      } catch {
        throw new Error('Network error: Unable to connect to BuildTrack backend at ' + API_BASE_URL);
      }
    } else {
      throw new Error('Network error: Unable to connect to BuildTrack backend at ' + API_BASE_URL);
    }
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMsg = formatApiError(response.status, typeof data === 'object' ? data : { message: data });
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// API Endpoints Mapping
export const api = {
  // ================= 1. AUTHENTICATION =================
  login: async ({ email, password }) => {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data?.token) {
      setToken(data.token);
      if (data.user) setStoredUser(data.user);
    }
    return data;
  },

  signup: async ({ name, email, password, role }) => {
    return request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  },

  logout: () => {
    removeToken();
    removeStoredUser();
  },

  // ================= 2. PROFILE =================
  getProfile: async () => {
    return request('/api/profile', { method: 'GET' });
  },

  // ================= 3. PROJECTS =================
  getProjects: async () => {
    return request('/api/projects', { method: 'GET' });
  },

  getProjectById: async (id) => {
    return request(`/api/projects/${id}`, { method: 'GET' });
  },

  createProject: async (projectData) => {
    return request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  updateProject: async (id, projectData) => {
    return request(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  },

  deleteProject: async (id) => {
    return request(`/api/projects/${id}`, { method: 'DELETE' });
  },

  // ================= 4. MILESTONES / PROGRESS =================
  getProgress: async () => {
    return request('/api/progress', { method: 'GET' });
  },

  getProgressById: async (id) => {
    return request(`/api/progress/${id}`, { method: 'GET' });
  },

  createProgress: async (progressData) => {
    return request('/api/progress', {
      method: 'POST',
      body: JSON.stringify(progressData),
    });
  },

  updateProgress: async (id, progressData) => {
    return request(`/api/progress/${id}`, {
      method: 'PUT',
      body: JSON.stringify(progressData),
    });
  },

  deleteProgress: async (id) => {
    return request(`/api/progress/${id}`, { method: 'DELETE' });
  },

  // ================= 5. WORKERS =================
  getWorkers: async () => {
    return request('/api/worker', { method: 'GET' });
  },

  getWorkerById: async (id) => {
    return request(`/api/worker/${id}`, { method: 'GET' });
  },

  createWorker: async (workerData) => {
    return request('/api/worker', {
      method: 'POST',
      body: JSON.stringify(workerData),
    });
  },

  updateWorker: async (id, workerData) => {
    return request(`/api/worker/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workerData),
    });
  },

  deleteWorker: async (id) => {
    return request(`/api/worker/${id}`, { method: 'DELETE' });
  },

  // ================= 6. ATTENDANCE =================
  getAttendance: async () => {
    return request('/api/attendance', { method: 'GET' });
  },

  getAttendanceById: async (id) => {
    return request(`/api/attendance/${id}`, { method: 'GET' });
  },

  createAttendance: async (attendanceData) => {
    return request('/api/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  },

  updateAttendance: async (id, attendanceData) => {
    return request(`/api/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attendanceData),
    });
  },

  deleteAttendance: async (id) => {
    return request(`/api/attendance/${id}`, { method: 'DELETE' });
  },

  // ================= 7. MATERIALS / INVENTORY =================
  getInventory: async (page = 1, limit = 20) => {
    return request(`/api/inventory?page=${page}&limit=${limit}`, { method: 'GET' });
  },

  getInventoryById: async (id) => {
    return request(`/api/inventory/${id}`, { method: 'GET' });
  },

  createInventory: async (inventoryData) => {
    return request('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(inventoryData),
    });
  },

  updateInventory: async (id, inventoryData) => {
    return request(`/api/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(inventoryData),
    });
  },

  deleteInventory: async (id) => {
    return request(`/api/inventory/${id}`, { method: 'DELETE' });
  },

  // ================= 8. PROCUREMENT =================
  getProcurements: async (page = 1, limit = 20) => {
    return request(`/api/procurement?page=${page}&limit=${limit}`, { method: 'GET' });
  },

  getProcurementById: async (id) => {
    return request(`/api/procurement/${id}`, { method: 'GET' });
  },

  createProcurement: async (procurementData) => {
    return request('/api/procurement', {
      method: 'POST',
      body: JSON.stringify(procurementData),
    });
  },

  updateProcurement: async (id, procurementData) => {
    return request(`/api/procurement/${id}`, {
      method: 'PUT',
      body: JSON.stringify(procurementData),
    });
  },

  deleteProcurement: async (id) => {
    return request(`/api/procurement/${id}`, { method: 'DELETE' });
  },

  // ================= 9. NOTIFICATIONS =================
  getNotifications: async () => {
    return request('/api/notifications', { method: 'GET' });
  },

  getNotificationById: async (id) => {
    return request(`/api/notifications/${id}`, { method: 'GET' });
  },

  createNotification: async (notifData) => {
    return request('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(notifData),
    });
  },

  updateNotification: async (id, notifData) => {
    return request(`/api/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(notifData),
    });
  },

  deleteNotification: async (id) => {
    return request(`/api/notifications/${id}`, { method: 'DELETE' });
  },

  // ================= 10. RESOURCES (Machinery & Heavy Equipment) =================
  getResources: async (page = 1, limit = 20) => {
    return request(`/api/resources?page=${page}&limit=${limit}`, { method: 'GET' });
  },

  getResourceById: async (id) => {
    return request(`/api/resources/${id}`, { method: 'GET' });
  },

  createResource: async (resourceData) => {
    return request('/api/resources', {
      method: 'POST',
      body: JSON.stringify(resourceData),
    });
  },

  updateResource: async (id, resourceData) => {
    return request(`/api/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(resourceData),
    });
  },

  deleteResource: async (id) => {
    return request(`/api/resources/${id}`, { method: 'DELETE' });
  },

  // ================= 11. REPORTS =================
  getProjectReport: async () => {
    return request('/api/reports/projects', { method: 'GET' });
  },

  getProgressReport: async () => {
    return request('/api/reports/progress', { method: 'GET' });
  },

  getResourceReport: async () => {
    return request('/api/reports/resources', { method: 'GET' });
  },

  getMaterialReport: async () => {
    return request('/api/reports/materials', { method: 'GET' });
  },
};

export default api;
