import bindings from 'bindings'
import { IGClient } from "./igclient"
import type { request } from './util'
import lg from './logger'
const { poll, OnResult } = bindings('kgramIPC')
const client     = new IGClient()

const verify_and_pass = ( msg : request ) =>
{
  lg.debug(Object.keys  (msg))
  lg.debug(Object.values(msg))

  const formalized : request = {
    time: msg.time,
    text: msg.text,
    urls: msg.urls,
    user: msg.user
  }

  if (!formalized.time)
    throw new Error("Request missing time value")
  return formalized
}

//-------------MAIN-----------------
setInterval(() => poll(async (received : request) =>
{
  let result = false
  lg.info('Waiting for requests')
  try
  {
    result = await client.post(verify_and_pass(received))
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
