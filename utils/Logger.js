export class Logger {
  constructor() {
    this.logs = [];
  }
  
  log(message, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      message,
      ...metadata
    };
    
    this.logs.push(logEntry);
    console.log(`[Game] ${message}`, metadata);
    
    return logEntry;
  }
  
  getLog() {
    return this.logs;
  }
  
  clear() {
    this.logs = [];
  }
}