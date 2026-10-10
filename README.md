# Nook

Nook is an offline-first creative workspace for stories, visual diaries, and personal archives. The public website is a focused install page; it does not open the editor or require an account. Install Nook as a PWA from the download button, and the installed app launches the local editor at `/app/`. Documents and media remain in the current browser profile.

## Run locally

```sh
npm install
npm run dev
```

The Vite development server runs at `http://127.0.0.1:5173`. Nook has no account service or backend; editing, document storage, and media storage run in the browser.

Create and run a production build with:

```sh
npm run build
npm run preview
```

`npm run preview` serves the production build locally. For deployment, publish the contents of `dist/` to any static host with SPA fallback support. The public page is simply the promotional site; the installed PWA opens the local editor.

## Current milestone

- Rich text editing with headings in content, paragraphs, bold, italic, strikethrough, links, bulleted lists, blockquotes, and undo/redo.
- Multiple local documents with create and switch actions.
- Document title and editor content autosave to this browser's local storage; binary media is stored in IndexedDB.
- Insert images, audio, video, PDFs, and arbitrary attachments with optional captions.
- Versioned JSON import/export packages the document and referenced media together.
- Responsive workspace shell with light and dark themes.
- Installable PWA with a service worker that caches the editor shell and its assets for offline launches after the initial online visit.
- No account, cloud service, or backend is required; the editor stores pages in browser local storage and media in IndexedDB.

The browser data is local to the current browser profile. Native `.mmdoc` ZIP packages, configurable hybrid storage thresholds, PDF/HTML/Markdown export, and the Electron desktop shell are subsequent milestones. SQLite is listed in the project plan for a future desktop storage adapter; it is not part of the current application runtime.
