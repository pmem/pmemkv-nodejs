#include <nan.h>
#include <libpmemkv.h>

using namespace pmemkv;

class Engine : public Nan::ObjectWrap {
 public:
  static void Init(v8::Local<v8::Object> exports);

 private:
  explicit Engine(const char* engine, const char* path, uint32_t size);
  ~Engine();

  static void New(const Nan::FunctionCallbackInfo<v8::Value>& info);
  static void Put(const Nan::FunctionCallbackInfo<v8::Value>& info);
  static void Close(const Nan::FunctionCallbackInfo<v8::Value>& info);
  static Nan::Persistent<v8::Function> constructor;
  KVEngine* kv;
};