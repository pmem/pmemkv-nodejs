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

const ENGINE = 'kvtree';
const PATH = '/dev/shm/pmemkv-nodejs';
const SIZE = 1024 * 1024 * 8;

const chai = require('chai');
const expect = chai.expect;
const fs = require('fs');
const pmemkv = require('../lib/all');

function clean() {
    if (fs.existsSync(PATH)) fs.unlinkSync(PATH);
    expect(fs.existsSync(PATH)).to.be.false;
}

describe('KVEngine', () => {

    beforeEach(() => {
        clean();
    });

    afterEach(() => {
        clean();
    });

    it('creates instance', () => {
        const size = 1024 * 1024 * 11;
        const kv = new pmemkv.KVEngine(ENGINE, PATH, size);
        expect(kv.closed).to.be.false;
        expect(kv.size).to.equal(size);
        kv.close();
        expect(kv.closed).to.be.true;
    });

    it('creates instance from existing pool', () => {
        const size = 1024 * 1024 * 13;
        let kv = new pmemkv.KVEngine(ENGINE, PATH, size);
        kv.close();
        expect(kv.closed).to.be.true;
        kv = new pmemkv.KVEngine(ENGINE, PATH, 0);
        expect(kv.closed).to.be.false;
        expect(kv.size).to.equal(size);
        kv.close();
        expect(kv.closed).to.be.true;
    });

    it('closes instance multiple times', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH, SIZE);
        expect(kv.closed).to.be.false;
        expect(kv.size).to.equal(SIZE);
        kv.close();
        expect(kv.closed).to.be.true;
        kv.close();
        expect(kv.closed).to.be.true;
        kv.close();
        expect(kv.closed).to.be.true;
    });

    it('gets missing key', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH, SIZE);
        expect(kv.get('key1')).not.to.exist;
        kv.close();
    });

    it('puts basic value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH, SIZE);
        kv.put('key1', 'value1');
        expect(kv.get('key1')).to.equal('value1');
        kv.close();
    });

    it('puts binary key', () => {
        // todo should fail?
    });

    it('puts binary value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH, SIZE);
        kv.put('key1', "A\0B\0\0C");
        expect(kv.get('key1')).to.equal("A\0B\0\0C");
        kv.close();
    });

    it('puts complex value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH, SIZE);
        const val = 'one\ttwo or <p>three</p>\n {four}   and ^five';
        kv.put('key1', val);
        expect(kv.get('key1')).to.equal(val);
        kv.close();
    });

    it('puts empty key', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH, SIZE);
        kv.put('', 'empty');
        kv.put(' ', 'single-space');
        kv.put('\t\t', 'two-tab');
        expect(kv.get('')).to.equal('empty');
        expect(kv.get(' ')).to.equal('single-space');
        expect(kv.get('\t\t')).to.equal('two-tab');
        kv.close();
    });

    it('puts empty value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH, SIZE);
        kv.put('empty', '');
        kv.put('single-space', ' ');
        kv.put('two-tab', '\t\t');
        expect(kv.get('empty')).to.equal('');
        expect(kv.get('single-space')).to.equal(' ');
        expect(kv.get('two-tab')).to.equal('\t\t');
        kv.close();
    });

    it('puts multiple values', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH, SIZE);
        kv.put('key1', 'value1');
        kv.put('key2', 'value2');
        kv.put('key3', 'value3');
        expect(kv.get('key1')).to.equal('value1');
        expect(kv.get('key2')).to.equal('value2');
        expect(kv.get('key3')).to.equal('value3');
        kv.close();
    });

    it('puts overwriting existing value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH, SIZE);
        kv.put('key1', 'value1');
        expect(kv.get('key1')).to.equal('value1');
        kv.put('key1', 'value123');
        expect(kv.get('key1')).to.equal('value123');
        kv.put('key1', 'asdf');
        expect(kv.get('key1')).to.equal('asdf');
        kv.close();
    });

    it('puts utf-8 key', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH, SIZE);
        const val = 'to remember, note, record';
        kv.put('记', val);
        expect(kv.get('记')).to.equal(val);
        kv.close();
    });

    it('puts utf-8 value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH, SIZE);
        const val = '记 means to remember, note, record';
        kv.put('key1', val);
        expect(kv.get('key1')).to.equal(val);
        kv.close();
    });

    it('puts very large value', () => {
        // todo finish
    });

    it('removes key and value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH, SIZE);
        kv.put('key1', 'value1');
        expect(kv.get('key1')).to.eql('value1');
        kv.remove('key1');
        expect(kv.get('key1')).not.to.exist;
        kv.close();
    });

    it('throws exception on create when engine is invalid', () => {
        let kv = undefined;
        try {
            kv = new pmemkv.KVEngine('nope.nope', PATH, SIZE);
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.equal('unable to open persistent pool');
        }
        expect(kv).not.to.exist;
    });

    it('throws exception on create when path is invalid', () => {
        let kv = undefined;
        try {
            kv = new pmemkv.KVEngine(ENGINE, '/tmp/123/234/345/456/567/678/nope.nope', SIZE);
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.equal('unable to open persistent pool');
        }
        expect(kv).not.to.exist;
    });

    it('throws exception on create with huge size', () => {
        let kv = undefined;
        try {
            kv = new pmemkv.KVEngine(ENGINE, PATH, 9223372036854775807); // 9.22 exabytes
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.equal('unable to open persistent pool');
        }
        expect(kv).not.to.exist;
    });

    it('throws exception on create with tiny size', () => {
        let kv = undefined;
        try {
            kv = new pmemkv.KVEngine(ENGINE, PATH, SIZE - 1); // too small
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.equal('unable to open persistent pool');
        }
        expect(kv).not.to.exist;
    });

    it('throws exception on put when out of space', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH, SIZE);
        try {
            for (let i = 0; i < 100000; i++) {
                const istr = i.toString();
                kv.put(istr, istr);
            }
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.equal('unable to put value');
        }
        kv.close();
    });

    it('uses immutable private attributes', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH, SIZE);
        kv['_kv'] = undefined;
        expect(kv['_kv']).to.exist;
        expect(kv.size).to.equal(SIZE);
        kv.close();
        kv['_closed'] = false;
        expect(kv['_closed']).to.be.true;
        expect(kv.closed).to.be.true;
    });

    it('uses blackhole engine', () => {
        const kv = new pmemkv.KVEngine('blackhole', PATH, SIZE);
        expect(kv.get('key1')).not.to.exist;
        kv.put('key1', 'value1');
        expect(kv.get('key1')).not.to.exist;
        kv.remove('key1');
        expect(kv.get('key1')).not.to.exist;
        kv.close();
    });

    it('uses module to publish types', () => {
        expect(pmemkv.KVEngine).to.exist;
        expect(pmemkv['KVEngine']).to.exist;
        expect(pmemkv['madeThisUP']).not.to.exist;
    });

});
