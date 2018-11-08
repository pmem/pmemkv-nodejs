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
const CONFIG = `{"path":"${PATH}","size":${SIZE}}`;

const chai = require('chai');
chai.use(require('chai-string'));
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

    it('uses module to publish types', () => {
        expect(pmemkv.KVEngine).to.exist;
        expect(pmemkv['KVEngine']).to.exist;
        expect(pmemkv['madeThisUP']).not.to.exist;
    });

    it('uses blackhole engine', () => {
        const kv = new pmemkv.KVEngine('blackhole', CONFIG);
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
        kv.stop();
    });

    it('starts engine', () => {
        const size = 1024 * 1024 * 11;
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv['_kv'] = undefined;
        expect(kv['_kv']).to.exist;
        expect(kv.stopped).to.be.false;
        kv.stop();
        kv['_stopped'] = false;
        expect(kv['_stopped']).to.be.true;
        expect(kv.stopped).to.be.true;
    });

    it('starts engine with existing pool', () => {
        const size = 1024 * 1024 * 13;
        let kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv.stop();
        expect(kv.stopped).to.be.true;
        kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        expect(kv.stopped).to.be.false;
        kv.stop();
        expect(kv.stopped).to.be.true;
    });

    it('stops engine multiple times', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        expect(kv.stopped).to.be.false;
        kv.stop();
        expect(kv.stopped).to.be.true;
        kv.stop();
        expect(kv.stopped).to.be.true;
        kv.stop();
        expect(kv.stopped).to.be.true;
    });

    it('gets missing key', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        expect(kv.exists('key1')).to.be.false;
        expect(kv.get('key1')).not.to.exist;
        kv.stop();
    });

    it('puts basic value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        expect(kv.exists('key1')).to.be.false;
        kv.put('key1', 'value1');
        expect(kv.exists('key1')).to.be.true;
        expect(kv.get('key1')).to.equal('value1');
        kv.stop();
    });

    it('puts binary key', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv.put("A\0B\0\0C", 'value1');
        expect(kv.exists("A\0B\0\0C")).to.be.true;
        expect(kv.get("A\0B\0\0C")).to.equal('value1');
        kv.stop();
    });

    it('puts binary value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv.put('key1', "A\0B\0\0C");
        expect(kv.get('key1')).to.equal("A\0B\0\0C");
        kv.stop();
    });

    it('puts complex value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        const val = 'one\ttwo or <p>three</p>\n {four}   and ^five';
        kv.put('key1', val);
        expect(kv.get('key1')).to.equal(val);
        kv.stop();
    });

    it('puts empty key', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv.put('', 'empty');
        kv.put(' ', 'single-space');
        kv.put('\t\t', 'two-tab');
        expect(kv.exists('')).to.be.true;
        expect(kv.get('')).to.equal('empty');
        expect(kv.exists(' ')).to.be.true;
        expect(kv.get(' ')).to.equal('single-space');
        expect(kv.exists('\t\t')).to.be.true;
        expect(kv.get('\t\t')).to.equal('two-tab');
        kv.stop();
    });

    it('puts empty value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv.put('empty', '');
        kv.put('single-space', ' ');
        kv.put('two-tab', '\t\t');
        expect(kv.get('empty')).to.equal('');
        expect(kv.get('single-space')).to.equal(' ');
        expect(kv.get('two-tab')).to.equal('\t\t');
        kv.stop();
    });

    it('puts multiple values', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv.put('key1', 'value1');
        kv.put('key2', 'value2');
        kv.put('key3', 'value3');
        expect(kv.exists('key1')).to.be.true;
        expect(kv.get('key1')).to.equal('value1');
        expect(kv.exists('key2')).to.be.true;
        expect(kv.get('key2')).to.equal('value2');
        expect(kv.exists('key3')).to.be.true;
        expect(kv.get('key3')).to.equal('value3');
        kv.stop();
    });

    it('puts overwriting existing value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv.put('key1', 'value1');
        expect(kv.get('key1')).to.equal('value1');
        kv.put('key1', 'value123');
        expect(kv.get('key1')).to.equal('value123');
        kv.put('key1', 'asdf');
        expect(kv.get('key1')).to.equal('asdf');
        kv.stop();
    });

    it('puts utf-8 key', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        const val = 'to remember, note, record';
        kv.put('记', val);
        expect(kv.exists('记')).to.be.true;
        expect(kv.get('记')).to.equal(val);
        kv.stop();
    });

    it('puts utf-8 value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        const val = '记 means to remember, note, record';
        kv.put('key1', val);
        expect(kv.get('key1')).to.equal(val);
        kv.stop();
    });

    it('removes key and value', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv.put('key1', 'value1');
        expect(kv.exists('key1')).to.be.true;
        expect(kv.get('key1')).to.eql('value1');
        expect(kv.remove('key1')).to.be.true;
        expect(kv.remove('key1')).to.be.false;
        expect(kv.exists('key1')).to.be.false;
        expect(kv.get('key1')).not.to.exist;
        kv.stop();
    });

    it('throws exception on start when engine is invalid', () => {
        let kv = undefined;
        try {
            kv = new pmemkv.KVEngine('nope.nope', CONFIG);
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.equal('unable to start engine');
        }
        expect(kv).not.to.exist;
    });

    it('throws exception on start when path is invalid', () => {
        let kv = undefined;
        try {
            let config = `{"path":"/tmp/123/234/345/456/567/678/nope.nope","size":${SIZE}}`;
            kv = new pmemkv.KVEngine(ENGINE, config);
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.equal('unable to start engine');
        }
        expect(kv).not.to.exist;
    });

    it('throws exception on start with huge size', () => {
        let kv = undefined;
        try {
            let config = `{"path":"${PATH}","size":9223372036854775807}`; // 9.22 exabytes
            kv = new pmemkv.KVEngine(ENGINE, config);
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.equal('unable to start engine');
        }
        expect(kv).not.to.exist;
    });

    it('throws exception on start with tiny size', () => {
        let kv = undefined;
        try {
            let config = `{"path":"${PATH}","size":${SIZE - 1}}`; // too small
            kv = new pmemkv.KVEngine(ENGINE, config);
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.equal('unable to start engine');
        }
        expect(kv).not.to.exist;
    });

    it('throws exception on put when out of space', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        try {
            for (let i = 0; i < 100000; i++) {
                const istr = i.toString();
                kv.put(istr, istr);
            }
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.startWith('unable to put key:');
        }
        kv.stop();
    });

    it('uses all test', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        expect(kv.count).to.equal(0);
        kv.put('记!', 'RR');
        expect(kv.count).to.equal(1);
        kv.put('2', 'one');
        expect(kv.count).to.equal(2);
        let result = '';
        kv.all((k) => result += `<${k}>,`);
        expect(result).to.eql('<2>,<记!>,');
        kv.stop();
    });

    it('uses each test', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        expect(kv.count).to.equal(0);
        kv.put('RR', '记!');
        expect(kv.count).to.equal(1);
        kv.put('1', '2');
        expect(kv.count).to.equal(2);
        let result = '';
        kv.each((k, v) => result += `<${k}>,<${v}>|`);
        expect(result).to.eql('<1>,<2>|<RR>,<记!>|');
        kv.stop();
    });

});
