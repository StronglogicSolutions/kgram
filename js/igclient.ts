import logger from './logger'
import { IgApiClient } from 'instagram-private-api';
import { GetURLS, GetCredentials, GetMapString, GetMime, IsVideo,
         FetchFile, ReadFile, usermap, request, FormatVideo, FormatImage} from './util'
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
  }
  //------------------
  private async login() : Promise<boolean>
  {
    logger.info({ login: this.user })
    this.ig.state.generateDevice(this.user)
    try
    {
      await this.ig.simulate.preLoginFlow()
      const account = await this.ig.account.login(this.user, this.pass)
      logger.info({ result: account })
      if (account)
      {
        this.igusers.set(this.user, account)
        process.nextTick(async () => await this.ig.simulate.postLoginFlow())
        return true
      }
    }
    catch (e)
    {
      logger.error({ Error: "login", Exception: e })
    }
    return false
  }
  //------------------
  public async post(req : request) : Promise<boolean>
  {
    this.set_user(req.user)

    if (!this.user || !this.pass)
      throw Error("Credentials not set")

    if (!this.igusers.has(this.user))
      await this.login()

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
    throw Error("Post failed. Did not login")
  }
  //------------------
  private async do_post(caption : string, file_path : string, is_video : boolean) : Promise<boolean>
  {
    if (!file_path)
      throw Error("Cannot post without media");

    if (is_video)
      return (await FormatVideo(file_path) && await this.post_video(caption, file_path))
    else
      return await this.post_image(caption, file_path)
  }
  //------------------
  private async post_video(caption : string, file_path : string) : Promise<boolean>
  {
    logger.info({ Posting: { Video: file_path, Text: caption }})
    const video   = await ReadFile('temp/Formatted.mp4')
    const preview = await ReadFile('temp/preview.jpg')
    try
    {
      return (video && preview &&
              (await this.ig.publish.video({video, coverImage: preview, caption}) != undefined))
    }
    catch (e)
    {
      logger.error({ Error: "post_video", Exception: e })
      throw e
    }
  }
  //------------------
  private async post_image(caption : string, file_path : string) : Promise<boolean>
  {
    logger.info("Posting image")
    const image_path = await FormatImage(file_path)
    const file       = await ReadFile   (image_path)
    if (file)
      try
      {
        return (await this.ig.publish.photo({file, caption}) != undefined)
      }
      catch(e)
      {
        logger.error({ Error: "post_image", Exception: e })
      }
    logger.error({"Post Failed": "No media"})
    return false
  }

  private name    : string
  private user    : string
  private pass    : string
  private ig      : IgApiClient
  private igusers : usermap
}
