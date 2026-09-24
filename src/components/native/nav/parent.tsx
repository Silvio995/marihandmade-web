"use client";
import { UserNav } from "./user";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useCartContext } from "@/state/Cart";
import { Container } from "@/components/storefront/layout";

export default function Header({
  categories = [],
}: {
  categories?: Array<{ title: string; slug: string }>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const { cart } = useCartContext();
  const count = (cart?.items ?? []).reduce((sum, item) => sum + item.count, 0);
  const links = [
    { title: "Home", href: "/" },
    ...categories.map((c) => ({
      title: c.title,
      href: `/categories/${encodeURIComponent(c.slug)}`,
    })),
  ];
  const navigation = links.map((link) => (
    <Link
      key={link.href}
      href={link.href}
      onClick={() => setOpen(false)}
      aria-current={pathname === link.href ? "page" : undefined}
      className={`shop-nav-link border-b-2 px-1 py-4 text-sm transition-colors hover:text-shop-brown ${pathname === link.href ? "border-shop-brown font-semibold" : "border-transparent"}`}
    >
      {link.title}
    </Link>
  ));
  return (
    <header
      className="shop-header relative z-30 border-b border-shop-line bg-shop-paper text-shop-ink"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <div className="bg-shop-sand text-shop-muted">
        <Container className="flex min-h-8 items-center justify-center gap-6 py-1 text-xs sm:justify-between">
          <p>Marì Atelier · Il valore del fatto a mano</p>
          <Link
            href="/contact"
            className="hidden underline-offset-4 hover:underline sm:block"
          >
            Parliamone insieme
          </Link>
        </Container>
      </div>
      <Container className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-4 py-5 lg:grid-cols-[180px_minmax(0,1fr)_auto] lg:py-7">
        <Link href="/" aria-label="MariHandmade — Home" className="w-fit">
          <Image
            src="/brand/logo.svg"
            alt="MariHandmade"
            width={150}
            height={62}
            priority
            className="h-12 w-28 object-contain sm:h-16 sm:w-36"
          />
        </Link>
        <form
          action="/products"
          role="search"
          className="shop-search col-span-2 row-start-2 flex min-w-0 items-center border border-shop-line bg-white lg:col-span-1 lg:col-start-2 lg:row-start-1"
        >
          <label htmlFor="catalog-search" className="sr-only">
            Cerca nel catalogo
          </label>
          <input
            id="catalog-search"
            type="search"
            name="q"
            placeholder="Cerca una creazione…"
            className="h-12 min-w-0 flex-1 bg-transparent px-4 text-sm outline-offset-[-2px]"
          />
          <button
            type="submit"
            aria-label="Cerca"
            className="flex h-12 w-12 shrink-0 items-center justify-center text-shop-brown"
          >
            <Search size={21} />
          </button>
        </form>
        <div className="flex items-center gap-1 sm:gap-4">
          {[
            { href: "/profile/edit", label: "Account", Icon: UserRound },
            { href: "/wishlist", label: "Wishlist", Icon: Heart },
            { href: "/cart", label: "Carrello", Icon: ShoppingBag },
          ].map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="shop-header-action relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 text-shop-ink hover:text-shop-brown"
            >
              <Icon size={22} strokeWidth={1.5} />
              <span className="hidden text-xs lg:block">{label}</span>
              {href === "/cart" && count > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-shop-brown px-1.5 text-xs text-white">
                  {count}
                  <span className="sr-only"> articoli</span>
                </span>
              )}
            </Link>
          ))}
          <UserNav />
          <button
            ref={trigger}
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Chiudi menu" : "Apri menu"}
            className="flex h-11 w-11 items-center justify-center lg:hidden"
          >
            {open ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </Container>
      <div className="border-t border-shop-line">
        <Container>
          <nav
            aria-label="Categorie"
            className="hidden flex-wrap gap-x-10 lg:flex"
          >
            {navigation}
          </nav>
          <nav
            id="mobile-navigation"
            aria-label="Categorie mobile"
            hidden={!open}
            className="lg:hidden"
          >
            <div className="flex flex-col pb-3">{navigation}</div>
          </nav>
        </Container>
      </div>
    </header>
  );
}
