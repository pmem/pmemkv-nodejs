#ifndef ENGINE_H
#define ENGINE_H

#include <iostream>
#include <libpmemkv.h>
#include <napi.h>

class KVEngine : public Napi::ObjectWrap<KVEngine> {
 public:
  static Napi::Object init(Napi::Env env, Napi::Object exports);
  KVEngine(const Napi::CallbackInfo& info);

 private:
  static Napi::FunctionReference constructor;

  Napi::Value close(const Napi::CallbackInfo& info);
  Napi::Value closed(const Napi::CallbackInfo& info);
  Napi::Value count(const Napi::CallbackInfo& info);
  Napi::Value all(const Napi::CallbackInfo& info);
  Napi::Value each(const Napi::CallbackInfo& info);
  Napi::Value exists(const Napi::CallbackInfo& info);
  Napi::Value get(const Napi::CallbackInfo& info);
  Napi::Value put(const Napi::CallbackInfo& info);
  Napi::Value remove(const Napi::CallbackInfo& info);
  
  pmemkv::KVEngine* _kv;
  bool _closed;
  Napi::Function _cb;
};

#endif