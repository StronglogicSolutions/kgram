#include <deque>
#include <zmq.hpp>
#include <kutils.hpp>
#include <kproto/ipc.hpp>
#include "types.hpp"

static const std::string RX_ADDR{"tcp://0.0.0.0:28475"};
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
};
//----------------------------------------------------------------
node_obj_t req_to_node_obj(request_t req, node_env_t& env)
{
  node_obj_t obj = node_obj_t::New(env);
  obj.Set("user", req.user);
  obj.Set("text", req.text);
  obj.Set("urls", req.media);
  return obj;
}
//-------------------------------------------------------------
class request_converter
{
public:

//----------------------------------
  request_t receive(ipc_msg_t msg)
  {
    const auto type = msg->type();

    if (type >= constants::IPC_PLATFORM_TYPE)
      m_dispatch_table[type](std::move(msg));

    return req;
  }

private:
using msg_handler_t = std::function<void(ipc_msg_t)>;
using dispatch_t    = std::map<uint8_t, msg_handler_t>;
//----------------------------------
  void on_request(ipc_msg_t msg)
  {
    platform_message* ipc_msg = static_cast<platform_message*>(msg.get());
    req.text  = ipc_msg->content();
    req.user  = ipc_msg->user();
    req.media = ipc_msg->urls();
  }
//----------------------------------
  dispatch_t m_dispatch_table{
    {constants::IPC_KIQ_MESSAGE,   [this](ipc_msg_t msg) {                             }},
    {constants::IPC_PLATFORM_TYPE, [this](ipc_msg_t msg) { on_request(std::move(msg)); }},
  };

  request_t req;
};
//-------------------------------------------------------------
class server
{
public:
  server()
  : context{1},
    socket(context, ZMQ_ROUTER)
  {
    socket.set(zmq::sockopt::linger, 0);
    socket.set(zmq::sockopt::routing_id, "kgram_daemon");
    socket.bind(RX_ADDR);
    future = std::async(std::launch::async, [this] { run(); });
  }
//----------------------------------
  ~server()
  {
    active = false;
    if (future.valid())
      future.wait();
  }
//----------------------------------
  bool is_active() const
  {
    return active;
  }
//----------------------------------
  ipc_msg_t get_msg()
  {
    ipc_msg_t msg = std::move(m_msgs.front());
    m_msgs.pop_front();
    return msg;
  }
//----------------------------------
  bool has_msgs() const
  {
    return !m_msgs.empty();
  }

private:
  void run()
  {
    while (active)
      recv();
  }
//----------------------------------
  void recv()
  {
    using namespace kutils;
    using buffers_t = std::vector<ipc_message::byte_buffer>;

    zmq::message_t identity;

    if (!socket.recv(identity) || identity.empty())
    {
      log("Socket failed to receive");
      return;
    }

    buffers_t      buffer;
    zmq::message_t msg;
    int            more_flag{1};

  while (more_flag)
    {
      socket.recv(msg);
      more_flag = socket.get(zmq::sockopt::rcvmore);
      buffer.push_back(std::vector<unsigned char>{static_cast<char*>(msg.data()), static_cast<char*>(msg.data()) + msg.size()});
    }

    m_msgs.push_back(DeserializeIPCMessage(std::move(buffer)));
  }
//----------------------------------
  zmq::context_t              context;
  zmq::socket_t               socket;
  std::future<void>           future;
  bool                        active{true};
  std::deque<kiq::ipc_msg_t> m_msgs;
};
}
