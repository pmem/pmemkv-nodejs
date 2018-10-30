const pmemkv = require('bindings')('pmemkv');

class KVEngine {

    constructor(engine, path, size = 8388608) {
        this._closed = false;
        this._kv = new pmemkv.KVEngine(engine, path, size);
        Object.defineProperty(this, '_kv', { configurable: false, writable: false });
    }

    close() {
        if (!this._closed) {
            this._closed = true;
            Object.defineProperty(this, '_closed', {configurable: false, writable: false});
            this._kv.close();
        }
    }

    get closed() {
        return this._closed;
    }

    all(callback) {
        this._kv.all(callback);
    }

    get count() {
        return this._kv.count();
    }

    each(callback) {
        this._kv.each(callback)
    }

    exists(key) {
        return this._kv.exists(key);
    }

    get(key) {
        return this._kv.get(key);
    }

    put(key, value) {
        this._kv.put(key, value);
    }

    remove(key) {
        return this._kv.remove(key);
    }
}

module.exports = KVEngine;