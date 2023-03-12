import type { credentials } from './util'

//----------------------------------
export class IGClient
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
