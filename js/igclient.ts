import type { usermap } from './util'
import { credentials } from './util'
import { IgApiClient } from 'instagram-private-api';
//----------------------------------
function s_login(...args: any) : boolean { return true; }
function s_post (...args: any) : boolean { return true; }
function s_gend (...args: any) : boolean { return true; }
function s_prel (...args: any) : boolean { return true; }
//----------------------------------
export class IGClient
{
  constructor()
  {
    this.name    = "Instagram Client"
    this.ig      = new IgApiClient();
    this.ig     != (void 0)
    this.igusers = new Map<string, boolean>()
  }

  public init() : boolean
  {
    return true
  }

  public info() : void
  {
    console.log(`Selected user  ===> "${this.user}`)
    console.log('Current IG users => ', this.igusers)
  }

  public getname() : string
  {
    return this.name
  }

  public async set(creds: credentials) : Promise<void>
  {
    if (!creds.validate())
      console.error('Failed to get credentials')

      this.user    = creds.name;
    this.pass    = creds.pass
    s_gend()//this.ig.state.generateDevice(this.user)
    s_prel() //await this.ig.simulate.preLoginFlow()
    this.info()
  }

  public async post(text : string, media : Array<string>) : Promise<boolean>
  {
    if (!this.user || !this.pass)
      throw Error("Credentials not set")
    if (!this.igusers.has(this.user))
    {
      const account = s_login(this.user, this.pass)//await this.ig.account.login(this.user, this.pass)
      if (account)
        this.igusers.set(this.user, account);
    }

    if (this.igusers.has(this.user))
      return s_post(text, media)//(await this.ig.publish.photo({file: undefined, caption: text}) != undefined)
    return false
  }

  private name    : string;
  private user    : string;
  private pass    : string;
  private ig      : IgApiClient;
  private igusers : usermap;

}
