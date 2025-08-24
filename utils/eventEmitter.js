// Simple event emitter for cross-component communication
class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
        return () => this.removeListener(event, listener);
    }

    removeListener(event, listener) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listener);
    }

    emit(event, ...args) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => {
            listener(...args);
        });
    }
}

// Create a singleton instance
const eventEmitter = new EventEmitter();

// Event names
export const EVENTS = {
    REFERENCE_SCANNED: 'REFERENCE_SCANNED',
    CAMERA_OPENED: 'CAMERA_OPENED',
    CAMERA_CLOSED: 'CAMERA_CLOSED',
};

export default eventEmitter;