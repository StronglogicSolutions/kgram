import bindings from 'bindings'
import { IGClient } from "./igclient"
import type { request } from './util'
import logger from './logger'
const { poll, OnResult } = bindings('kgramIPC')
const client     = new IGClient()
//----------------------------------
setInterval(() => poll(async (msg: request) =>
{
  logger.info('Waiting for requests')
  try
  {
    logger.debug({ received: msg })

    const result = await client.post(msg)
    if (result)
      logger.info('Successfully posted')
    else
      logger.error('Failed to post')

    OnResult(result);
  }
  catch(e)
  {
    logger.error({ exception: e })
  }
}), 300)
