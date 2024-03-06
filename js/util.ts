import fs, { watchFile } from 'fs'
import path from 'path'
const { Readable } = require('stream')
const { finished } = require('stream/promises')
import lg from './logger'
import type { AccountRepositoryLoginResponseLogged_in_user } from 'instagram-private-api/dist/responses'
import ffmpeg from 'ffmpeg'
import mime from 'mime/lite'
import gm from 'gm'
import { exec } from 'child_process'
import { make_caption_command, dimensions, validate_aspect_ratio, FindBestSize, GetExtent } from './gfx'

//---------------------------------
//----------INIT-------------------
//---------------------------------
gm.subClass({ imageMagick: true })

//---------------------------------
//----------CONSTANTS--------------
//---------------------------------
const center      : string      = "Center"
const nib_size    : number      = 400
const not_found   : number      = -1
const fail_result : thread_info = { text: "", indexes: [], url: ""}

//---------------------------------
//----------TYPES------------------
//---------------------------------
       type IGUser = AccountRepositoryLoginResponseLogged_in_user
export type usermap = Map<string, IGUser | boolean>

//---------------------------------
//---------INTERFACE---------------
//---------------------------------
export interface credentials_interface
{
  name: string
  pass: string
  validate(): boolean
}
//---------------------------------
export interface request
{
  user:  string
  text:  string
  urls:  string
  time:  string | number
  q   :  string
}
//----------------------------------
interface thread_info
{
  text    : string
  url     : string
  indexes : Array<number>
}
//---------------------------------
//----------SMOL-------------------
//---------------------------------
const sanitize = (s : string) => s.replace(/\.\.\.\//g, '').replace(/\.\.\//g, '').replace(/\"/g, '\\"')

//---------------------------------
//---------MAIN UTILS--------------
//---------------------------------
export function GetURLS(s: string) : Array<string>
{
  return (s.length > 0) ? s.split('>').filter(u => u) : []
}

//---------------------------------
export function GetMapString(map : usermap) : string
{
  let delim = ''
  let s = (map) ? `Map(${map.size}) {` : 'invalid map'
  for (let [key, value] of map)
  {
    s += `${delim} '${key}' => '${(typeof value === 'boolean') ? value : value.pk }'`
    delim = ','
  }
  if (map)
    s += ' }'
  return s
}
//---------------------------------
export class credentials implements credentials_interface
{
  constructor()
  {
    this.name = ""
    this.pass = ""
  }
  //---------------------------------
  public validate() : boolean
  {
    return (this.name.length > 0 && this.pass.length > 0)
  }
  //---------------------------------
  public name : string
  public pass : string
}
//---------------------------------
export function GetCredentials(user: string) : credentials
{
  const creds = new credentials()
  const configPath = path.join(__dirname, "../", "config.json")

  if (fs.existsSync(configPath))
  {
    const config    = require(configPath)
    const usercreds = config[user]
    if (usercreds)
    {
      lg.info('Credentials found')
      creds.name = usercreds.name
      creds.pass = usercreds.pass
    }
  }
  else
    lg.error({ PathException: configPath})

    return creds
}
//---------------------------------
export async function FetchFile(url : string) : Promise<string>
{
  const is_local = path => path.startsWith("file://")
  if (is_local(url))
    return url.substring(7)

  if (url)
  {
    try
    {
      const ext      = url.substring(url.lastIndexOf('.'))
      const dl_path  = path.resolve(__dirname, 'temp' + ext)
      const response = await fetch(url)
      if (response.ok)
      {
        await finished(Readable.fromWeb(response.body).pipe(fs.createWriteStream(dl_path)));
        return dl_path
      }
      lg.error("Fetch error")
    }
    catch (e)
    {
      lg.error({ FetchException: e, message: "Check version of node" })
    }
  }
  return ""
}
//---------------------------------
export async function FormatVideo(file : string, make_preview : boolean = true) : Promise<boolean>
{
  const file_path = path.resolve(__dirname, file)
  if (!fs.existsSync(file_path))
    throw new Error("File path doesn't exist!!!")

  const video = await new ffmpeg(file_path)
  if (video)
  {
    if (!validate_aspect_ratio(video.metadata.video.aspect))
      video.setVideoSize('1080x1350', true, true, '#fff')
    else
      video.setVideoSize('1080x?', true, true)

    if (make_preview)
      video.fnExtractFrameToJPG(path.resolve(__dirname, '..'), { frame_rate : 1,
                                                                 number     : 1,
                                                                 file_name  : 'preview.jpg' })

    video.save(path.resolve(__dirname, '..', 'formatted.mp4'), (err, new_file : string) =>
    {
      if (!err)
      {
        lg.info({ new_file })
        return true
      }
      lg.error(err)
    })
  }
  return false
}
//----------------------------------
export function GetMime(path : string) : string
{
  return mime.getType(path)
}
//----------------------------------
export function IsVideo(mime : string) : boolean
{
  return mime.includes('video')
}
//----------------------------------
export async function ReadFile(filepath : string) : Promise<Buffer>
{
  let resolver
  let p1 = new Promise(resolve => resolver = resolve)
  let p2 = new Promise(resolve => setTimeout(() => { }, 8000))
  let buffer : Buffer = undefined
  await fs.readFile(filepath, (err, data) =>
  {
    if (err)
      lg.error('Failed to read file')
    else
      buffer = data
    resolver()
  })
  await Promise.race([p1, p2])
  return buffer
}
//----------------------------------
export async function GetImageSize(file : string) : Promise <dimensions>
{
  const image = gm(file)
  return new Promise(r => image.size((err, info) => r({ width: info.width, height: info.height })))
}
//----------------------------------
interface ig_image_info
{
  file   : Buffer,
  width  : number,
  height : number
}
//----------------------------------
export async function IGImageFromURL(url : string) : Promise<ig_image_info>
{
  const image = await FormatImage(await FetchFile(url))
  const size  = await GetImageSize(image)
  return { file: await ReadFile(image), width: size.width, height: size.height }
}
//----------------------------------
export async function FormatImage(file : string, out : string = 'temp.jpg') : Promise<string>
{
  let   r         = undefined
  let   path      = file
  const p         = new Promise(resolve => r = resolve)
  const data      = gm(file)
  const mime_data = GetMime(file)
  const orig_size = await GetImageSize(file)
  const style     = FindBestSize(orig_size)
  const size      = style.size
  const extent    = GetExtent(style.type)

  lg.info({BestSize: size})

  if (mime_data.includes('png'))
  {
    lg.info({ SaveAs: out, Reminder: 'IG images must be jpg'})
    path = file.substring(0, file.lastIndexOf('/') + 1) + out
  }

  data.resize(size.width, size.height).background('black').gravity(center).extent(extent.width, extent.height).write(path, (err) =>
  {
    if (err)
      lg.error({Error: "Error formatting image", Message: err})
    else
    {
      lg.info("Image formatting complete")
      file = path
    }
    r()
  })

  await p
  return file
}
//----------------------------------
export async function CreateImage(text : string, name = "generated.png") : Promise<string>
{
  let   r = undefined
  const p = new Promise(resolve => r = resolve)

  exec(make_caption_command(text, name), (error, stdout, stderr) =>
  {
    if (error)
      lg.error({ ...error, message: error.message.substring(0, 250)})
    else
    if (stderr)
      lg.error(stderr)
    r()
  })

  await p
  return name
}
//----------------------------------
export function FormatLongPost(input : string, clean_text : boolean = true) : Array<string>
{
  const chunks = []
  const text = (clean_text) ? sanitize(input) : input
  for (let i = 0, read = 0; read < text.length;)
  {
    const size = ((text.length - read) > nib_size) ? nib_size : (text.length - read)
    let chunk = text.substring(read, (read + size))

    if ((read + size) === text.length)
    {
      if (size < 8)
        chunks[chunks.length - 1] += chunk
      else
        chunks.push(chunk)
      break
    }

    const w_id = chunk.lastIndexOf(' ')
    const p_id = chunk.lastIndexOf('.')
    const pos = (i + size < text.length) ?
      (w_id > p_id) ? w_id : p_id :
      size
    chunks.push((pos === 0) ? chunk : chunk.substring(0, pos))
    i++
    read += pos
  }

  lg.trace({ FormatFinish: `${chunks.length} chunks`})
  return chunks
}

//----------------------------------
export
const is_thread_start = (r)    => { return is_start(r.text) }
const is_newer        = (a, b) => { return a > b }
const is_thread       = (text) => { return (text.endsWith("../") || text.endsWith(".../")) }
const is_end          = (text) => { return (text.endsWith('fin')) }
const is_start        = (text) => { return (text.startsWith("🧵")) }
const find_start      = (r)    =>
{
  for (let i = 0; i < r.length; i++)
    if (is_start(r[i].text))
      return i
  return -1
}
//----------------------------------
export const make_post_from_thread = (reqs) : thread_info =>
{
  reqs.sort((a : request, b : request) => { return a.time < b.time })

  const info : thread_info = { text: "", indexes: [], url: "" }
  let   idx = find_start(reqs)

  if (idx === not_found)
    return info

  info.indexes.push(idx)

  const urls = GetURLS(reqs[idx].urls)
  if (urls.length && urls[0])
    info.url = urls[0]

  const last                    = reqs[idx]
  const posts   : Array<string> = [sanitize(last.text)]
  let   time                    = last.time
  let   has_end : boolean       = false

  idx++

  for (const req of reqs.slice(idx))
  {
    if      (is_newer(req.time, time) && is_thread(req.text))
      time = req.time
    else if (is_end(req.text))
    {
      has_end = true
      break
    }
    else
      continue

    info.indexes.push(idx++)
    posts.push(sanitize(req.text))
  }

  if (posts.length < 2 || !has_end)
    return fail_result

  return { ...info, text: posts.join('\n')}
}
//----------------------------------
export function is_ig_user(v : IGUser | boolean)
{
  return (typeof v === 'object' && Object.keys(v).includes('pk'))
}
