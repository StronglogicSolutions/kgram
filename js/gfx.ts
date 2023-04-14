//----------------------------------
export enum image_type
{
  square,
  portrait,
  landscape
}
//----------------------------------
interface image_style
{
  type : image_type
  size : dimensions
}
//-------------------------------
export interface dimensions
{
  width:  number
  height: number
}
//---------------------------------
interface vcoord
{
  x : number
  y : number
}
//---------------------------------
export const validate_aspect_ratio = (ratio : vcoord) =>
{
  return ((ratio.x == 9 && ratio.y == 16) || // 9:16
          (ratio.x == 4 && ratio.y == 5)  || // 4:5
          (ratio.x == 1 && ratio.y == 1))    // 1:1
}
//-------------------------------
export const make_caption_command = (text, file) =>
{  return `convert -size "1080x1080" -background "#666666" -fill "#D3D3D3" -font "Ubuntu-Mono" -interword-spacing 8 \
          -kerning 4 -pointsize 24 -border 2%x2% -bordercolor "#666666" -gravity Center -interline-spacing 24 -stroke "#FEFEFE"\
          -strokewidth 0.5 -fill white caption:\"${text}\" ${file}` }
//----------------------------------
export function FindBestSize(size : dimensions) : image_style
{
  const θ : number = 1 // Coefficient to optionally shrink images with imperfect aspect ratios
  if (size.height === size.width)                                                   // SQUARE
    return { type: image_type.square, size: { width: 1080, height: 1080 } }
  else
  if (size.height > size.width)
  {
    if ((1080 / size.width) < (1350 / size.height))                                 // PORTRAIT
      return { type: image_type.portrait, size: { width: 1080 * θ, height: null } }
    else
      return { type: image_type.portrait, size: { width: null, height: 1350 * θ } }
  }

  if ((1080 / size.width) < (566 / size.height))                                    // LANDSCAPE
    return { type: image_type.landscape, size: { width: 1080 * θ, height: null } }
  else
    return { type: image_type.landscape, size: { width: null, height: 566 * θ } }
}
//----------------------------------
export function GetExtent(type : image_type) : dimensions
{
  switch (type)
  {
    case image_type.square:    return { width: 1080, height: 1080 }
    case image_type.portrait:  return { width: 1080, height: 1350 }
    case image_type.landscape: return { width: 1080, height: 566  }
  }
}