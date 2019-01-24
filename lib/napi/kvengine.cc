#include "kvengine.h"

Napi::FunctionReference KVEngine::constructor;

Napi::Object KVEngine::init(Napi::Env env, Napi::Object exports)
{
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "KVEngine", {
    InstanceMethod("stop", &KVEngine::stop), 
    InstanceMethod("count", &KVEngine::count), 
    InstanceMethod("all", &KVEngine::all), 
    InstanceMethod("each", &KVEngine::each), 
    InstanceMethod("exists", &KVEngine::exists), 
    InstanceMethod("get", &KVEngine::get), 
    InstanceMethod("put", &KVEngine::put), 
    InstanceMethod("remove", &KVEngine::remove)
  });
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  exports.Set("KVEngine", func);

  return exports;
}

KVEngine::KVEngine(const Napi::CallbackInfo &info) : Napi::ObjectWrap<KVEngine>(info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);
  int length = info.Length();
  if (length != 3)
  {
    Napi::TypeError::New(env, "invalid arguments").ThrowAsJavaScriptException();
  }
  string engine = info[0].As<Napi::String>().Utf8Value();
  string config = info[1].As<Napi::String>().Utf8Value();
  Napi::Function cb = info[2].As<Napi::Function>();

  std::function<KVStartFailureCallback> localf = [&](void *context, const char *engine, const char *config, const char *msg) {
    cb.Call(env.Global(), {
      env.Undefined(), 
      Napi::String::New(env, engine), 
      Napi::String::New(env, config), 
      Napi::String::New(env, msg)
    });
  };
  auto callback = [](void *context, const char *engine, const char *config, const char *msg) {
    const auto c = ((std::function<KVStartFailureCallback> *)context);
    c->operator()(context, engine, config, msg);
  };
  this->_kv = pmemkv::KVEngine::Start(&localf, engine.c_str(), config.c_str(), callback);
  if (this->_kv == nullptr)
  {
    Napi::TypeError::New(env, "unable to open persistent pool").ThrowAsJavaScriptException();
  }
}

Napi::Value KVEngine::stop(const Napi::CallbackInfo &info)
{
  pmemkv::KVEngine::Stop(this->_kv);
  return Napi::Value();
}

Napi::Value KVEngine::count(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  return Napi::Number::New(env, _kv->Count());
}

Napi::Value KVEngine::all(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  Napi::Function cb = info[0].As<Napi::Function>();

  this->_kv->All([&](int keybytes, const char *key) {
    cb.Call(env.Global(), {Napi::String::New(env, key)});
  });

  return Napi::Value();
}

Napi::Value KVEngine::each(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  Napi::Function cb = info[0].As<Napi::Function>();

  this->_kv->Each([&](int keybytes, const char *key, int valuebytes, const char *value) {
    cb.Call(env.Global(), {Napi::String::New(env, key), Napi::String::New(env, value)});
  });

  return Napi::Value();
}

Napi::Value KVEngine::exists(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  string key = info[0].As<Napi::String>().Utf8Value();

  return Napi::Boolean::New(env, (_kv->Exists(key) == OK));
}

Napi::Value KVEngine::get(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  string key = info[0].As<Napi::String>().Utf8Value();
  string value;

  KVStatus status = this->_kv->Get(key, &value);
  if (status == OK)
    return Napi::String::New(env, value);
  else if (status == NOT_FOUND)
  {
    return env.Undefined();
  }
  else if (status == FAILED)
  {
    Napi::Error::New(env, "Unable to get key").ThrowAsJavaScriptException();
  }

  return Napi::Value();
}

Napi::Value KVEngine::put(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  string key = info[0].As<Napi::String>().Utf8Value();
  string value = info[1].As<Napi::String>().Utf8Value();

  KVStatus status = this->_kv->Put(key, value);
  if (status == FAILED)
    Napi::Error::New(env, "Unable to put key").ThrowAsJavaScriptException();

  return Napi::Value();
}

Napi::Value KVEngine::remove(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  string key = info[0].As<Napi::String>().Utf8Value();

  KVStatus status = this->_kv->Remove(key);
  if (status == FAILED)
    Napi::Error::New(env, "Unable to remove key").ThrowAsJavaScriptException();
    
  return Napi::Boolean::New(env, (status == OK));
}
