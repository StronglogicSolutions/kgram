import fs, { watchFile } from 'fs'
import path from 'path'
const { Readable } = require('stream');
const { finished } = require('stream/promises');
import lg from './logger'
import type { AccountRepositoryLoginResponseLogged_in_user } from 'instagram-private-api/dist/responses'
import ffmpeg from 'ffmpeg'
import mime from 'mime/lite'
import gm from 'gm'
import { IgUserHasLoggedOutError } from 'instagram-private-api';
import { exec } from 'child_process'

gm.subClass({ imageMagick: true })

const FetchException : string = "FetchException"
const PathException  : string = "Path does not exist"

type IGUser = AccountRepositoryLoginResponseLogged_in_user
//---------------------------------
interface vcoord
{
  x : number
  y : number
}
//---------------------------------
const validateAspectRatio = (ratio : vcoord) =>
{
  return ((ratio.x == 9 && ratio.y == 16) || // 9:16
          (ratio.x == 4 && ratio.y == 5)  || // 4:5
          (ratio.x == 1 && ratio.y == 1))    // 1:1
}
//---------------------------------
export function GetURLS(s: string) : Array<string>
{
  return (s.length > 0) ? s.split('>').filter(u => u) : []
}
//---------------------------------
export interface request
{
  user:  string
  text:  string
  urls:  string
  media: Array<string>
}
//---------------------------------
export type usermap = Map<string, IGUser | boolean>
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
//-------------------------------
export interface credentials_interface
{
  name: string
  pass: string
  validate(): boolean
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
  lg.info("Fetching file")
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
    if (!validateAspectRatio(video.metadata.video.aspect))
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
export async function FormatImage(file : string) : Promise<string>
{
  let   r1, r2    = undefined
  let   path      = file
  const p1        = new Promise(resolve => r1 = resolve)
  const p2        = new Promise(resolve => r2 = resolve)
  const data      = gm(file)
  const mime_data = GetMime(file)
  const size      = { width: 0, height: 0 }

  data.size((err, info) =>
  {
    size.width  = info.width
    size.height = info.height
    r1()
  })

  await p1

  if (mime_data.includes('png'))
  {
    lg.info("Must convert png to jpg")
    path = file.substring(0, file.lastIndexOf('/') + 1) + 'temp.jpg'
  }

  data.resize(size.width, size.height).background('black').gravity('Center').extent(1080, 1350).write(path, (err) =>
  {
    if (err)
      lg.error({Error: "Error formatting image", Message: err})
    else
    {
      lg.info("Image formatting complete")
      file = path
    }
    r2()
  })

  await p2
  return file
}
//----------------------------------
export async function CreateImage(text : string) : Promise<string>
{
  let   r    = undefined
  const p    = new Promise(resolve => r = resolve)
  const file = "generated.png"

  const command = `convert -size "1080x1080" -background "#666666" -fill "#D3D3D3" -font "Ubuntu-Mono" -interword-spacing 8 -kerning 4 -pointsize 24 -border 2%x2% -bordercolor "#666666" -gravity Center -interline-spacing 24 -stroke "#FEFEFE" -strokewidth 0.5 -fill white caption:\"${text}\" ${file}`

  exec(command, (error, stdout, stderr) =>
  {
    if (error)
      lg.error(error)
    if (stderr)
      lg.error(stderr)

    r()
  })

  await p
  return file
}
