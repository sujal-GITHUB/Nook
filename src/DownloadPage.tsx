import { ArrowDownToLine, ArrowLeft, ArrowUpRight, Apple, PackageOpen, PanelsTopLeft, Smartphone } from 'lucide-react'
import Dither from './Dither'

const repository = 'https://github.com/sujal-GITHUB/Nook'
const latestDownload = `${repository}/releases/latest/download`

function InstallerLink({ href, label }: { href: string; label: string }) {
  return <a className="os-download" href={href}>
    <span>{label}</span><ArrowDownToLine size={17} aria-hidden="true" />
  </a>
}

export default function DownloadPage() {
  return <main className="landing download-landing os-download-page">
    <div className="landing-dither-layer" aria-hidden="true"><Dither /></div>
    <header className="download-nav">
      <a className="landing-brand" href="/" aria-label="Nook home"><img className="landing-brand-icon" src="/app-icon.svg" alt="" aria-hidden="true" /><span>NOOK</span></a>
      <a className="download-back" href="/"><ArrowLeft size={14} aria-hidden="true" /> BACK TO NOOK</a>
    </header>

    <section className="os-download-content" aria-labelledby="os-download-title">
      <p className="eyebrow"><span className="eyebrow-rule" /> YOUR SPACE, ON YOUR DEVICE</p>
      <h1 id="os-download-title">Choose your<br /><em>platform.</em></h1>
      <p className="os-download-lede">Install Nook once. Create and keep everything on your device, even when you’re offline.</p>

      <div className="os-download-grid">
        <article className="os-download-card">
          <div className="os-card-heading"><Apple size={20} aria-hidden="true" /><div><h2>macOS</h2><p>For Apple silicon and Intel Macs</p></div></div>
          <InstallerLink href={`${latestDownload}/Nook-mac-universal.dmg`} label="Download for Mac" />
        </article>
        <article className="os-download-card">
          <div className="os-card-heading"><PanelsTopLeft size={20} aria-hidden="true" /><div><h2>Windows</h2><p>64-bit Windows 10 or later</p></div></div>
          <InstallerLink href={`${latestDownload}/Nook-win-x64.exe`} label="Download for Windows" />
        </article>
        <article className="os-download-card">
          <div className="os-card-heading"><PackageOpen size={20} aria-hidden="true" /><div><h2>Linux</h2><p>64-bit desktop distributions</p></div></div>
          <InstallerLink href={`${latestDownload}/Nook-linux-x86_64.AppImage`} label="Download AppImage" />
          <InstallerLink href={`${latestDownload}/Nook-linux-amd64.deb`} label="Download Debian package" />
        </article>
        <article className="os-download-card">
          <div className="os-card-heading"><Smartphone size={20} aria-hidden="true" /><div><h2>Android</h2><p>Phones and tablets · Android 7+</p></div></div>
          <InstallerLink href={`${latestDownload}/Nook-android-universal.apk`} label="Download APK" />
        </article>
      </div>

      <div className="release-meta">
        <span>OFFLINE-FIRST · NO ACCOUNT REQUIRED</span>
        <a href={`${repository}/releases/latest`} target="_blank" rel="noreferrer">LATEST RELEASE <ArrowUpRight size={12} aria-hidden="true" /></a>
      </div>
      <p className="os-download-footnote">Nook keeps your pages and media in local storage on your device. Downloads require an internet connection; the workspace is designed to work offline after installation.</p>
    </section>
    <footer className="download-footer"><a className="landing-brand" href="/" aria-label="Nook home"><img className="landing-brand-icon" src="/app-icon.svg" alt="" aria-hidden="true" /><span>NOOK</span></a><span>YOUR FILES STAY HERE.</span><a href={`${repository}/releases`} target="_blank" rel="noreferrer">ALL RELEASES ↗</a></footer>
  </main>
}
