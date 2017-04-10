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
const ref = require('ref');

const pmemkv = ffi.Library('/usr/local/lib/libpmemkv.so', {  // todo use env var, alt dirs
    'kvtree_open': ['pointer', ['string', 'size_t']],
    'kvtree_close': ['void', ['pointer']],
    'kvtree_get': ['int8', ['pointer', 'string', 'size_t', 'pointer', ref.refType('uint32')]],
    'kvtree_put': ['int8', ['pointer', 'string', 'string']],
    'kvtree_remove': ['void', ['pointer', 'string']],
    'kvtree_size': ['size_t', ['pointer']],
});

class KVTree {  // todo missing getList support
    constructor(path, size) {
        this._closed = false;
        this._kv = pmemkv.kvtree_open(path, size);
        if (this._kv.isNull()) throw new Error('unable to open persistent pool');
        Object.defineProperty(this, '_kv', {configurable: false, writable: false});
    }

    close() {
        if (!this._closed) {
            pmemkv.kvtree_close(this._kv);
            this._closed = true;
            Object.defineProperty(this, '_closed', {configurable: false, writable: false});
        }
    }

    get closed() {  // todo autoclose when out of scope
        return this._closed;
    }

    get(key) {
        const limit = 1024;  // todo make configurable
        const value = Buffer.alloc(limit);
        const valuebytes = ref.alloc('uint32');
        const result = pmemkv.kvtree_get(this._kv, key, limit, value, valuebytes);
        if (result === 0) {
            return undefined;
        } else if (result > 0) {
            return value.toString('utf8', 0, valuebytes.deref());  // todo always utf8?
        } else {
            throw new Error('unable to get value');
        }
    }

    put(key, value) {
        const result = pmemkv.kvtree_put(this._kv, key, value);
        if (result !== 0) throw new Error('unable to put value');
    }

    remove(key) {
        pmemkv.kvtree_remove(this._kv, key);
    }

    get size() {
        return pmemkv.kvtree_size(this._kv);
    }
}

module.exports = KVTree;
