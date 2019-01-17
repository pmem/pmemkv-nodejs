#include "kvengine.h"

Napi::FunctionReference KVEngine::constructor;

Napi::Object KVEngine::init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "KVEngine", {
    InstanceMethod("close", &KVEngine::close),
    InstanceMethod("closed", &KVEngine::closed),
    InstanceMethod("count", &KVEngine::count),
    InstanceMethod("all", &KVEngine::all),
    // InstanceMethod("each", &KVEngine::each),
    // InstanceMethod("exists", &KVEngine::exists),
    // InstanceMethod("get", &KVEngine::get),
    InstanceMethod("put", &KVEngine::put),
    // InstanceMethod("remove", &KVEngine::remove)
  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("KVEngine", func);
  return exports;
}

KVEngine::KVEngine(const Napi::CallbackInfo& info) : Napi::ObjectWrap<KVEngine>(info)  {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  int length = info.Length();

  if (length != 3) {
    Napi::TypeError::New(env, "invalid arguments").ThrowAsJavaScriptException();
  }

  std::string engine = info[0].As<Napi::String>().Utf8Value();
  std::string path = info[1].As<Napi::String>().Utf8Value();
  size_t size = info[2].As<Napi::Number>().Int64Value();

  this->_kv = pmemkv::KVEngine::Open(engine, path, size);
  this->_closed = false;
}

Napi::Value KVEngine::put(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  std::string key = info[0].As<Napi::String>().Utf8Value();
  std::string value = info[1].As<Napi::String>().Utf8Value();

  KVStatus status = this->_kv->Put(key ,value);
  if (status == FAILED) Napi::Error::New(env,  string("unable to put key:") + key).ThrowAsJavaScriptException();
  return Napi::Value();
}

Napi::Value KVEngine::close(const Napi::CallbackInfo& info) {
  this->_kv->Close(this->_kv);
  return Napi::Value();
}

Napi::Value KVEngine::closed(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Boolean::New(env, _closed);
}

Napi::Value KVEngine::count(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, _kv->Count());
}

void testfunc(){

}

Napi::Value KVEngine::all(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  this->_cb = info[0].As<Napi::Function>();
  cb.Call(env.Global(), { Napi::String::New(env, "k") });
  this->_kv->All([](int kb, const char* k) {
    testfunc();
  });
}

