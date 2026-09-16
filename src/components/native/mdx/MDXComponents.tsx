import ConsCard from '@/components/native/mdx/ConsCard'
import ProsCard from '@/components/native/mdx/ProsCard'
import Step from '@/components/native/mdx/Step'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

type MDXImageProps = {
   alt?: string
   src: string
}

function MDXImage({ alt = '', src }: MDXImageProps) {
   return (
      <div className="my-6 w-full relative h-[400px]">
         <Image
            alt={alt}
            className="mx-auto rounded-lg object-cover"
            src={src}
            fill
            sizes="(min-width: 1000px) 30vw, 50vw"
         />
      </div>
   )
}

type CalloutProps = {
   emoji?: React.ReactNode
   children: React.ReactNode
}

function Callout({ emoji, children }: CalloutProps) {
   return (
      <div className="my-8 flex rounded-lg bg-neutral-200 p-4 dark:bg-neutral-800">
         <div className="mr-4 flex w-4 items-center">{emoji}</div>
         <div className="callout w-full">{children}</div>
      </div>
   )
}

type HeaderProps = {
   title?: string
}

function Header({ title }: HeaderProps) {
   return <>{title ?? 'HEY'}</>
}

const MDXComponents = {
   MDXImage,
   Callout,
   ConsCard,
   ProsCard,
   Step,
   Header,
}

export default MDXComponents