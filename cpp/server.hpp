#include <zmq.hpp>
#include <kutils.hpp>
#include <kproto/ipc.hpp>

const std::string RX_ADDR{"tcp://0.0.0.0:28475"};

namespace kiq
{
class server
{
using ipc_msg_t = ipc_message::u_ipc_msg_ptr;
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

  ~server()
  {
    active = false;
    if (future.valid())
      future.wait();
  }

  bool is_active() const
  {
    return active;
  }


private:

  void run()
  {
    while (active)
      process(ReceiveIPCMessage());
  }

  ipc_msg_t ReceiveIPCMessage()
  {
    using namespace kutils;
    using buffers_t = std::vector<ipc_message::byte_buffer>;

    zmq::message_t identity;

    if (!socket.recv(&identity))
    {
      log("Socket failed to receive");
      return nullptr;
    }

    if (identity.empty())
    {
      log("Rejecting message from ", identity.to_string().c_str());
      return nullptr;
    }

    buffers_t      received_message;
    zmq::message_t message;
    int            more_flag{1};

    while (more_flag)
    {
      socket.recv(&message, static_cast<int>(zmq::recv_flags::none));
      size_t size = sizeof(more_flag);
      socket.getsockopt(ZMQ_RCVMORE, &more_flag, &size);

      received_message.push_back(std::vector<unsigned char>{static_cast<char*>(message.data()), static_cast<char*>(message.data()) + message.size()});
    }

    return DeserializeIPCMessage(std::move(received_message));
  }

  void process(ipc_msg_t msg) const
  {
    if (!msg)
      kutils::log("Ignoring null message");
    std::move(msg);
  }

  zmq::context_t    context;
  zmq::socket_t     socket;
  std::future<void> future;
  bool              active{true};
};

} // ns