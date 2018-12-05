#include <stdio.h>
#include "engine.h"
using namespace Nan;
using namespace v8;
Nan::Persistent<v8::Function> Engine::constructor;

Engine::Engine(const char* engine, const char* path, uint32_t size){
    kv = KVEngine::Open(engine, path, size);
}
Engine::~Engine() {
}

void Engine::Init(v8::Local<v8::Object> exports) {
  Nan::HandleScope scope;

  // Prepare constructor template
  v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);
  tpl->SetClassName(Nan::New("KVEngine").ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  Nan::SetPrototypeMethod(tpl, "put", Put);
  Nan::SetPrototypeMethod(tpl, "close", Put);

  constructor.Reset(tpl->GetFunction());
  exports->Set(Nan::New("KVEngine").ToLocalChecked(), tpl->GetFunction());
}

void Engine::New(const Nan::FunctionCallbackInfo<v8::Value>& info) {
    String::Utf8Value engine(info[0]);
    String::Utf8Value path(info[1]);
    uint32_t size = info[2]->IsUndefined() ? 0 : info[2]->NumberValue();

    Engine* obj = new Engine(*engine, *path, size);
    obj->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
}

void Engine::Put(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  Engine* obj = ObjectWrap::Unwrap<Engine>(info.Holder());
  String::Utf8Value key(info[0]);
  String::Utf8Value value(info[1]);
  obj->kv->Put(*key, *value);
  info.GetReturnValue().Set(Nan::New(0));
}

void Engine::Close(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  Engine* obj = ObjectWrap::Unwrap<Engine>(info.Holder());
  
  delete obj->kv;
  info.GetReturnValue().Set(Nan::New(0));
}
