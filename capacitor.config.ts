import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.nook.workspace',
  appName: 'Nook',
  webDir: 'dist',
  backgroundColor: '#1b1e4a',
  android: {
    allowMixedContent: false,
  },
}

export default config
