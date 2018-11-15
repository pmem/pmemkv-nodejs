#include <iostream>
#include<sys/time.h>
#include<ffi.h>

int testFunc(int m, int n) {
    // printf("params: %d %d \n", m, n);
    return m+n;
}

int main() {
    struct timeval start, end;
    int iteration = 100000000;
    // get function pointer
    int(* functionPtr)(int, int) = &testFunc;

    #ifdef FFI
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

        // create ffi_cif object
        ffi_cif cif;
        ffi_type *returnFfiType = &ffi_type_sint;
        ffi_status ffiPrepStatus = ffi_prep_cif(&cif, FFI_DEFAULT_ABI, (unsigned int)argCount, returnFfiType, ffiArgTypes);
        
        if (ffiPrepStatus == FFI_OK) {
            void *returnPtr = NULL;
            if (returnFfiType->size) {
                returnPtr = alloca(returnFfiType->size);
            }
            //ffi call
            ulong returnValue = 0;
            gettimeofday(&start, NULL);
            for (int i=0; i<iteration; ++i){
                ffi_call(&cif, (void (*)())functionPtr, returnPtr, ffiArgs);
                returnValue += *(int *)returnPtr;
            }
            gettimeofday(&end, NULL);
            printf("result %lu\n", returnValue);
            printf("ffi: %.2f ms\n", (end.tv_sec-start.tv_sec)*1000+(end.tv_usec-start.tv_usec)/1000.0);
        }
    #else
         // native call
        ulong returnValue = 0;
        gettimeofday(&start, NULL);
        for (int i=0; i<iteration; ++i){
            returnValue += functionPtr(3, 5);
        }
        gettimeofday(&end, NULL);
        printf("result %lu\n", returnValue);
        printf("native: %.2f ms\n", (end.tv_sec-start.tv_sec)*1000+(end.tv_usec-start.tv_usec)/1000.0);

    #endif

}
