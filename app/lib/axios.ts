import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true, // Exemplo: enviar cookies (necessário para autenticação de sessão)
});