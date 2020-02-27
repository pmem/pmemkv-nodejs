[![Build Status](https://travis-ci.org/pmem/pmemkv-nodejs.svg?branch=master)](https://travis-ci.org/pmem/pmemkv-nodejs)

# pmemkv-nodejs

Node.js bindings for pmemkv.
All known issues and limitations are logged as GitHub issues.

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

```sh
git clone https://github.com/pmem/pmemkv-nodejs.git
cd pmemkv-nodejs
```

Add npm modules to your project (install the dependencies listed in package.json in the local node_modules folder):

```sh
npm install
```

## Testing

This library includes a set of automated tests that exercise all functionality.

```sh
LD_LIBRARY_PATH=path_to_your_libs npm test
```

## Example

We are using `/dev/shm` to
[emulate persistent memory](http://pmem.io/2016/02/22/pm-emulation.html)
in example.

Example can be found within this repository in [examples directory](https://github.com/pmem/pmemkv-nodejs/tree/master/examples).
To execute the example:

```sh
PMEM_IS_PMEM_FORCE=1 node basic_example.js
```

## Documentation

Docs can be generated using jsdoc (to install, run: `npm install -g jsdoc`)
by executing commands:

```sh
mkdir doc
cd doc
jsdoc ../lib/database.js --pedantic --verbose -R ../README.md
```
