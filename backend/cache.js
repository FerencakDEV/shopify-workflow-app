class SimpleCache {
  constructor(ttl = 300000) { // 5 minút default
    this.ttl = ttl;
    this.cache = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    const isExpired = (Date.now() - entry.timestamp) > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value) {
    this.cache.set(key, { value, timestamp: Date.now() });
  }
}

module.exports = SimpleCache;
