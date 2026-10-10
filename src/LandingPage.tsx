import { useEffect, useRef, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Download, FileText, Link2, ShieldCheck, X } from 'lucide-react'
import Dither from './Dither'
import ShuffleText from './ShuffleText'
import UseCases from './UseCases'
import { BentoGrid, BentoGridItem } from './BentoGrid'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function LandingBrand() {
  return <a className="landing-brand" href="#top" aria-label="Nook home">
    <img className="landing-brand-icon" src="/app-icon.svg" alt="" aria-hidden="true" />
    <span>NOOK</span>
  </a>
}

export default function LandingPage() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const helpDialog = useRef<HTMLDialogElement>(null)
  const pageRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setInstalled(true)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

    setInstalled(isStandalone)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

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

  const installOrOpen = async () => {
    if (installed) {
      window.location.assign('/app/')
      return
    }
    if (!installPrompt) {
      helpDialog.current?.showModal()
      return
    }

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    setInstallPrompt(null)
    if (choice.outcome === 'accepted') setInstalled(true)
  }

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
          <button className="download-nav-cta" type="button" onClick={() => void installOrOpen()}>{installed ? 'OPEN NOOK' : 'DOWNLOAD'} <ArrowUpRight size={13} /></button>
        </nav>
      </header>
      <div className="download-copy">
        <p className="eyebrow"><span className="eyebrow-rule" /> A PRIVATE SPACE FOR YOUR WHOLE STORY</p>
        <h1 id="download-title" aria-label="Everything you need. Nothing online.">
          <span><ShuffleText text="Everything" /></span>
          <span><ShuffleText text="you need." delay={150} /></span>
          <em><ShuffleText text="Nothing" delay={300} /></em>
          <em><ShuffleText text="online." delay={450} /></em>
        </h1>
        <p className="hero-description">One creative workspace for your words, photos, films, sounds, and keepsakes. Install Nook once. Your work stays on your device, ready offline.</p>
        <button className="primary-cta download-cta" type="button" onClick={() => void installOrOpen()}>
          <Download size={16} strokeWidth={1.8} />
          {installed ? 'OPEN NOOK' : 'DOWNLOAD THE APP'}
        </button>
        <p className="download-note">FREE TO USE <i /> NO ACCOUNT <i /> YOUR FILES STAY HERE</p>
      </div>
      <a className="download-caption" href="#features">EXPLORE THE SPACE <i /><ArrowDownRight size={13} /></a>
    </section>

    <section className="story-section" aria-labelledby="story-title" data-reveal>
      <div className="story-mark" aria-hidden="true"><span /><span /><span /></div>
      <div className="story-copy">
        <span className="section-kicker"><i /> MADE FOR THE THINGS YOU KEEP</span>
        <h2 id="story-title">Less collecting<br />in pieces.<br /><em>More seeing<br />the whole.</em></h2>
      </div>
      <div className="story-aside">
        <p>A ticket from the train. A voice note from the trail. The photograph you almost forgot to take.</p>
        <p>Put the pieces on one page. Let a collection become a story you can return to.</p>
        <span className="story-aside-note"><Link2 size={14} /> YOUR LIFE, IN ITS OWN WORDS</span>
      </div>
    </section>


    <section className="usage-section" id="ideas" aria-labelledby="use-cases-title">
      <div className="section-intro use-cases-intro" data-reveal>
        <span className="section-kicker"><i /> A FEW PLACES TO BEGIN</span>
        <h2 id="use-cases-title">A place for<br /><em>every kind of story.</em></h2>
      </div>
      <UseCases />
    </section>

    <section className="offline-section" id="offline" aria-labelledby="offline-title">
      <div className="offline-content" data-reveal>
        <span className="section-kicker"><i /> PRIVATE BY DEFAULT</span>
        <h2 id="offline-title">Your work<br />stays <em>yours.</em></h2>
        <p>Your pages and media are saved on this device. No account is needed to use the workspace, and your documents aren’t sent to a cloud library.</p>
      </div>
      <div className="offline-points" data-reveal>
        <article><ShieldCheck aria-hidden="true" /><div><h3>Kept on your device</h3><p>Pages save in this browser profile; attached media stays in local browser storage.</p></div></article>
        <article><Download aria-hidden="true" /><div><h3>Ready when you are</h3><p>Install Nook after the first visit, then reopen the workspace offline.</p></div></article>
        <article><FileText aria-hidden="true" /><div><h3>Take your work with you</h3><p>Export a page with its media as a portable JSON package.</p></div></article>
      </div>
    </section>

    <section className="download-end" aria-labelledby="download-end-title" data-reveal>
      <span className="section-kicker"><i /> YOUR SPACE IS READY</span>
      <h2 id="download-end-title">Bring it all<br /><em>with you.</em></h2>
      <p>One download. Your own space. Ready offline.</p>
      <button className="primary-cta download-cta" type="button" onClick={() => void installOrOpen()}><Download size={16} strokeWidth={1.8} />{installed ? 'OPEN NOOK' : 'DOWNLOAD THE APP'}</button>
    </section>

    <footer className="download-footer"><LandingBrand /><span>YOUR FILES STAY HERE.</span><a href="#top">BACK TO TOP ↑</a></footer>

    <dialog className="install-dialog" ref={helpDialog} aria-labelledby="install-help-title">
      <button className="install-dialog-close" type="button" aria-label="Close install instructions" onClick={() => helpDialog.current?.close()}><X size={18} /></button>
      <span className="install-kicker"><i /> INSTALL NOOK ON THIS DEVICE</span>
      <h2 id="install-help-title">Take your space<br /><em>with you.</em></h2>
      <p className="install-dialog-copy">Open your browser’s menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>. Once installed, Nook opens as an offline workspace on this device.</p>
      <button className="primary-cta" type="button" onClick={() => helpDialog.current?.close()}>GOT IT</button>
    </dialog>
  </main>
}
