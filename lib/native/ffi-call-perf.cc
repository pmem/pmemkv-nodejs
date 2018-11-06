#include <iostream>
#include<sys/time.h>
#include<ffi.h>

int testFunc(int m, int n) {
    // printf("params: %d %d \n", m, n);
    return m+n;
}

int main() {
    testFunc(1, 2);
    struct timeval start, end;
    int iteration = 1000000;

    // get function pointer
    int(* functionPtr)(int, int) = &testFunc;

    // args types array
    int argCount = 2;
    ffi_type **ffiArgTypes = (ffi_type **)alloca(sizeof(ffi_type *) *argCount);
    ffiArgTypes[0] = &ffi_type_sint;
    ffiArgTypes[1] = &ffi_type_sint;
    
    // args values array
    void **ffiArgs = (void **)alloca(sizeof(void *) *argCount);
    void *ffiArgPtr = alloca(ffiArgTypes[0]->size);
    int *argPtr = (int *)ffiArgPtr;
    *argPtr = 5;
    ffiArgs[0] = ffiArgPtr;
    
    void *ffiArgPtr2 = alloca(ffiArgTypes[1]->size);
    int *argPtr2 = (int *)ffiArgPtr2;
    *argPtr2 = 3;
    ffiArgs[1] = ffiArgPtr2;

    // create ffi_cfi object
    ffi_cif cif;
    ffi_type *returnFfiType = &ffi_type_sint;
    ffi_status ffiPrepStatus = ffi_prep_cif(&cif, FFI_DEFAULT_ABI, (unsigned int)argCount, returnFfiType, ffiArgTypes);
    
    if (ffiPrepStatus == FFI_OK) {
        void *returnPtr = NULL;
        if (returnFfiType->size) {
            returnPtr = alloca(returnFfiType->size);
        }
        // warmup
        for (int i=0; i<iteration*2; ++i){
            int returnValue = testFunc(5, 3);
        }
        // ffi call
        gettimeofday(&start, NULL);
        for (int i=0; i<iteration; ++i){
            ffi_call(&cif, (void (*)())functionPtr, returnPtr, ffiArgs);
            int returnValue = *(int *)returnPtr;
        }
        gettimeofday(&end, NULL);
        printf("ffi: %.2f ms\n", (end.tv_sec-start.tv_sec)*1000+(end.tv_usec-start.tv_usec)/1000.0);
        // native call
        gettimeofday(&start, NULL);
        for (int i=0; i<iteration; ++i){
            int returnValue = testFunc(5, 3);
        }
        gettimeofday(&end, NULL);
        printf("native: %.2f ms\n", (end.tv_sec-start.tv_sec)*1000+(end.tv_usec-start.tv_usec)/1000.0);
    }
}