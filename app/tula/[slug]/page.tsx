import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActivityCatalog } from "@/components/ActivityCatalog";
import { getTulaSeoPage, tulaSeoPages } from "@/lib/seo-pages";

type TulaSeoPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return tulaSeoPages.map((page) => ({
    slug: page.slug
  }));
}

export async function generateMetadata({
  params
}: TulaSeoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getTulaSeoPage(slug);

  if (!page) {
    return {
      title: "Страница не найдена"
    };
  }

  return {
    title: page.title,
    description: page.description,
    openGraph: {
      title: page.title,
      description: page.description,
      url: `https://vnedoma.com/tula/${page.slug}`,
      siteName: "Вне дома",
      locale: "ru_RU",
      type: "website"
    }
  };
}

export default async function TulaSeoPage({ params, searchParams }: TulaSeoPageProps) {
  const { slug } = await params;
  const page = getTulaSeoPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <ActivityCatalog
      searchParams={searchParams ? await searchParams : {}}
      heading={page.heading}
      description={page.description}
      fixedFilters={page.filters}
      showCategoryFilter={false}
    />
  );
}
