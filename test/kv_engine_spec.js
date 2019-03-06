/*
 * Copyright 2017-2019, Intel Corporation
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

const ENGINE = 'vsmap';
const CONFIG = `{"path":"/dev/shm"}`;

const chai = require('chai');
chai.use(require('chai-string'));
const expect = chai.expect;
const pmemkv = require('../lib/all');

describe('KVEngine', () => {

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
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv['_kv'] = undefined;
        expect(kv['_kv']).to.exist;
        expect(kv.stopped).to.be.false;
        kv.stop();
        kv['_stopped'] = false;
        expect(kv['_stopped']).to.be.true;
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
        expect(kv.get('key1')).to.equal('value1');
        expect(kv.remove('key1')).to.be.true;
        expect(kv.remove('key1')).to.be.false;
        expect(kv.exists('key1')).to.be.false;
        expect(kv.get('key1')).not.to.exist;
        kv.stop();
    });

    it('throws exception on start when config is empty', () => {
        let kv = undefined;
        try {
            kv = new pmemkv.KVEngine(ENGINE, "{}");
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.equal('Config does not include valid path string');
        }
        expect(kv).not.to.exist;
    });

    it('throws exception on start when config is malformed', () => {
        let kv = undefined;
        try {
            kv = new pmemkv.KVEngine(ENGINE, "{");
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.equal('Config could not be parsed as JSON');
        }
        expect(kv).not.to.exist;
    });

    it('throws exception on start when engine is invalid', () => {
        let kv = undefined;
        try {
            kv = new pmemkv.KVEngine('nope.nope', CONFIG);
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.equal('Unknown engine name');
        }
        expect(kv).not.to.exist;
    });

    it('throws exception on start when path is invalid', () => {
        let kv = undefined;
        try {
            let config = `{"path":"/tmp/123/234/345/456/567/678/nope.nope"}`;
            kv = new pmemkv.KVEngine(ENGINE, config);
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.equal('Config path is not an existing directory');
        }
        expect(kv).not.to.exist;
    });

    it('throws exception on start when path is wrong type', () => {
        let kv = undefined;
        try {
            let config = '{"path":1234}';
            kv = new pmemkv.KVEngine(ENGINE, config);
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.equal('Config does not include valid path string');
        }
        expect(kv).not.to.exist;
    });

    it('uses all test', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv.put('1', 'one');
        kv.put('2', 'two');
        kv.put('记!', 'RR');

        let x = '';
        kv.all((k) => x += `<${k}>,`);
        expect(x).to.equal('<1>,<2>,<记!>,');

        kv.stop();
    });

    it('uses all above test', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv.put('A', '1');
        kv.put('AB', '2');
        kv.put('AC', '3');
        kv.put('B', '4');
        kv.put('BB', '5');
        kv.put('BC', '6');
        kv.put('记!', 'RR');

        let x = '';
        kv.all_above('B', (k) => x += `${k},`);
        expect(x).to.equal('BB,BC,记!,');

        x = '';
        kv.all_above('', (k) => x += `${k},`);
        expect(x).to.equal('A,AB,AC,B,BB,BC,记!,');

        kv.stop();
    });

    it('uses all below test', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv.put('A', '1');
        kv.put('AB', '2');
        kv.put('AC', '3');
        kv.put('B', '4');
        kv.put('BB', '5');
        kv.put('BC', '6');
        kv.put('记!', 'RR');

        let x = '';
        kv.all_below('B', (k) => x += `${k},`);
        expect(x).to.equal('A,AB,AC,');

        x = '';
        kv.all_below('\uFFFF', (k) => x += `${k},`);
        expect(x).to.equal('A,AB,AC,B,BB,BC,记!,');

        kv.stop();
    });

    it('uses all between test', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv.put('A', '1');
        kv.put('AB', '2');
        kv.put('AC', '3');
        kv.put('B', '4');
        kv.put('BB', '5');
        kv.put('BC', '6');
        kv.put('记!', 'RR');

        let x = '';
        kv.all_between('A', 'B', (k) => x += `${k},`);
        expect(x).to.equal('AB,AC,');

        x = '';
        kv.all_between('B', '\uFFFF', (k) => x += `${k},`);
        expect(x).to.equal('BB,BC,记!,');

        x = '';
        kv.all_between('', '', (k) => x += `${k},`);
        kv.all_between('A', 'A', (k) => x += `${k},`);
        kv.all_between('B', 'A', (k) => x += `${k},`);
        expect(x).to.equal('');

        kv.stop();
    });

    it('uses count test', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv.put('A', '1');
        kv.put('AB', '2');
        kv.put('AC', '3');
        kv.put('B', '4');
        kv.put('BB', '5');
        kv.put('BC', '6');
        kv.put('BD', '7');
        expect(kv.count).to.equal(7);

        expect(kv.count_above('')).to.equal(7);
        expect(kv.count_above('A')).to.equal(6);
        expect(kv.count_above('B')).to.equal(3);
        expect(kv.count_above('BC')).to.equal(1);
        expect(kv.count_above('BD')).to.equal(0);
        expect(kv.count_above('Z')).to.equal(0);

        expect(kv.count_below('')).to.equal(0);
        expect(kv.count_below('A')).to.equal(0);
        expect(kv.count_below('B')).to.equal(3);
        expect(kv.count_below('BD')).to.equal(6);
        expect(kv.count_below('ZZZZZ')).to.equal(7);

        expect(kv.count_between('', 'ZZZZ')).to.equal(7);
        expect(kv.count_between('', 'A')).to.equal(0);
        expect(kv.count_between('', 'B')).to.equal(3);
        expect(kv.count_between('A', 'B')).to.equal(2);
        expect(kv.count_between('B', 'ZZZZ')).to.equal(3);

        expect(kv.count_between('', '')).to.equal(0);
        expect(kv.count_between('A', 'A')).to.equal(0);
        expect(kv.count_between('AC', 'A')).to.equal(0);
        expect(kv.count_between('B', 'A')).to.equal(0);
        expect(kv.count_between('BD', 'A')).to.equal(0);
        expect(kv.count_between('ZZZ', 'B')).to.equal(0);

        kv.stop();
    });

    it('uses each test', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv.put('1', 'one');
        kv.put('2', 'two');
        kv.put('记!', 'RR');

        let x = '';
        kv.each((k, v) => x += `<${k}>,<${v}>|`);
        expect(x).to.equal('<1>,<one>|<2>,<two>|<记!>,<RR>|');

        kv.stop();
    });

    it('uses each above test', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv.put('A', '1');
        kv.put('AB', '2');
        kv.put('AC', '3');
        kv.put('B', '4');
        kv.put('BB', '5');
        kv.put('BC', '6');
        kv.put('记!', 'RR');

        let x = '';
        kv.each_above('B', (k, v) => x += `${k},${v}|`);
        expect(x).to.equal('BB,5|BC,6|记!,RR|');

        x = '';
        kv.each_above('', (k, v) => x += `${k},${v}|`);
        expect(x).to.equal('A,1|AB,2|AC,3|B,4|BB,5|BC,6|记!,RR|');

        kv.stop();
    });

    it('uses each below test', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv.put('A', '1');
        kv.put('AB', '2');
        kv.put('AC', '3');
        kv.put('B', '4');
        kv.put('BB', '5');
        kv.put('BC', '6');
        kv.put('记!', 'RR');

        let x = '';
        kv.each_below('AC', (k, v) => x += `${k},${v}|`);
        expect(x).to.equal('A,1|AB,2|');

        x = '';
        kv.each_below('\uFFFF', (k, v) => x += `${k},${v}|`);
        expect(x).to.equal('A,1|AB,2|AC,3|B,4|BB,5|BC,6|记!,RR|');

        kv.stop();
    });

    it('uses each between test', () => {
        const kv = new pmemkv.KVEngine(ENGINE, CONFIG);
        kv.put('A', '1');
        kv.put('AB', '2');
        kv.put('AC', '3');
        kv.put('B', '4');
        kv.put('BB', '5');
        kv.put('BC', '6');
        kv.put('记!', 'RR');

        let x = '';
        kv.each_between('A', 'B', (k, v) => x += `${k},${v}|`);
        expect(x).to.equal('AB,2|AC,3|');

        x = '';
        kv.each_between('B', '\uFFFF', (k, v) => x += `${k},${v}|`);
        expect(x).to.equal('BB,5|BC,6|记!,RR|');

        x = '';
        kv.each_between('', '', (k, v) => x += `${k},${v}|`);
        kv.each_between('A', 'A', (k, v) => x += `${k},${v}|`);
        kv.each_between('B', 'A', (k, v) => x += `${k},${v}|`);
        expect(x).to.equal('');

        kv.stop();
    });

});
