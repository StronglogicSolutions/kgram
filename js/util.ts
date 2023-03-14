import fs from 'fs'
import path from 'path'
import type { AccountRepositoryLoginResponseLogged_in_user } from 'instagram-private-api/dist/responses'

type IGUser = AccountRepositoryLoginResponseLogged_in_user
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
      console.log('Credentials found')
      creds.name = usercreds.name
      creds.pass = usercreds.pass
    }
  }
  else
    console.error('path didn\'t exist')

    return creds
}
