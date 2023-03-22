import { usermap, request, FormatVideo } from './util'
import { GetURLS, GetCredentials, GetMapString, GetMime, IsVideo, FetchFile, ReadFile} from './util'
import { IgApiClient } from 'instagram-private-api';
import logger from './logger'
import { P } from 'pino';

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
    logger.info(GetMapString(this.igusers))
  }
  //------------------
  public getname() : string
  {
    return this.name
  }
  //------------------
  public async set_user(user: string) : Promise<void>
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
    this.set_user(req.user)

    if (!this.user || !this.pass)
      throw Error("Credentials not set")
    if (!this.igusers.has(this.user))
        this.igusers.set(this.user, s_login(this.user, this.pass)) // await this.ig.account.login(this.user, this.pass));

    if (this.igusers.has(this.user))
    {
      const urls  : Array<string> = GetURLS(req.urls)
      let isVideo : boolean       = false
      let i       : number        = 0
      for (; i < urls.length; i++)
      {
        if (IsVideo(GetMime(urls[i])))
        {
          isVideo = true
          break
        }
      }
      if (isVideo)
        return await this.do_post(req.text, urls[i], true)
      else
        return await this.do_post(req.text, await FetchFile(urls[0]), false)
    }
    return false
  }
  //------------------
  private async do_post(caption : string, file_path : string, is_video : boolean) : Promise<boolean>
  {
    if (is_video && FormatVideo(file_path))
    {
      logger.info({Posting: {Video: file_path, Text: caption}})
      const video   = await ReadFile('temp/Formatted.mp4')
      const preview = await ReadFile('temp/preview.jpg')
      if (video && preview)
        return s_post(video, preview, caption) // return (await this.ig.publish.video({video, coverImage, caption}) != undefined)
    }
    else
    {
      logger.info({"Received temp file: ": file_path})
      const file = await ReadFile(file_path)
      if (file)
        return s_post(file, caption) // return (await this.ig.publish.video({file, caption}) != undefined)
      else
        logger.error({"Post Failed": "No media"})
    }
    return false
  }

  private name    : string;
  private user    : string;
  private pass    : string;
  private ig      : IgApiClient;
  private igusers : usermap;

}
