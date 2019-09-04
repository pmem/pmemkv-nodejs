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
const CONFIG = {"path":"/dev/shm", "size":1073741824};

const chai = require('chai');
chai.use(require('chai-string'));
const expect = chai.expect;
const pmemkv = require('../lib/all');

describe('db', () => {

    it('uses module to publish types', () => {
        expect(pmemkv.db).to.exist;
        expect(pmemkv['db']).to.exist;
        expect(pmemkv['madeThisUP']).not.to.exist;
    });

    it('uses blackhole engine', () => {
        const db = new pmemkv.db('blackhole', CONFIG);
        expect(db.count_all).to.equal(0);
        expect(db.exists('key1')).to.be.false;
        expect(db.get('key1')).not.to.exist;
        db.put('key1', 'value1');
        expect(db.count_all).to.equal(0);
        expect(db.exists('key1')).to.be.false;
        expect(db.get('key1')).not.to.exist;
        expect(db.remove('key1')).to.be.true;
        expect(db.exists('key1')).to.be.false;
        expect(db.get('key1')).not.to.exist;
        db.stop();
    });

    it('starts engine', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        db['_db'] = undefined;
        expect(db['_db']).to.exist;
        expect(db.stopped).to.be.false;
        db.stop();
        db['_stopped'] = false;
        expect(db['_stopped']).to.be.true;
        expect(db.stopped).to.be.true;
    });

    it('stops engine multiple times', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        expect(db.stopped).to.be.false;
        db.stop();
        expect(db.stopped).to.be.true;
        db.stop();
        expect(db.stopped).to.be.true;
        db.stop();
        expect(db.stopped).to.be.true;
    });

    it('gets missing key', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        expect(db.exists('key1')).to.be.false;
        expect(db.get('key1')).not.to.exist;
        db.stop();
    });

    it('puts basic value', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        expect(db.exists('key1')).to.be.false;
        db.put('key1', 'value1');
        expect(db.exists('key1')).to.be.true;
        expect(db.get('key1')).to.equal('value1');
        db.stop();
    });

    it('puts binary key', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        db.put("A\0B\0\0C", 'value1');
        expect(db.exists("A\0B\0\0C")).to.be.true;
        expect(db.get("A\0B\0\0C")).to.equal('value1');
        db.stop();
    });

    it('puts binary value', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        db.put('key1', "A\0B\0\0C");
        expect(db.get('key1')).to.equal("A\0B\0\0C");
        db.stop();
    });

    it('puts complex value', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        const val = 'one\ttwo or <p>three</p>\n {four}   and ^five';
        db.put('key1', val);
        expect(db.get('key1')).to.equal(val);
        db.stop();
    });

    it('puts empty key', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        db.put('', 'empty');
        db.put(' ', 'single-space');
        db.put('\t\t', 'two-tab');
        expect(db.exists('')).to.be.true;
        expect(db.get('')).to.equal('empty');
        expect(db.exists(' ')).to.be.true;
        expect(db.get(' ')).to.equal('single-space');
        expect(db.exists('\t\t')).to.be.true;
        expect(db.get('\t\t')).to.equal('two-tab');
        db.stop();
    });

    it('puts empty value', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        db.put('empty', '');
        db.put('single-space', ' ');
        db.put('two-tab', '\t\t');
        expect(db.get('empty')).to.equal('');
        expect(db.get('single-space')).to.equal(' ');
        expect(db.get('two-tab')).to.equal('\t\t');
        db.stop();
    });

    it('puts multiple values', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        db.put('key1', 'value1');
        db.put('key2', 'value2');
        db.put('key3', 'value3');
        expect(db.exists('key1')).to.be.true;
        expect(db.get('key1')).to.equal('value1');
        expect(db.exists('key2')).to.be.true;
        expect(db.get('key2')).to.equal('value2');
        expect(db.exists('key3')).to.be.true;
        expect(db.get('key3')).to.equal('value3');
        db.stop();
    });

    it('puts overwriting existing value', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        db.put('key1', 'value1');
        expect(db.get('key1')).to.equal('value1');
        db.put('key1', 'value123');
        expect(db.get('key1')).to.equal('value123');
        db.put('key1', 'asdf');
        expect(db.get('key1')).to.equal('asdf');
        db.stop();
    });

    it('puts utf-8 key', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        const val = 'to remember, note, record';
        db.put('记', val);
        expect(db.exists('记')).to.be.true;
        expect(db.get('记')).to.equal(val);
        db.stop();
    });

    it('puts utf-8 value', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        const val = '记 means to remember, note, record';
        db.put('key1', val);
        expect(db.get('key1')).to.equal(val);
        db.stop();
    });

    it('removes key and value', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        db.put('key1', 'value1');
        expect(db.exists('key1')).to.be.true;
        expect(db.get('key1')).to.equal('value1');
        expect(db.remove('key1')).to.be.true;
        expect(db.remove('key1')).to.be.false;
        expect(db.exists('key1')).to.be.false;
        expect(db.get('key1')).not.to.exist;
        db.stop();
    });

    it('throws exception on start when config is empty', () => {
        let db = undefined;
        try {
            db = new pmemkv.db(ENGINE, {});
            expect(true).to.be.false;
        } catch (e) {
            // XXX replace with:
            // expect(e.message).to.equal('Config does not include valid path string');
            // when pmemkv_errmsg() is implemented
            expect(e.message).to.equal('invalid config object');
        }
        expect(db).not.to.exist;
    });

    it('throws exception on start when config is malformed', () => {
        let db = undefined;
        try {
            db = new pmemkv.db(ENGINE, {"path": "/dev/shm"});
            expect(true).to.be.false;
        } catch (e) {
            expect(e.message).to.equal('pmemkv_open() failed');
        }
        expect(db).not.to.exist;
    });

    it('throws exception on start when engine is invalid', () => {
        let db = undefined;
        try {
            db = new pmemkv.db('nope.nope', CONFIG);
            expect(true).to.be.false;
        } catch (e) {
            // XXX replace with:
            // expect(e.message).to.equal('Unknown engine name');
            // when pmemkv_errmsg() is implemented
            expect(e.message).to.equal('pmemkv_open() failed');
        }
        expect(db).not.to.exist;
    });

    it('throws exception on start when path is invalid', () => {
        let db = undefined;
        try {
            let config = {"path":"/tmp/123/234/345/456/567/678/nope.nope"};
            db = new pmemkv.db(ENGINE, config);
            expect(true).to.be.false;
        } catch (e) {
            // XXX replace with:
            // expect(e.message).to.equal('Config path is not an existing directory');
            // when pmemkv_errmsg() is implemented
            expect(e.message).to.equal('pmemkv_open() failed');
        }
        expect(db).not.to.exist;
    });

    it('throws exception on start when path is wrong type', () => {
        let db = undefined;
        try {
            let config = {"path":1234};
            db = new pmemkv.db(ENGINE, config);
            expect(true).to.be.false;
        } catch (e) {
            // XXX replace with:
            // expect(e.message).to.equal('Config does not include valid path string');
            // when pmemkv_errmsg() is implemented
            expect(e.message).to.equal('pmemkv_open() failed');
        }
        expect(db).not.to.exist;
    });

    it('uses get_keys_test', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        db.put('1', 'one');
        db.put('2', 'two');
        db.put('记!', 'RR');

        let x = '';
        db.get_all((k) => x += `<${k}>,`);
        expect(x).to.equal('<1>,<2>,<记!>,');

        db.stop();
    });

    it('uses get_keys_above test', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        db.put('A', '1');
        db.put('AB', '2');
        db.put('AC', '3');
        db.put('B', '4');
        db.put('BB', '5');
        db.put('BC', '6');
        db.put('记!', 'RR');

        let x = '';
        db.get_keys_above('B', (k) => x += `${k},`);
        expect(x).to.equal('BB,BC,记!,');

        x = '';
        db.get_keys_above('', (k) => x += `${k},`);
        expect(x).to.equal('A,AB,AC,B,BB,BC,记!,');

        db.stop();
    });

    it('uses get_keys_below test', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        db.put('A', '1');
        db.put('AB', '2');
        db.put('AC', '3');
        db.put('B', '4');
        db.put('BB', '5');
        db.put('BC', '6');
        db.put('记!', 'RR');

        let x = '';
        db.get_keys_below('B', (k) => x += `${k},`);
        expect(x).to.equal('A,AB,AC,');

        x = '';
        db.get_keys_below('\uFFFF', (k) => x += `${k},`);
        expect(x).to.equal('A,AB,AC,B,BB,BC,记!,');

        db.stop();
    });

    it('uses get_keys_between test', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        db.put('A', '1');
        db.put('AB', '2');
        db.put('AC', '3');
        db.put('B', '4');
        db.put('BB', '5');
        db.put('BC', '6');
        db.put('记!', 'RR');

        let x = '';
        db.get_keys_between('A', 'B', (k) => x += `${k},`);
        expect(x).to.equal('AB,AC,');

        x = '';
        db.get_keys_between('B', '\uFFFF', (k) => x += `${k},`);
        expect(x).to.equal('BB,BC,记!,');

        x = '';
        db.get_keys_between('', '', (k) => x += `${k},`);
        db.get_keys_between('A', 'A', (k) => x += `${k},`);
        db.get_keys_between('B', 'A', (k) => x += `${k},`);
        expect(x).to.equal('');

        db.stop();
    });

    it('uses count_all test', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        db.put('A', '1');
        db.put('AB', '2');
        db.put('AC', '3');
        db.put('B', '4');
        db.put('BB', '5');
        db.put('BC', '6');
        db.put('BD', '7');
        expect(db.count_all).to.equal(7);

        expect(db.count_above('')).to.equal(7);
        expect(db.count_above('A')).to.equal(6);
        expect(db.count_above('B')).to.equal(3);
        expect(db.count_above('BC')).to.equal(1);
        expect(db.count_above('BD')).to.equal(0);
        expect(db.count_above('Z')).to.equal(0);

        expect(db.count_below('')).to.equal(0);
        expect(db.count_below('A')).to.equal(0);
        expect(db.count_below('B')).to.equal(3);
        expect(db.count_below('BD')).to.equal(6);
        expect(db.count_below('ZZZZZ')).to.equal(7);

        expect(db.count_between('', 'ZZZZ')).to.equal(7);
        expect(db.count_between('', 'A')).to.equal(0);
        expect(db.count_between('', 'B')).to.equal(3);
        expect(db.count_between('A', 'B')).to.equal(2);
        expect(db.count_between('B', 'ZZZZ')).to.equal(3);

        expect(db.count_between('', '')).to.equal(0);
        expect(db.count_between('A', 'A')).to.equal(0);
        expect(db.count_between('AC', 'A')).to.equal(0);
        expect(db.count_between('B', 'A')).to.equal(0);
        expect(db.count_between('BD', 'A')).to.equal(0);
        expect(db.count_between('ZZZ', 'B')).to.equal(0);

        db.stop();
    });

    it('uses get_all test', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        db.put('1', 'one');
        db.put('2', 'two');
        db.put('记!', 'RR');

        let x = '';
        db.get_all((k, v) => x += `<${k}>,<${v}>|`);
        expect(x).to.equal('<1>,<one>|<2>,<two>|<记!>,<RR>|');

        db.stop();
    });

    it('uses get_above test', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        db.put('A', '1');
        db.put('AB', '2');
        db.put('AC', '3');
        db.put('B', '4');
        db.put('BB', '5');
        db.put('BC', '6');
        db.put('记!', 'RR');

        let x = '';
        db.get_above('B', (k, v) => x += `${k},${v}|`);
        expect(x).to.equal('BB,5|BC,6|记!,RR|');

        x = '';
        db.get_above('', (k, v) => x += `${k},${v}|`);
        expect(x).to.equal('A,1|AB,2|AC,3|B,4|BB,5|BC,6|记!,RR|');

        db.stop();
    });

    it('uses get_below test', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        db.put('A', '1');
        db.put('AB', '2');
        db.put('AC', '3');
        db.put('B', '4');
        db.put('BB', '5');
        db.put('BC', '6');
        db.put('记!', 'RR');

        let x = '';
        db.get_below('AC', (k, v) => x += `${k},${v}|`);
        expect(x).to.equal('A,1|AB,2|');

        x = '';
        db.get_below('\uFFFF', (k, v) => x += `${k},${v}|`);
        expect(x).to.equal('A,1|AB,2|AC,3|B,4|BB,5|BC,6|记!,RR|');

        db.stop();
    });

    it('uses get_between test', () => {
        const db = new pmemkv.db(ENGINE, CONFIG);
        db.put('A', '1');
        db.put('AB', '2');
        db.put('AC', '3');
        db.put('B', '4');
        db.put('BB', '5');
        db.put('BC', '6');
        db.put('记!', 'RR');

        let x = '';
        db.get_between('A', 'B', (k, v) => x += `${k},${v}|`);
        expect(x).to.equal('AB,2|AC,3|');

        x = '';
        db.get_between('B', '\uFFFF', (k, v) => x += `${k},${v}|`);
        expect(x).to.equal('BB,5|BC,6|记!,RR|');

        x = '';
        db.get_between('', '', (k, v) => x += `${k},${v}|`);
        db.get_between('A', 'A', (k, v) => x += `${k},${v}|`);
        db.get_between('B', 'A', (k, v) => x += `${k},${v}|`);
        expect(x).to.equal('');

        db.stop();
    });

});
