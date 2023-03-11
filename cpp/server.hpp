#include <deque>
#include <zmq.hpp>
#include <kutils.hpp>
#include <kproto/ipc.hpp>

static const std::string RX_ADDR{"tcp://0.0.0.0:28475"};
namespace kiq
{
using ipc_msg_t = ipc_message::u_ipc_msg_ptr;
//-------------------------------------------------------------
class request_converter
{
public:
using request_t = std::vector<std::string>;
//----------------------------------
  request_t receive(ipc_msg_t msg)
  {
    request_t  req;
    const auto type = msg->type();

    if (type >= constants::IPC_PLATFORM_TYPE)
      m_dispatch_table[type](std::move(msg));

    return req;
  }

private:
using msg_handler_t = std::function<void(ipc_msg_t)>;
using dispatch_t    = std::map<uint8_t, msg_handler_t>;
//----------------------------------
  void on_request(ipc_msg_t msg) const
  {
    kiq::platform_request* request = static_cast<platform_request*>(msg.get());
    kutils::log(request->to_string());
  }
//----------------------------------
  dispatch_t m_dispatch_table{
    {constants::IPC_PLATFORM_TYPE,    [this](ipc_msg_t msg) {                             }},
    {constants::IPC_PLATFORM_REQUEST, [this](ipc_msg_t msg) { on_request(std::move(msg)); }},
  };
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
    return std::move(msg);
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

    if (!socket.recv(&identity) || identity.empty())
    {
      log("Socket failed to receive");
      return;
    }

    buffers_t      buffer;
    zmq::message_t msg;
    int            more_flag{1};

  while (more_flag)
    {
      socket.recv(&msg, static_cast<int>(zmq::recv_flags::none));
      size_t size = sizeof(more_flag);
      socket.getsockopt(ZMQ_RCVMORE, &more_flag, &size);
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
