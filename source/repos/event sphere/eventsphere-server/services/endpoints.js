// src/endpoints.js
import api from './client'; // Use your existing client.js

export const getEvents = async (query = {}) => {
    // Note: The path must start with /api because of your server.js routes
    const response = await api.get('/events', {
        params: query
    });
    return response.data;
};