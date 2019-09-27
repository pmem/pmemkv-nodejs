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

#include "database.h"
#include <string>

Napi::FunctionReference db::constructor;

Napi::Object db::init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "db", {
            InstanceMethod("stop", &db::stop),
            InstanceMethod("get_keys", &db::get_keys),
            InstanceMethod("get_keys_above", &db::get_keys_above),
            InstanceMethod("get_keys_below", &db::get_keys_below),
            InstanceMethod("get_keys_between", &db::get_keys_between),
            InstanceMethod("count_all", &db::count_all),
            InstanceMethod("count_above", &db::count_above),
            InstanceMethod("count_below", &db::count_below),
            InstanceMethod("count_between", &db::count_between),
            InstanceMethod("get_all", &db::get_all),
            InstanceMethod("get_above", &db::get_above),
            InstanceMethod("get_below", &db::get_below),
            InstanceMethod("get_between", &db::get_between),
            InstanceMethod("exists", &db::exists),
            InstanceMethod("get", &db::get),
            InstanceMethod("put", &db::put),
            InstanceMethod("remove", &db::remove)
    });
    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();
    exports.Set("db", func);

    Napi::Object constants_obj = Napi::Object::New(env);
    Napi::Object status_obj = Napi::Object::New(env);
    status_obj.Set("OK", int(pmem::kv::status::OK));
    status_obj.Set("UNKNOWN_ERROR", int(pmem::kv::status::UNKNOWN_ERROR));
    status_obj.Set("NOT_FOUND", int(pmem::kv::status::NOT_FOUND));
    status_obj.Set("NOT_SUPPORTED", int(pmem::kv::status::NOT_SUPPORTED));
    status_obj.Set("INVALID_ARGUMENT", int(pmem::kv::status::INVALID_ARGUMENT));
    status_obj.Set("CONFIG_PARSING_ERROR", int(pmem::kv::status::CONFIG_PARSING_ERROR));
    status_obj.Set("CONFIG_TYPE_ERROR", int(pmem::kv::status::CONFIG_TYPE_ERROR));
    status_obj.Set("STOPPED_BY_CB", int(pmem::kv::status::STOPPED_BY_CB));
    status_obj.Set("OUT_OF_MEMORY", int(pmem::kv::status::OUT_OF_MEMORY));
    status_obj.Set("WRONG_ENGINE_NAME", int(pmem::kv::status::WRONG_ENGINE_NAME));
    constants_obj.Set("status", status_obj);
    exports.Set("constants", constants_obj);

    return exports;
}

db::db(const Napi::CallbackInfo& info) : Napi::ObjectWrap<db>(info), _db() {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);
    int length = info.Length();
    if (length != 2){
        Napi::Error::New(env, "invalid arguments").ThrowAsJavaScriptException();
        return;
    }
    std::string engine = info[0].As<Napi::String>().Utf8Value();
    Napi::Object config = info[1].As<Napi::Object>();
    Napi::Array props = config.GetPropertyNames();

    // TODO: remove when empty config is supported
    if (props.Length() == 0){
        Napi::Error::New(env, "invalid config object").ThrowAsJavaScriptException();
        return;
    }

    pmem::kv::config cfg;
    for (uint32_t i = 0; i < props.Length(); ++i) {
        Napi::Value key = props.Get(i);
        if (!key.IsString()){
            Napi::Error::New(env, "Key should be string").ThrowAsJavaScriptException();
            return;
        }
        Napi::Value value = config.Get(key);
        if (value.IsString()){
            auto status = cfg.put_string(key.As<Napi::String>().Utf8Value(), value.As<Napi::String>().Utf8Value());
	        if (status != pmem::kv::status::OK){
                Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
                e.Set("status", Napi::Number::New(env, int(status)));
                e.ThrowAsJavaScriptException();
                return;
            }
        }
        else if (value.IsNumber()){
            auto status = cfg.put_uint64(key.As<Napi::String>().Utf8Value(), value.As<Napi::Number>().Uint32Value());
            if (status != pmem::kv::status::OK){
                Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
                e.Set("status", Napi::Number::New(env, int(status)));
                e.ThrowAsJavaScriptException();
                return;
            }
        }
        else {
            Napi::Error::New(env, "not implemented").ThrowAsJavaScriptException();
            return;
        }
    }

    auto status = this->_db.open(engine.c_str(), std::move(cfg));
    if (status != pmem::kv::status::OK){
        Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
        e.Set("status", Napi::Number::New(env, int(status)));
        e.ThrowAsJavaScriptException();
        return;
    }
}

