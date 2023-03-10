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
  : context_{1},
    socket_(context_, ZMQ_ROUTER)
  {
    socket_.set(zmq::sockopt::linger, 0);
    socket_.set(zmq::sockopt::routing_id, "kgram_daemon");
    socket_.bind(RX_ADDR);
    future_ = std::async(std::launch::async, [this] { run(); });
    kutils::log("Server listening on ", RX_ADDR.c_str());
  }
//----------------------------------
  ~server()
  {
    active_ = false;
    if (future_.valid())
      future_.wait();
  }
//----------------------------------
  bool is_active() const
  {
    return active_;
  }
//----------------------------------
  ipc_msg_t get_msg()
  {
    ipc_msg_t msg = std::move(msgs_.front());
    msgs_.pop_front();
    return msg;
  }
//----------------------------------
  bool has_msgs() const
  {
    return !msgs_.empty();
  }

private:
  void run()
  {
    while (active_)
      recv();
  }
//----------------------------------
  void recv()
  {
    using namespace kutils;
    using buffers_t = std::vector<ipc_message::byte_buffer>;

    zmq::message_t identity;

    if (!socket_.recv(identity) || identity.empty())
      return log("Socket failed to receive");

    buffers_t      buffer;
    zmq::message_t msg;
    int            more_flag{1};

    while (more_flag && socket_.recv(msg))
    {
      more_flag = socket_.get(zmq::sockopt::rcvmore);
      buffer.push_back({static_cast<char*>(msg.data()), static_cast<char*>(msg.data()) + msg.size()});
    }
    msgs_.push_back(DeserializeIPCMessage(std::move(buffer)));
    kutils::log("IPC message received");
  }
//----------------------------------
  zmq::context_t             context_;
  zmq::socket_t              socket_;
  std::future<void>          future_;
  bool                       active_{true};
  std::deque<kiq::ipc_msg_t> msgs_;
};
}
