/*
 * Copyright 2017-2018, Intel Corporation
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in
 *       the documentation and/or other materials provided with the
 *       distribution.
 *
 *     * Neither the name of the copyright holder nor the names of its
 *       contributors may be used to endorse or promote products derived
 *       from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

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