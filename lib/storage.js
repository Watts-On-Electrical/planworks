// Drop-in replacement for the chat-artifact `window.storage` API.
// Uses browser localStorage. Project data lives under one key per project,
// keeping the door open for multiple-project support later.

const PREFIX = "planworks:";

export const storage = {
  async get(key) {
    if (typeof window === "undefined") return null;
    try {
      const value = window.localStorage.getItem(PREFIX + key);
      if (value === null) return null;
      return { key, value, shared: false };
    } catch (err) {
      console.error("storage.get failed", err);
      return null;
    }
  },

  async set(key, value) {
    if (typeof window === "undefined") return null;
    try {
      window.localStorage.setItem(PREFIX + key, value);
      return { key, value, shared: false };
    } catch (err) {
      // Likely quota exceeded — most often because of a large embedded PDF
      console.error("storage.set failed", err);
      throw err;
    }
  },

  async delete(key) {
    if (typeof window === "undefined") return null;
    try {
      window.localStorage.removeItem(PREFIX + key);
      return { key, deleted: true, shared: false };
    } catch (err) {
      console.error("storage.delete failed", err);
      return null;
    }
  },

  async list(prefix = "") {
    if (typeof window === "undefined") return { keys: [], prefix };
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX + prefix)) {
        keys.push(k.slice(PREFIX.length));
      }
    }
    return { keys, prefix };
  },
};
