'use client'

import { useState, useCallback, useMemo } from 'react'
import { createEditor, Descendant, Transforms, Editor, Element as SlateElement } from 'slate'
import { Slate, Editable, withReact, useSlate, ReactEditor } from 'slate-react'
import { withHistory } from 'slate-history'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Link, 
  Image, 
  Video,
  Code,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

type CustomElement = {
  type: 'paragraph' | 'heading-one' | 'heading-two' | 'heading-three' | 'block-quote' | 'bulleted-list' | 'numbered-list' | 'list-item' | 'link' | 'image' | 'video' | 'code-block'
  children: CustomText[]
  url?: string
  alt?: string
  caption?: string
  alignment?: 'left' | 'center' | 'right'
  title?: string
  originalUrl?: string
  platform?: string
  align?: string
}

type CustomText = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  code?: boolean
}

declare module 'slate' {
  interface CustomTypes {
    Editor: ReactEditor
    Element: CustomElement
    Text: CustomText
  }
}

const LIST_TYPES = ['numbered-list', 'bulleted-list']
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify']

const isBlockActive = (editor: Editor, format: string, blockType = 'type') => {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n[blockType as keyof CustomElement] === format,
    })
  )

  return !!match
}

const isMarkActive = (editor: Editor, format: keyof CustomText) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
  )
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type) &&
      !TEXT_ALIGN_TYPES.includes(format),
    split: true,
  })
  let newProperties: Partial<SlateElement>
  if (TEXT_ALIGN_TYPES.includes(format)) {
    newProperties = {
      align: isActive ? undefined : format,
    } as Partial<SlateElement>
  } else {
    newProperties = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    } as Partial<SlateElement>
  }
  Transforms.setNodes<SlateElement>(editor, newProperties)

  if (!isActive && isList) {
    const block = { type: format, children: [] } as SlateElement
    Transforms.wrapNodes(editor, block)
  }
}

const toggleMark = (editor: Editor, format: keyof CustomText) => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

const ToolbarButton = ({ 
  active, 
  onMouseDown, 
  children 
}: { 
  active: boolean
  onMouseDown: (event: React.MouseEvent) => void
  children: React.ReactNode 
}) => (
  <Button
    variant={active ? 'primary' : 'ghost'}
    size="sm"
    onMouseDown={onMouseDown}
    className="p-2"
  >
    {children}
  </Button>
)

