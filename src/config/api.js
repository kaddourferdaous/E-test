// src/config/api.js
export const API_BASE_URL = import.meta.env.VITE_API_VERCEL;

// Optionnel : créer une instance axios configurée
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});