import type { Metadata } from "next";
import { ActivityCatalog } from "@/components/ActivityCatalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Социальные активности в Туле",
  description:
    "Собрали места и встречи, где можно поиграть, потанцевать, погулять, попробовать новое и познакомиться с людьми.",
  alternates: {
    canonical: "/tula"
  },
  openGraph: {
    title: "Социальные активности в Туле",
    description:
      "Собрали места и встречи, где можно поиграть, потанцевать, погулять, попробовать новое и познакомиться с людьми.",
    url: "https://vlyudi.ru/tula",
    siteName: "Влюди",
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Влюди — социальные активности в Туле"
      }
    ]
  }
};

type TulaPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TulaPage({ searchParams }: TulaPageProps) {
  return (
    <ActivityCatalog
      searchParams={searchParams ? await searchParams : {}}
      heading="Социальные активности в Туле"
      description="Собрали места и встречи, где можно поиграть, потанцевать, погулять, попробовать новое и познакомиться с людьми."
    />
  );
}
