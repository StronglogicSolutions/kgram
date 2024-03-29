import bindings from 'bindings'
import { IGClient } from "./igclient"
import type { request } from './util'
import lg from './logger'
const { poll, transmit, OnResult } = bindings('kgramIPC')
const client = new IGClient(transmit)

let start_time = process.hrtime.bigint()
let interval_d : bigint = BigInt(86400000000000)

//-------------MAIN-----------------
setInterval(() =>
{
  lg.trace("Node worker polling")
  poll(async (received : request) =>
  {
    let result = false
    try
    {
      lg.debug(received)
      result = await client.process_request(received)
      if (result)
        lg.info("Success")
      else
        lg.error("Posting failed")
    }
    catch(e)
    {
      lg.error(e)

      if (e.message === "RESTART")
        process.exit(1)
    }
    OnResult(result)
    lg.debug(client.info())
  })

  if (process.hrtime.bigint() > start_time + interval_d)
  {
    lg.debug("Resetting users")
    client.reset_users()
    start_time = process.hrtime.bigint();
  }
}, 300)
