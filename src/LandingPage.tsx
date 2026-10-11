import { useEffect, useRef } from 'react'
import {
  RiArrowRightDownLine as ArrowDownRight, RiArrowRightUpLine as ArrowUpRight, RiVoiceprintLine as AudioLines,
  RiDownloadLine as Download, RiFileTextLine as FileText, RiHardDrive2Line as HardDrive, RiGalleryLine as Images,
  RiLinkM as Link2, RiAttachment2 as Paperclip, RiShieldCheckLine as ShieldCheck, RiWifiOffLine as WifiOff,
} from '@remixicon/react'
import Dither from './Dither'
import ShuffleText from './ShuffleText'
import UseCases from './UseCases'
import { BentoGrid, BentoGridItem } from './BentoGrid'

function LandingBrand() {
  return <a className="landing-brand" href="#top" aria-label="Nook home">
    <img className="landing-brand-icon" src="/app-icon.svg" alt="" aria-hidden="true" />
    <span>NOOK</span>
  </a>
}

export default function LandingPage() {
  const pageRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const page = pageRef.current
    if (!page) return
    const sections = [...page.querySelectorAll<HTMLElement>('[data-reveal]')]
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      sections.forEach(section => section.classList.add('is-visible'))
      return
    }
    page.classList.add('motion-ready')
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' })
    sections.forEach(section => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return <main className="landing download-landing" id="top" ref={pageRef}>
    <div className="landing-dither-layer" aria-hidden="true"><Dither /></div>
    <svg className="grain-filter" aria-hidden="true">
      <filter id="grain-filter"><feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="3" stitchTiles="stitch" /></filter>
      <rect width="100%" height="100%" filter="url(#grain-filter)" />
    </svg>
    <section className="hero download-hero" aria-labelledby="download-title">
      <header className="download-nav">
        <LandingBrand />
        <nav aria-label="Page navigation">
          <a href="#features">THE SPACE</a>
          <a href="#ideas">WAYS TO USE IT</a>
          <a href="#offline">OFFLINE, BY DESIGN</a>
          <a className="download-nav-cta" href="/download/">DOWNLOAD <ArrowUpRight size={13} /></a>
        </nav>
      </header>
      <div className="download-copy">
        <p className="eyebrow"><span className="eyebrow-rule" /> ONE OFFLINE MULTIMEDIA EDITOR</p>
        <h1 id="download-title" aria-label="Everything in one place. Create without the internet.">
          <span><ShuffleText text="Everything in" /></span>
          <span><ShuffleText text="one place." delay={150} /></span>
          <em><ShuffleText text="Create without" delay={300} /></em>
          <em><ShuffleText text="the internet." delay={450} /></em>
        </h1>
        <p className="hero-description">Write, then add photos, videos, voice memos, audio, links, PDFs, and files to the same document. Nook keeps every piece together, autosaved on your device and ready offline.</p>
        <a className="primary-cta download-cta" href="/download/">
          <Download size={16} strokeWidth={1.8} />
          DOWNLOAD NOOK
        </a>
        <p className="download-note">ONE FLEXIBLE CANVAS <i /> AUTOSAVED LOCALLY <i /> WORK OFFLINE</p>
      </div>
      <a className="download-caption" href="#features">EXPLORE THE SPACE <i /><ArrowDownRight size={13} /></a>
    </section>

    <section className="story-section" id="features" aria-labelledby="story-title" data-reveal>
      <div className="story-mark" aria-hidden="true"><span /><span /><span /></div>
      <div className="story-copy">
        <span className="section-kicker"><i /> ONE DOCUMENT, ALL THE PIECES</span>
        <h2 id="story-title">More than<br />a text editor.<br /><em>Your whole<br />story.</em></h2>
      </div>
      <div className="story-aside">
        <p>Write a passage, place a photo beside it, add the trail recording, and keep the ticket PDF in the same document.</p>
        <p>No shuffling between apps. Just one flexible canvas where words and media stay in context.</p>
        <span className="story-aside-note"><Link2 size={14} /> EVERYTHING IN ONE PLACE</span>
      </div>
    </section>

    <section className="usage-section" id="ideas" aria-labelledby="use-cases-title">
      <div className="section-intro use-cases-intro" data-reveal>
        <span className="section-kicker"><i /> START WITH WHATEVER YOU HAVE</span>
        <h2 id="use-cases-title">One canvas for<br /><em>every kind of story.</em></h2>
      </div>
      <UseCases />
    </section>

    <section className="offline-section" id="offline" aria-labelledby="offline-title">
      <div className="offline-content" data-reveal>
        <span className="section-kicker"><i /> NO INTERNET NEEDED</span>
        <h2 id="offline-title">Create<br /><em>offline.</em></h2>
        <p>After installation, write, add media, and return to your documents without a connection. Your pages and files stay in local storage on your device.</p>
      </div>
      <div className="offline-points" data-reveal>
        <article><ShieldCheck aria-hidden="true" /><div><h3>Autosaved as you work</h3><p>Edits are saved to local storage automatically as your document changes.</p></div></article>
        <article><WifiOff aria-hidden="true" /><div><h3>Ready without a connection</h3><p>Open Nook and continue working offline after it has been installed.</p></div></article>
        <article><FileText aria-hidden="true" /><div><h3>Keep the whole document</h3><p>Export a page with its media as a portable Nook document package.</p></div></article>
      </div>
    </section>

    <section className="download-end" aria-labelledby="download-end-title" data-reveal>
      <span className="section-kicker"><i /> EVERYTHING IN ONE PLACE</span>
      <h2 id="download-end-title">Create without<br /><em>the internet.</em></h2>
      <p>Your words, media, and ideas together in one offline workspace.</p>
      <a className="primary-cta download-cta" href="/download/"><Download size={16} strokeWidth={1.8} />DOWNLOAD NOOK</a>
    </section>

    <footer className="download-footer"><LandingBrand /><span>YOUR FILES STAY HERE.</span><a href="#top">BACK TO TOP ↑</a></footer>

  </main>
}
