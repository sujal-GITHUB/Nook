# Nook

Nook is a local-first creative workspace for writing, visual diaries, travel journals, and personal archives. The browser app runs as an installable PWA; the desktop shell is built with Electron for Linux, Windows, and macOS. There are no accounts, cloud sync, or backend services. The promotional site may be hosted online, while the editor keeps documents and media on the device.

## Run the browser app

Requirements: Node.js 20.19 or later and npm.

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. The installable app starts at `/app/`. To create and preview a production PWA build:

```sh
npm run build
npm run preview
```

Once the app shell has been installed or loaded successfully, the service worker caches its static assets for offline launches. Browser documents use IndexedDB, and media files are stored as IndexedDB blobs in that browser profile. Browser storage remains subject to each browser's quota and device profile; export backup copies regularly.

## Run the desktop app

```sh
npm run desktop
```

The Electron renderer is sandboxed, has context isolation enabled, and has no Node integration. A narrow preload bridge calls validated IPC handlers. Desktop document metadata and versioned editor content live in a SQLite database under Electron's per-user application data directory. Binary media lives in a private managed assets directory alongside it. SQLite is provided by `sql.js` (SQLite compiled to WebAssembly), avoiding platform-specific native module builds.

Build installers on the corresponding operating system:

```sh
npm run dist:linux    # AppImage and DEB
npm run dist:windows  # NSIS installer
npm run dist:mac      # Universal macOS DMG and ZIP
```

GitHub Actions runs native Linux, Windows, and universal macOS builds for pushes, pull requests, and manual workflow dispatch. Finished installers appear as separate 14-day artifacts on each workflow run. Pushing a version tag such as `v0.1.0` also publishes those installers and generated release notes to GitHub Releases. The `/download/` page checks the latest published release and links directly to its platform installers; it reports when no release is available yet.

Electron Builder can cross-build some targets, but macOS signing/notarization requires Apple tooling and credentials, and Windows/Linux installers should be validated on their target operating systems before distribution. Release signing is not configured in this repository.

## Current editor features

- Multiple local pages with page search, rename, duplicate, and delete.
- Rich text, headings, lists, block quotes, links, undo/redo, and a slash-triggered block style menu.
- Attach local images, video, audio, PDFs, and other files using the file picker or drag-and-drop; paste clipboard images where supported. Media blocks include captions and playback/preview controls.
- Automatic local saving and migration of existing browser `localStorage` page records into IndexedDB.
- Versioned `.nook.json` export/import that packages referenced media with the page.
- Browser offline application shell, responsive editor, and light/dark themes.
- Desktop Linux, Windows, and macOS packaging configuration using Electron with local SQLite metadata and filesystem media.

The browser and desktop storage adapters share the same Tiptap JSON content shape. A `.nook.json` export is portable between them. PDF, HTML, Markdown, and ZIP-based `.mmdoc` export; configurable embedded-versus-bundled thresholds; storage usage controls; advanced recovery; and signed platform installers are not implemented yet and are not advertised as available features.

## Security and data

- Imported page links are restricted to safe web, email, phone, or relative URL schemes; imported editor content is parsed as Tiptap JSON rather than executed HTML.
- Electron keeps filesystem access in the main process. Asset filenames are derived from hashed IDs, and IPC validates document and media records.
- The desktop database is written as an atomic SQLite file snapshot. Keep external `.nook.json` backups for portable copies and recovery.
- Remote hyperlinks can be stored offline, but the linked page itself is not downloaded and requires connectivity to visit.
