const pmemkv = require('bindings')('pmemkv');

class KVEngine {

    constructor(engine, config) {
        this._stopped = false;
        const cb = function (context, engine, config, msg) {
            throw new Error(msg);
        }
        this._kv = new pmemkv.KVEngine(engine, config, cb);
        Object.defineProperty(this, '_kv', {configurable: false, writable: false});
    }

    stop() {
        if (!this._stopped) {
            this._stopped = true;
            Object.defineProperty(this, '_stopped', {configurable: false, writable: false});
            this._kv.stop();
        }
    }

    get stopped() {
        return this._stopped;
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