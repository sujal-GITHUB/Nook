import { useEffect, useState } from 'react'
import { NodeViewWrapper, type NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react'
import { Node } from '@tiptap/core'
import { FileText, ImageOff } from 'lucide-react'
import { getMedia } from './mediaStore'

function MediaView({ node, updateAttributes, selected }: NodeViewProps) {
  const { assetId, name, mimeType } = node.attrs as { assetId: string; name: string; mimeType: string }
  const [src, setSrc] = useState<string>()
  const [storedMime, setStoredMime] = useState<string>()
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let objectUrl: string | undefined
    let active = true
    getMedia(assetId).then(asset => {
      if (!active) return
      if (asset) {
        objectUrl = URL.createObjectURL(asset.blob)
        setStoredMime(asset.mimeType)
        setSrc(objectUrl)
      } else setMissing(true)
    }).catch(() => { if (active) setMissing(true) })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [assetId])

  const renderType = storedMime ?? mimeType
  return <NodeViewWrapper className={`media-block${selected ? ' media-selected' : ''}`} contentEditable={false}>
    {missing ? <div className="media-missing"><ImageOff size={18} /><span>Media unavailable: {name}</span></div> : !src ? <div className="media-loading">Loading {name}…</div> : renderType.startsWith('image/') ? <figure><img src={src} alt={name} /><figcaption><input aria-label="Image caption" value={node.attrs.caption ?? ''} placeholder="Add a caption…" onChange={event => updateAttributes({ caption: event.target.value })} /></figcaption></figure> : renderType.startsWith('video/') ? <video src={src} controls preload="metadata" /> : renderType.startsWith('audio/') ? <audio src={src} controls preload="metadata" /> : renderType === 'application/pdf' ? <iframe src={src} title={name} sandbox="" /> : <a className="attachment-card" href={src} download={name}><FileText size={20} /><span><strong>{name}</strong><small>{formatBytes(node.attrs.size)}</small></span></a>}
    {!renderType.startsWith('image/') && <div className="media-caption"><input aria-label="Media caption" value={node.attrs.caption ?? ''} placeholder="Add a caption…" onChange={event => updateAttributes({ caption: event.target.value })} /></div>}
  </NodeViewWrapper>
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export const MediaBlock = Node.create({
  name: 'media',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      assetId: { default: null }, name: { default: 'Attachment' }, mimeType: { default: 'application/octet-stream' },
      size: { default: 0 }, caption: { default: '' },
    }
  },
  parseHTML() { return [{ tag: 'div[data-nook-media]' }] },
  renderHTML({ HTMLAttributes }) { return ['div', { ...HTMLAttributes, 'data-nook-media': '' }] },
  addNodeView() { return ReactNodeViewRenderer(MediaView) },
})
