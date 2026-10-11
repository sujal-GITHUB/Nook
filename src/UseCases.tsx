import { Archive, BookOpen, FileText, Images, Map, PenLine } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const FEATURES = [
  {
    title: 'Travel journals',
    description: 'Bring map links, photos, ticket PDFs, and voice memos together as the story of a place.',
    icon: Map
  },
  {
    title: 'Visual diaries',
    description: 'Pair everyday photos and videos with captions, notes, and the sounds around them.',
    icon: Images
  },
  {
    title: 'Personal stories',
    description: 'Weave writing, photographs, recordings, and keepsakes into one document you can revisit.',
    icon: PenLine
  },
  {
    title: 'Project notes',
    description: 'Keep drafts, reference links, PDFs, and other project files in the notes they belong with.',
    icon: FileText
  },
  {
    title: 'Multimedia documents',
    description: 'Combine text with images, playable audio and video, PDFs, and downloadable attachments.',
    icon: BookOpen
  },
  {
    title: 'Personal archives',
    description: 'Keep meaningful photos, documents, links, and media saved together on your device.',
    icon: Archive
  }
] as { title: string; description: string; icon: LucideIcon }[]

function Feature({ title, description, icon: Icon, index }: (typeof FEATURES)[number] & { index: number }) {
  return <article className="aceternity-feature" data-row={index < 3 ? 'top' : 'bottom'} data-reveal>
    <div className="aceternity-feature-hover" aria-hidden="true" />
    <div className="aceternity-feature-icon"><Icon aria-hidden="true" /></div>
    <h3><span className="aceternity-feature-accent" aria-hidden="true" /><span className="aceternity-feature-title">{title}</span></h3>
    <p>{description}</p>
  </article>
}

export default function UseCases() {
  return <div className="aceternity-feature-grid">
    {FEATURES.map((feature, index) => <Feature key={feature.title} {...feature} index={index} />)}
  </div>
}
