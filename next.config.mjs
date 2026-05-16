/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Valid JS identifiers — safe to externalise as strings
    config.externals.push('pino-pretty', 'lokijs', 'encoding')

    // @react-native-async-storage/async-storage has characters that are
    // invalid in JS identifiers, so webpack generates broken code when
    // it's listed as a string external.  Aliasing to false returns an
    // empty module stub instead.
    config.resolve.alias['@react-native-async-storage/async-storage'] = false

    return config
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
