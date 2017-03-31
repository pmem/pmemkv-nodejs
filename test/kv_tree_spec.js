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

const PATH = '/dev/shm/pmemkv-nodejs';
const SIZE = 1024 * 1024 * 16;

const chai = require('chai');
const expect = chai.expect;
const fs = require('fs');
const pmemkv = require('../lib/all');

function clean() {
    try {
        fs.unlinkSync(PATH);
    } catch (err) {
        // ignore any errors
    }
}

describe('KVTree', () => {

    beforeEach(() => {
        clean();
    });

    afterEach(() => {
        clean();
    });

    it('creates instance', () => {
        const size = 1024 * 1024 * 11;
        const kv = new pmemkv.KVTree(PATH, size);
        expect(kv.closed).to.be.false;
        expect(kv.size).to.equal(size);
        kv.close();
        expect(kv.closed).to.be.true;
    });

    it('creates instance from existing', () => {
        const size = 1024 * 1024 * 13;
        let kv = new pmemkv.KVTree(PATH, size);
        kv.close();
        kv = new pmemkv.KVTree(PATH, 0);
        expect(kv.closed).to.be.false;
        expect(kv.size).to.equal(size);
        kv.close();
        expect(kv.closed).to.be.true;
    });

    it('closes instance multiple times', () => {
        const size = 1024 * 1024 * 15;
        const kv = new pmemkv.KVTree(PATH, size);
        expect(kv.size).to.equal(size);
        expect(kv.closed).to.be.false;
        kv.close();
        expect(kv.closed).to.be.true;
        kv.close();
        expect(kv.closed).to.be.true;
        kv.close();
        expect(kv.closed).to.be.true;
        kv.close();
    });

    it('fails to create instance with huge size', () => {
        // todo add test case
    });

    it('fails to create instance with tiny size', () => {
        // todo add test case
    });

    it('gets key', () => {
        const kv = new pmemkv.KVTree(PATH, SIZE);
        kv.put('key1', 'value1');
        expect(kv.get('key1')).to.equal('value1');
        kv.close();
    });

    it('gets missing key', () => {
        const kv = new pmemkv.KVTree(PATH, SIZE);
        expect(kv.get('key1')).not.to.exist;
        kv.close();
    });

    it('replaces key', () => {
        const kv = new pmemkv.KVTree(PATH, SIZE);
        kv.put('key1', 'value1');
        expect(kv.get('key1')).to.equal('value1');
        kv.put('key1', 'value123');
        expect(kv.get('key1')).to.equal('value123');
        kv.put('key1', 'asdf');
        expect(kv.get('key1')).to.equal('asdf');
        kv.close();
    });

    it('removes key', () => {
        const kv = new pmemkv.KVTree(PATH, SIZE);
        kv.put('key1', 'value1');
        expect(kv.get('key1')).to.exist;
        kv.remove('key1');
        expect(kv.get('key1')).not.to.exist;
        kv.close();
    });

    it('uses immutable private attributes', () => {
        const kv = new pmemkv.KVTree(PATH, SIZE);
        kv['_kv'] = undefined;
        expect(kv['_kv']).to.exist;
        expect(kv.size).to.equal(SIZE);
        kv.close();
        kv['_closed'] = false;
        expect(kv['_closed']).to.be.true;
        expect(kv.closed).to.be.true;
    });

    it('uses module to publish objects', () => {
        expect(pmemkv.KVTree).to.exist;
        expect(pmemkv['KVTree']).to.exist;
        expect(pmemkv['madeThisUP']).not.to.exist;
    });

});
