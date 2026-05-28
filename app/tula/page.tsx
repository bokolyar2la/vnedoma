import type { Metadata } from "next";
import { ActivityCatalog } from "@/components/ActivityCatalog";

export const metadata: Metadata = {
  title: "Занятия и события в Туле",
  description: "Найдите мастер-классы, секции, лекции и клубы по интересам.",
  openGraph: {
    title: "Занятия и события в Туле",
    description: "Найдите мастер-классы, секции, лекции и клубы по интересам.",
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
      heading="Занятия и события в Туле"
      description="Найдите мастер-классы, секции, лекции и клубы по интересам."
    />
  );
}
