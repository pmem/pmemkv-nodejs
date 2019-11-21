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

#ifndef ENGINE_H
#define ENGINE_H

#include <iostream>
#include <libpmemkv.hpp>
#include <napi.h>

enum KeyType {KEY_TYPE_STRING, KEY_TYPE_BUFFER};

class db : public Napi::ObjectWrap<db> {
  public:
    static Napi::Object init(Napi::Env env, Napi::Object exports);
    db(const Napi::CallbackInfo& info);

  private:
    static Napi::FunctionReference constructor;

    Napi::Value stop(const Napi::CallbackInfo& info);
    Napi::Value get_keys(const Napi::CallbackInfo& info);
    Napi::Value get_keys_above(const Napi::CallbackInfo& info);
    Napi::Value get_keys_below(const Napi::CallbackInfo& info);
    Napi::Value get_keys_between(const Napi::CallbackInfo& info);
    Napi::Value count_all(const Napi::CallbackInfo& info);
    Napi::Value count_above(const Napi::CallbackInfo& info);
    Napi::Value count_below(const Napi::CallbackInfo& info);
    Napi::Value count_between(const Napi::CallbackInfo& info);
    Napi::Value get_all(const Napi::CallbackInfo& info);
    Napi::Value get_all_as_buffer(const Napi::CallbackInfo& info);
    Napi::Value get_above(const Napi::CallbackInfo& info);
    Napi::Value get_above_as_buffer(const Napi::CallbackInfo& info);
    Napi::Value get_below(const Napi::CallbackInfo& info);
    Napi::Value get_below_as_buffer(const Napi::CallbackInfo& info);
    Napi::Value get_between(const Napi::CallbackInfo& info);
    Napi::Value get_between_as_buffer(const Napi::CallbackInfo& info);
    Napi::Value exists(const Napi::CallbackInfo& info);
    Napi::Value get(const Napi::CallbackInfo& info);
    Napi::Value get_as_buffer(const Napi::CallbackInfo& info);
    Napi::Value put(const Napi::CallbackInfo& info);
    Napi::Value remove(const Napi::CallbackInfo& info);

    pmem::kv::db _db;
    KeyType _key_type;
};

#endif
