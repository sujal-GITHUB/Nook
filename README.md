# Nook

**A private, offline-first workspace for complete multimedia documents.** Bring writing, photos, video, audio, links, PDFs, and other files together in one place to make travel journals, visual diaries, project notes, and personal archives.

Nook is built to work without an account or cloud storage. Your documents and attached media stay on your device, and the desktop app can be used without an internet connection.

## Download Nook

Download the latest desktop release from [GitHub Releases](https://github.com/sujal-GITHUB/Nook/releases/latest). Choose the installer for your operating system:

| Operating system | Download | Package |
| --- | --- | --- |
| Windows 10/11, 64-bit | `Nook-win-x64.exe` | Windows installer |
| macOS, Intel or Apple silicon | `Nook-mac-universal.dmg` | Universal disk image |
| Linux, 64-bit | `Nook-linux-x86_64.AppImage` | Portable application |
| Debian or Ubuntu, 64-bit | `Nook-linux-amd64.deb` | Debian package |

If the latest release page has no installers yet, a release has not been published. Builds shown under GitHub Actions are temporary workflow artifacts and are retained for 14 days; use the Releases page for stable downloads.

## Install

### Fedora and other Linux distributions

The AppImage is the recommended download for Fedora. Save `Nook-linux-x86_64.AppImage`, then make it executable and launch it:

```sh
chmod +x Nook-linux-x86_64.AppImage
./Nook-linux-x86_64.AppImage
```

You can also mark the file as executable in your file manager, then double-click it. If your system reports that FUSE is unavailable, install the FUSE 2 compatibility package provided by your distribution or use the AppImage's supported extraction option.

The `.deb` package is for Debian and Ubuntu, not Fedora. On Debian or Ubuntu, install the downloaded package with:

```sh
sudo apt install ./Nook-linux-amd64.deb
```

### Windows

1. Download `Nook-win-x64.exe` from the latest release.
2. Open the installer and follow the setup prompts. You can choose an installation location and optionally create a desktop shortcut.
3. Launch **Nook** from the Start menu or desktop shortcut.

The current installer is for 64-bit Windows. Builds are not code-signed, so Windows may show a publisher or SmartScreen warning. Only install a copy obtained from the official Nook repository if you choose to proceed.

### macOS

1. Download `Nook-mac-universal.dmg` from the latest release.
2. Open the disk image and drag **Nook** into **Applications**.
3. Eject the mounted Nook disk image, then launch Nook from Applications.

The universal build supports both Intel and Apple silicon Macs. The current app is not signed or notarized with an Apple Developer ID, so macOS may warn that it cannot verify the developer. Only use a copy downloaded from the official Nook repository.

## What you can make

- **Travel journals:** combine trip notes with local photos, videos, audio, and saved links.
- **Visual diaries and personal stories:** place media alongside formatted writing and captions.
- **Project notes and archives:** keep reference files and ideas together in a searchable local workspace.
- **Multimedia documents:** work with images, video, audio, PDFs, and other attachments in the same document.

Nook stores remote links as links; it does not download the linked web pages. Opening those destinations still requires an internet connection. Local attachments remain available offline when stored on the device.

## Current features

- Multiple documents with search, rename, duplicate, and delete.
- Rich text with headings, lists, quotes, links, undo, and redo.
- Insert local images, video, audio, PDFs, and other files with a picker or drag and drop; paste images where supported.
- Captions and preview or playback controls for supported media.
- Automatic saving to local storage.
- Versioned `.nook.json` export and import, including referenced media.
- An installable browser app (PWA) with an offline application shell after its first successful load.
- Native desktop builds for Linux, Windows, and macOS.

Browser documents and media are stored in that browser profile's IndexedDB storage and remain subject to browser/device storage limits. Desktop document data and media are stored in the current user's local application data. Nook does not provide cloud sync or an account service.

## Run from source

### Requirements

- Node.js 20.19 or later
- npm

Install dependencies and start the development server:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The editor route is `/app/`.

To launch the Electron desktop app during development:

```sh
npm run desktop
```

### Build desktop installers

Build each installer on its target operating system:

```sh
npm run dist:linux    # Linux x64 AppImage and DEB
npm run dist:windows  # Windows x64 installer (requires Inno Setup 6 or 7)
npm run dist:mac      # Universal macOS DMG and ZIP
```

The Windows installer build requires Windows and Inno Setup. You can set `ISCC_PATH` if `ISCC.exe` is not in a standard Inno Setup installation directory. macOS distribution is currently unsigned and not notarized.

GitHub Actions builds the platform packages for pushes and pull requests. Those run artifacts are temporary. To publish a release, push a new version tag such as `v0.1.2`; the workflow builds all three platforms and attaches the installers to a GitHub Release. The workflow needs repository Actions permissions that allow the release job to write repository contents.

## Data and security

- Nook does not require an account and does not sync documents to a server.
- Imported editor content is parsed as structured document data; links are restricted to supported safe URL schemes.
- The Electron renderer is sandboxed with context isolation and no Node.js integration. Filesystem access is handled in the main process through a limited preload bridge.
- Desktop media is stored locally alongside the application's document data. Export `.nook.json` backups to move documents or keep an independent copy.

## Not currently included

Cloud sync, account services, PDF/HTML/Markdown export, ZIP-based `.mmdoc` packages, advanced recovery tools, and signed/notarized installers are not currently available. The browser PWA and desktop app use local storage but have platform-specific storage locations; they do not automatically sync with each other.
