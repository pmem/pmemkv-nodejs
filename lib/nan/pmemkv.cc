#include <nan.h>
#include "engine.h"

void InitAll(v8::Local<v8::Object> exports) {
  Engine::Init(exports);
}

NODE_MODULE(pmemkv, InitAll)