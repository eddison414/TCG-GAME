export class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(listener);
    
    return () => {
      this.events[event] = this.events[event].filter(l => l !== listener);
    };
  }
  
  emit(event, data) {
    try {
      if (this.events[event]) {
        this.events[event].forEach(listener => listener(data));
      }
      return true;
    } catch (error) {
      console.error(`Error emitting ${event}:`, error);
      return false;
    }
  }
  
  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}