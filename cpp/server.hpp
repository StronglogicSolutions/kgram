#include <deque>
#include <zmq.hpp>
#include <kutils.hpp>
#include <kproto/ipc.hpp>
#include "types.hpp"

//----------------------------------------------------------------
namespace kiq
{
using ipc_msg_t = ipc_message::u_ipc_msg_ptr;
//-------------------------------------------------------------
struct request_t
{
  std::string user;
  std::string text;
  std::string media;
  std::string time;
  std::string query;
  bool        sanity{false};

  void clear()
  {
    user.clear(); text.clear(); media.clear(); time.clear(); query.clear();
  }
};
//----------------------------------------------------------------
node_obj_t req_to_node_obj(request_t req, node_env_t& env);
//-------------------------------------------------------------
class request_converter
{
public:
  request_converter() = default;
  request_t receive(ipc_msg_t msg);

private:
using msg_handler_t = std::function<void(ipc_msg_t)>;
using dispatch_t    = std::map<uint8_t, msg_handler_t>;

  void on_request(ipc_msg_t msg);
  void on_query  (ipc_msg_t msg);
  void on_status (ipc_msg_t msg);

  request_t  req;
  dispatch_t m_dispatch_table{
    {constants::IPC_KIQ_MESSAGE,   [this](ipc_msg_t msg) { on_query  (std::move(msg)); }},
    {constants::IPC_PLATFORM_TYPE, [this](ipc_msg_t msg) { on_request(std::move(msg)); }}
  };
}; // request_converter
//-------------------------------------------------------------
class server
{
public:
  server();
  ~server();

  bool      is_active()                    const;
  bool      has_msgs ()                    const;
  void      reply    (bool success = true);
  ipc_msg_t get_msg  ();
  void      send_msg (ipc_msg_t);
  void      reset    ();

private:
  void      stop     ();
  void      start    ();
  void      run();
  void      recv();
  zmq::context_t             context_;
  zmq::socket_t              rx_;
  zmq::socket_t              tx_;
  std::future<void>          future_;
  bool                       active_{true};
  uint32_t                   replies_pending_{0};
  session_daemon             daemon_;
  std::deque<kiq::ipc_msg_t> msgs_;
  std::vector<std::string>   processed_;
}; // server
} // ns kiq
