#include <napi.h>
#include <zmq.hpp>

class server
{

private:
  zmq::socket_t socket;
};

void callback(const Napi::CallbackInfo& info)
{
  Napi::Env      env = info.Env();
  Napi::Function cb  = info[0].As<Napi::Function>();
  cb.Call(env.Global(), {Napi::String::New(env, "Hello logic")});
}

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
  return Napi::Function::New(env, callback);
}

NODE_API_MODULE(Test, Init)

