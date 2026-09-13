/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { webpack }) => {
    config.externals.push(
      'pino-pretty', 
      'lokijs', 
      'encoding',
      '@x402/svm/exact/client',
      '@x402/core/client',
      '@x402/evm/exact/client',
      '@x402/evm/upto/client',
      '@x402/evm'
    )
    config.resolve.alias = {
      ...config.resolve.alias,
      '@x402/evm/exact/client': false,
      '@x402/evm/upto/client': false,
      '@x402/evm': false,
      '@x402/svm/exact/client': false,
      '@x402/core/client': false,
    }
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      '@react-native-async-storage/async-storage': false,
      '@x402/evm': false,
      '@x402/evm/exact/client': false,
      '@x402/evm/upto/client': false,
      '@x402/svm/exact/client': false,
      '@x402/core/client': false,
    }
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@x402\//,
      })
    )
    return config
  },
}

export default nextConfig
