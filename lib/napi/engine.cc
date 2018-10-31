#include "engine.h"
#include <assert.h>
#include <stdio.h>

napi_ref Engine::constructor;

Engine::Engine(const char* engine, const char* path, uint32_t size){
    wrapper_ = nullptr;
    env_ = nullptr;
    kv = KVEngine::Open(engine, path, size);
}

Engine::~Engine() { napi_delete_reference(env_, wrapper_); }

void Engine::Destructor(napi_env env, void* nativeObject, void* /*finalize_hint*/) {
  reinterpret_cast<Engine*>(nativeObject)->~Engine();
}

#define DECLARE_NAPI_METHOD(name, func)                          \
  { name, 0, func, 0, 0, 0, napi_default, 0 }

napi_value Engine::Init(napi_env env, napi_value exports) {
  napi_status status;
  napi_property_descriptor properties[] = {
      DECLARE_NAPI_METHOD("put", Put),
      DECLARE_NAPI_METHOD("close", Close),
  };

  napi_value cons;
  status =
      napi_define_class(env, "KVEngine", NAPI_AUTO_LENGTH, New, nullptr, 3, properties, &cons);
  assert(status == napi_ok);

  status = napi_create_reference(env, cons, 1, &constructor);
  assert(status == napi_ok);

  status = napi_set_named_property(env, exports, "KVEngine", cons);
  assert(status == napi_ok);
  return exports;
}

napi_value Engine::New(napi_env env, napi_callback_info info) {
  napi_status status;

  napi_value target;
  status = napi_get_new_target(env, info, &target);
  assert(status == napi_ok);
  bool is_constructor = target != nullptr;
    
  size_t argc = 3;
  napi_value args[argc];
  napi_value jsthis;
  status = napi_get_cb_info(env, info, &argc, args, &jsthis, nullptr);
  assert(status == napi_ok);

  char engine[100] = {'\0'};
  char path[100] = {'\0'};
  uint32_t size;

  napi_get_value_string_utf8(env, args[0], engine, 100, NULL);
  napi_get_value_string_utf8(env, args[1], path, 100, NULL);
  napi_get_value_uint32(env, args[2], &size);

  Engine* kv = new Engine(engine, path, size);

  kv->env_ = env;
  status = napi_wrap(env,
                      jsthis,
                      reinterpret_cast<void*>(kv),
                      Engine::Destructor,
                      nullptr,  // finalize_hint
                      &kv->wrapper_);
  assert(status == napi_ok);

  return jsthis;

}

napi_value Engine::Put(napi_env env, napi_callback_info info) {
  napi_status status;

  size_t argc = 2;
  napi_value args[argc];
  napi_value jsthis;
  status = napi_get_cb_info(env, info, &argc, args, &jsthis, nullptr);
  assert(status == napi_ok);
  char key[100] = {'\0'};
  char value[100] = {'\0'};

  napi_get_value_string_utf8(env, args[0], key, 100, NULL);
  napi_get_value_string_utf8(env, args[1], value, 100, NULL);

  Engine* kv;
  status = napi_unwrap(env, jsthis, reinterpret_cast<void**>(&kv));

  kv->kv->Put(key, value);

  return nullptr;
}

napi_value Engine::Close(napi_env env, napi_callback_info info) {
  napi_status status;

  size_t argc = 2;
  napi_value args[argc];
  napi_value jsthis;
  status = napi_get_cb_info(env, info, &argc, args, &jsthis, nullptr);
  assert(status == napi_ok);

  Engine* kv;
  status = napi_unwrap(env, jsthis, reinterpret_cast<void**>(&kv));

  delete kv->kv;

  return nullptr;
}