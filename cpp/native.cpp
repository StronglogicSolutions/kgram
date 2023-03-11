#include "types.hpp"
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
  std::string msg = "Waiting for request";
  node_env_t  env = info.Env();
  node_fnc_t  cb  = info[0].As<node_fnc_t>();

  if (g_server.has_msgs())
  {
    kiq::ipc_msg_t ipc_msg = g_server.get_msg();
                       msg = "Processed message";
    g_converter.receive(std::move(ipc_msg));
  }

  cb.Call(env.Global(), { node_str_t::New(env, msg)});
}
//----------------------------------------------------------------
node_obj_t Init(node_env_t env, node_obj_t exports)
{
  return node_fnc_t::New(env, callback);
}
//----------------------------------------------------------------
NODE_API_MODULE(kgramIPC, Init)
