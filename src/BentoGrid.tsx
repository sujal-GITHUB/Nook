import type { ReactNode } from 'react'

type BentoGridProps = {
  className?: string
  children: ReactNode
}

type BentoGridItemProps = {
  className?: string
  title: string
  description: string
  header: ReactNode
  icon?: ReactNode
}

export function BentoGrid({ className = '', children }: BentoGridProps) {
  return <div className={`bento-grid ${className}`}>{children}</div>
}

export function BentoGridItem({ className = '', title, description, header, icon }: BentoGridItemProps) {
  return <article className={`bento-grid-item ${className}`} data-reveal>
    <div className="bento-grid-header">{header}</div>
    <div className="bento-grid-content">
      {icon}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  </article>
}
