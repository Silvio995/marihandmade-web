"use client";
import { UserNav } from "./user";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useCartContext } from "@/state/Cart";

export default function Header({
  categories = [],
}: {
  categories?: Array<{ title: string; slug: string }>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const { cart } = useCartContext();
  const count = (cart?.items ?? []).reduce((sum, item) => sum + item.count, 0);
  const links = [
    { title: "Home", href: "/" },
    { title: "Catalogo", href: "/products" },
    { title: "Contatti", href: "/contact" },
  ];
  const navigation = links.map((link) => (
    <Link
      key={link.href}
      href={link.href}
      onClick={() => setOpen(false)}
      aria-current={pathname === link.href ? "page" : undefined}
      className="atelier-nav-link"
    >
      {link.title}
    </Link>
  ));
  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    trigger.current = event.currentTarget;
    setOpen(!open);
  }
  return (
    <header
      className="shop-header atelier-header"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <div className="atelier-header-row">
        <Link
          href="/"
          aria-label="MariHandmade — Home"
          className="atelier-header-logo"
        >
          <Image
            src="/brand/logo.svg"
            alt="MariHandmade"
            width={110}
            height={56}
            priority
            className="h-14 w-full object-contain"
          />
        </Link>
        <nav
          aria-label="Navigazione principale"
          className="hidden items-center gap-3 lg:flex"
        >
          {navigation}
        </nav>
        <div className="atelier-header-actions">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls="storefront-navigation"
            aria-label={
              open
                ? "Chiudi ricerca e collezioni"
                : "Cerca e sfoglia il catalogo"
            }
            className="atelier-header-icon hidden lg:inline-flex"
          >
            <Search size={20} aria-hidden="true" />
          </button>
          {[
            { href: "/profile/edit", label: "Account", Icon: UserRound },
            { href: "/wishlist", label: "Wishlist", Icon: Heart },
            { href: "/cart", label: "Carrello", Icon: ShoppingBag },
          ].map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={pathname === href ? "page" : undefined}
              className="atelier-header-icon relative"
            >
              <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
              {href === "/cart" && count > 0 && (
                <span className="atelier-cart-count">
                  {count}
                  <span className="sr-only"> articoli</span>
                </span>
              )}
            </Link>
          ))}
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls="storefront-navigation"
            aria-label={open ? "Chiudi menu" : "Apri menu"}
            className="atelier-header-icon lg:hidden"
          >
            {open ? (
              <X size={22} aria-hidden="true" />
            ) : (
              <Menu size={22} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      <div
        id="storefront-navigation"
        hidden={!open}
        className="atelier-header-panel"
      >
        <div className="atelier-header-panel-inner">
          <nav
            aria-label="Navigazione mobile"
            className="flex flex-col lg:hidden"
          >
            {navigation}
          </nav>
          <form
            action="/products"
            method="get"
            role="search"
            className="atelier-search"
          >
            <label htmlFor="catalog-search" className="sr-only">
              Cerca nel catalogo
            </label>
            <input
              id="catalog-search"
              type="search"
              name="q"
              placeholder="Cerca una creazione…"
            />
            <button
              type="submit"
              aria-label="Cerca"
              className="atelier-header-icon"
            >
              <Search size={20} aria-hidden="true" />
            </button>
          </form>
          <nav aria-label="Categorie" className="flex flex-wrap gap-x-5">
            {categories.map((category) => {
              const href = `/categories/${encodeURIComponent(category.slug)}`;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className="atelier-nav-link"
                >
                  {category.title}
                </Link>
              );
            })}
          </nav>
          <UserNav />
        </div>
      </div>
    </header>
  );
}
