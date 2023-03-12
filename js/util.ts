import fs from 'fs'
import path from 'path'


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
export interface credentials
{
  name: string
  pass: string
}

export function GetCredentials(user: string) : credentials
{
  const credentials = { name: "" , pass: "" }
  const configPath = path.join(__dirname, "../", "config.json")

  if (fs.existsSync(configPath))
  {
    const config = require(configPath)
    console.log(config)
    const usercreds = config[user]
    if (usercreds)
    {
      credentials.name = usercreds.name
      credentials.pass = usercreds.pass
    }
  }
  else
    console.log('path didn\'t exist')
  return credentials
}