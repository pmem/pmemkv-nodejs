# pmemkv-nodejs
Node.js bindings for pmemkv

The current API is simplified and not functionally equal to its native C/C++ counterpart.
In the future existing API may be extended in idiomatic way without preserving backward compatibility.
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
in example.

Example can be found within this repository in [examples directory](https://github.com/pmem/pmemkv-nodejs/tree/master/examples).
To execute the example:
```
PMEM_IS_PMEM_FORCE=1 node example.js
```

