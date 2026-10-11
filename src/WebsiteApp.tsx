import LandingPage from './LandingPage'
import DownloadPage from './DownloadPage'
import { ArrowUpRight, BookOpen, Download, Home, PackageOpen, WifiOff } from 'lucide-react'
import { MobileSiteDock, type MobileSiteDockLink } from './MobileSiteDock'

const landingLinks: MobileSiteDockLink[] = [
  { label: 'The space', href: '#features', icon: BookOpen },
  { label: 'Stories', href: '#ideas', icon: PackageOpen },
  { label: 'Offline', href: '#offline', icon: WifiOff },
  { label: 'Download', href: '/download/', icon: Download },
]

const downloadLinks: MobileSiteDockLink[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Stories', href: '/#ideas', icon: BookOpen },
  { label: 'Platforms', href: '#os-download-title', icon: PackageOpen },
  { label: 'Releases', href: 'https://github.com/sujal-GITHUB/Nook/releases', icon: ArrowUpRight },
]

export default function WebsiteApp() {
  const isDownloadPage = window.location.pathname.startsWith('/download')
  return <>
    {isDownloadPage ? <DownloadPage /> : <LandingPage />}
    <MobileSiteDock links={isDownloadPage ? downloadLinks : landingLinks} />
  </>
}
