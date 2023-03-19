import { usermap, request, FormatVideo } from './util'
import { GetURLS, GetCredentials, GetMapString, GetMime, IsVideo, FetchFile, ReadFile} from './util'
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
    logger.info(GetMapString(this.igusers))
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
        this.igusers.set(this.user, s_login(this.user, this.pass))
        // await this.ig.account.login(this.user, this.pass));
    if (this.igusers.has(this.user))
    {
      const urls = GetURLS(req.urls)
      let isVideo : boolean = false
      let i : number = 0
      for (; i < urls.length; i++)
      {
        if (IsVideo(GetMime(urls[i])))
        {
          isVideo = true
          break
        }
      }
      if (isVideo)
        return await this.post_video(urls[i], req.text)
      else
      {
        if (urls)
        {
          const temp = await FetchFile(urls[0])
          logger.info({"Received temp file: ": temp})
          if (temp)
          {
            const file = await ReadFile(temp)
            if (file)
              return s_post(file, req.text)
          }
        }
        console.log(urls[0]);
        const file = await ReadFile(urls[0])
        if (file)
          return s_post(file, req.text)
          // return (await this.ig.publish.photo({file, caption: req.text}) != undefined)
      }
    }
    return false
  }
  //------------------
  private async post_video(videoPath : string, caption : string) : Promise<boolean>
  {
    if (FormatVideo(videoPath))
    {
      const video      = await ReadFile('temp/Formatted.mp4')
      const coverImage = await ReadFile('temp/preview.jpg')
      if (video && coverImage)
        return s_post(video, coverImage, caption)
        // return (await this.ig.publish.video({video, coverImage, caption: req.text}) != undefined)
    }
    return false
  }

  private name    : string;
  private user    : string;
  private pass    : string;
  private ig      : IgApiClient;
  private igusers : usermap;

}
