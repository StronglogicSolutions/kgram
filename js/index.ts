import bindings from 'bindings'
import { IGClient } from "./igclient"
import { GetURLS, GetCredentials } from './util'
import type { request } from './util'

const GetMessage = bindings('kgramIPC')

//----------------------------------
function run()
{
  const client = new IGClient()
  setInterval(() => GetMessage((msg: request | string) =>
  {
    if (typeof msg !== 'string')
    {
      msg.media = GetURLS(msg.urls)
      client.set(GetCredentials(msg.user))
      client.post(msg.text, msg.media)
    }
    console.log(msg)
  }), 300)
}

run()
