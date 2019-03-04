/*
 * Copyright 2017-2019, Intel Corporation
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in
 *       the documentation and/or other materials provided with the
 *       distribution.
 *
 *     * Neither the name of the copyright holder nor the names of its
 *       contributors may be used to endorse or promote products derived
 *       from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#include "kvengine.h"

Napi::FunctionReference KVEngine::constructor;

Napi::Object KVEngine::init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "KVEngine", {
            InstanceMethod("stop", &KVEngine::stop),
            InstanceMethod("all", &KVEngine::all),
            InstanceMethod("all_above", &KVEngine::all_above),
            InstanceMethod("all_below", &KVEngine::all_below),
            InstanceMethod("all_between", &KVEngine::all_between),
            InstanceMethod("count", &KVEngine::count),
            InstanceMethod("count_above", &KVEngine::count_above),
            InstanceMethod("count_below", &KVEngine::count_below),
            InstanceMethod("count_between", &KVEngine::count_between),
            InstanceMethod("each", &KVEngine::each),
            InstanceMethod("each_above", &KVEngine::each_above),
            InstanceMethod("each_below", &KVEngine::each_below),
            InstanceMethod("each_between", &KVEngine::each_between),
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

KVEngine::KVEngine(const Napi::CallbackInfo& info) : Napi::ObjectWrap<KVEngine>(info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);
    int length = info.Length();
    if (length != 3) Napi::TypeError::New(env, "invalid arguments").ThrowAsJavaScriptException();
    string engine = info[0].As<Napi::String>().Utf8Value();
    string config = info[1].As<Napi::String>().Utf8Value();
    Napi::Function cb = info[2].As<Napi::Function>();
    std::function<KVStartFailureCallback> localf = [&](void* context, const char* engine, const char* config,
                                                       const char* msg) {
        cb.Call(env.Global(), {
                env.Undefined(),
                Napi::String::New(env, engine),
                Napi::String::New(env, config),
                Napi::String::New(env, msg)
        });
    };
    auto callback = [](void* context, const char* engine, const char* config, const char* msg) {
        const auto c = ((std::function<KVStartFailureCallback>*) context);
        c->operator()(context, engine, config, msg);
    };
    this->_kv = pmemkv::KVEngine::Start(&localf, engine.c_str(), config.c_str(), callback);
}

Napi::Value KVEngine::stop(const Napi::CallbackInfo& info) {
    pmemkv::KVEngine::Stop(this->_kv);
    return Napi::Value();
}

Napi::Value KVEngine::all(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Function cb = info[0].As<Napi::Function>();
    bool as_buffer = info[1].As<Napi::Boolean>();
    if (as_buffer){
        this->_kv->All([&](int keybytes, const char* key) {
            cb.Call(env.Global(), {Napi::Buffer<char>::Copy(env, key, keybytes)});
        });
    }
    else {
        this->_kv->All([&](int keybytes, const char* key) {
            cb.Call(env.Global(), {Napi::String::New(env, key, keybytes)});
        });
    }
    return Napi::Value();
}

Napi::Value KVEngine::all_above(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    string key;
    Napi::Function cb = info[1].As<Napi::Function>();
    if (info[0].IsBuffer()){
        Napi::Buffer<char> buffer = info[0].As<Napi::Buffer<char>>();
        key = string(buffer.Data(), buffer.Length());
        this->_kv->AllAbove(key, [&](int keybytes, const char* key) {
            cb.Call(env.Global(), {Napi::Buffer<char>::Copy(env, key, keybytes)});
        });
    }
    else if (info[0].IsString()){
        key = info[0].As<Napi::String>().Utf8Value();
        this->_kv->AllAbove(key, [&](int keybytes, const char* key) {
            cb.Call(env.Global(), {Napi::String::New(env, key, keybytes)});
        });
    }
    else {
        Napi::Error::New(env, "A Buffer or string is expected").ThrowAsJavaScriptException();
        return Napi::Value();
    }
    return Napi::Value();
}

Napi::Value KVEngine::all_below(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    string key;
    Napi::Function cb = info[1].As<Napi::Function>();
    if (info[0].IsBuffer()){
        Napi::Buffer<char> buffer = info[0].As<Napi::Buffer<char>>();
        key = string(buffer.Data(), buffer.Length());
        this->_kv->AllBelow(key, [&](int keybytes, const char* key) {
            cb.Call(env.Global(), {Napi::Buffer<char>::Copy(env, key, keybytes)});
        });
    }
    else if (info[0].IsString()){
        key = info[0].As<Napi::String>().Utf8Value();
        this->_kv->AllBelow(key, [&](int keybytes, const char* key) {
            cb.Call(env.Global(), {Napi::String::New(env, key, keybytes)});
        });
    }
    else {
        Napi::Error::New(env, "A Buffer or string is expected").ThrowAsJavaScriptException();
        return Napi::Value();
    }
    return Napi::Value();
}

Napi::Value KVEngine::all_between(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    string key1, key2;
    Napi::Function cb = info[2].As<Napi::Function>();
    if (info[0].IsBuffer()){
        Napi::Buffer<char> buffer1 = info[0].As<Napi::Buffer<char>>();
        Napi::Buffer<char> buffer2 = info[1].As<Napi::Buffer<char>>();
        key1 = string(buffer1.Data(), buffer1.Length());
        key2 = string(buffer2.Data(), buffer2.Length());
        this->_kv->AllBetween(key1, key2, [&](int keybytes, const char* key) {
            cb.Call(env.Global(), {Napi::Buffer<char>::Copy(env, key, keybytes)});
        });
    }
    else if (info[0].IsString()){
        key1 = info[0].As<Napi::String>().Utf8Value();
        key2 = info[1].As<Napi::String>().Utf8Value();
        this->_kv->AllBetween(key1, key2, [&](int keybytes, const char* key) {
            cb.Call(env.Global(), {Napi::String::New(env, key, keybytes)});
        });
    }
    else {
        Napi::Error::New(env, "A Buffer or string is expected").ThrowAsJavaScriptException();
        return Napi::Value();
    }
    return Napi::Value();
}

Napi::Value KVEngine::count(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, _kv->Count());
}

Napi::Value KVEngine::count_above(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    string key;
    if (info[0].IsBuffer()){
        Napi::Buffer<char> buffer = info[0].As<Napi::Buffer<char>>();
        key = string(buffer.Data(), buffer.Length());
    }
    else if (info[0].IsString()){
        key = info[0].As<Napi::String>().Utf8Value();
    }
    else {
        Napi::Error::New(env, "A Buffer or string is expected").ThrowAsJavaScriptException();
        return Napi::Value();
    }
    return Napi::Number::New(env, _kv->CountAbove(key));
}

Napi::Value KVEngine::count_below(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    string key;
    if (info[0].IsBuffer()){
        Napi::Buffer<char> buffer = info[0].As<Napi::Buffer<char>>();
        key = string(buffer.Data(), buffer.Length());
    }
    else if (info[0].IsString()){
        key = info[0].As<Napi::String>().Utf8Value();
    }
    else {
        Napi::Error::New(env, "A Buffer or string is expected").ThrowAsJavaScriptException();
        return Napi::Value();
    }
    return Napi::Number::New(env, _kv->CountBelow(key));
}

Napi::Value KVEngine::count_between(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    string key1, key2;
    if (info[0].IsBuffer()){
        Napi::Buffer<char> buffer1 = info[0].As<Napi::Buffer<char>>();
        Napi::Buffer<char> buffer2 = info[1].As<Napi::Buffer<char>>();
        key1 = string(buffer1.Data(), buffer1.Length());
        key2 = string(buffer2.Data(), buffer2.Length());
    }
    else if(info[0].IsString()){
        key1 = info[0].As<Napi::String>().Utf8Value();
        key2 = info[1].As<Napi::String>().Utf8Value();
    }
    else {
        Napi::Error::New(env, "A Buffer or string is expected").ThrowAsJavaScriptException();
        return Napi::Value();
    }
    return Napi::Number::New(env, _kv->CountBetween(key1, key2));
}

Napi::Value KVEngine::each(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Function cb = info[0].As<Napi::Function>();
    bool as_buffer = info[1].As<Napi::Boolean>();
    if (as_buffer){
        this->_kv->Each([&](int keybytes, const char* key, int valuebytes, const char* value) {
            cb.Call(env.Global(), {Napi::Buffer<char>::Copy(env, key, keybytes), Napi::Buffer<char>::Copy(env, value, valuebytes)});
        });
    }
    else{
        this->_kv->Each([&](int keybytes, const char* key, int valuebytes, const char* value) {
            cb.Call(env.Global(), {Napi::String::New(env, key, keybytes), Napi::String::New(env, value, valuebytes)});
        });
    }
    return Napi::Value();
}

Napi::Value KVEngine::each_above(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    string key;
    Napi::Function cb = info[1].As<Napi::Function>();
    if (info[0].IsBuffer()){
        Napi::Buffer<char> buffer = info[0].As<Napi::Buffer<char>>();
        key = string(buffer.Data(), buffer.Length());
        this->_kv->EachAbove(key, [&](int keybytes, const char* key, int valuebytes, const char* value) {
            cb.Call(env.Global(), {Napi::Buffer<char>::Copy(env, key, keybytes), Napi::Buffer<char>::Copy(env, value, valuebytes)});
        });
    }
    else if (info[0].IsString()){
        key = info[0].As<Napi::String>().Utf8Value();
        this->_kv->EachAbove(key, [&](int keybytes, const char* key, int valuebytes, const char* value) {
            cb.Call(env.Global(), {Napi::String::New(env, key, keybytes), Napi::String::New(env, value, valuebytes)});
        });
    }
    else {
        Napi::Error::New(env, "A Buffer or string is expected").ThrowAsJavaScriptException();
        return Napi::Value();
    }
    return Napi::Value();
}

Napi::Value KVEngine::each_below(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    string key;
    Napi::Function cb = info[1].As<Napi::Function>();
    if (info[0].IsBuffer()){
        Napi::Buffer<char> buffer = info[0].As<Napi::Buffer<char>>();
        key = string(buffer.Data(), buffer.Length());
        this->_kv->EachBelow(key, [&](int keybytes, const char* key, int valuebytes, const char* value) {
            cb.Call(env.Global(), {Napi::Buffer<char>::Copy(env, key, keybytes), Napi::Buffer<char>::Copy(env, value, valuebytes)});
        });
    }
    else if (info[0].IsString()){
        key = info[0].As<Napi::String>().Utf8Value();
        this->_kv->EachBelow(key, [&](int keybytes, const char* key, int valuebytes, const char* value) {
            cb.Call(env.Global(), {Napi::String::New(env, key, keybytes), Napi::String::New(env, value, valuebytes)});
        });
    }
    else {
        Napi::Error::New(env, "A Buffer or string is expected").ThrowAsJavaScriptException();
        return Napi::Value();
    }
    return Napi::Value();
}

Napi::Value KVEngine::each_between(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    string key1, key2;
    Napi::Function cb = info[2].As<Napi::Function>();
    if (info[0].IsBuffer()){
        Napi::Buffer<char> buffer1 = info[0].As<Napi::Buffer<char>>();
        Napi::Buffer<char> buffer2 = info[1].As<Napi::Buffer<char>>();
        key1 = string(buffer1.Data(), buffer1.Length());
        key2 = string(buffer2.Data(), buffer2.Length());
        this->_kv->EachBetween(key1, key2, [&](int keybytes, const char* key, int valuebytes, const char* value) {
            cb.Call(env.Global(), {Napi::Buffer<char>::Copy(env, key, keybytes), Napi::Buffer<char>::Copy(env, value, valuebytes)});
        });
    }
    else if (info[0].IsString()){
        key1 = info[0].As<Napi::String>().Utf8Value();
        key2 = info[1].As<Napi::String>().Utf8Value();
        this->_kv->EachBetween(key1, key2, [&](int keybytes, const char* key, int valuebytes, const char* value) {
            cb.Call(env.Global(), {Napi::String::New(env, key, keybytes), Napi::String::New(env, value, valuebytes)});
        });
    }
    else {
        Napi::Error::New(env, "A Buffer or string is expected").ThrowAsJavaScriptException();
        return Napi::Value();
    }
    return Napi::Value();
}

Napi::Value KVEngine::exists(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    string key;
    if (info[0].IsBuffer()){
        Napi::Buffer<char> buffer = info[0].As<Napi::Buffer<char>>();
        key = string(buffer.Data(), buffer.Length());
    }
    else if (info[0].IsString()){
        key = info[0].As<Napi::String>().Utf8Value();
    }
    else {
        Napi::Error::New(env, "A Buffer or string is expected").ThrowAsJavaScriptException();
        return Napi::Value();
    }
    return Napi::Boolean::New(env, (_kv->Exists(key) == OK));
}

struct GetCallbackContext {
    KVStatus status;
    Napi::Env env;
    Napi::Value value;
};

Napi::Value KVEngine::get(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    string key;
    Napi::Value value;
    GetCallbackContext cxt = {NOT_FOUND, env, value};
    if (info[0].IsBuffer()){
        Napi::Buffer<char> buffer = info[0].As<Napi::Buffer<char>>();
        key = string(buffer.Data(), buffer.Length());
        auto cb = [](void* context, int valuebytes, const char* value){
            const auto c = ((GetCallbackContext*)context);
            c->status = OK;
            c->value = Napi::Buffer<char>::Copy(c->env, value, valuebytes);
        };
        this->_kv->Get(&cxt, key, cb);
    }
    else if (info[0].IsString()){
        key = info[0].As<Napi::String>().Utf8Value();
        auto cb = [](void* context, int valuebytes, const char* value){
            const auto c = ((GetCallbackContext*)context);
            c->status = OK;
            c->value = Napi::String::New(c->env, value, valuebytes);
        };
        this->_kv->Get(&cxt, key, cb);
    }
    else {
        Napi::Error::New(env, "A Buffer or string is expected").ThrowAsJavaScriptException();
        return Napi::Value();
    }
    if (cxt.status == OK){
        return cxt.value;
    }
    else if (cxt.status == NOT_FOUND) {
        return env.Undefined();
    }
    else if (cxt.status == FAILED) {
        Napi::Error::New(env, "Unable to get key").ThrowAsJavaScriptException();
    }
    return Napi::Value();
}

Napi::Value KVEngine::put(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    string key, value;
    // get key
    if (info[0].IsBuffer()){
        Napi::Buffer<char> buffer = info[0].As<Napi::Buffer<char>>();
        key = string(buffer.Data(), buffer.Length());
    }
    else if (info[0].IsString()){
        key = info[0].As<Napi::String>().Utf8Value();
    }
    
    else {
        Napi::Error::New(env, "A Buffer or string is expected").ThrowAsJavaScriptException();
        return Napi::Value();
    }
    // get value
    if (info[1].IsBuffer()){
        Napi::Buffer<char> buffer = info[1].As<Napi::Buffer<char>>();
        value = string(buffer.Data(), buffer.Length());
    }
    else if (info[1].IsString()){
        value = info[1].As<Napi::String>().Utf8Value();
    }
    else {
        Napi::Error::New(env, "A Buffer or string is expected").ThrowAsJavaScriptException();
        return Napi::Value();
    }
    KVStatus status = this->_kv->Put(key, value);
    if (status == FAILED) Napi::Error::New(env, "Unable to put key").ThrowAsJavaScriptException();
    return Napi::Value();
}

Napi::Value KVEngine::remove(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    string key;
    if (info[0].IsBuffer()){
        Napi::Buffer<char> buffer = info[0].As<Napi::Buffer<char>>();
        key = string(buffer.Data(), buffer.Length());
    }
    else if (info[0].IsString()){
        key = info[0].As<Napi::String>().Utf8Value();
    }
    else {
        Napi::Error::New(env, "A Buffer or string is expected").ThrowAsJavaScriptException();
        return Napi::Value();
    }
    KVStatus status = this->_kv->Remove(key);
    if (status == FAILED) Napi::Error::New(env, "Unable to remove key").ThrowAsJavaScriptException();
    return Napi::Boolean::New(env, (status == OK));
}
