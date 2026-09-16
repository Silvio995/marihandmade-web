'use client'

import { Button } from '@/components/ui/button'
import {
   cloudinaryCloudName,
   cloudinaryUploadPreset,
   isCloudinaryReady,
} from '@/lib/cloudinary'
import { ImagePlus, Trash } from 'lucide-react'
import { CldUploadWidget } from 'next-cloudinary'
import type { CloudinaryUploadWidgetResults } from 'next-cloudinary'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface ImageUploadProps {
   disabled?: boolean
   onChange: (value: string) => void
   onRemove: (value: string) => void
   value: string[]
}

const ImageUpload: React.FC<ImageUploadProps> = ({
   disabled,
   onChange,
   onRemove,
   value,
}) => {
   const [isMounted, setIsMounted] = useState(false)

   useEffect(() => {
      setIsMounted(true)
   }, [])

   const onUpload = (result: CloudinaryUploadWidgetResults) => {
      if (
         result.info &&
         typeof result.info !== 'string' &&
         'secure_url' in result.info &&
         typeof result.info.secure_url === 'string'
      ) {
         onChange(result.info.secure_url)
      }
   }

   if (!isMounted) {
      return null
   }

   if (!isCloudinaryReady) {
      return (
         <p className="text-sm text-muted-foreground">
            Cloudinary non configurato: definire
            NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME e
            NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.
         </p>
      )
   }

   return (
      <div>
         <div className="mb-4 flex items-center gap-4">
            {value.map((url) => (
               <div
                  key={url}
                  className="relative h-[200px] w-[200px] overflow-hidden rounded-md"
               >
                  <div className="absolute right-2 top-2 z-10">
                     <Button
                        type="button"
                        onClick={() => onRemove(url)}
                        variant="destructive"
                        size="sm"
                     >
                        <Trash className="h-4" />
                     </Button>
                  </div>
                  <Image
                     fill
                     sizes="(min-width: 1000px) 30vw, 50vw"
                     className="object-cover"
                     alt="Image"
                     src={url}
                  />
               </div>
            ))}
         </div>

         <CldUploadWidget
            onUpload={onUpload}
            uploadPreset={cloudinaryUploadPreset}
            config={{ cloud: { cloudName: cloudinaryCloudName } }}
         >
            {({ open }) => {
               const onClick = () => {
                  open()
               }

               return (
                  <Button
                     type="button"
                     disabled={disabled}
                     variant="secondary"
                     onClick={onClick}
                  >
                     <ImagePlus className="mr-2 h-4" />
                     Upload an Image
                  </Button>
               )
            }}
         </CldUploadWidget>
      </div>
   )
}

export default ImageUpload
