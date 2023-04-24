import lg from './logger'
import { IgApiClient } from 'instagram-private-api';
import { GetURLS, GetCredentials, GetMapString, GetMime, IsVideo,
         FetchFile, ReadFile, usermap, request, FormatVideo, FormatImage,
         CreateImage, FormatLongPost, make_post_from_thread} from './util'
import { example_posts } from './testdata'
interface ClientInfo { Status: string, IGUsers: string }

const vid_path         : string    = 'temp/Formatted.mp4'
const prev_path        : string    = 'temp/preview.jpg'
const client_name      : string    = "Instagram Client"

const make_reqs = posts =>
{
  const reqs = []
  let i = 0
  for (const post of posts)
    reqs.push({text: post, time: i++})
  return reqs
}

//----------------------------------
export class IGClient
{
  constructor()
  {
    this.name    = client_name
    this.ig      = new IgApiClient()
    this.igusers = new Map<string, boolean>()
    this.rx_req  = new Array<request>()
  }
  //------------------
  public init() : boolean
  {
    return true
  }
  //------------------
  public info() : ClientInfo
  {
    return { Status: `Selected user  ===> "${this.user}"`, IGUsers: GetMapString(this.igusers) }
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
      lg.error('Failed to get credentials')

    this.user = creds.name;
    this.pass = creds.pass
  }
  //------------------
  private async login() : Promise<boolean>
  {
    lg.debug("login")
    if (this.igusers.has(this.user) && !this.igusers.get(this.user))
    {
      lg.warn("This user already failed to login")
      return false
    }

    this.ig.state.generateDevice(this.user)
    try
    {
      const account = await this.ig.account.login(this.user, this.pass)
      lg.info({ username: account.username, id: account.pk })
      if (account && this.igusers.set(this.user, account))
      {
        lg.debug("Returning true")
        return true
      }
    }
    catch (e)
    {
      lg.error({ login_error: e })
    }
    lg.warn("Setting user as false to prevent login flood")
    this.igusers.set(this.user, false)

    return false
  }
  //------------------
  public async post(req : request) : Promise<boolean>
  {
    this.set_user(req.user)

    if (!this.user || !this.pass)
      throw new Error("Credentials not set")

    if (!req.urls)
    {
      lg.debug("Adding post with no media to queue in case it's a thread")
      this.rx_req.push(req);
      return await this.try_big_post()
    }

    const user_logged_in = !this.igusers.get(this.user)
    lg.debug({ user_logged_in })
    if (!user_logged_in && !await this.login())
      return false

    if (this.igusers.has(this.user))
    {
      const urls  : Array<string> = GetURLS(req.urls)
      for (const url in urls)
      {
        if (IsVideo(GetMime(url)))
          return await this.do_post(req.text, url, true)
      }
      return await this.do_post(req.text, await FetchFile(urls[0]), false)
    }
    throw Error("Failed to login and set user")
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
    const video   = await ReadFile(vid_path)
    const preview = await ReadFile(prev_path)
    try
    {
      return (video && preview &&
              (await this.ig.publish.video({video, coverImage: preview, caption}) != undefined))
    }
    catch (e)
    {
      lg.error({ Error: "post_video", Exception: e })
      throw e
    }
  }
  //------------------
  private async post_image(caption : string, file_path : string) : Promise<boolean>
  {
    const image_path = await FormatImage(file_path)
    const file       = await ReadFile   (image_path)
    if (file)
      try
      {
        return (await this.ig.publish.photo({file, caption}) != undefined)
      }
      catch(e)
      {
        lg.error({ post_image_error: e })
      }
    else
      lg.error({ Error: "No media" })
    return false
  }
  //-----------------
  private async post_generated_text(text : string) : Promise<boolean>
  {
    const strings = FormatLongPost(text)
    lg.debug({ LongPost: strings })
    const items   = []
    const caption = (text.length > 2200)  ? text.substring(0, 2200) : text
    const num     = (strings.length < 10) ? strings.length : 10

    for (let i = 0; i < num; i++)
      items.push({ file: await ReadFile(await CreateImage(strings[i], `page${i + 1}.png`)), width: 1080, height: 1080 })
    lg.debug({ ToPost: items })
    return await this.ig.publish.album({ caption, items }) != undefined
  }
  //-----------------
  private async try_big_post() : Promise<boolean>
  {
    const info = make_post_from_thread(this.rx_req)
    if (!info.text)
      return false

    if (await this.post_generated_text(info.text))
    {
      for (let i = info.indexes.length; i >= 0; i--)
        this.rx_req.splice(info.indexes[i], 1)
      return true
    }

    lg.debug({ NoPost: "no media and threads to post" })
    return false
  }

  public async test() : Promise<void>
  {
    this.rx_req = make_reqs(example_posts)
    this.set_user("DEFAULT_USER")
    if (await this.login())
      await this.try_big_post()
    else
      lg.error("Failed to login")
  }

  private name    : string
  private user    : string
  private pass    : string
  private ig      : IgApiClient
  private igusers : usermap
  private rx_req  : Array<request>;
}
