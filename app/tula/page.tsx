import type { Metadata } from "next";
import { ActivityCatalog } from "@/components/ActivityCatalog";

export const metadata: Metadata = {
  title: "Социальные активности в Туле",
  description:
    "Собрали места и встречи, где можно поиграть, потанцевать, погулять, попробовать новое и познакомиться с людьми.",
  openGraph: {
    title: "Социальные активности в Туле",
    description:
      "Собрали места и встречи, где можно поиграть, потанцевать, погулять, попробовать новое и познакомиться с людьми.",
    url: "https://vnedoma.com/tula",
    siteName: "Вне дома",
    locale: "ru_RU",
    type: "website"
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