const BlockButton = ({ format, icon }: { format: string; icon: React.ReactNode }) => {
  const editor = useSlate()
  return (
    <ToolbarButton
      active={isBlockActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
    >
      {icon}
    </ToolbarButton>
  )
}

const MarkButton = ({ format, icon }: { format: keyof CustomText; icon: React.ReactNode }) => {
  const editor = useSlate()
  return (
    <ToolbarButton
      active={isMarkActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
    >
      {icon}
    </ToolbarButton>
  )
}

const LinkButton = () => {
  const editor = useSlate()
  const [showModal, setShowModal] = useState(false)
  const [url, setUrl] = useState('')

  const insertLink = () => {
    if (url) {
      const link = {
        type: 'link' as const,
        url,
        children: [{ text: url }],
      }
      Transforms.insertNodes(editor, link)
      setUrl('')
      setShowModal(false)
    }
  }

  return (
    <>
      <ToolbarButton
        active={isBlockActive(editor, 'link')}
        onMouseDown={event => {
          event.preventDefault()
          setShowModal(true)
        }}
      >
        <Link className="w-4 h-4" />
      </ToolbarButton>
      
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Insert Link">
        <div className="space-y-4">
          <Input
            placeholder="Enter URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={insertLink} disabled={!url}>
              Insert Link
            </Button>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

const VideoButton = () => {
  const editor = useSlate()
  const [showModal, setShowModal] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [title, setTitle] = useState('')

  const insertVideo = () => {
    if (videoUrl) {
      // Extract video ID and platform
      let embedUrl = videoUrl
      let platform = 'generic'
      
      // YouTube
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const videoId = extractYouTubeId(videoUrl)
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`
          platform = 'youtube'
        }
      }
      // Vimeo
      else if (videoUrl.includes('vimeo.com')) {
        const videoId = extractVimeoId(videoUrl)
        if (videoId) {
          embedUrl = `https://player.vimeo.com/video/${videoId}`
          platform = 'vimeo'
        }
      }
      
      const video = {
        type: 'video' as const,
        url: embedUrl,
        originalUrl: videoUrl,
        title,
        platform,
        children: [{ text: '' }],
      }
      Transforms.insertNodes(editor, video)
      setVideoUrl('')
      setTitle('')
      setShowModal(false)
    }
  }

  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const extractVimeoId = (url: string): string | null => {
    const regex = /vimeo\.com\/(?:.*#|.*\/)?([0-9]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  return (
    <>
      <ToolbarButton
        active={false}
        onMouseDown={event => {
          event.preventDefault()
          setShowModal(true)
        }}
      >
        <Video className="w-4 h-4" />
      </ToolbarButton>
      
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Embed Video">
        <div className="space-y-4">
          <Input
            placeholder="YouTube, Vimeo, or video URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <Input
            placeholder="Video title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="text-sm text-gray-600">
            Supported platforms: YouTube, Vimeo, or direct video URLs
          </div>
          <div className="flex gap-2">
            <Button onClick={insertVideo} disabled={!videoUrl}>
              Embed Video
            </Button>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

const ImageButton = () => {
  const editor = useSlate()
  const [showModal, setShowModal] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [caption, setCaption] = useState('')
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center')

  const insertImage = () => {
    if (imageUrl) {
      const image = {
        type: 'image' as const,
        url: imageUrl,
        alt: altText,
        caption,
        alignment,
        children: [{ text: '' }],
      }
      Transforms.insertNodes(editor, image)
      setImageUrl('')
      setAltText('')
      setCaption('')
      setAlignment('center')
      setShowModal(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      
      try {
        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          const { url } = await response.json()
          setImageUrl(url)
        }
      } catch (error) {
        console.error('Error uploading image:', error)
      }
    }
  }

  return (
    <>
      <ToolbarButton
        active={false}
        onMouseDown={event => {
          event.preventDefault()
          setShowModal(true)
        }}
      >
        <Image className="w-4 h-4" />
      </ToolbarButton>
      
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Insert Image">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          <div className="text-center text-gray-500">or</div>
          
          <Input
            placeholder="Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <Input
            placeholder="Alt text (required for accessibility)"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
          />
          <Input
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          
          <div>
            <label className="block text-sm font-medium mb-2">Alignment</label>
            <select
              value={alignment}
              onChange={(e) => setAlignment(e.target.value as 'left' | 'center' | 'right')}
              className="w-full p-2 border rounded-md"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={insertImage} disabled={!imageUrl || !altText}>
              Insert Image
            </Button>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

const Element = ({ attributes, children, element }: any) => {
  const style = { textAlign: element.align }
  switch (element.type) {
    case 'block-quote':
      return (
        <blockquote style={style} {...attributes} className="border-l-4 border-gray-300 pl-4 italic">
          {children}
        </blockquote>
      )
    case 'bulleted-list':
      return (
        <ul style={style} {...attributes} className="list-disc pl-6">
          {children}
        </ul>
      )
    case 'heading-one':
      return (
        <h1 style={style} {...attributes} className="text-3xl font-bold mb-4">
          {children}
        </h1>
      )
    case 'heading-two':
      return (
        <h2 style={style} {...attributes} className="text-2xl font-bold mb-3">
          {children}
        </h2>
      )
    case 'heading-three':
      return (
        <h3 style={style} {...attributes} className="text-xl font-bold mb-2">
          {children}
        </h3>
      )
    case 'list-item':
      return (
        <li style={style} {...attributes}>
          {children}
        </li>
      )
    case 'numbered-list':
      return (
        <ol style={style} {...attributes} className="list-decimal pl-6">
          {children}
        </ol>
      )
    case 'link':
      return (
        <a {...attributes} href={element.url} className="text-blue-600 underline">
          {children}
        </a>
      )
    case 'image':
      return (
        <div {...attributes} className={`my-4 ${element.alignment === 'center' ? 'text-center' : element.alignment === 'right' ? 'text-right' : 'text-left'}`}>
          <div contentEditable={false}>
            <img 
              src={element.url} 
              alt={element.alt} 
              className={`max-w-full h-auto rounded-lg shadow-sm ${element.alignment === 'center' ? 'mx-auto' : element.alignment === 'right' ? 'ml-auto' : 'mr-auto'}`}
            />
            {element.caption && (
              <p className="text-sm text-gray-600 mt-2 italic">{element.caption}</p>
            )}
          </div>
          {children}
        </div>
      )
    case 'video':
      return (
        <div {...attributes} className="my-4">
          <div contentEditable={false}>
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              {element.platform === 'youtube' || element.platform === 'vimeo' ? (
                <iframe
                  src={element.url}
                  title={element.title || 'Embedded video'}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={element.url}
                  controls
                  className="w-full h-full object-cover"
                  title={element.title}
                />
              )}
            </div>
            {element.title && (
              <p className="text-sm text-gray-600 mt-2">{element.title}</p>
            )}
          </div>
          {children}
        </div>
      )
    case 'code-block':
      return (
        <pre {...attributes} className="bg-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
          <code>{children}</code>
        </pre>
      )
    default:
      return (
        <p style={style} {...attributes} className="mb-2">
          {children}
        </p>
      )
  }
}

const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.code) {
    children = <code className="bg-gray-100 px-1 rounded">{children}</code>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underline) {
    children = <u>{children}</u>
  }

  return <span {...attributes}>{children}</span>
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  
  const initialValue: Descendant[] = useMemo(() => {
    try {
      return value ? JSON.parse(value) : [{ type: 'paragraph', children: [{ text: '' }] }]
    } catch {
      return [{ type: 'paragraph', children: [{ text: value || '' }] }]
    }
  }, [value])

  const handleChange = useCallback((newValue: Descendant[]) => {
    onChange(JSON.stringify(newValue))
  }, [onChange])

  return (
    <div className={`border rounded-lg ${className}`}>
      <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
        <div className="border-b p-2 flex flex-wrap gap-1">
          <MarkButton format="bold" icon={<Bold className="w-4 h-4" />} />
          <MarkButton format="italic" icon={<Italic className="w-4 h-4" />} />
          <MarkButton format="underline" icon={<Underline className="w-4 h-4" />} />
          <MarkButton format="code" icon={<Code className="w-4 h-4" />} />
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          <BlockButton format="heading-one" icon={<Heading1 className="w-4 h-4" />} />
          <BlockButton format="heading-two" icon={<Heading2 className="w-4 h-4" />} />
          <BlockButton format="heading-three" icon={<Heading3 className="w-4 h-4" />} />
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          <BlockButton format="block-quote" icon={<Quote className="w-4 h-4" />} />
          <BlockButton format="numbered-list" icon={<ListOrdered className="w-4 h-4" />} />
          <BlockButton format="bulleted-list" icon={<List className="w-4 h-4" />} />
          <BlockButton format="code-block" icon={<Code className="w-4 h-4" />} />
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          <LinkButton />
          <ImageButton />
          <VideoButton />
        </div>
        
        <div className="p-4">
          <Editable
            renderElement={Element}
            renderLeaf={Leaf}
            placeholder={placeholder}
            spellCheck
            autoFocus
            className="min-h-[200px] outline-none"
          />
        </div>
      </Slate>
    </div>
  )
}