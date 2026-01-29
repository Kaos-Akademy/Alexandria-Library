// Logger utility for better debugging and error tracking
// Based on Eternity project patterns

export const logger = {
  log: (context: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[${timestamp}] [${context}] ${message}`, data);
    } else {
      console.log(`[${timestamp}] [${context}] ${message}`);
    }
  },
  
  error: (context: string, message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    if (error) {
      console.error(`[${timestamp}] [${context}] ❌ ${message}`, error);
      if (error instanceof Error && error.stack) {
        console.error(`[${timestamp}] [${context}] 📚 Stack trace:`, error.stack);
      }
    } else {
      console.error(`[${timestamp}] [${context}] ❌ ${message}`);
    }
  },
  
  warn: (context: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    if (data) {
      console.warn(`[${timestamp}] [${context}] ⚠️ ${message}`, data);
    } else {
      console.warn(`[${timestamp}] [${context}] ⚠️ ${message}`);
    }
  },
  
  info: (context: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    if (data) {
      console.info(`[${timestamp}] [${context}] ℹ️ ${message}`, data);
    } else {
      console.info(`[${timestamp}] [${context}] ℹ️ ${message}`);
    }
  },
};
