import lg from './logger'
import { IgApiClient } from 'instagram-private-api';
import { GetURLS, GetCredentials, GetMapString, GetMime, IsVideo,
         FetchFile, ReadFile, usermap, request, FormatVideo, FormatImage,
         CreateImage, FormatLongPost, IGImageFromURL, make_post_from_thread,
         is_thread_start, is_ig_user} from './util'
import { example_posts } from './testdata'

const req_from_posts = (posts) =>
{
  let i = 1
  const reqs = []
  for (const post of posts)
  {
    reqs.push({ text: post, urls: "", time: i++ })
  }

  return reqs
}
interface ClientInfo { Status: string, IGUsers: string }
//----------------------------------
const vid_path    : string = 'temp/Formatted.mp4'
const prev_path   : string = 'temp/preview.jpg'
const client_name : string = "Instagram Client"
//----------------------------------
interface ig_feed_item
{
  time : string
  id   : string
  user : string
  urls : string
  text : string
}
//----------------------------------
interface transmit_fn
{
  (payload : Array<ig_feed_item>) : void
}
//----------------------------------
const get_vid = videos =>
{
  let width = 0
  let ret_vid
  for (const video of videos)
    if (video.width > width)
      ret_vid = video.url
  return ret_vid
}
//----------------------------------
export class IGClient
{
  constructor(fn : transmit_fn)
  {
    this.name    = client_name
    this.ig      = new IgApiClient()
    this.igusers = new Map<string, boolean>()
    this.rx_req  = new Array<request>()
    this.request = fn
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
    if (this.igusers.has(this.user))
    {
      const account = this.igusers.get(this.user)
      if (is_ig_user(account))
      {
        lg.info(`${this.user} is already logged in`)
        return true
      }
      lg.warn("This user already failed to login")
      return false
    }

    this.ig.state.generateDevice(this.user)
    try
    {
      // const account = await this.ig.account.login(this.user, this.pass)
      // lg.info({ username: account.username, id: account.pk })
      const account = true
      if (account && this.igusers.set(this.user, account))
      {
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
    if (req.q)
      return await this.do_query(req.q)

    this.set_user(req.user)

    if (!this.user || !this.pass)
      throw new Error("Credentials not set")

    const thread_start = is_thread_start(req)
    if (thread_start || !req.urls)
    {
      lg.debug("Adding post to queue in case of thread")
      this.rx_req.push(req);
    }

    if (!this.igusers.get(this.user) && !await this.login())
      return false

    if (this.igusers.has(this.user))
    {
      if (thread_start || !req.urls)
        return await this.try_big_post()

      const urls : Array<string> = GetURLS(req.urls)
      for (const url of urls)
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
      lg.error({Exception: e })
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
  private async post_generated_text(text : string, url : string = "") : Promise<boolean>
  {
    const strings = FormatLongPost(text)
    const items   = []
    const caption = (text.length > 2200)  ? text.substring(0, 2200) : text
    const num     = (strings.length < 10) ? strings.length : 10

    if (url)
      items.push(IGImageFromURL(url))

    for (let i = 0; i < num; i++)
      items.push({ file: await ReadFile(await CreateImage(strings[i], `page${i + 1}.jpg`)), width: 1080, height: 1080 })
    // return (items.length > 0 && items[0] &&
    //         await this.ig.publish.album({ caption, items }) != undefined)
    return true
  }
  //-----------------
  private async try_big_post() : Promise<boolean>
  {
    const info = make_post_from_thread(this.rx_req)
    if (!info.text)
      return false

    if (await this.post_generated_text(info.text, info.url))
    {
      for (let i = info.indexes.length; i >= 0; i--)
      this.rx_req.splice(info.indexes[i], 1)
      return true
    }

    lg.warn("No big post")

    return false
  }
  //-----------------
  private async do_query(q : string) : Promise<boolean>
  {
    const reject_post        = item => { return (!item || !item.caption) }
    const is_english         = (text : string) => true
    const get_quality_result = (data : Array<ig_feed_item>) => { return data.filter( item => is_english(item.text) && item.urls.length > 0 )}
    const get_result         = data => { data = get_quality_result(data); if (data.length > 5) data.length = 5; return data}

    if (!this.user || !this.is_logged_in(this.user))
    {
      await this.set_user("DEFAULT_USER")
      if (!await this.login())
      {
        lg.error("Query failed. Unable to login default user")
        return false
      }
    }

    lg.info(`Querying Instagram for ${q}`)

    let feed_items = []

    const response = await this.ig.feed.tags(q);
    for (const item of await response.items())
    {
      if (reject_post(item)) continue

      const ig_feed_item = {user: item.user.username,
                            time: item.taken_at,
                            id  : item.id,
                            text: item.caption.text ,
                            urls: item.image_versions2 ?
                                    item.image_versions2.candidates.map(img => img.url).join('>') :
                                    ""}
      if (item.video_versions)
        ig_feed_item.urls += (ig_feed_item.urls.length > 0) ? get_vid(item.video_versions) :
                                                              '>' + get_vid(item.video_versions)
      feed_items.push(ig_feed_item)
    }

    lg.trace({ Items: feed_items.length })
    this.request(get_result(feed_items))
    return feed_items.length > 0
  }
  //-----------------
  private is_logged_in(user : string) : boolean
  {
    return (this.igusers.has(user) && is_ig_user(this.igusers.get(user)))
  }

  private name    : string
  private user    : string
  private pass    : string
  private ig      : IgApiClient
  private igusers : usermap
  private rx_req  : Array<request>
  private request : transmit_fn
}
