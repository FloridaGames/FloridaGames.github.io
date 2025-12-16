/**
 * SCORM Bridge - Client Side
 * Include this script in your REMOTE content (on your server).
 * usage:
 * const bridge = new ScormBridge();
 * await bridge.initialize();
 * await bridge.set('cmi.score.scaled', 0.8);
 * await bridge.commit();
 */

class ScormBridge {
  constructor() {
    this.targetWindow = window.parent; // The LMS Wrapper is the parent
    this.isConnected = false;
    this.requests = {};
    this.requestId = 0;

    // Listen for responses from the Wrapper
    window.addEventListener('message', (event) => {
      const data = event.data;
      if (!data || data.protocol !== 'scorm-bridge') return;

      if (data.type === 'response') {
        const { id, result, error } = data;
        if (this.requests[id]) {
          if (error) this.requests[id].reject(error);
          else this.requests[id].resolve(result);
          delete this.requests[id];
        }
      }
    });
  }

  _send(action, payload = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.requests[id] = { resolve, reject };
      
      this.targetWindow.postMessage({
        protocol: 'scorm-bridge',
        id,
        action,
        payload
      }, '*'); // In production, replace '*' with specific LMS origin if known
    });
  }

  async initialize() {
    console.log("[Bridge] Initializing...");
    const result = await this._send('Initialize');
    this.isConnected = result;
    return result;
  }

  async terminate() {
    return this._send('Terminate');
  }

  async getValue(element) {
    return this._send('GetValue', { element });
  }

  async setValue(element, value) {
    return this._send('SetValue', { element, value });
  }

  async commit() {
    return this._send('Commit');
  }
  
  async getLastError() {
    return this._send('GetLastError');
  }
}

// Expose to window
window.ScormBridge = ScormBridge;
