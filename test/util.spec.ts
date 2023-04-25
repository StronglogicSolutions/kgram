import assert from 'assert'
import { FindBestSize, image_type, dimensions } from '../js/gfx'
import { CreateImage, ReadFile, FormatLongPost, make_post_from_thread } from '../js/util'
import { example_posts } from '../js/testdata'

const make_reqs = posts =>
{
  const reqs = []
  let i = 0
  for (const post of posts)
    reqs.push({text: post, time: i++})
  return reqs
}

describe('Dimensions tests', () =>
{
  it('Landscape is chosen', () =>
  {
    const size  : dimensions = { width: 800, height: 500 }
    const style              = FindBestSize(size)
    assert(style.type        == image_type.landscape, "Type is landscape")
    assert(style.size.height == 566, "Height is 566")
  })

  it('Portait is chosen', () =>
  {
    const size  : dimensions = { width: 200, height: 450 }
    const style              = FindBestSize(size)
    assert(style.type        == image_type.portrait, "Type is portrait")
    assert(style.size.height == 1350, "Height is 1350")
  })

  it('Square is chosen', () =>
  {
    const size  : dimensions = { width: 50, height: 50 }
    const style              = FindBestSize(size)
    assert(style.type        == image_type.square, "Type is square")
    assert(style.size.height == 1080, "Height is 1080")
  })
})

describe('Image tests', () =>
{
  it('Image is generated from text', async () =>
  {
    const path = await CreateImage("I know very well that implied, in this critical reflection about the real world, is something made in an unveiling of yet another reality. And, again, I know very well, that to simply substitute an ingenuous perception of reality for a critical one, it is sufficient for the oppressed to liberate themselves. To do so, they need to organize in a revolutionary manner and to transform the real world in a revolutionary manner.\nThe sense of organization requires a conscious action making clear what's unclear in a profound vision of consciousness. It is precisely this  creation of a new reality, prefigured in the revolutionary criticism of the old one, that cannot exhaust the conscientization process")
    const file = await ReadFile(path)
    assert(file.length > 0, "File is not empty")
  })
})

describe('Text tests', () =>
{
  it('Post generated from thread', async () =>
  {
    let i = 0
    for (const chunk of FormatLongPost(make_post_from_thread(make_reqs(example_posts)).text, false))
    {
      console.log(`Chunk ${i}`, chunk)
      await CreateImage(chunk, `Post${i++}.jpg`)
    }
    assert(await (await ReadFile('Post0.jpg')).byteLength > 0, "Files were generated")
  }).timeout(10000)
})