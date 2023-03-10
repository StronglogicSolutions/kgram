#include "types.hpp"
#include "server.hpp"
#include <thread>

std::vector<kiq::ipc_msg_t> g_msgs;
bool requests_pending()
{
  return !g_msgs.empty();
}
//--------------------SERVER---------------------------------------
static void
start_server()
{
  std::thread{[&]
  {
    kiq::server server{};
    while (server.is_active())
    {
      kutils::log("Server running!");
      if (server.has_msg())
        g_msgs.push_back(server.get_msg());
      std::this_thread::sleep_for(std::chrono::milliseconds(300));
    }
  }}.detach();
}

//--------------------NODE----------------------------------------
void callback(const node_inf_t& info)
{
  std::string msg;
  node_env_t  env = info.Env();
  node_fnc_t  cb  = info[0].As<node_fnc_t>();

  if (requests_pending())
    msg = std::string{"Received: " + std::to_string(g_msgs.front()->type())};
  else
    msg = "Waiting for request";

  cb.Call(env.Global(), { node_str_t::New(env, msg)});
}
//----------------------------------------------------------------
node_obj_t Init(node_env_t env, node_obj_t exports)
{
  start_server();
  return node_fnc_t::New(env, callback);
}
//----------------------------------------------------------------
NODE_API_MODULE(kgramIPC, Init)
