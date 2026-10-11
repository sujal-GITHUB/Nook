import type { RemixiconComponentType } from '@remixicon/react'
import { GlassSurface } from './GlassSurface'

export type MobileSiteDockLink = {
  label: string
  href: string
  icon: RemixiconComponentType
}

export function MobileSiteDock({ links }: { links: MobileSiteDockLink[] }) {
  return <nav className="site-mobile-dock" aria-label="Site navigation">
    <GlassSurface className="site-mobile-dock-glass" style={{ width: '100%', height: 70 }}>
      <a className="site-mobile-dock-brand" href="/" aria-label="Nook home">
        <img src="/app-icon.svg" alt="" />
        <span>Nook</span>
      </a>
      {links.map(({ label, href, icon: Icon }) => <a className="site-mobile-dock-link" href={href} key={label}>
        <Icon size={18} aria-hidden="true" />
        <span>{label}</span>
      </a>)}
    </GlassSurface>
  </nav>
}
