/**
 * Converts WordPress HTML content to Sanity Portable Text block array.
 * Handles: paragraphs, headings, lists, blockquotes, bold/italic/underline,
 * links, images, YouTube iframes. Strips WordPress block comments.
 */

import * as cheerio from 'cheerio'
import { nanoid } from 'nanoid'

function key() {
  return nanoid(12)
}

interface Mark {
  _type: string
  _key: string
  href?: string
}

interface Span {
  _type: 'span'
  _key: string
  text: string
  marks: string[]
}

interface Block {
  _type: 'block'
  _key: string
  style: string
  children: Span[]
  markDefs: Mark[]
  listItem?: string
  level?: number
}

interface ImageBlock {
  _type: 'image'
  _key: string
  _sanityAsset?: string
  asset?: { _type: 'reference'; _ref: string }
  alt?: string
  caption?: string
  // Temporary field for migration — holds original URL
  _wpImageUrl?: string
}

interface YoutubeBlock {
  _type: 'youtube'
  _key: string
  url: string
}

type PortableTextBlock = Block | ImageBlock | YoutubeBlock

/**
 * Convert an HTML string (from WordPress post content) to Portable Text blocks.
 * Images are returned with `_wpImageUrl` so the caller can download/upload them
 * and replace with a Sanity asset reference.
 */
export function htmlToPortableText(html: string): PortableTextBlock[] {
  if (!html || !html.trim()) return []

  // Strip WordPress block comments <!-- wp:xxx --> and <!-- /wp:xxx -->
  const cleaned = html.replace(/<!--\s*\/?wp:[\s\S]*?-->/g, '')

  const $ = cheerio.load(cleaned, { xmlMode: false })
  const blocks: PortableTextBlock[] = []

  // Process top-level elements in <body>
  $('body').children().each((_, el) => {
    const node = $(el)
    processNode(node, $, blocks)
  })

  // If cheerio didn't wrap in body children (plain text), try the whole content
  if (blocks.length === 0 && cleaned.trim()) {
    // Might be raw text or inline HTML without block wrappers
    const fallback = createTextBlock(cleaned.replace(/<[^>]*>/g, '').trim(), 'normal')
    if (fallback.children[0] && (fallback.children[0] as Span).text) {
      blocks.push(fallback)
    }
  }

  return blocks
}

function processNode(
  node: cheerio.Cheerio<cheerio.Element>,
  $: cheerio.CheerioAPI,
  blocks: PortableTextBlock[],
  listType?: string,
  listLevel?: number
) {
  const tagName = node.prop('tagName')?.toLowerCase() || ''

  // Skip empty text nodes
  if (node[0]?.type === 'text') {
    const text = node.text().trim()
    if (text) {
      blocks.push(createTextBlock(text, 'normal'))
    }
    return
  }

  switch (tagName) {
    case 'p': {
      const block = inlineToBlock(node, $, 'normal')
      if (block.children.length > 0) {
        blocks.push(block)
      }
      // Check for embedded images inside <p>
      node.find('img').each((_, img) => {
        const imgBlock = createImageBlock($(img))
        if (imgBlock) blocks.push(imgBlock)
      })
      break
    }

    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6': {
      // Map h1 → h2 (Sanity convention — h1 is the page title)
      const level = tagName === 'h1' ? 'h2' : tagName
      const block = inlineToBlock(node, $, level)
      if (block.children.length > 0) {
        blocks.push(block)
      }
      break
    }

    case 'blockquote': {
      // Process children of blockquote as blockquote-styled blocks
      node.children().each((_, child) => {
        const childNode = $(child)
        const childTag = childNode.prop('tagName')?.toLowerCase()
        if (childTag === 'p') {
          const block = inlineToBlock(childNode, $, 'blockquote')
          if (block.children.length > 0) blocks.push(block)
        } else {
          const block = inlineToBlock(node, $, 'blockquote')
          if (block.children.length > 0) blocks.push(block)
        }
      })
      break
    }

    case 'ul':
    case 'ol': {
      const type = tagName === 'ul' ? 'bullet' : 'number'
      const level = (listLevel || 0) + 1
      node.children('li').each((_, li) => {
        const liNode = $(li)
        const block = inlineToBlock(liNode, $, 'normal')
        block.listItem = type
        block.level = level
        if (block.children.length > 0) {
          blocks.push(block)
        }
        // Handle nested lists
        liNode.children('ul, ol').each((_, nested) => {
          processNode($(nested), $, blocks, type, level)
        })
      })
      break
    }

    case 'img': {
      const imgBlock = createImageBlock(node)
      if (imgBlock) blocks.push(imgBlock)
      break
    }

    case 'a': {
      // Standalone link (not inside a <p>) — check if it wraps an image
      const img = node.find('img')
      if (img.length > 0) {
        const imgBlock = createImageBlock(img)
        if (imgBlock) blocks.push(imgBlock)
      } else {
        // Treat as a paragraph with a link
        const block = inlineToBlock(node, $, 'normal')
        if (block.children.length > 0) blocks.push(block)
      }
      break
    }

    case 'iframe': {
      const ytBlock = createYoutubeBlock(node)
      if (ytBlock) {
        blocks.push(ytBlock)
      }
      break
    }

    case 'figure': {
      // WordPress Gutenberg figure blocks
      const img = node.find('img')
      if (img.length > 0) {
        const imgBlock = createImageBlock(img)
        if (imgBlock) {
          const caption = node.find('figcaption').text().trim()
          if (caption) imgBlock.caption = caption
          blocks.push(imgBlock)
        }
      }
      const iframe = node.find('iframe')
      if (iframe.length > 0) {
        const ytBlock = createYoutubeBlock(iframe)
        if (ytBlock) blocks.push(ytBlock)
      }
      break
    }

    case 'div': {
      // Recursively process div contents
      node.children().each((_, child) => {
        processNode($(child), $, blocks, listType, listLevel)
      })
      break
    }

    case 'hr':
      // Skip horizontal rules
      break

    case 'table': {
      // Convert table to text representation (tables aren't native in Portable Text)
      const text = node.text().trim()
      if (text) {
        blocks.push(createTextBlock(text, 'normal'))
      }
      break
    }

    default: {
      // For any other tags, try to extract text content
      const text = node.text().trim()
      if (text) {
        const block = inlineToBlock(node, $, 'normal')
        if (block.children.length > 0) blocks.push(block)
      }
      break
    }
  }
}

