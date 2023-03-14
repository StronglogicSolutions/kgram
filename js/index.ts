import bindings from 'bindings'
import { IGClient } from "./igclient"
import type { request } from './util'

const GetMessage = bindings('kgramIPC')
const client     = new IGClient()

//----------------------------------
setInterval(() => GetMessage(async (msg: request) =>
{
  console.log('Waiting for requests')
  try
  {
    console.log('Received: ', msg)
    if (await client.post(msg))
      console.log('Successfully posted')
    else
      console.error('Failed to post')
  }
  catch(e)
  {
    console.error('Exception caught handling IPC request: ', e)
  }
}), 300)
