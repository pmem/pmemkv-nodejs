#include <node_api.h>
#include <iostream>
#include <libpmemkv.h>

using namespace pmemkv;

class Engine {
 public:
  static napi_value Init(napi_env env, napi_value exports);
  static void Destructor(napi_env env, void* nativeObject, void* finalize_hint);

 private:
  explicit Engine(const char* engine, const char* path, uint32_t size);
  ~Engine();

  static napi_value New(napi_env env, napi_callback_info info);
  static napi_value Put(napi_env env, napi_callback_info info);
  static napi_value Close(napi_env env, napi_callback_info info);
  static napi_ref constructor;
  double value_;
  napi_env env_;
  napi_ref wrapper_;
  KVEngine* kv;
  
};