/**
 * Convert an element with inline content (text, <strong>, <em>, <a>, etc.)
 * to a Portable Text block with spans and mark definitions.
 */
function inlineToBlock(
  node: cheerio.Cheerio<cheerio.Element>,
  $: cheerio.CheerioAPI,
  style: string
): Block {
  const block: Block = {
    _type: 'block',
    _key: key(),
    style,
    children: [],
    markDefs: [],
  }

  function walkInline(el: cheerio.Cheerio<cheerio.AnyNode>, activeMarks: string[]) {
    el.contents().each((_, child) => {
      if (child.type === 'text') {
        const text = $(child).text()
        if (text) {
          block.children.push({
            _type: 'span',
            _key: key(),
            text,
            marks: [...activeMarks],
          })
        }
        return
      }

      const childNode = $(child)
      const childTag = (child as cheerio.Element).tagName?.toLowerCase()

      // Skip images inside paragraphs (handled separately)
      if (childTag === 'img') return

      // Skip iframes (handled separately)
      if (childTag === 'iframe') return

      const newMarks = [...activeMarks]

      if (childTag === 'strong' || childTag === 'b') {
        newMarks.push('strong')
      }
      if (childTag === 'em' || childTag === 'i') {
        newMarks.push('em')
      }
      if (childTag === 'u') {
        newMarks.push('underline')
      }

      if (childTag === 'a') {
        const href = childNode.attr('href')
        if (href) {
          const markKey = key()
          block.markDefs.push({
            _type: 'link',
            _key: markKey,
            href,
          })
          newMarks.push(markKey)
        }
      }

      // For <br>, insert a newline
      if (childTag === 'br') {
        block.children.push({
          _type: 'span',
          _key: key(),
          text: '\n',
          marks: [...activeMarks],
        })
        return
      }

      walkInline(childNode, newMarks)
    })
  }

  walkInline(node, [])

  // Ensure at least one empty span (Sanity requires it)
  if (block.children.length === 0) {
    block.children.push({
      _type: 'span',
      _key: key(),
      text: '',
      marks: [],
    })
  }

  return block
}

function createTextBlock(text: string, style: string): Block {
  return {
    _type: 'block',
    _key: key(),
    style,
    children: [
      {
        _type: 'span',
        _key: key(),
        text,
        marks: [],
      },
    ],
    markDefs: [],
  }
}

function createImageBlock(img: cheerio.Cheerio<cheerio.Element>): ImageBlock | null {
  const src = img.attr('src') || img.attr('data-src')
  if (!src) return null

  // Get the full-size URL (WordPress often uses -300x200 thumbnails in content)
  const fullSrc = src.replace(/-\d+x\d+(\.\w+)$/, '$1')

  return {
    _type: 'image',
    _key: key(),
    alt: img.attr('alt') || undefined,
    _wpImageUrl: fullSrc,
  }
}

function createYoutubeBlock(iframe: cheerio.Cheerio<cheerio.Element>): YoutubeBlock | null {
  const src = iframe.attr('src') || ''
  if (!src.includes('youtube.com') && !src.includes('youtu.be')) return null

  // Convert embed URL to watch URL
  let url = src
  const embedMatch = src.match(/youtube\.com\/embed\/([^?&]+)/)
  if (embedMatch) {
    url = `https://www.youtube.com/watch?v=${embedMatch[1]}`
  }

  return {
    _type: 'youtube',
    _key: key(),
    url,
  }
}

export type { PortableTextBlock, ImageBlock }
