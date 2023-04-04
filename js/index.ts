import bindings from 'bindings'
import { IGClient } from "./igclient"
import type { request } from './util'
import lg from './logger'
const { poll, OnResult } = bindings('kgramIPC')
const client     = new IGClient()
//----------------------------------
setInterval(() => poll(async (msg: request) =>
{
  let result = false
  lg.info('Waiting for requests')
  try
  {
    lg.debug({ received: msg })

    result = await client.post(msg)
    if (result)
      lg.info({ success: result })
    else
      lg.error('Posting failed')
  }
  catch(e)
  {
    lg.error({ exception: e })
  }
  OnResult(result);

  lg.debug(client.info())
}), 300)
