import LandingPage from './LandingPage'
import DownloadPage from './DownloadPage'

export default function WebsiteApp() {
  return window.location.pathname.startsWith('/download') ? <DownloadPage /> : <LandingPage />
}
