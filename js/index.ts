import bindings from 'bindings'
import { IGClient } from "./igclient"
import type { request } from './util'
import lg from './logger'
const { poll, OnResult } = bindings('kgramIPC')
const client = new IGClient()

//-------------MAIN-----------------
setInterval(() => poll(async (received : request) =>
{
  let result = false
  lg.info('Waiting for requests')
  try
  {
    lg.debug(received)

    result = await client.post(received)
    if (result)
      lg.info('Success')
    else
      lg.error('Posting failed')
  }
  catch(e)
  {
    lg.error(e)
  }
  OnResult(result)
  lg.debug(client.info())
}), 300)
