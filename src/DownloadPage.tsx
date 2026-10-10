import { useEffect, useState } from 'react'
import { ArrowDownToLine, ArrowLeft, ArrowUpRight, Apple, Check, LoaderCircle, MonitorDown, PackageOpen } from 'lucide-react'
import Dither from './Dither'

const repository = 'https://github.com/sujal-GITHUB/Nook'
const releaseApi = 'https://api.github.com/repos/sujal-GITHUB/Nook/releases/latest'

type ReleaseAsset = { name: string; browser_download_url: string; size: number }
type ReleaseResponse = { tag_name?: unknown; html_url?: unknown; assets?: unknown }
type ReleaseState =
  | { status: 'loading' }
  | { status: 'available'; tag: string; url: string; assets: ReleaseAsset[] }
  | { status: 'empty' }
  | { status: 'error' }

function readRelease(value: unknown): ReleaseState {
  if (!value || typeof value !== 'object') return { status: 'error' }
  const release = value as ReleaseResponse
  if (typeof release.tag_name !== 'string' || typeof release.html_url !== 'string'
    || !release.html_url.startsWith(`${repository}/releases/tag/`) || !Array.isArray(release.assets)) return { status: 'error' }
  const assets = release.assets.filter((asset): asset is ReleaseAsset => {
    if (!asset || typeof asset !== 'object') return false
    const candidate = asset as Partial<ReleaseAsset>
    return typeof candidate.name === 'string'
      && typeof candidate.browser_download_url === 'string'
      && candidate.browser_download_url.startsWith(`${repository}/releases/download/`)
      && typeof candidate.size === 'number'
  })
  return { status: 'available', tag: release.tag_name, url: release.html_url, assets }
}

function formatSize(bytes: number): string {
  return bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 1024 ** 2))} MB`
}

function ReleaseLink({ asset, label, unavailableText }: { asset?: ReleaseAsset; label: string; unavailableText: string }) {
  if (!asset) return <span className="os-download unavailable" aria-disabled="true">{label}<span>{unavailableText}</span></span>
  return <a className="os-download" href={asset.browser_download_url}>
    <span>{label}<small>{formatSize(asset.size)}</small></span><ArrowDownToLine size={17} aria-hidden="true" />
  </a>
}

export default function DownloadPage() {
  const [release, setRelease] = useState<ReleaseState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    void fetch(releaseApi, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal,
    }).then(async response => {
      if (response.status === 404) {
        setRelease({ status: 'empty' })
        return
      }
      if (!response.ok) throw new Error('Could not check releases')
      setRelease(readRelease(await response.json()))
    }).catch(error => {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setRelease({ status: 'error' })
    })
    return () => controller.abort()
  }, [])

  const assets = release.status === 'available' ? release.assets : []
  const asset = (name: string) => assets.find(item => item.name === name)
  const unavailableText = release.status === 'empty' ? 'Build not published yet'
    : release.status === 'loading' ? 'Checking availability…'
      : release.status === 'error' ? 'Check releases on GitHub'
        : 'Not in this release'

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

      {release.status === 'loading' && <p className="release-status" role="status"><LoaderCircle size={15} className="release-spinner" /> CHECKING FOR THE LATEST RELEASE</p>}
      {release.status === 'empty' && <div className="release-status release-note" role="status"><span className="release-status-icon"><Check size={14} /></span><span><strong>Desktop installers are being prepared.</strong><br />The first installers will appear here as soon as a release is published.</span></div>}
      {release.status === 'error' && <div className="release-status release-note" role="status"><span className="release-status-icon">!</span><span><strong>Couldn’t check the latest release.</strong><br />You can still view available builds and release notes on GitHub.</span></div>}

      <div className="os-download-grid">
        <article className="os-download-card">
          <div className="os-card-heading"><Apple size={20} aria-hidden="true" /><div><h2>macOS</h2><p>For Apple silicon and Intel Macs</p></div></div>
          <ReleaseLink asset={asset('Nook-mac-universal.dmg')} label="Download for Mac" unavailableText={unavailableText} />
        </article>
        <article className="os-download-card">
          <div className="os-card-heading"><MonitorDown size={20} aria-hidden="true" /><div><h2>Windows</h2><p>64-bit Windows 10 or later</p></div></div>
          <ReleaseLink asset={asset('Nook-win-x64.exe')} label="Download for Windows" unavailableText={unavailableText} />
        </article>
        <article className="os-download-card">
          <div className="os-card-heading"><PackageOpen size={20} aria-hidden="true" /><div><h2>Linux</h2><p>64-bit desktop distributions</p></div></div>
          <ReleaseLink asset={asset('Nook-linux-x64.AppImage')} label="AppImage" unavailableText={unavailableText} />
          <ReleaseLink asset={asset('Nook-linux-x64.deb')} label="Debian package" unavailableText={unavailableText} />
        </article>
      </div>

      <div className="release-meta">
        <span>{release.status === 'available' ? `LATEST RELEASE · ${release.tag}` : 'OFFLINE-FIRST · NO ACCOUNT REQUIRED'}</span>
        <a href={release.status === 'available' ? release.url : `${repository}/releases`}>RELEASE NOTES <ArrowUpRight size={12} aria-hidden="true" /></a>
      </div>
      <p className="os-download-footnote">Nook keeps your pages and media in local storage on your device. Downloads require an internet connection; the workspace is designed to work offline after installation.</p>
    </section>
    <footer className="download-footer"><a className="landing-brand" href="/" aria-label="Nook home"><img className="landing-brand-icon" src="/app-icon.svg" alt="" aria-hidden="true" /><span>NOOK</span></a><span>YOUR FILES STAY HERE.</span><a href={`${repository}/releases`}>ALL RELEASES ↗</a></footer>
  </main>
}
