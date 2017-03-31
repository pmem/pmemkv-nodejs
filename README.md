# pmemkv-nodejs
Node.js bindings for pmemkv

*This is experimental pre-release software and should not be used in
production systems. APIs and file formats may change at any time without
preserving backwards compatibility. All known issues and limitations
are logged as GitHub issues.*

## Dependencies

* Node.js 6.10 or higher
* [pmemkv](https://github.com/pmem/pmemkv) - native key/value library
* [node-ffi](https://github.com/node-ffi/node-ffi) - for native library integration
* Used only for testing:
  * [chai](https://github.com/chaijs/chai) - test assertion library
  * [chai-string](https://github.com/onechiporenko/chai-string) - string assertion library
  * [mocha](https://github.com/mochajs/mocha) - test framework

## Installation

Start by installing [pmemkv](https://github.com/pmem/pmemkv#installation) on your system.

Add npm module to your project:

```
npm install pmem/pmemkv-nodejs --save
```

## Sample code

We are using `/dev/shm` to
[emulate persistent memory](http://pmem.io/2016/02/22/pm-emulation.html)
in this simple example.

```
const pmemkv = require('pmemkv');

const kv = new pmemkv.KVTree("/dev/shm/mykv", 8388608); // 8 MB
kv.put('key1', 'value1);
expect(kv.get('key1')).to.equal('value1');
kv.remove('key1');
kv.close();
```
