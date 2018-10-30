#include "engine.h"

napi_value Init(napi_env env, napi_value exports) {
  return Engine::Init(env, exports);
}

NAPI_MODULE(pmemkv, Init)