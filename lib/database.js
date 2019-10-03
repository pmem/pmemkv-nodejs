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

/**
 * Main Node.js pmemkv class.
 *
 * It contains Node.js pmemkv public enum *constants* and class *db* with its
 * functions and members.
 *
 * @link   https://github.com/pmem/pmemkv-nodejs
 * @file   This files defines the *db* class and exports *constants* enum.
 * @since  1.0
 */

const pmemkv = require('bindings')('pmemkv');

/** @class db Main pmemkv class, it provides functions to operate on data in database. */
class db {
	/**
	 * Creates an instance of db.
	 *
	 * @constructor
	 * @param {string} engine Name of the engine to work with.
	 * @param {object} config JSON like config with parameters specified for the engine.
	 */
	constructor(engine, config) {
		this._stopped = false;
		this._db = new pmemkv.db(engine, config);
		Object.defineProperty(this, '_db', {configurable: false, writable: false});
	}

	/**
	 * Stops the database.
	 */
	stop() {
		if (!this._stopped) {
			this._stopped = true;
			Object.defineProperty(this, '_stopped', {configurable: false, writable: false});
			this._db.stop();
		}
	}

	/**
	 * Returns value of *stopped* property.
	 *
	 * @return {boolean} true if stopped, false otherwise.
	 */
	get stopped() {
		return this._stopped;
	}

	/**
	 * aaaa.
	 *
	 * @param {boolean} aaaa.
	 */
	get_keys(callback) {
		this._db.get_all(callback);
	}

	/**
	 * aaaa.
	 *
	 * @param {string} aaaa.
	 * @param {boolean} aaaa.
	 */
	get_keys_above(key, callback) {
		this._db.get_above(key, callback);
	}

	/**
	 * aaaa.
	 *
	 * @param {string} aaaa.
	 * @param {boolean} aaaa.
	 */
	get_keys_below(key, callback) {
		this._db.get_below(key, callback);
	}

	/**
	 * aaaa.
	 *
	 * @param {string} aaaa.
	 * @param {string} aaaa.
	 * @param {boolean} aaaa.
	 */
	get_keys_between(key1, key2, callback) {
		this._db.get_between(key1, key2, callback);
	}

	/**
	 * aaaa.
	 *
	 * @return {number} aaaa.
	 */
	get count_all() {
		return this._db.count_all();
	}

	/**
	 * aaaa.
	 *
	 * @param {string} aaaa.
	 * @return {number} aaaa.
	 */
	count_above(key) {
		return this._db.count_above(key);
	}

	/**
	 * aaaa.
	 *
	 * @param {string} aaaa.
	 * @return {number} aaaa.
	 */
	count_below(key) {
		return this._db.count_below(key);
	}

	/**
	 * aaaa.
	 *
	 * @param {string} key1 .
	 * @param {string} key2 .
	 * @return {number} aaaa.
	 */
	count_between(key1, key2) {
		return this._db.count_between(key1, key2);
	}

	/**
	 * aaaa.
	 *
	 * @param {boolean} aaaa.
	 */
	get_all(callback) {
		this._db.get_all(callback)
	}

	/**
	 * aaaa.
	 *
	 * @param {string} aaaa.
	 * @param {boolean} aaaa.
	 */
	get_above(key, callback) {
		this._db.get_above(key, callback)
	}

	/**
	 * aaaa.
	 *
	 * @param {string} aaaa.
	 * @param {boolean} aaaa.
	 */
	get_below(key, callback) {
		this._db.get_below(key, callback)
	}

	/**
	 * aaaa.
	 *
	 * @param {string} aaaa.
	 * @param {string} aaaa.
	 * @param {boolean} aaaa.
	 */
	get_between(key1, key2, callback) {
		this._db.get_between(key1, key2, callback)
	}

	/**
	 * aaaa.
	 *
	 * @param {string} key .
	 * @return {boolean} aaaa.
	 */
	exists(key) {
		return this._db.exists(key);
	}

	/**
	 * aaaa.
	 *
	 * @param {string} key .
	 * @return {boolean} aaaa.
	 */
	get(key) {
		return this._db.get(key);
	}

	/**
	 * aaaa.
	 *
	 * @param {string} key .
	 * @param {aaaa} value .
	 */
	put(key, value) {
		this._db.put(key, value);
	}

	/**
	 * aaaa.
	 *
	 * @param {string} key .
	 * @return {boolean} aaaa.
	 */
	remove(key) {
		return this._db.remove(key);
	}
}

module.exports = db;
module.exports.constants = pmemkv.constants;