Napi::Value db::stop(const Napi::CallbackInfo& info) {
    return Napi::Value();
}

Napi::Value db::get_keys(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Function cb = info[0].As<Napi::Function>();
    pmem::kv::status status = this->_db.get_all([&](pmem::kv::string_view key, pmem::kv::string_view value) -> int {
        cb.Call(env.Global(), {Napi::String::New(env, key.data())});
        return 0;
    });
    if (status != pmem::kv::status::OK){
        Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
        e.Set("status", Napi::Number::New(env, int(status)));
        e.ThrowAsJavaScriptException();
    }
    return Napi::Value();
}

Napi::Value db::get_keys_above(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    Napi::Function cb = info[1].As<Napi::Function>();
    pmem::kv::status status = this->_db.get_above(key, [&](pmem::kv::string_view key, pmem::kv::string_view value) -> int {
        cb.Call(env.Global(), {Napi::String::New(env, key.data())});
        return 0;
    });
    if (status != pmem::kv::status::OK){
        Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
        e.Set("status", Napi::Number::New(env, int(status)));
        e.ThrowAsJavaScriptException();
    }
    return Napi::Value();
}

Napi::Value db::get_keys_below(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    Napi::Function cb = info[1].As<Napi::Function>();
    pmem::kv::status status = this->_db.get_below(key, [&](pmem::kv::string_view key, pmem::kv::string_view value) -> int {
        cb.Call(env.Global(), {Napi::String::New(env, key.data())});
        return 0;
    });
    if (status != pmem::kv::status::OK){
        Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
        e.Set("status", Napi::Number::New(env, int(status)));
        e.ThrowAsJavaScriptException();
    }
    return Napi::Value();
}

Napi::Value db::get_keys_between(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key1 = info[0].As<Napi::String>().Utf8Value();
    std::string key2 = info[1].As<Napi::String>().Utf8Value();
    Napi::Function cb = info[2].As<Napi::Function>();
    pmem::kv::status status = this->_db.get_between(key1, key2, [&](pmem::kv::string_view key, pmem::kv::string_view value) -> int {
        cb.Call(env.Global(), {Napi::String::New(env, key.data())});
        return 0;
    });
    if (status != pmem::kv::status::OK){
        Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
        e.Set("status", Napi::Number::New(env, int(status)));
        e.ThrowAsJavaScriptException();
    }
    return Napi::Value();
}

Napi::Value db::count_all(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::size_t cnt;
    pmem::kv::status status = this->_db.count_all(cnt);
    if (status != pmem::kv::status::OK){
        Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
        e.Set("status", Napi::Number::New(env, int(status)));
        e.ThrowAsJavaScriptException();
        return Napi::Value();
    }
    return Napi::Number::New(env, cnt);
}

Napi::Value db::count_above(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    std::size_t cnt;
    pmem::kv::status status = this->_db.count_above(key, cnt);
    if (status != pmem::kv::status::OK){
        Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
        e.Set("status", Napi::Number::New(env, int(status)));
        e.ThrowAsJavaScriptException();
        return Napi::Value();
    }
    return Napi::Number::New(env, cnt);
}

Napi::Value db::count_below(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    std::size_t cnt;
    pmem::kv::status status = this->_db.count_below(key, cnt);
    if (status != pmem::kv::status::OK){
        Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
        e.Set("status", Napi::Number::New(env, int(status)));
        e.ThrowAsJavaScriptException();
        return Napi::Value();
    }
    return Napi::Number::New(env, cnt);
}

Napi::Value db::count_between(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key1 = info[0].As<Napi::String>().Utf8Value();
    std::string key2 = info[1].As<Napi::String>().Utf8Value();
    std::size_t cnt;
    pmem::kv::status status = this->_db.count_between(key1, key2, cnt);
    if (status != pmem::kv::status::OK){
        Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
        e.Set("status", Napi::Number::New(env, int(status)));
        e.ThrowAsJavaScriptException();
        return Napi::Value();
    }
    return Napi::Number::New(env, cnt);
}

