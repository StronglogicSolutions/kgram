import bindings from 'bindings'
import { IGClient } from "./igclient"
import type { request } from './util'

const GetMessage = bindings('kgramIPC')
const client     = new IGClient()

//----------------------------------
setInterval(() => GetMessage((msg: request | string) =>
{
  if (typeof msg !== 'string')
  {
    if (client.post(msg))
      console.log('Successfully posted')
    else
      console.error('Failed to post')
  }
  console.log(msg)
}), 300)
