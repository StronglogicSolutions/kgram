#include "types.hpp"
#include "server.hpp"
#include <thread>

static void
start_server()
{
  std::thread{[]
  {
    kiq::server server{};
    while (server.is_active())
    {
      kutils::log("Server running!");
      std::this_thread::sleep_for(std::chrono::milliseconds(300));
    }
  }}.detach();
}

void callback(const node_inf_t& info)
{
  node_env_t      env = info.Env();
  node_fnc_t cb  = info[0].As<node_fnc_t>();
  cb.Call(env.Global(), { node_str_t::New(env, "Hello logic") });
}

node_obj_t Init(node_env_t env, node_obj_t exports)
{
  start_server();
  return node_fnc_t::New(env, callback);
}

NODE_API_MODULE(Test, Init)
