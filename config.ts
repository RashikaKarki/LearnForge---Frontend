
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const WEBSOCKET_HOST = import.meta.env.VITE_WEBSOCKET_HOST || 'localhost:8000';
export const WEBSOCKET_PROTOCOL = import.meta.env.VITE_WEBSOCKET_PROTOCOL || 'ws';
export const WEBSOCKET_API_VERSION = import.meta.env.VITE_WEBSOCKET_API_VERSION || '/api/v1';

export const getPolarisWebSocketUrl = (sessionId: string, token?: string): string => {
  const baseUrl = `${WEBSOCKET_PROTOCOL}://${WEBSOCKET_HOST}${WEBSOCKET_API_VERSION}/mission-commander/ws`;
  const params = new URLSearchParams({
    session_id: sessionId
  });
  if (token) {
    params.append('token', token);
  }
  return `${baseUrl}?${params.toString()}`;
};

// Generic WebSocket URL constructor for other endpoints (using cookies for token)
export const getWebSocketUrl = (endpoint: string, sessionId: string): string => {
  const baseUrl = `${WEBSOCKET_PROTOCOL}://${WEBSOCKET_HOST}${WEBSOCKET_API_VERSION}${endpoint}`;
  const params = new URLSearchParams({
    session_id: sessionId
  });
  return `${baseUrl}?${params.toString()}`;
};

// Mission Ally WebSocket URL constructor
export const getMissionAllyWebSocketUrl = (missionId: string, token: string): string => {
  const baseUrl = `${WEBSOCKET_PROTOCOL}://${WEBSOCKET_HOST}${WEBSOCKET_API_VERSION}/mission-ally/ws`;
  const params = new URLSearchParams({
    mission_id: missionId
  });
  if (token) {
    params.append('token', token);
  }
  return `${baseUrl}?${params.toString()}`;
};
