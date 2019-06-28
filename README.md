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

Clone the pmemkv-nodejs tree:

```
git clone https://github.com/pmem/pmemkv-nodejs.git
cd pmemkv-nodejs
```

Add npm modules to your project (install the dependencies listed in package.json in the local node_modules folder):

```
npm install
```

## Testing

This library includes a set of automated tests that exercise all functionality.

```
LD_LIBRARY_PATH=path_to_your_libs npm test
```

## Example

We are using `/dev/shm` to
[emulate persistent memory](http://pmem.io/2016/02/22/pm-emulation.html)
in this simple example.

```js
const Database = require('/lib/database');

function assert(condition) {
    if (!condition) throw new Error('Assert failed');
}

console.log('Starting engine');
const db = new Database('vsmap', '{"path":"/dev/shm", "size":1073741824}');

console.log('Putting new key');
db.put('key1', 'value1');
assert(db.count_all === 1);

console.log('Reading key back');
assert(db.get('key1') === 'value1');

console.log('Iterating existing keys');
db.put('key2', 'value2');
db.put('key3', 'value3');
db.get_keys((k) => console.log(`  visited: ${k}`));

console.log('Removing existing key');
db.remove('key1');
assert(!db.exists('key1'));

console.log('Stopping engine');
db.stop();
```
