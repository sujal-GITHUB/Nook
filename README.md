# Nook

**Everything in one place. Create without the internet.**

Nook is an offline-first multimedia editor for making complete documents from writing, photos, videos, audio recordings, links, PDFs, and other files. Use one local workspace for travel journals, visual diaries, personal stories, project notes, and archives.

The website is the product landing and download page. The editor runs as an offline-first desktop application for Linux, Windows, and macOS, and as an Android app; it does not open as a browser editor. There are no accounts or cloud document storage. Documents and media stay on the device running Nook.

## Contents

- [Download](#download)
- [Install Nook](#install-nook)
- [Features](#features)
- [Where your documents are stored](#where-your-documents-are-stored)
- [Run from source](#run-from-source)
- [Current limitations](#current-limitations)
- [Security](#security)

## Download

Get Nook from the [latest GitHub Release](https://github.com/sujal-GITHUB/Nook/releases/latest). Download the installer for your system:

| System | Download | Notes |
| --- | --- | --- |
| Windows 10/11, x64 | [Nook-win-x64.exe](https://github.com/sujal-GITHUB/Nook/releases/latest/download/Nook-win-x64.exe) | Standard installer |
| macOS, Intel and Apple silicon | [Nook-mac-universal.dmg](https://github.com/sujal-GITHUB/Nook/releases/latest/download/Nook-mac-universal.dmg) | Universal app |
| Linux, x86_64 | [Nook-linux-x86_64.AppImage](https://github.com/sujal-GITHUB/Nook/releases/latest/download/Nook-linux-x86_64.AppImage) | Portable; recommended for Fedora |
| Debian/Ubuntu, x86_64 | [Nook-linux-amd64.deb](https://github.com/sujal-GITHUB/Nook/releases/latest/download/Nook-linux-amd64.deb) | Debian package |
| Android 7 and later | [Nook-android-universal.apk](https://github.com/sujal-GITHUB/Nook/releases/latest/download/Nook-android-universal.apk) | Install directly on a phone or tablet |

These links work once a release with installer assets has been published. If the latest release page does not list installers, use the **Releases** page later; GitHub Actions run artifacts are temporary build outputs retained for 14 days, not permanent downloads.

## Install Nook

### Fedora and other Linux distributions

Use the AppImage on Fedora. It does not need a system-wide installation.

1. Download [Nook-linux-x86_64.AppImage](https://github.com/sujal-GITHUB/Nook/releases/latest/download/Nook-linux-x86_64.AppImage) and open your **Downloads** folder.
2. In the file manager, right-click the AppImage, open **Properties → Permissions**, and enable **Allow executing file as a program** (wording varies by desktop environment).
3. Close Properties and double-click the AppImage to start Nook.

Or launch it in a terminal from the download folder:

```sh
chmod +x Nook-linux-x86_64.AppImage
./Nook-linux-x86_64.AppImage
```

If Nook reports that FUSE is missing on standard Fedora Workstation, install its FUSE 2 compatibility libraries and retry:

```sh
sudo dnf install fuse fuse-libs
```

On Fedora Atomic desktops such as Silverblue or Kinoite, use the distribution's recommended AppImage workflow instead of layering packages without checking the system guidance. The `.deb` download is for Debian and Ubuntu; it is not the Fedora package.

### Debian and Ubuntu

Choose either the AppImage steps above or install the `.deb` package:

1. Download [Nook-linux-amd64.deb](https://github.com/sujal-GITHUB/Nook/releases/latest/download/Nook-linux-amd64.deb).
2. Open a terminal in the folder containing the download and install it:

   ```sh
   sudo apt install ./Nook-linux-amd64.deb
   ```

3. Open **Nook** from your applications menu.

### Windows 10/11

1. Download [Nook-win-x64.exe](https://github.com/sujal-GITHUB/Nook/releases/latest/download/Nook-win-x64.exe).
2. Open the downloaded installer and follow the setup wizard. Choose an install location and whether to add a desktop shortcut.
3. Start **Nook** from the Start menu or the desktop shortcut.

The installer is for 64-bit Windows. This build is not code-signed, so Windows may show a publisher or SmartScreen warning. Check that the installer came from the official Nook Releases page before deciding whether to continue.

### macOS

1. Download [Nook-mac-universal.dmg](https://github.com/sujal-GITHUB/Nook/releases/latest/download/Nook-mac-universal.dmg).
2. Open the downloaded disk image.
3. Drag **Nook** into **Applications**, then eject the mounted Nook disk image.
4. Open Nook from **Applications**.

The universal build supports Intel and Apple silicon Macs. It is not signed or notarized with an Apple Developer ID, so macOS may block the first launch. Only continue if you trust the copy from the official repository. After attempting to open it, macOS may let you approve it in **System Settings → Privacy & Security → Open Anyway**. See [Apple’s safety guidance for apps from unidentified developers](https://support.apple.com/en-us/102445).

### Android 7 and later

1. Download [Nook-android-universal.apk](https://github.com/sujal-GITHUB/Nook/releases/latest/download/Nook-android-universal.apk) from the official Releases page on your Android device.
2. Open the APK from **Downloads**. If Android asks, allow your browser or file manager to install unknown apps, then return to the installer.
3. Tap **Install**, then open **Nook** from your app list.

The APK is built for direct installation and is not distributed through Google Play. Android keeps Nook's documents and attachments in local app storage. Android removes this private app data when Nook is uninstalled; portable backup export is currently available in the desktop app.

## Features

### Write and shape documents

- Create and manage multiple local pages in a personal workspace.
- Format text with bold, italic, strikethrough, headings, bulleted lists, block quotes, and links.
- Use the `/` block-style menu in an empty paragraph to choose a paragraph or heading.
- Undo and redo edits, and find and replace text within the current page.
- Search the workspace by page title; rename, duplicate, and delete pages.

### Bring media into the document

- Add local images, video, audio, PDFs, and other files with **Add media** or by dragging files into a document. Paste images from the clipboard.
- View images with captions, play supported local audio and video, and preview PDFs inline. Other formats appear as named file cards.
- Save a copy of any attachment to a regular file through the system save dialog.
- Keep an audio recording or voice memo made elsewhere as an attachment alongside the writing and images it belongs with. Nook does not currently record audio inside the app.
- Files up to 500 MB can be added, subject to available disk space.

### Keep work local and portable

- Changes save automatically to local device storage; the editor shows when a page is saved. Android uses the device's local IndexedDB storage inside the app.
- On desktop, choose **Save PDF** for a readable document you can open or share in other apps. **Backup** creates a portable `.nook.json` package, including the media, that can be imported back into Nook.
- Switch between light and dark themes.
- Use the installed apps without a network connection. The website is only needed to read about Nook and download installers.

**Links stay links:** saving a web link does not save the linked page. Opening a remote destination requires an internet connection; your local Nook documents remain available offline.

## Where your documents are stored

Documents and media are stored in Nook's local application data on the current device. On desktop this is held in the current computer account; on Android it is held in the app's private local storage. Nook does not provide account login, cloud storage, or automatic cross-device sync. Export `.nook.json` backups if you want a portable copy or a separate backup.

## Run from source

### Requirements

- Node.js 20.19 or later
- npm

Install dependencies and start the development server:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite to view the landing page and download information. The editor is not served by the website. To build and run the Electron desktop editor during development:

```sh
npm run desktop
```

For Android development, install Android Studio with the Android SDK and a Java 21 JDK, connect an Android device or start an emulator, then run:

```sh
npm run build:android
npm run android:open
```

From Android Studio, run the `app` configuration on your device. To create a locally installable debug APK from the terminal:

```sh
cd android
./gradlew assembleDebug
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

`npm run build` builds the website only. `npm run build:desktop` builds the editor renderer with file-relative assets for Electron.

### Build installers

Build each desktop package on its target operating system:

```sh
npm run dist:linux    # Linux x64 AppImage and DEB
npm run dist:windows  # Windows x64 installer; requires Windows and Inno Setup 6 or 7
npm run dist:mac      # Universal macOS DMG and ZIP; requires macOS
```

If Inno Setup is installed in a nonstandard location, set `ISCC_PATH` to the `ISCC.exe` path before running the Windows build.

GitHub Actions builds Linux, Windows, macOS, and Android packages for branch pushes and pull requests. Those runs produce temporary artifacts. To publish downloadable installers, push a new version tag (the next version is `v0.1.4`). The tag workflow builds all platforms and attaches the installers to a GitHub Release. The Android APK is debug-signed for direct installation, not Google Play distribution. Because GitHub runners generate their debug keys, Android may require uninstalling an older APK before installing a later one; uninstalling erases that installation's local documents. Configure a persistent private signing key before distributing Android updates broadly. The release job requires repository Actions permissions to write contents.

## Current limitations

- In-app audio recording, cloud sync, accounts, and collaboration are not available.
- HTML and Markdown export are not available. Use PDF for a readable document copy and `.nook.json` for a portable editable backup.
- Nook does not currently have a browser editor or browser-based document storage.
- Android PDF preview/export, portable backup export, and native save-to-folder dialogs are not implemented yet. Android can create and edit local documents and attach/view supported media; use the desktop build for PDF export and portable backups.
- macOS builds are not signed or notarized, and Windows builds are not code-signed.

## Security

The Electron renderer runs with sandboxing and context isolation, with Node.js integration disabled. Filesystem operations are handled by the desktop main process through a limited preload bridge. Imported document content is validated as structured data, and supported links are restricted to safe URL schemes.
