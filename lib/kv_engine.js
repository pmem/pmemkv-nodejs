/*
 * Copyright 2017, Intel Corporation
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

const pmemkv = ffi.Library('/usr/local/lib/libpmemkv.so', {
    'kvengine_open': ['pointer', ['string', 'string', 'size_t']],
    'kvengine_close': ['void', ['pointer']],
    'kvengine_get_ffi': ['int8', ['pointer']],
    'kvengine_put_ffi': ['int8', ['pointer']],
    'kvengine_remove_ffi': ['void', ['pointer']]
});

class KVEngine {

    constructor(engine, path, size = 8388608, limit = 1024) {
        this._closed = false;
        this._kv = pmemkv.kvengine_open(engine, path, size);
        if (this._kv.isNull()) throw new Error('unable to open persistent pool');
        Object.defineProperty(this, '_kv', {configurable: false, writable: false});
        this._limit = limit;
        this._buf = Buffer.alloc(this._limit);
    }

    close() {
        if (!this._closed) {
            this._closed = true;
            Object.defineProperty(this, '_closed', {configurable: false, writable: false});
            pmemkv.kvengine_close(this._kv);
        }
    }

    get closed() {
        return this._closed;
    }

    get(key) {
        const buf = this._buf;
        buf.writePointer(this._kv);
        buf.writeInt32LE(this._limit, 8);
        buf.writeInt32LE(0, 16);
        const keybytes = buf.write(key, 20, 'utf8');
        buf.writeInt32LE(keybytes, 12);
        buf.writeInt32LE(0, 20 + keybytes);

        const result = pmemkv.kvengine_get_ffi(buf);
        if (result === 0) {
            return undefined;
        } else if (result > 0) {
            return buf.toString('utf8', 20 + keybytes, 20 + keybytes + buf.readInt32LE(16));
        } else {
            throw new Error('unable to get value');
        }
    }

    put(key, value) {
        const buf = this._buf;
        buf.writePointer(this._kv);
        const keybytes = buf.write(key, 20, 'utf8');
        const valuebytes = buf.write(value, 20 + keybytes, 'utf8');
        buf.writeInt32LE(keybytes, 12);
        buf.writeInt32LE(valuebytes, 16);

        const result = pmemkv.kvengine_put_ffi(buf);
        if (result !== 1) throw new Error('unable to put value');
    }

    remove(key) {
        const buf = this._buf;
        buf.writePointer(this._kv);
        const keybytes = buf.write(key, 20, 'utf8');
        buf.writeInt32LE(keybytes, 12);
        buf.writeInt32LE(0, 20 + keybytes);

        pmemkv.kvengine_remove_ffi(buf);
    }
}

module.exports = KVEngine;
