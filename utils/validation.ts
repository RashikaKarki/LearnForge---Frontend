import DOMPurify from 'dompurify';

// Input validation constants
export const VALIDATION_LIMITS = {
  MESSAGE_MAX_LENGTH: 1000,
  MESSAGE_MIN_LENGTH: 1,
  USERNAME_MAX_LENGTH: 50,
  USERNAME_MIN_LENGTH: 2,
  MISSION_TITLE_MAX_LENGTH: 100,
  MISSION_DESCRIPTION_MAX_LENGTH: 2000,
  SESSION_ID_MAX_LENGTH: 100,
  USER_ID_MAX_LENGTH: 100,
} as const;

// Rate limiting constants
export const RATE_LIMITS = {
  MESSAGE_COOLDOWN_MS: 1000, // 1 second between messages
  MAX_MESSAGES_PER_MINUTE: 30,
  MAX_CONNECTION_ATTEMPTS: 5,
  CONNECTION_RETRY_DELAY_MS: 2000,
} as const;

// WebSocket message types
export const VALID_WEBSOCKET_MESSAGE_TYPES = [
  'connected',
  'agent_message', 
  'agent_handover',
  'mission_created',
  'error',
  'ping',
  'pong'
] as const;

export type ValidWebSocketMessageType = typeof VALID_WEBSOCKET_MESSAGE_TYPES[number];

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Sanitize HTML to prevent XSS
  sanitized = DOMPurify.sanitize(sanitized, { 
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: []  // No attributes allowed
  });
  
  return sanitized;
};

// Validate message content
export const validateMessage = (message: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(message);
  
  if (sanitized.length < VALIDATION_LIMITS.MESSAGE_MIN_LENGTH) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (sanitized.length > VALIDATION_LIMITS.MESSAGE_MAX_LENGTH) {
    return { 
      isValid: false, 
      error: `Message too long. Please keep it under ${VALIDATION_LIMITS.MESSAGE_MAX_LENGTH} characters.` 
    };
  }
  
  // Check for potential injection patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
    /expression\s*\(/i,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      return { isValid: false, error: 'Message contains potentially dangerous content' };
    }
  }
  
  return { isValid: true };
};

// Validate WebSocket message structure
export const validateWebSocketMessage = (data: any): { isValid: boolean; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Invalid message format' };
  }
  
  if (!data.type || typeof data.type !== 'string') {
    return { isValid: false, error: 'Missing or invalid message type' };
  }
  
  if (!VALID_WEBSOCKET_MESSAGE_TYPES.includes(data.type as ValidWebSocketMessageType)) {
    return { isValid: false, error: `Invalid message type: ${data.type}` };
  }
  
  // Validate content based on message type
  switch (data.type) {
    case 'connected':
      if (!data.message || typeof data.message !== 'string') {
        return { isValid: false, error: 'Invalid connected message format' };
      }
      break;
      
    case 'agent_message':
      if (!data.message || typeof data.message !== 'string') {
        return { isValid: false, error: 'Invalid agent message format' };
      }
      break;
      
    case 'mission_created':
      if (!data.mission || typeof data.mission !== 'object') {
        return { isValid: false, error: 'Invalid mission created message format' };
      }
      break;
      
    case 'error':
      if (!data.message || typeof data.message !== 'string') {
        return { isValid: false, error: 'Invalid error message format' };
      }
      break;
  }
  
  return { isValid: true };
};

// Validate session ID
export const validateSessionId = (sessionId: string): { isValid: boolean; error?: string } => {
  if (!sessionId || typeof sessionId !== 'string') {
    return { isValid: false, error: 'Session ID is required' };
  }
  
  const sanitized = sanitizeInput(sessionId);
  
  if (sanitized.length === 0) {
    return { isValid: false, error: 'Session ID cannot be empty' };
  }
  
  if (sanitized.length > VALIDATION_LIMITS.SESSION_ID_MAX_LENGTH) {
    return { isValid: false, error: 'Session ID too long' };
  }
  
  // Session ID should only contain alphanumeric characters and hyphens
  if (!/^[a-zA-Z0-9\-_]+$/.test(sanitized)) {
    return { isValid: false, error: 'Session ID contains invalid characters' };
  }
  
  return { isValid: true };
};

// Validate Firebase token
export const validateFirebaseToken = (token: string): { isValid: boolean; error?: string } => {
  if (!token || typeof token !== 'string') {
    return { isValid: false, error: 'Firebase token is required' };
  }
  
  const sanitized = sanitizeInput(token);
  
  if (sanitized.length === 0) {
    return { isValid: false, error: 'Firebase token cannot be empty' };
  }
  
  if (sanitized.length > 2000) { // Firebase tokens are typically longer
    return { isValid: false, error: 'Firebase token too long' };
  }
  
  return { isValid: true };
};

// Validate user ID
export const validateUserId = (userId: string): { isValid: boolean; error?: string } => {
  if (!userId || typeof userId !== 'string') {
    return { isValid: false, error: 'User ID is required' };
  }
  
  const sanitized = sanitizeInput(userId);
  
  if (sanitized.length === 0) {
    return { isValid: false, error: 'User ID cannot be empty' };
  }
  
  if (sanitized.length > VALIDATION_LIMITS.USER_ID_MAX_LENGTH) {
    return { isValid: false, error: 'User ID too long' };
  }
  
  return { isValid: true };
};

// Rate limiting utility
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    return true;
  }
  
  getRemainingTime(key: string, maxAttempts: number, windowMs: number): number {
    const attempts = this.attempts.get(key) || [];
    const now = Date.now();
    const validAttempts = attempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length < maxAttempts) {
      return 0;
    }
    
    const oldestAttempt = Math.min(...validAttempts);
    return windowMs - (now - oldestAttempt);
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// URL encoding utility for safe URL construction
export const encodeUrlParams = (params: Record<string, string>): string => {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
};

// Safe WebSocket URL construction
export const buildWebSocketUrl = (baseUrl: string, sessionId: string, firebaseToken: string): string => {
  const sessionValidation = validateSessionId(sessionId);
  if (!sessionValidation.isValid) {
    throw new Error(`Invalid session ID: ${sessionValidation.error}`);
  }
  
  const tokenValidation = validateFirebaseToken(firebaseToken);
  if (!tokenValidation.isValid) {
    throw new Error(`Invalid Firebase token: ${tokenValidation.error}`);
  }
  
  const params = encodeUrlParams({
    session_id: sessionId,
    token: firebaseToken
  });
  
  return `${baseUrl}?${params}`;
};
