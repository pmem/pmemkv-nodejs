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

const ENGINE = 'kvtree3';
const PATH = '/dev/shm/pmemkv-nodejs';
const SIZE = 1024 * 1024 * 8;

const chai = require('chai');
chai.use(require('chai-string'));
const expect = chai.expect;
const fs = require('fs');
var require_path = '../lib/all';
if (process.env.npm_config_BINDING == 'NAPI'){
    require_path = '../lib/napi/all';
}
const pmemkv = require(require_path);

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

    it('uses module to publish types', () => {
        expect(pmemkv.KVEngine).to.exist;
        expect(pmemkv['KVEngine']).to.exist;
        expect(pmemkv['madeThisUP']).not.to.exist;
    });

    it('uses blackhole engine', () => {
        const kv = new pmemkv.KVEngine('blackhole', PATH);
        expect(kv.count).to.equal(0);
        expect(kv.exists('key1')).to.be.false;
        expect(kv.get('key1')).not.to.exist;
        kv.put('key1', 'value1');
        expect(kv.count).to.equal(0);
        expect(kv.exists('key1')).to.be.false;
        expect(kv.get('key1')).not.to.exist;
        expect(kv.remove('key1')).to.be.true;
        expect(kv.exists('key1')).to.be.false;
        expect(kv.get('key1')).not.to.exist;
        kv.close();
    });

    it('creates instance', () => {
        const size = 1024 * 1024 * 11;
        const kv = new pmemkv.KVEngine(ENGINE, PATH, size);
        kv['_kv'] = undefined;
        expect(kv['_kv']).to.exist;
        expect(kv.closed).to.be.false;
        kv.close();
        kv['_closed'] = false;
        expect(kv['_closed']).to.be.true;
        expect(kv.closed).to.be.true;
    });

    it('creates instance from existing pool', () => {
        const size = 1024 * 1024 * 13;
        let kv = new pmemkv.KVEngine(ENGINE, PATH, size);
        kv.close();
        expect(kv.closed).to.be.true;
        kv = new pmemkv.KVEngine(ENGINE, PATH, 0);
        expect(kv.closed).to.be.false;
        kv.close();
        expect(kv.closed).to.be.true;
    });

    it('closes instance multiple times', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH);
        expect(kv.closed).to.be.false;
        kv.close();
        expect(kv.closed).to.be.true;
        kv.close();
        expect(kv.closed).to.be.true;
        kv.close();
        expect(kv.closed).to.be.true;
    });

    it('gets missing key', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH);
        expect(kv.exists('key1')).to.be.false;
        expect(kv.get('key1')).not.to.exist;
        kv.close();
    });

    it('puts basic value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH);
        expect(kv.exists('key1')).to.be.false;
        kv.put('key1', 'value1');
        expect(kv.exists('key1')).to.be.true;
        expect(kv.get('key1')).to.equal('value1');
        kv.close();
    });

    it('puts binary key', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH);
        kv.put("A\0B\0\0C", 'value1');
        expect(kv.exists("A\0B\0\0C")).to.be.true;
        expect(kv.get("A\0B\0\0C")).to.equal('value1');
        kv.close();
    });

    it('puts binary value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH);
        kv.put('key1', "A\0B\0\0C");
        expect(kv.get('key1')).to.equal("A\0B\0\0C");
        kv.close();
    });

    it('puts complex value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH);
        const val = 'one\ttwo or <p>three</p>\n {four}   and ^five';
        kv.put('key1', val);
        expect(kv.get('key1')).to.equal(val);
        kv.close();
    });

    it('puts empty key', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH);
        kv.put('', 'empty');
        kv.put(' ', 'single-space');
        kv.put('\t\t', 'two-tab');
        expect(kv.exists('')).to.be.true;
        expect(kv.get('')).to.equal('empty');
        expect(kv.exists(' ')).to.be.true;
        expect(kv.get(' ')).to.equal('single-space');
        expect(kv.exists('\t\t')).to.be.true;
        expect(kv.get('\t\t')).to.equal('two-tab');
        kv.close();
    });

    it('puts empty value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH);
        kv.put('empty', '');
        kv.put('single-space', ' ');
        kv.put('two-tab', '\t\t');
        expect(kv.get('empty')).to.equal('');
        expect(kv.get('single-space')).to.equal(' ');
        expect(kv.get('two-tab')).to.equal('\t\t');
        kv.close();
    });

    it('puts multiple values', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH);
        kv.put('key1', 'value1');
        kv.put('key2', 'value2');
        kv.put('key3', 'value3');
        expect(kv.exists('key1')).to.be.true;
        expect(kv.get('key1')).to.equal('value1');
        expect(kv.exists('key2')).to.be.true;
        expect(kv.get('key2')).to.equal('value2');
        expect(kv.exists('key3')).to.be.true;
        expect(kv.get('key3')).to.equal('value3');
        kv.close();
    });

    it('puts overwriting existing value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH);
        kv.put('key1', 'value1');
        expect(kv.get('key1')).to.equal('value1');
        kv.put('key1', 'value123');
        expect(kv.get('key1')).to.equal('value123');
        kv.put('key1', 'asdf');
        expect(kv.get('key1')).to.equal('asdf');
        kv.close();
    });

    it('puts utf-8 key', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH);
        const val = 'to remember, note, record';
        kv.put('记', val);
        expect(kv.exists('记')).to.be.true;
        expect(kv.get('记')).to.equal(val);
        kv.close();
    });

    it('puts utf-8 value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH);
        const val = '记 means to remember, note, record';
        kv.put('key1', val);
        expect(kv.get('key1')).to.equal(val);
        kv.close();
    });

    it('removes key and value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH);
        kv.put('key1', 'value1');
        expect(kv.exists('key1')).to.be.true;
        expect(kv.get('key1')).to.eql('value1');
        expect(kv.remove('key1')).to.be.true;
        expect(kv.remove('key1')).to.be.false;
        expect(kv.exists('key1')).to.be.false;
        expect(kv.get('key1')).not.to.exist;
        kv.close();
    });

    it('throws exception on create when engine is invalid', () => {
        let kv = undefined;
        try {
            kv = new pmemkv.KVEngine('nope.nope', PATH);
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.equal('unable to open persistent pool');
        }
        expect(kv).not.to.exist;
    });

    it('throws exception on create when path is invalid', () => {
        let kv = undefined;
        try {
            kv = new pmemkv.KVEngine(ENGINE, '/tmp/123/234/345/456/567/678/nope.nope');
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
        const kv = new pmemkv.KVEngine(ENGINE, PATH);
        try {
            for (let i = 0; i < 100000; i++) {
                const istr = i.toString();
                kv.put(istr, istr);
            }
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.startWith('unable to put key:');
        }
        kv.close();
    });

    it('uses all test', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH);
        expect(kv.count).to.equal(0);
        kv.put('记!', 'RR');
        expect(kv.count).to.equal(1);
        kv.put('2', 'one');
        expect(kv.count).to.equal(2);
        let result = '';
        kv.all((k) => result += `<${k}>,`);
        expect(result).to.eql('<2>,<记!>,');
        kv.close();
    });

    it('uses each test', () => {
        const kv = new pmemkv.KVEngine(ENGINE, PATH);
        expect(kv.count).to.equal(0);
        kv.put('RR', '记!');
        expect(kv.count).to.equal(1);
        kv.put('1', '2');
        expect(kv.count).to.equal(2);
        let result = '';
        kv.each((k, v) => result += `<${k}>,<${v}>|`);
        expect(result).to.eql('<1>,<2>|<RR>,<记!>|');
        kv.close();
    });

});
