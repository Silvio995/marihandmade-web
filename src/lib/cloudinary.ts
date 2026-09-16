export const cloudinaryCloudName =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  (process.env.NODE_ENV !== 'production' ? 'demo' : '')

export const cloudinaryUploadPreset =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ''

export const isCloudinaryReady = Boolean(
  cloudinaryCloudName && cloudinaryUploadPreset
)
