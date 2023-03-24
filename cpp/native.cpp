#include "server.hpp"
#include <thread>

namespace
{
  kiq::server            g_server;
  kiq::request_converter g_converter;
}
//--------------------NODE----------------------------------------
void poll(const node_inf_t& info)
{
  node_env_t env = info.Env();
  node_fnc_t cb  = info[0].As<node_fnc_t>();

  if (g_server.has_msgs())
    cb.Call(env.Global(), { kiq::req_to_node_obj(g_converter.receive(std::move(g_server.get_msg())), env) });
}
//----------------------------------------------------------------
void on_result(const node_inf_t& info)
{
  g_server.reply(info[0].As<node_bol_t>().Value());
}
//----------------------------------------------------------------
node_obj_t Init(node_env_t env, node_obj_t exports)
{
  kutils::log("Initializing native callbacks");
  exports.Set("poll",     node_fnc_t::New(env, poll));
  exports.Set("OnResult", node_fnc_t::New(env, on_result));
  return exports;
}
//----------------------------------------------------------------
NODE_API_MODULE(kgramIPC, Init)
