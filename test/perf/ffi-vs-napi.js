const pmemkv_ffi = require('../../lib/all.js');
const pmemkv_napi = require('pmemkv-napi');
const iteration = 100000;

// node-ffi
var benchmarkFFI = function(){
    const kv_ffi = new pmemkv_ffi.KVEngine('blackhole', '{"path":"/dev/shm/pmemkv"}');
    // warmup
    for (var i=0; i<iteration; ++i){
        kv_ffi.put('key', 'value');
    }

    console.time('ffi: put()');
    for (var i=0; i<iteration; ++i){
        kv_ffi.put('key', 'value');
    }
    console.timeEnd('ffi: put()');
    kv_ffi.stop();
}

// napi
var benchmarkNAPI = function(){
    const kv_napi = new pmemkv_napi.KVEngine('blackhole', '{"path":"/dev/shm/pmemkv"}');
    //warmup
    for (var i=0; i<iteration; ++i){
        kv_napi.put('key', 'value');
    }

    console.time('napi: put()');
    for (var i=0; i<iteration; ++i){
        kv_napi.put('key', 'value');
    }
    console.timeEnd('napi: put()');
    kv_napi.stop();
}

var benchmarks = [benchmarkFFI, benchmarkNAPI]
for (key in benchmarks){
    benchmarks[key]();
}
