import api from './client';

export const authApi = {
    signup: (data) => api.post('/api/auth/signup', data).then((r) => r.data),
    login: (data) => api.post('/api/auth/login', data).then((r) => r.data),
    me: () => api.get('/api/auth/me').then((r) => r.data),
};

export const eventsApi = {
    list: (params) => api.get('/api/events', { params }).then((r) => r.data),
    get: (id) => api.get(`/api/events/${id}`).then((r) => r.data),
    create: (data) => api.post('/api/events', data).then((r) => r.data),
    cancel: (id) => api.patch(`/api/events/${id}/cancel`).then((r) => r.data),
    messages: (id) => api.get(`/api/events/${id}/messages`).then((r) => r.data),
};

export const ticketsApi = {
    book: (data) => api.post('/api/tickets/book', data).then((r) => r.data),
    mine: () => api.get('/api/tickets/me').then((r) => r.data),
};

export const adminApi = {
    dashboard: () => api.get('/api/admin/dashboard').then((r) => r.data),
    requests: (status = 'pending') => api.get('/api/admin/requests', { params: { status } }).then((r) => r.data),
    reviewRequest: (id, decision, notes) =>
        api.patch(`/api/admin/requests/${id}`, { decision, notes }).then((r) => r.data),
    checkIn: (qrHash) => api.post('/api/admin/check-in', { qrHash }).then((r) => r.data),
};

export const suggestionsApi = {
    create: (data) => api.post('/api/suggestions', data).then((r) => r.data),
    list: (params) => api.get('/api/suggestions', { params }).then((r) => r.data),
};