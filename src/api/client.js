// API client. Every function here maps to one endpoint in docs/API_CONTRACT.md.
// With VITE_USE_MOCK=true (default) the calls are answered by ./mock.js instead of the backend.
import * as mock from './mock.js';
import { ApiError } from './errors.js';

export { ApiError };

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false';
const BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TIMEOUT_MS = 15000;

async function request(method, path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    throw new ApiError(0, 'NETWORK_ERROR', e.name === 'AbortError' ? 'The request timed out.' : 'Could not reach the server.');
  } finally {
    clearTimeout(timer);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error || {};
    throw new ApiError(res.status, err.code || 'HTTP_' + res.status, err.message || res.statusText, err.details);
  }
  return data;
}

export const api = {
  /** GET /api/health */
  health: () => (USE_MOCK ? mock.health() : request('GET', '/health')),
  /** GET /api/majors */
  getMajors: () => (USE_MOCK ? mock.getMajors() : request('GET', '/majors')),
  /** GET /api/units?major={id} */
  getUnits: (major) => (USE_MOCK ? mock.getUnits(major) : request('GET', `/units?major=${encodeURIComponent(major)}`)),
  /** POST /api/recommend  { major, completed_units }  (Jira 3.1.3, Thinh's DAG engine) */
  getPathway: (major, completedUnits) =>
    USE_MOCK ? mock.getPathway(major, completedUnits) : request('POST', '/recommend', { major, completed_units: completedUnits }),
  /** POST /api/chat  { question, history } */
  chat: (question, history = []) => (USE_MOCK ? mock.chat(question, history) : request('POST', '/chat', { question, history })),
  /** GET /api/trends */
  getTrends: () => (USE_MOCK ? mock.getTrends() : request('GET', '/trends')),
};

export const usingMock = USE_MOCK;
