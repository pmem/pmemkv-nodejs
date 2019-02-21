# pmemkv-nodejs
Node.js bindings for pmemkv

*This is experimental pre-release software and should not be used in
production systems. APIs and file formats may change at any time without
preserving backwards compatibility. All known issues and limitations
are logged as GitHub issues.*

## Dependencies

* Node.js 6.10 or higher
* [PMDK](https://github.com/pmem/pmdk) - native persistent memory libraries
* [pmemkv](https://github.com/pmem/pmemkv) - native key/value library
* [node-addon-api](https://github.com/nodejs/node-addon-api), [node-bindings](https://github.com/TooTallNate/node-bindings), [node-gyp](https://github.com/nodejs/node-gyp) - for native library integration
* Used only for testing:
  * [chai](https://github.com/chaijs/chai) - test assertion library
  * [chai-string](https://github.com/onechiporenko/chai-string) - string assertion library
  * [mocha](https://github.com/mochajs/mocha) - test framework

## Installation

Start by installing [pmemkv](https://github.com/pmem/pmemkv/blob/master/INSTALLING.md) on your system.

Add npm module to your project:

```
npm install pmem/pmemkv-nodejs --save
```

## Example

We are using `/dev/shm` to
[emulate persistent memory](http://pmem.io/2016/02/22/pm-emulation.html)
in this simple example.

```js
const pmemkv = require('pmemkv');

function assert(condition) {
    if (!condition) throw new Error('Assert failed');
}

console.log('Starting engine');
const kv = new KVEngine('vmap', '{"path":"/dev/shm/"}');

console.log('Putting new key');
kv.put('key1', 'value1');
assert(kv.count === 1);

console.log('Reading key back');
assert(kv.get('key1') === 'value1');

console.log('Iterating existing keys');
kv.put('key2', 'value2');
kv.put('key3', 'value3');
kv.all((k) => console.log(`  visited: ${k}`));

console.log('Removing existing key');
kv.remove('key1');
assert(!kv.exists('key1'));

console.log('Stopping engine');
kv.stop();
```
