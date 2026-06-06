import type { Metadata } from "next";
import { ActivityCatalog } from "@/components/ActivityCatalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Куда сходить и чем заняться в Туле",
  description:
    "Каталог активностей в Туле: игры, танцы, прогулки, мастер-классы, клубы и встречи, куда можно прийти одному или с компанией.",
  alternates: {
    canonical: "/tula"
  },
  openGraph: {
    title: "Куда сходить и чем заняться в Туле",
    description:
      "Каталог активностей в Туле: игры, танцы, прогулки, мастер-классы, клубы и встречи, куда можно прийти одному или с компанией.",
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
      heading="Куда сходить и чем заняться в Туле"
      description="Собрали места и встречи, где можно поиграть, потанцевать, погулять, попробовать новое и познакомиться с людьми."
      seoBlock={{
        title: "Как выбрать активность в Туле",
        paragraphs: [
          "Влюди помогает найти не просто мероприятие, а понятный сценарий для вечера, выходного или нового круга общения. В каталоге есть игры, танцы, прогулки, мастер-классы, клубы, волонтёрство и выездные форматы рядом с Тулой.",
          "Если вы идёте один, смотрите подборки “Можно одному” и “Новичкам”. Если хочется сэкономить, начните с бесплатных активностей. Для свободного дня подойдут прогулки, выезды и форматы на выходные.",
          "Информация на сайте носит справочный характер: расписание, стоимость, свободные места и условия участия лучше уточнять у организаторов перед посещением."
        ],
        links: [
          { label: "Бесплатные активности", href: "/tula/besplatno" },
          { label: "Можно одному", href: "/tula/mozhno-odnomu" },
          { label: "Для новичков", href: "/tula/dlya-novichkov" },
          { label: "На выходные", href: "/tula/chem-zanyatsya-v-vyhodnye" },
          { label: "Где познакомиться", href: "/tula/gde-poznakomitsya" }
        ]
      }}
    />
  );
}
