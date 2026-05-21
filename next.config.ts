import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'flagcdn.com' },
    ],
  },
}

export default withSentryConfig(nextConfig, {
  org: 'prode-mundial-2026',
  project: 'javascript-nextjs',
  silent: true,
  disableLogger: true,
})
