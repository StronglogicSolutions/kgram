import assert from 'assert'
import { FindBestSize, GetExtent, image_type, dimensions } from '../js/gfx'

describe('Utils tests', () =>
{
  it('Landscape is chosen', () =>
  {
    const size  : dimensions = { width: 800, height: 500 }
    const style              = FindBestSize(size)
    assert(style.type        == image_type.landscape)
    assert(style.size.height == 566)
  })

  it('Porrait is chosen', () =>
  {
    const size  : dimensions = { width: 200, height: 450 }
    const style              = FindBestSize(size)
    assert(style.type        == image_type.portrait)
    assert(style.size.height == 1350)
  })

  it('Square is chosen', () =>
  {
    const size  : dimensions = { width: 50, height: 50 }
    const style              = FindBestSize(size)
    assert(style.type        == image_type.square)
    assert(style.size.height == 1080)
  })
})
