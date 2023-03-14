import bindings from 'bindings'
import { IGClient } from "./igclient"
import type { request } from './util'
import logger from './logger'
const GetMessage = bindings('kgramIPC')
const client     = new IGClient()
//----------------------------------
setInterval(() => GetMessage(async (msg: request) =>
{
  logger.info('Waiting for requests')
  try
  {
    logger.debug({'Received: ': msg})
    if (await client.post(msg))
      logger.info('Successfully posted')
    else
      logger.error('Failed to post')
  }
  catch(e)
  {
    logger.error({'Exception caught handling IPC request: ': e})
  }
}), 300)
