'use client'

import Image from 'next/image'
import Link from 'next/link'
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const components: { title: string; href: string; description: string }[] = [
  { title: 'Alert Dialog', href: '/docs/primitives/alert-dialog', description: 'A modal dialog that interrupts the user with important content.' }
]

export function MainNav() {
  return (
    <div className="hidden md:flex items-center gap-6">
      {/* Logo */}
      <Link href="/" className="relative w-36 h-16 flex-shrink-0">
        <Image
          src="/brand/logo.jpeg"
          alt="Logo"
          fill
          sizes="(min-width: 768px) 144px, 100vw"
          className="object-contain"
          priority
        />
      </Link>

      {/* Menu desktop */}
      <NavMenu />
    </div>
  )
}

export function NavMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
            <Link href="/products">
              <div className="font-normal text-foreground/70">Products</div>
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <div className="font-normal text-foreground/70">Categories</div>
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link
                    href="/"
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                  >
                    <div className="mb-2 mt-4 text-lg font-medium">shadcn/ui</div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Beautifully designed components built with Radix UI and Tailwind CSS.
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>

              <ListItem href="/docs" title="Introduction">
                Re-usable components built using Radix UI and Tailwind CSS.
              </ListItem>
              <ListItem href="/docs/installation" title="Installation">
                How to install dependencies and structure your app.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

type ListItemProps = React.ComponentPropsWithoutRef<'a'> & {
  href: string
}

const ListItem = forwardRef<React.ElementRef<'a'>, ListItemProps>(
  ({ className, title, children, href, ...props }, ref) => (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          ref={ref}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
)

ListItem.displayName = 'ListItem'
