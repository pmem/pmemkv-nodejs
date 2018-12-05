#include <iostream>
#include<sys/time.h>
#include<ffi.h>
#include <stdio.h>
#include <dlfcn.h>
#include <pthread.h>
#include <sys/types.h>
#include <unistd.h>

#include "libpmemkv.h"

#define LOG(msg) std::cout << msg << "\n"
#define PMEMKV_PATH "/usr/local/lib/libpmemkv.so"

using namespace pmemkv;

int8_t testFunc(pmemkv::KVEngine* engine, int32_t keybytes, const char* key, int32_t valuebytes, const char* value){
    return 0;
}

int main() {
    const char *engine_type = "blackhole";
    const char *engine_name = "/dev/shm/pmemkv";
    size_t engine_size = 1073741824;

    KVEngine* kv = kvengine_open(engine_type, engine_name, engine_size);
    int iteration = 100000000;
    struct timeval start, end;

    const char* key = "key";
    int32_t key_length = strlen(key);
    const char* value = "value";
    int32_t value_length = strlen(value);
    int8_t (*put_func)(pmemkv::KVEngine*, int32_t, const char*, int32_t, const char*) = &testFunc;

    // args
    size_t kv_put_args_count = 5;
    ffi_type *kv_put_args_types[5];
    void *kv_put_args_values[5];
    int8_t result;
    #ifdef FFI
        // kv
        kv_put_args_types[0] = &ffi_type_pointer;
        kv_put_args_values[0] = &key;
        // key length
        kv_put_args_types[1] = &ffi_type_sint32;
        kv_put_args_values[1] = &key_length;
        // key
        kv_put_args_types[2] = &ffi_type_pointer;
        kv_put_args_values[2] = &key;
        // value length
        kv_put_args_types[3] = &ffi_type_sint32;
        kv_put_args_values[3] = &value_length;
        // value
        kv_put_args_types[4] = &ffi_type_pointer;
        kv_put_args_values[4] = &value;

        // return value type
        ffi_type *kv_put_return_type = &ffi_type_sint8; 

        // create ffi_cfi
        ffi_cif cif; 
        ffi_status status = ffi_prep_cif(&cif, FFI_DEFAULT_ABI, kv_put_args_count, kv_put_return_type, kv_put_args_types);
        if (status == FFI_OK) {
            void *return_ptr = NULL;
            return_ptr = &result;
            gettimeofday(&start, NULL);
            for (int i=0; i<iteration; ++i){
                ffi_call(&cif, (void (*)())put_func, return_ptr, kv_put_args_values);
            }
            gettimeofday(&end, NULL);
            
            printf("ffi: %.2f ms\n", (end.tv_sec-start.tv_sec)*1000+(end.tv_usec-start.tv_usec)/1000.0);
            int8_t return_value = *(int8_t *)return_ptr;
        }
    #else
        gettimeofday(&start, NULL);
        for (int i=0; i<iteration; ++i){
            result = put_func(kv, key_length, key, value_length, value);
        }
        gettimeofday(&end, NULL);
        printf("native: %.2f ms\n", (end.tv_sec-start.tv_sec)*1000+(end.tv_usec-start.tv_usec)/1000.0);
    #endif


    delete kv;

    return 0;
}