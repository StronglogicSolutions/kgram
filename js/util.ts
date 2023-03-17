import fs from 'fs'
import path from 'path'
const { Readable } = require('stream');
const { finished } = require('stream/promises');
import logger from './logger'
import type { AccountRepositoryLoginResponseLogged_in_user } from 'instagram-private-api/dist/responses'
import ffmpeg from 'ffmpeg'
import mime from 'mime/lite'

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
export function GetURLS(s: string)
{
  return s.split('>')
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
    s += `${delim} '${key}' => '${value}'`
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
      logger.info('Credentials found')
      creds.name = usercreds.name
      creds.pass = usercreds.pass
    }
  }
  else
    logger.error.error({"Path doesn't exist": configPath})

    return creds
}
//---------------------------------
export async function FetchFile(url : string) : Promise<string>
{
  if (url)
  {
    const ext      = url.substring(url.lastIndexOf('.'))
    const path     = 'temp' + ext
    const response = await fetch(url)
    if (response.ok)
    {
      await finished(Readable.fromWeb(response.body).pipe(fs.createWriteStream(path)));
      return path
    }
    logger.error("Fetch error")
  }
  return ""
}
//---------------------------------
export async function FormatVideo(file : string, makePreview : boolean = true) : Promise<boolean>
{
  const filePath = path.resolve(__dirname, file)
  console.log(filePath)
  if (!fs.existsSync(filePath))
    throw new Error("File path doesn't exist!!!")

  const video = await new ffmpeg(filePath)
  if (video)
  {
    if (!validateAspectRatio(video.metadata.video.aspect))
      video.setVideoSize('1080x1350', true, true, '#fff')
    else
      video.setVideoSize('1080x?', true, true)

    if (makePreview)
      video.fnExtractFrameToJPG(path.resolve(__dirname, '..'),
      { frame_rate : 1,
        number     : 1,
        file_name  : 'preview.jpg' })

    video.save(path.resolve(__dirname, '..', 'formatted.mp4'), (err, file) =>
    {
      if (err)
        logger.error(err)
      else
      {
        logger.info({'file created': file})
        return true
      }
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
export async function ReadFile(path : string) : Promise<Buffer>
{
  let resolver
  let p1 = new Promise(resolve => resolver = resolve)
  let p2 = new Promise(resolve => setTimeout(() => { }, 8000))
  let buffer : Buffer = undefined
  await fs.readFile('temp/Formatted.mp4', (err, data) => {
    if (err)
      logger.error('Failed to read file')
    else
      buffer = data
    resolver()
  })
  await Promise.race([p1, p2])
  return buffer
}
