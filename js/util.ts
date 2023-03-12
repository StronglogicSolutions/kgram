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