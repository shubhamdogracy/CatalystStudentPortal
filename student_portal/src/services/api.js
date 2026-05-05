const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

// credentials: 'include' sends the httpOnly cookie automatically on every request
const req = (url, options = {}) =>
  fetch(`${BASE_URL}${url}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  }).then(handleResponse);

export const authService = {
  login: (email, password) =>
    req('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  guestSignup: (payload) =>
    req('/auth/guest-signup', { method: 'POST', body: JSON.stringify(payload) }),

  logout: () =>
    req('/auth/logout', { method: 'POST' }),

  me: () => req('/auth/me'),

  updateName: (name) =>
    req('/auth/me', { method: 'PUT', body: JSON.stringify({ name }) }),
};

export const studentService = {
  getAll:     ()            => req('/students'),
  getById:    (id)          => req(`/students/${id}`),
  getMentor:  (id)          => req(`/students/${id}/mentor`),
  create:     (payload)     => req('/students', { method: 'POST', body: JSON.stringify(payload) }),
  update:     (id, payload) => req(`/students/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove:     (id)          => req(`/students/${id}`, { method: 'DELETE' }),
};

export const assignmentService = {
  getByBatch:    (batchId)      => req(`/assignments/batch/${batchId}`),
  getForGuest:   ()             => req('/assignments/guest'),
  getResponses:  (studentId)    => req(`/assignment-responses?studentId=${studentId}`),
  getResponse:   (id)           => req(`/assignment-responses/${id}`),
  start:         (payload)      => req('/assignment-responses', { method: 'POST', body: JSON.stringify(payload) }),
  submit:        (id, payload)  => req(`/assignment-responses/${id}/submit`, { method: 'POST', body: JSON.stringify(payload) }),
};

export const satService = {
  getMyAssignments: (studentId)            => req(`/sat/test/assignments?studentId=${studentId}`),
  startSession:     (assignmentId)         => req('/sat/test/start', { method: 'POST', body: JSON.stringify({ assignment_id: assignmentId }) }),
  submitModule1:    (sessionId, answers)   => req(`/sat/test/${sessionId}/module/1/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  getModule2:       (sessionId)            => req(`/sat/test/${sessionId}/module/2`),
  submitModule2:    (sessionId, answers)   => req(`/sat/test/${sessionId}/module/2/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  getResults:       (sessionId)            => req(`/sat/test/${sessionId}/results`),
};

export const chatService = {
  getConversations: (userId)              => req(`/chat/conversations/${userId}`),
  getMessages:      (userId, otherId, page = 1) => req(`/chat/messages/${userId}/${otherId}?page=${page}`),
  markRead:         (senderId, receiverId) => req('/chat/messages/read', { method: 'PUT', body: JSON.stringify({ senderId, receiverId }) }),
  searchUsers:      (q)                   => req(`/chat/users/search${q ? `?q=${encodeURIComponent(q)}` : ''}`),
};
