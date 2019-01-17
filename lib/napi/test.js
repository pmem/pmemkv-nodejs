// const pmemkv_ffi = require('../all.js');
const pmemkv_napi = require('bindings')('pmemkv');
const iteration = 100000;

// // node-ffi
// var benchmarkFFI = function(){
//     const kv_ffi = new pmemkv_ffi.KVEngine('blackhole', '/dev/shm/pmemkv-ffi0', 1073741824);  // 1 GB pool
//     // warmup
//     for (var i=0; i<iteration; ++i){
//         kv_ffi.put('key', 'value');
//     }

//     console.time('ffi');
//     for (var i=0; i<iteration; ++i){
//         kv_ffi.put('key', 'value');
//     }
//     console.timeEnd('ffi');
//     kv_ffi.close();
// }

// napi
var benchmarkNAPI = function(){
    const kv_napi = new pmemkv_napi.KVEngine('blackhole', '/dev/shm/pmemkv-napi0', 1073741824);  // 1 GB pool
    //warmup
    for (var i=0; i<iteration; ++i){
        kv_napi.put('key', 'value');
    }

    console.time('napi');
    for (var i=0; i<iteration; ++i){
        kv_napi.put('key', 'value');
    }
    console.timeEnd('napi');
    kv_napi.close();
}

var benchmarks = [benchmarkNAPI]
for (key in benchmarks){
    benchmarks[key]();
}