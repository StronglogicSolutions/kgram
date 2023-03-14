#include "server.hpp"
#include <thread>

namespace
{
  kiq::server            g_server;
  kiq::request_converter g_converter;
}
//--------------------NODE----------------------------------------
void callback(const node_inf_t& info)
{
  node_env_t env = info.Env();
  node_fnc_t cb  = info[0].As<node_fnc_t>();

  if (g_server.has_msgs())
    cb.Call(env.Global(), { kiq::req_to_node_obj(g_converter.receive(std::move(g_server.get_msg())), env) });
}
//----------------------------------------------------------------
node_obj_t Init(node_env_t env, node_obj_t exports)
{
  kutils::log("Initializing native callback");
  return node_fnc_t::New(env, callback);
}
//----------------------------------------------------------------
NODE_API_MODULE(kgramIPC, Init)
