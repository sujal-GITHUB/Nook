import { Archive, AudioLines, BookOpen, Images, Palette, Projector } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const FEATURES = [
  {
    title: 'Travel journals',
    description: 'Keep photographs, field notes, saved links, and recordings together as the story of a place.',
    icon: BookOpen
  },
  {
    title: 'Visual diaries',
    description: 'Give everyday images their context with captions, passing thoughts, and the moments around them.',
    icon: Images
  },
  {
    title: 'Moodboards',
    description: 'Gather visual references, inspiring links, and written fragments while an idea takes shape.',
    icon: Palette
  },
  {
    title: 'Sound stories',
    description: 'Place audio recordings beside the notes, images, and memories that give them meaning.',
    icon: AudioLines
  },
  {
    title: 'Creative projects',
    description: 'Bring drafts, reference files, links, and visual inspiration together from first thought onward.',
    icon: Projector
  },
  {
    title: 'Personal archives',
    description: 'Keep meaningful photographs, documents, notes, and keepsakes close for the stories they hold.',
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
