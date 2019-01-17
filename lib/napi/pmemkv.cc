#include <napi.h>
#include "kvengine.h"

Napi::Object initAll(Napi::Env env, Napi::Object exports) {
  return KVEngine::init(env, exports);
}

NODE_API_MODULE(pmemkv, initAll)