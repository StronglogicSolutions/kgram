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
// ~ 650 character limit @ 24pt
export const make_caption_command = (text, file) => // size should be 1058.8235
{
  const size = (text.length > 650) ? 16  : (text.length > 250) ? 24 : 48
  const swdt = (text.length < 650) ? 0.5 : 0.15
  return `convert -size "1058x1058" -background "#333" -fill "#D3D3D3" -font "Ubuntu-Mono" -interword-spacing 4 \
          -kerning 4 -pointsize ${size} -border 1%x1% -bordercolor "#333" -gravity Center -interline-spacing 24 -stroke "#FEFEFE"\
          -strokewidth ${swdt} caption:\"${text}\" ${file}` }
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