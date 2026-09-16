import { homepageEditorialFooter } from "@/data/homepage-editorial";
import type { CategoryDto } from "@/lib/api/contracts";
import { Container } from "@/components/storefront/layout";
import Image from "next/image";
import Link from "next/link";
export default function Footer({
  categories = [],
}: {
  categories?: CategoryDto[];
}) {
  const groups = [
    {
      title: "Shop",
      links: categories.map((c) => ({
        label: c.title,
        href: `/categories/${encodeURIComponent(c.slug)}`,
      })),
    },
    {
      title: "Assistenza",
      links: [
        { label: "Aiuto e contatti", href: "/contact" },

        { label: "Il mio account", href: "/profile/edit" },
      ],
    },
    {
      title: "Il mondo Marì",
      links: [
        { label: "La nostra storia", href: "/about-us" },
        { label: "Blog", href: "/blog" },
        { label: "Contatti", href: "/contact" },
      ],
    },
    { title: "Informazioni", links: homepageEditorialFooter.legal },
  ];
  return (
    <footer className="border-t border-shop-line bg-shop-paper text-shop-ink">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_3fr]">
          <div>
            <Link href="/" aria-label="MariHandmade — Home">
              <Image
                src="/brand/logo.svg"
                alt="MariHandmade"
                width={145}
                height={65}
                className="mb-5 h-16 w-36 object-contain"
              />
            </Link>
            <p className="max-w-xs text-sm leading-7 text-shop-muted">
              Un atelier indipendente. Creazioni crochet, idee personali e il
              piacere del fatto a mano.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-3">
              {homepageEditorialFooter.social.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xs underline underline-offset-4"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {groups.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h2 className="mb-5 text-sm font-semibold">{group.title}</h2>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm leading-6 text-shop-muted underline-offset-4 hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-wrap justify-between gap-3 border-t border-shop-line pt-6 text-xs text-shop-muted">
          <p>© {new Date().getFullYear()} MariHandmade</p>
          <p>Creazioni da scegliere, regalare e custodire.</p>
        </div>
      </Container>
    </footer>
  );
}
