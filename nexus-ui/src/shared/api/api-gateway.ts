const REMOTE_API_GATEWAY_ORIGIN = "https://api-gateway-chat-service.onrender.com";

export const API_GATEWAY_ORIGIN = import.meta.env.DEV
  ? window.location.origin
  : REMOTE_API_GATEWAY_ORIGIN;

export const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : `${REMOTE_API_GATEWAY_ORIGIN}/api`;
