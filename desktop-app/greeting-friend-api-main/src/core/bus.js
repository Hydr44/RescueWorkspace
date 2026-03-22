// src/core/bus.js
// Semplice Event Bus globale (no deps)
const listeners = new Map(); // event -> Set(fn)

export const bus = {
  on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(fn);
    return () => listeners.get(event)?.delete(fn);
  },
  once(event, fn) {
    const off = this.on(event, (...args) => { off(); fn(...args); });
    return off;
  },
  emit(event, payload) {
    const set = listeners.get(event);
    if (!set) return;
    for (const fn of [...set]) {
      try { fn(payload); } catch (e) { console.error(`[bus:${event}]`, e); }
    }
  },
  clear() {
    listeners.clear();
  }
};

// Eventi standard suggeriti:
// "open:client" { id }
// "open:transport" { id }
// "open:quote" { id }
// "notify" { type:'success'|'error'|'info', message }