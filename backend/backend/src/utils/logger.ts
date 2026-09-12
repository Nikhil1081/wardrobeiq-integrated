type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function sanitize(data: any): any {
  if (typeof data === 'string') {
    return data
      .replace(/mongodb(\+srv)?:\/\/[^@\s]+@/g, 'mongodb+srv://[REDACTED]@')
      .replace(/sk-[A-Za-z0-9_-]{20,}/g, 'sk-[REDACTED]');
  }
  if (data && typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(sanitize);
    }
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (/key|secret|password|uri|token|auth/i.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitize(value);
      }
    }
    return sanitized;
  }
  return data;
}

export const logger = {
  info: (message: string, context?: Record<string, any>) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, context ? JSON.stringify(sanitize(context)) : '');
  },
  warn: (message: string, context?: Record<string, any>) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, context ? JSON.stringify(sanitize(context)) : '');
  },
  error: (message: string, error?: any, context?: Record<string, any>) => {
    const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, JSON.stringify(sanitize({ error: errorDetails, ...context })));
  },
  debug: (message: string, context?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, context ? JSON.stringify(sanitize(context)) : '');
    }
  },
};
