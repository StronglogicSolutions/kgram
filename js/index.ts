import bindings from 'bindings'
import { IGClient } from "./igclient"
import type { request } from './util'
import logger from './logger'
const { poll, OnResult } = bindings('kgramIPC')
const client     = new IGClient()
//----------------------------------
setInterval(() => poll(async (msg: request) =>
{
  let result = false
  logger.info('Waiting for requests')
  try
  {
    logger.debug({ received: msg })

    result = await client.post(msg)
    if (result)
      logger.info({ success: result })
    else
      logger.error('Posting failed')

  }
  catch(e)
  {
    logger.error({ exception: e })
  }
  OnResult(result);
}), 300)
