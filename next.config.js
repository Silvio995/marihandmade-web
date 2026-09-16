/** @type {import('next').NextConfig} */
const fallbackCloudName =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  (process.env.NODE_ENV !== 'production' ? 'demo' : undefined)

const nextConfig = {
  experimental: {
    outputFileTracingIncludes: { '/**/*': ['./src/generated/client/**/*'] },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  env: {
    ...(fallbackCloudName && {
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: fallbackCloudName,
    }),
  },
}

module.exports = nextConfig
