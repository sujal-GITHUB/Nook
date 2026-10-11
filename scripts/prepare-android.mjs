import { copyFile, unlink } from 'node:fs/promises'

await copyFile('dist/mobile.html', 'dist/index.html')
await unlink('dist/mobile.html')
