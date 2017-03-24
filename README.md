# pmemkv-nodejs
Node.js bindings for pmemkv

*This is experimental pre-release software and should not be used in
production systems. APIs and file formats may change at any time without
preserving backwards compatibility. All known issues and limitations
are logged as GitHub issues.*

## Dependencies

* Node.js 7 or higher
* [pmemkv](https://github.com/pmem/pmemkv) - native key/value library
* [ffi](https://github.com/node-ffi/node-ffi) - for native library integration
* Used only for testing:
  * [mocha](https://github.com/mochajs/mocha) - test framework
  * [chai](https://github.com/chaijs/chai) - test assertion library
  * [chai-string](https://github.com/onechiporenko/chai-string) - string assertion library

## Installation

Start by installing [pmemkv](https://github.com/pmem/pmemkv#installation) on your system.

Add npm module to your project:

```
npm install pmem/pmemkv-nodejs --save
```
