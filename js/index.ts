import bindings from 'bindings'
import { IGClient } from "./igclient"
import { GetURLS, GetCredentials } from './util'
import type { request } from './util'

const GetMessage = bindings('kgramIPC')

//----------------------------------
const client = new IGClient()
setInterval(() => GetMessage((msg: request | string) =>
{
  if (typeof msg !== 'string')
  {
    msg.media = GetURLS(msg.urls)
    client.set(GetCredentials(msg.user))
    if (client.post(msg.text, msg.media))
      console.log('Successfully posted')
    else
      console.error('Failed to post')
  }
  console.log(msg)
}), 300)