Napi::Value db::get_all(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Function cb = info[0].As<Napi::Function>();
    pmem::kv::status status = this->_db.get_all([&](pmem::kv::string_view key, pmem::kv::string_view value) -> int {
        cb.Call(env.Global(), {Napi::String::New(env, key.data()), Napi::String::New(env, value.data())});
        return 0;
    });
    if (status != pmem::kv::status::OK){
        Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
        e.Set("status", Napi::Number::New(env, int(status)));
        e.ThrowAsJavaScriptException();
    }
    return Napi::Value();
}

Napi::Value db::get_above(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    Napi::Function cb = info[1].As<Napi::Function>();
    pmem::kv::status status = this->_db.get_above(key, [&](pmem::kv::string_view key, pmem::kv::string_view value) -> int {
        cb.Call(env.Global(), {Napi::String::New(env, key.data()), Napi::String::New(env, value.data())});
        return 0;
    });
    if (status != pmem::kv::status::OK){
        Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
        e.Set("status", Napi::Number::New(env, int(status)));
        e.ThrowAsJavaScriptException();
    }
    return Napi::Value();
}

Napi::Value db::get_below(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    Napi::Function cb = info[1].As<Napi::Function>();
    pmem::kv::status status = this->_db.get_below(key, [&](pmem::kv::string_view key, pmem::kv::string_view value) -> int {
        cb.Call(env.Global(), {Napi::String::New(env, key.data()), Napi::String::New(env, value.data())});
        return 0;
    });
    if (status != pmem::kv::status::OK){
        Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
        e.Set("status", Napi::Number::New(env, int(status)));
        e.ThrowAsJavaScriptException();
    }
    return Napi::Value();
}

Napi::Value db::get_between(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key1 = info[0].As<Napi::String>().Utf8Value();
    std::string key2 = info[1].As<Napi::String>().Utf8Value();
    Napi::Function cb = info[2].As<Napi::Function>();
    pmem::kv::status status = this->_db.get_between(key1, key2, [&](pmem::kv::string_view key, pmem::kv::string_view value) -> int {
        cb.Call(env.Global(), {Napi::String::New(env, key.data()), Napi::String::New(env, value.data())});
        return 0;
    });
    if (status != pmem::kv::status::OK){
        Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
        e.Set("status", Napi::Number::New(env, int(status)));
        e.ThrowAsJavaScriptException();
    }
    return Napi::Value();
}

Napi::Value db::exists(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    pmem::kv::status status = _db.exists(key);
    if (status != pmem::kv::status::OK && status != pmem::kv::status::NOT_FOUND){
        Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
        e.Set("status", Napi::Number::New(env, int(status)));
        e.ThrowAsJavaScriptException();
    }
    return Napi::Boolean::New(env, (status == pmem::kv::status::OK));
}

Napi::Value db::get(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    std::string value;
    pmem::kv::status status = this->_db.get(key, &value);
    if (status == pmem::kv::status::OK)
        return Napi::String::New(env, value);
    else if (status == pmem::kv::status::NOT_FOUND) {
        return env.Undefined();
    } else {
        Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
        e.Set("status", Napi::Number::New(env, int(status)));
        e.ThrowAsJavaScriptException();
    }
    return Napi::Value();
}

Napi::Value db::put(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    std::string value = info[1].As<Napi::String>().Utf8Value();
    pmem::kv::status status = this->_db.put(key, value);
    if (status != pmem::kv::status::OK) {
        Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
        e.Set("status", Napi::Number::New(env, int(status)));
        e.ThrowAsJavaScriptException();
    }
    return Napi::Value();
}

Napi::Value db::remove(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    pmem::kv::status status = this->_db.remove(key);
    if (status != pmem::kv::status::OK && status != pmem::kv::status::NOT_FOUND){
        Napi::Error e = Napi::Error::New(env, pmem::kv::errormsg());
        e.Set("status", Napi::Number::New(env, int(status)));
        e.ThrowAsJavaScriptException();
    }
    return Napi::Boolean::New(env, (status == pmem::kv::status::OK));
}
