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

const ffi = require('ffi');
const ref = require('ref');

const PMEMKV_LIB = process.env.PMEMKV_LIB;

const PMEMKV_PATH = (typeof PMEMKV_LIB === 'undefined') ? 'libpmemkv.so' : PMEMKV_LIB;

const pmemkv = ffi.Library(PMEMKV_PATH, {
    'kvengine_start': ['pointer', ['pointer', 'string', 'string', 'pointer']],
    'kvengine_stop': ['void', ['pointer']],
    'kvengine_all': ['void', ['pointer', 'pointer', 'pointer']],
    'kvengine_count': ['int64', ['pointer']],
    'kvengine_each': ['void', ['pointer', 'pointer', 'pointer']],
    'kvengine_exists': ['int8', ['pointer', 'int32', 'pointer']],
    'kvengine_get': ['int8', ['pointer', 'pointer', 'int32', 'pointer', 'pointer']],
    'kvengine_put': ['int8', ['pointer', 'int32', 'pointer', 'int32', 'pointer']],
    'kvengine_remove': ['int8', ['pointer', 'int32', 'pointer']]
});

class KVEngine {

    constructor(engine, config) {
        this._stopped = false;
        const cb = ffi.Callback('void', ['pointer', 'string', 'string', 'string'],
            function (context, engine, config, msg) {
                throw new Error(msg);
            }
        );
        this._kv = pmemkv.kvengine_start(null, engine, config, cb);
        Object.defineProperty(this, '_kv', {configurable: false, writable: false});
    }

    stop() {
        if (!this._stopped) {
            this._stopped = true;
            Object.defineProperty(this, '_stopped', {configurable: false, writable: false});
            pmemkv.kvengine_stop(this._kv);
        }
    }

    get stopped() {
        return this._stopped;
    }

    all(callback) {
        const cb = ffi.Callback('void', ['pointer', 'int32', 'pointer'],
            function (context, keybytes, key) {
                callback(ref.reinterpret(key, keybytes, 0).toString());
            }
        );
        pmemkv.kvengine_all(this._kv, null, cb);
    }

    get count() {
        return pmemkv.kvengine_count(this._kv);
    }

    each(callback) {
        const cb = ffi.Callback('void', ['pointer', 'int32', 'pointer', 'int32', 'pointer'],
            function (context, keybytes, key, valuebytes, value) {
                const k = ref.reinterpret(key, keybytes, 0).toString();
                const v = ref.reinterpret(value, valuebytes, 0).toString();
                callback(k, v);
            }
        );
        pmemkv.kvengine_each(this._kv, null, cb);
    }

    exists(key) {
        const ckey = new Buffer(key);
        return pmemkv.kvengine_exists(this._kv, ckey.length, ckey) === 1;
    }

    get(key) {
        const ckey = new Buffer(key);
        let result = undefined;
        const callback = ffi.Callback('void', ['pointer', 'int32', 'pointer'],
            function (context, valuebytes, value) {
                result = ref.reinterpret(value, valuebytes, 0).toString();
            }
        );
        pmemkv.kvengine_get(this._kv, null, ckey.length, ckey, callback);
        return result;
    }

    put(key, value) {
        const ckey = new Buffer(key);
        const cvalue = new Buffer(value);
        const result = pmemkv.kvengine_put(this._kv, ckey.length, ckey, cvalue.length, cvalue);
        if (result < 0) throw new Error(`Unable to put key`);
    }

    remove(key) {
        const ckey = new Buffer(key);
        let result = pmemkv.kvengine_remove(this._kv, ckey.length, ckey);
        if (result < 0) throw new Error(`Unable to remove key`);
        return result === 1;
    }
}

module.exports = KVEngine;
