import type { Metadata } from "next";
import { ActivityCatalog } from "@/components/ActivityCatalog";

export const metadata: Metadata = {
  title: "Кружки и занятия в Туле",
  description: "Найдите секции, мастер-классы, лекции, клубы и хобби в Туле.",
  openGraph: {
    title: "Кружки и занятия в Туле",
    description: "Найдите секции, мастер-классы, лекции, клубы и хобби в Туле.",
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
      heading="Кружки и занятия в Туле"
      description="Секции, мастер-классы, лекции, клубы и хобби, куда можно прийти после работы, в выходные или просто в свободный вечер."
    />
  );
}
