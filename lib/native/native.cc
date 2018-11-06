#include <iostream>
#include "libpmemkv.h"
#include<sys/time.h>

#define LOG(msg) std::cout << msg << "\n"

using namespace pmemkv;

int main() {
    KVEngine* kv = kvengine_open("blackhole", "/dev/shm/pmemkv", 1073741824);
    int iteration = 100000;
    struct timeval start, end;
    // warmup
    const char* key = "key";
    const char* value = "value";
    for (int i=0; i<iteration; ++i){
        int8_t s = kvengine_put(kv, strlen(key), key, strlen(value), value);
    }
    gettimeofday(&start, NULL);
    for (int i=0; i<iteration; ++i){
        int8_t s = kvengine_put(kv, strlen(key), key, strlen(value), value);
    }
    gettimeofday(&end, NULL);
    
    printf("native: %.2f ms\n", (end.tv_sec-start.tv_sec)*1000+(end.tv_usec-start.tv_usec)/1000.0);
    delete kv;
    return 0;
}