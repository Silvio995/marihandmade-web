import type { HomeCarouselSlideContent } from "@/types/homepage";

// Editorial photography only: these assets never supply product/SKU imagery.
export const homepageEditorialContent = {
  carousel: [
    {
      id: "editorial-1",
      imageUrl: "/images/editorial/baby.jpeg",
      altText: "Copertina e cuscini crochet azzurri con piccoli orsetti",
    },
    {
      id: "editorial-2",
      imageUrl: "/images/editorial/borsa.jpeg",
      altText: "Borsa crochet turchese con tracolla a catena",
    },
    {
      id: "editorial-3",
      imageUrl: "/images/editorial/costume2.jpeg",
      altText: "Dettaglio di un costume crochet verde e bianco",
    },
    {
      id: "editorial-4",
      imageUrl: "/images/editorial/costume1.jpeg",
      altText: "Costume crochet bianco indossato in giardino",
    },
    {
      id: "editorial-5",
      imageUrl: "/images/editorial/borsa1.jpeg",
      altText: "Borsa crochet rossa fotografata tra i fiori",
    },
    {
      id: "editorial-6",
      imageUrl: "/images/editorial/baby1.jpeg",
      altText: "Completo baby crochet azzurro con dettagli a forma di orsetto",
    },
  ] satisfies HomeCarouselSlideContent[],
  customCreation: {
    eyebrow: "Creazioni Personalizzate",
    title: "Un dialogo creativo, un pezzo realizzato a mano solo per te.",
    paragraph:
      "Ogni creazione Marì nasce da un'idea, da un dettaglio o da un'emozione. Puoi richiedere una creazione personalizzata scegliendo colori, stile e ispirazione: realizzeremo insieme un pezzo unico, fatto a mano con cura. Ogni progetto può ispirarsi a personaggi, bouquet, bambole, borse, costumi, occasioni speciali o a un regalo pensato su misura.",
    cta: { label: "Inizia la tua creazione", href: "/products" },
    videoTitle: "Video Marì Atelier",
    youtubeVideoId: "7Fmg-cpmcxI",
    videoPlaceholder: {
      badge: "Contenuto Editoriale",
      title: "Video atelier in arrivo",
      subtitle: "Presto potrai guardare il processo creativo Marì Atelier.",
    },
  },
  collections: {
    eyebrow: "Collezioni",
    title: "Esplora l'universo Marì Atelier",
    subtitle:
      "Alcune creazioni sono disponibili all'acquisto, altre restano in vetrina come pezzi unici già realizzati.",
  },
};

// Optional imagery for actual returned categories; these are not category records.
export const collectionEditorialImages: Record<
  string,
  { image: string; alt: string }
> = {
  borse: {
    image: "/images/editorial/borsa1.jpeg",
    alt: "Borsa crochet rossa tra i fiori — fotografia editoriale",
  },
  bambole: {
    image: "/images/editorial/bambola.jpeg",
    alt: "Bambola crochet con abito bianco e dettagli blu — fotografia editoriale",
  },
  costumi: {
    image: "/images/editorial/costume1.jpeg",
    alt: "Costume crochet bianco — fotografia editoriale",
  },
};

export type EditorialLink = {
  label: string;
  href: string;
};

// Official editorial source for storefront home content.
export type EditorialImageItem = {
  src: string;
  alt: string;
  label?: string;
};

export type EditorialCollection = {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  image: string;
  alt: string;
  isFuture?: boolean;
  statusLabel?: string;
};

export const homepageEditorialFooter = {
  labels: {
    navigation: "Navigazione",
    social: "Atelier Online",
  },
  brand: {
    label: "Marì Atelier",
    description:
      "Atelier indipendente di creazioni crochet artigianali: collezioni curate, pezzi unici e progetti personalizzati.",
  },
  navigation: [
    { label: "Catalogo", href: "/products" },
    { label: "Collezioni", href: "/products" },
    { label: "Atelier", href: "/about-us" },
  ] as EditorialLink[],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Termini", href: "/terms" },
  ] as EditorialLink[],
  social: [
    {
      label: "Instagram",
      href: "https://www.instagram.com/maria_firelli?utm_source=qr&igsh=NWVobDJkMHd2dno0",
    },
    {
      label: "Facebook",
      href: "https://www.facebook.com/mariafirelli?rdid=nEVCD2IDZCJP0Bn1&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F17PnH4WYRa%2F#",
    },
    {
      label: "WhatsApp",
      href: "/contact",
    },
    {
      label: "TikTok",
      href: "https://www.tiktok.com/@marihandmadeofficial?_r=1&_t=ZN-94HHmZniBL4",
    },
  ] as EditorialLink[],
} as const;
