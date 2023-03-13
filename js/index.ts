import bindings from 'bindings'
import { GetURLS } from './util'
import type { request } from './util'

const GetMessage = bindings('kgramIPC')
//----------------------------------
class IGClient
{
  constructor()
  {
    this.name = "Instagram Client"
  }

  public init()                                        : boolean { return true }
  public info()                                        : boolean { return true }
  public getName()                                     : string  { return this.name }
  public post(text : string, media : Array<string>)    : boolean { return true }

  private name: string;

}
//----------------------------------
function run()
{
  const client = new IGClient()
  setInterval(() => GetMessage((msg: request | string) =>
  {
    if (typeof msg !== 'string')
    {
      msg.media = GetURLS(msg.urls)
      client.post(msg.text, msg.media)
    }
    console.log(msg)
  }), 300)
}

run()
