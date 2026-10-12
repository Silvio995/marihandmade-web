import { homepageEditorialFooter } from "@/data/homepage-editorial";
import type { CategoryDto } from "@/lib/api/contracts";
import Link from "next/link";
import { Facebook, Instagram, MessageCircle, Music2 } from "lucide-react";
const socialIcons = {
  Instagram,
  Facebook,
  WhatsApp: MessageCircle,
  TikTok: Music2,
};
export default function Footer({
  categories = [],
}: {
  categories?: CategoryDto[];
}) {
  const content = homepageEditorialFooter;
  const navigation = [
    { label: "Catalogo", href: "/products" },
    { label: "Atelier", href: "/about-us" },
    { label: "Contatti", href: "/contact" },
    { label: "Il mio account", href: "/profile/edit" },
    ...categories.map((category) => ({
      label: category.title,
      href: `/categories/${encodeURIComponent(category.slug)}`,
    })),
  ];
  return (
    <footer className="atelier-footer">
      <div className="atelier-footer-inner">
        <div className="atelier-footer-grid">
          <div className="space-y-4">
            <Link
              href="/"
              className="atelier-footer-label inline-flex min-h-11 items-center"
            >
              {content.brand.label}
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-[#4f4035]">
              {content.brand.description}
            </p>
          </div>
          <nav aria-label="Navigazione footer" className="space-y-4">
            <h2 className="atelier-footer-label">
              {content.labels.navigation}
            </h2>
            <ul className="space-y-2 text-sm">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="underline-offset-4 hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-4">
            <h2 className="atelier-footer-label">{content.labels.social}</h2>
            <div className="flex flex-wrap gap-3">
              {content.social.map((item) => {
                const Icon =
                  socialIcons[item.label as keyof typeof socialIcons];
                if (!Icon) return null;
                const external = item.href.startsWith("https://");
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    aria-label={
                      external
                        ? `${item.label} (si apre in una nuova scheda)`
                        : "WhatsApp — Contatti"
                    }
                    className="atelier-social"
                  >
                    <Icon size={16} aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
            <nav
              aria-label="Informazioni legali"
              className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.2em] text-[#6f5c4d]"
            >
              {content.legal.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-11 items-center hover:underline"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <p className="atelier-copyright">
          © {new Date().getFullYear()} {content.brand.label}
        </p>
      </div>
    </footer>
  );
}
