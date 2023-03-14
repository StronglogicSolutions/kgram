import type { usermap, request } from './util'
import { GetURLS, GetCredentials, credentials } from './util'
import { IgApiClient } from 'instagram-private-api';
import logger from './logger'

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
  //------------------
  public init() : boolean
  {
    return true
  }
  //------------------
  public info() : void
  {
    logger.info(`Selected user  ===> "${this.user}"`)
    logger.info('Current IG users:')
    console.log(this.igusers)
  }
  //------------------
  public getname() : string
  {
    return this.name
  }
  //------------------
  public async set(user: string) : Promise<void>
  {
    const creds = GetCredentials(user)
    if (!creds.validate())
      logger.error('Failed to get credentials')

    this.user = creds.name;
    this.pass = creds.pass
    s_gend()                     //this.ig.state.generateDevice(this.user)
    s_prel()                     //await this.ig.simulate.preLoginFlow()
    this.info()
  }
  //------------------
  public async post(req : request) : Promise<boolean>
  {
    this.set(req.user)

    if (!this.user || !this.pass)
      throw Error("Credentials not set")
    if (!this.igusers.has(this.user))
        this.igusers.set(this.user, s_login(this.user, this.pass))//await this.ig.account.login(this.user, this.pass));
    if (this.igusers.has(this.user))
      return s_post(req.text, GetURLS(req.urls)) //(await this.ig.publish.photo({file: undefined, caption: text}) != undefined)
    return false
  }

  private name    : string;
  private user    : string;
  private pass    : string;
  private ig      : IgApiClient;
  private igusers : usermap;

}
