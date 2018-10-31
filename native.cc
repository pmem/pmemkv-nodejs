#include <iostream>
#include "libpmemkv.h"
#include<sys/time.h>

#define LOG(msg) std::cout << msg << "\n"

using namespace pmemkv;

int main() {
    KVEngine* kv = KVEngine::Open("blackhole", "/dev/shm/pmemkv-native", 1073741824);  // 1 GB pool
    int iteration = 100000;
    struct timeval start, end;
    // warmup
    for (int i=0; i<iteration; ++i){
        KVStatus s = kv->Put("key", "value");
    }
    gettimeofday(&start, NULL);
    for (int i=0; i<iteration; ++i){
        KVStatus s = kv->Put("key", "value");
    }
    gettimeofday(&end, NULL);
    
    printf("native: %.2f ms\n", (end.tv_sec-start.tv_sec)*1000+(end.tv_usec-start.tv_usec)/1000.0);
    delete kv;
    return 0;
}