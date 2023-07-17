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
  static kutils::timer<86400000> timer;
  if (timer.check_and_update())
    g_server.reset();

  node_env_t env = info.Env();
  node_fnc_t cb  = info[0].As<node_fnc_t>();

  if (g_server.has_msgs())
    cb.Call(env.Global(), { kiq::req_to_node_obj(g_converter.receive(g_server.get_msg()), env) });
}
//----------------------------------------------------------------
void on_result(const node_inf_t& info)
{
  g_server.reply(info[0].As<node_bol_t>().Value());
}
//----------------------------------------------------------------
void transmit(const node_inf_t& info)
{
  static const std::string platform      = "Instagram";
  static const bool        should_repost = true;
  static const uint32_t    no_command    = 0x00;
         const node_arr_t  array         = info[0].As<node_arr_t>();
  kutils::log("transmit() recv NodeJS data. Item count: ", std::to_string(array.Length()).c_str());
  for (uint32_t i = 0; i < array.Length(); i++)
  {
    try
    {
      const auto data = array.Get(i).As<node_obj_t>();
      g_server.send_msg(std::move(std::make_unique<kiq::platform_message>(
        platform,
        data.Get("id")  .ToString().Utf8Value(),
        data.Get("user").ToString().Utf8Value(),
        data.Get("text").ToString().Utf8Value(),
        data.Get("urls").ToString().Utf8Value(),
        should_repost, no_command, "",
        data.Get("time").ToString().Utf8Value())));
    }
    catch (const std::exception& e)
    {
      kutils::log("Exception caught", e.what());
    }
  }
}
//----------------------------------------------------------------
node_obj_t Init(node_env_t env, node_obj_t exports)
{
  kutils::log("Initializing native callbacks");
  exports.Set("poll",     node_fnc_t::New(env, poll));
  exports.Set("transmit", node_fnc_t::New(env, transmit));
  exports.Set("OnResult", node_fnc_t::New(env, on_result));
  return exports;
}
//----------------------------------------------------------------
NODE_API_MODULE(kgramIPC, Init)
