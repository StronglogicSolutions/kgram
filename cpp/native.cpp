#include "types.hpp"
#include "server.hpp"
#include <thread>

namespace
{
  kiq::server server;
}

//--------------------NODE----------------------------------------
void callback(const node_inf_t& info)
{
  std::string msg;
  node_env_t  env = info.Env();
  node_fnc_t  cb  = info[0].As<node_fnc_t>();

  if (server.has_msgs())
    msg = std::string{"Received: " + std::to_string(server.get_msg()->type())};
  else
    msg = "Waiting for request";

  cb.Call(env.Global(), { node_str_t::New(env, msg)});
}
//----------------------------------------------------------------
node_obj_t Init(node_env_t env, node_obj_t exports)
{
  return node_fnc_t::New(env, callback);
}
//----------------------------------------------------------------
NODE_API_MODULE(kgramIPC, Init)
