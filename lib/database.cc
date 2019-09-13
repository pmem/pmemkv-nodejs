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
#include <libpmemkv_json_config.h>

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

    return exports;
}

db::db(const Napi::CallbackInfo& info) : Napi::ObjectWrap<db>(info), _db() {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);
    int length = info.Length();
    if (length != 2)
        Napi::TypeError::New(env, "invalid arguments").ThrowAsJavaScriptException();
    std::string engine = info[0].As<Napi::String>().Utf8Value();
    std::string config = info[1].As<Napi::String>().Utf8Value();

    pmemkv_config *cfg = pmemkv_config_new();
    if (!cfg)
        Napi::Error::New(env, "Allocating a pmemkv config failed").ThrowAsJavaScriptException();

    int rv = pmemkv_config_from_json(cfg, config.c_str());
    if (rv) {
        pmemkv_config_delete(cfg);
        Napi::Error::New(env, "Creating a pmemkv config from JSON string failed").ThrowAsJavaScriptException();
        return;
    }

    auto status = this->_db.open(engine.c_str(), pmem::kv::config(cfg));
    if (status != pmem::kv::status::OK)
        Napi::Error::New(env, "pmemkv_open() failed").ThrowAsJavaScriptException();
}

Napi::Value db::stop(const Napi::CallbackInfo& info) {
    return Napi::Value();
}

Napi::Value db::get_keys(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Function cb = info[0].As<Napi::Function>();
    this->_db.get_all([&](pmem::kv::string_view key, pmem::kv::string_view value) -> int {
        cb.Call(env.Global(), {Napi::String::New(env, key.data())});
        return 0;
    });
    return Napi::Value();
}

Napi::Value db::get_keys_above(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    Napi::Function cb = info[1].As<Napi::Function>();
    this->_db.get_above(key, [&](pmem::kv::string_view key, pmem::kv::string_view value) -> int {
        cb.Call(env.Global(), {Napi::String::New(env, key.data())});
        return 0;
    });
    return Napi::Value();
}

Napi::Value db::get_keys_below(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    Napi::Function cb = info[1].As<Napi::Function>();
    this->_db.get_below(key, [&](pmem::kv::string_view key, pmem::kv::string_view value) -> int {
        cb.Call(env.Global(), {Napi::String::New(env, key.data())});
        return 0;
    });
    return Napi::Value();
}

Napi::Value db::get_keys_between(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key1 = info[0].As<Napi::String>().Utf8Value();
    std::string key2 = info[1].As<Napi::String>().Utf8Value();
    Napi::Function cb = info[2].As<Napi::Function>();
    this->_db.get_between(key1, key2, [&](pmem::kv::string_view key, pmem::kv::string_view value) -> int {
        cb.Call(env.Global(), {Napi::String::New(env, key.data())});
        return 0;
    });
    return Napi::Value();
}

Napi::Value db::count_all(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::size_t cnt;
    this->_db.count_all(cnt);
    return Napi::Number::New(env, cnt);
}

Napi::Value db::count_above(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    std::size_t cnt;
    this->_db.count_above(key, cnt);
    return Napi::Number::New(env, cnt);
}

Napi::Value db::count_below(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    std::size_t cnt;
    this->_db.count_below(key, cnt);
    return Napi::Number::New(env, cnt);
}

Napi::Value db::count_between(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key1 = info[0].As<Napi::String>().Utf8Value();
    std::string key2 = info[1].As<Napi::String>().Utf8Value();
    std::size_t cnt;
    this->_db.count_between(key1, key2, cnt);
    return Napi::Number::New(env, cnt);
}

Napi::Value db::get_all(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Function cb = info[0].As<Napi::Function>();
    this->_db.get_all([&](pmem::kv::string_view key, pmem::kv::string_view value) -> int {
        cb.Call(env.Global(), {Napi::String::New(env, key.data()), Napi::String::New(env, value.data())});
        return 0;
    });
    return Napi::Value();
}

Napi::Value db::get_above(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    Napi::Function cb = info[1].As<Napi::Function>();
    this->_db.get_above(key, [&](pmem::kv::string_view key, pmem::kv::string_view value) -> int {
        cb.Call(env.Global(), {Napi::String::New(env, key.data()), Napi::String::New(env, value.data())});
        return 0;
    });
    return Napi::Value();
}

Napi::Value db::get_below(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    Napi::Function cb = info[1].As<Napi::Function>();
    this->_db.get_below(key, [&](pmem::kv::string_view key, pmem::kv::string_view value) -> int {
        cb.Call(env.Global(), {Napi::String::New(env, key.data()), Napi::String::New(env, value.data())});
        return 0;
    });
    return Napi::Value();
}

Napi::Value db::get_between(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key1 = info[0].As<Napi::String>().Utf8Value();
    std::string key2 = info[1].As<Napi::String>().Utf8Value();
    Napi::Function cb = info[2].As<Napi::Function>();
    this->_db.get_between(key1, key2, [&](pmem::kv::string_view key, pmem::kv::string_view value) -> int {
        cb.Call(env.Global(), {Napi::String::New(env, key.data()), Napi::String::New(env, value.data())});
        return 0;
    });
    return Napi::Value();
}

Napi::Value db::exists(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    return Napi::Boolean::New(env, (_db.exists(key) == pmem::kv::status::OK));
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
    } else if (status == pmem::kv::status::FAILED) {
        Napi::Error::New(env, "Unable to get key").ThrowAsJavaScriptException();
    }
    return Napi::Value();
}

Napi::Value db::put(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    std::string value = info[1].As<Napi::String>().Utf8Value();
    pmem::kv::status status = this->_db.put(key, value);
    if (status == pmem::kv::status::FAILED) Napi::Error::New(env, "Unable to put key").ThrowAsJavaScriptException();
    return Napi::Value();
}

Napi::Value db::remove(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string key = info[0].As<Napi::String>().Utf8Value();
    pmem::kv::status status = this->_db.remove(key);
    if (status == pmem::kv::status::FAILED) Napi::Error::New(env, "Unable to remove key").ThrowAsJavaScriptException();
    return Napi::Boolean::New(env, (status == pmem::kv::status::OK));
}
