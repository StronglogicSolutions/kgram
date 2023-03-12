import bindings from 'bindings'
import { GetURLS, GetCredentials } from './util'
import type { request, credentials } from './util'

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
  public getname()                                     : string  { return this.name }
  public set(creds: credentials)                       : void    { this.user = creds.name; this.pass = creds.pass }
  public post(text : string, media : Array<string>)    : boolean
  {
    if (!this.user || !this.pass)
      throw Error("Credentials not set")

    return true;
  }

  private name: string;
  private user: string;
  private pass: string;

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
      client.set(GetCredentials(msg.user))
      client.post(msg.text, msg.media)
    }
    console.log(msg)
  }), 300)
}

run()
