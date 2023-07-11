#include "server.hpp"

static const char* RX_ADDR{"tcp://0.0.0.0:28475"};
static const char* TX_ADDR{"tcp://0.0.0.0:28476"};
//----------------------------------------------------------------
namespace kiq
{
//----------------------------------------------------------------
node_obj_t req_to_node_obj(request_t req, node_env_t& env)
{
  node_obj_t obj = node_obj_t::New(env);
  obj.Set("user", req.user );
  obj.Set("text", req.text );
  obj.Set("urls", req.media);
  obj.Set("time", req.time );
  obj.Set("q"   , req.query);
  return obj;
}
//-------------------------------------------------------------
request_t request_converter::receive(ipc_msg_t msg)
{
  const auto type = msg->type();

  if (type >= constants::IPC_KIQ_MESSAGE)
    m_dispatch_table[type](std::move(msg));

  return req;
}
//----------------------------------
void request_converter::on_request(ipc_msg_t msg)
{
  platform_message* ipc_msg = static_cast<platform_message*>(msg.get());
  req.text  = ipc_msg->content();
  req.user  = ipc_msg->user();
  req.media = ipc_msg->urls();
  req.time  = ipc_msg->time();
  req.query = "";
}
//-------------------------------------------------------------
void request_converter::on_query(ipc_msg_t msg)
{
  kiq_message& ipc_msg = *(static_cast<kiq_message*>(msg.get()));
  req.clear();
  req.query = ipc_msg.payload();
}
//-------------------------------------------------------------
server::server()
: context_{1},
  rx_(context_, ZMQ_ROUTER),
  tx_(context_, ZMQ_DEALER)
{
  rx_.set(zmq::sockopt::linger, 0);
  tx_.set(zmq::sockopt::linger, 0);
  rx_.set(zmq::sockopt::routing_id, "kgram_daemon");
  tx_.set(zmq::sockopt::routing_id, "kgram_daemon_tx");
  rx_.set(zmq::sockopt::tcp_keepalive, 1);
  tx_.set(zmq::sockopt::tcp_keepalive, 1);
  rx_.set(zmq::sockopt::tcp_keepalive_idle,  300);
  tx_.set(zmq::sockopt::tcp_keepalive_idle,  300);
  rx_.set(zmq::sockopt::tcp_keepalive_intvl, 300);
  tx_.set(zmq::sockopt::tcp_keepalive_intvl, 300);

  kiq::set_log_fn([](const char* message) { kutils::log(message);} );

  start();
}
//----------------------------------
server::~server()
{
  stop();
}
//----------------------------------
void server::start()
{
  try
  {
    rx_.bind   (RX_ADDR);
    tx_.connect(TX_ADDR);

    future_ = std::async(std::launch::async, [this] { run(); });
    kutils::log("Server listening on ", RX_ADDR);
  }
  catch (const std::exception& e)
  {
    kutils::log("Exception caught during start(): ", e.what());
  }
}
//----------------------------------
void server::stop()
{
  rx_.disconnect(RX_ADDR);
  tx_.disconnect(TX_ADDR);
  active_ = false;
  if (future_.valid())
    future_.wait();
  kutils::log("Server has stopped");
}
//----------------------------------
void server::reset()
{
  kutils::log("Server is resetting connection");
  stop ();
  start();
}
//----------------------------------
bool server::is_active() const
{
  return active_;
}
//----------------------------------
ipc_msg_t server::get_msg()
{
  ipc_msg_t msg = std::move(msgs_.front());
  msgs_.pop_front();
  return msg;
}
//----------------------------------
bool server::has_msgs() const
{
  return !msgs_.empty();
}
//----------------------------------
void server::reply(bool success)
{
  if (!replies_pending_)
  {
    kutils::log("Received reply value, but not currently waiting to reply. Ignoring");
    return;
  }

  kiq::ipc_msg_t msg;
    if (success)
      msg = std::make_unique<kiq::okay_message>();
    else
      msg = std::make_unique<kiq::fail_message>();

  kutils::log("Sending reply of ", constants::IPC_MESSAGE_NAMES.at(msg->type()));
  send_msg(std::move(msg));

  replies_pending_--;
}

void server::run()
{
  kutils::log("Receive worker initiated");
  while (active_)
    recv();
}
//----------------------------------
void server::recv()
{
  using namespace kutils;
  using buffers_t = std::vector<ipc_message::byte_buffer>;

  auto is_duplicate = [this](const auto& m) { for (const auto& id : processed_) if (id == m->id()) return true; // match
                                              return false; };                                                  // no match
  zmq::message_t identity;
  if (!rx_.recv(identity) || identity.empty())
    return log("Socket failed to receive");

  buffers_t      buffer;
  zmq::message_t msg;
  int            more_flag{1};

  while (more_flag && rx_.recv(msg))
  {
    more_flag = rx_.get(zmq::sockopt::rcvmore);
    buffer.push_back({static_cast<char*>(msg.data()), static_cast<char*>(msg.data()) + msg.size()});
  }
  ipc_msg_t  ipc_msg = DeserializeIPCMessage(std::move(buffer));
  kutils::log("Message type is ", std::to_string(ipc_msg->type()).c_str());
  if (ipc_msg->type() == constants::IPC_PLATFORM_TYPE)
  {
    const auto* decoded = static_cast<platform_message*>(ipc_msg.get());
    if (is_duplicate(decoded))
      return kutils::log("Ignoring duplicate IPC message");
    processed_.push_back(decoded->id());
  }

  msgs_.push_back(std::move(ipc_msg));
  kutils::log("IPC message received");
  replies_pending_++;
}
//------------------------------------
void server::send_msg(ipc_msg_t msg)
{
  const auto& payload   = msg->data();
  const auto  frame_num = payload.size();
  kutils::log(msg->to_string());
  for (uint32_t i = 0; i < frame_num; i++)
  {
    auto flag = i == (frame_num - 1) ? zmq::send_flags::none : zmq::send_flags::sndmore;
    auto data = payload.at(i);

    zmq::message_t message{data.size()};
    std::memcpy(message.data(), data.data(), data.size());

    tx_.send(message, flag);
  }
}
} // ns kiq
