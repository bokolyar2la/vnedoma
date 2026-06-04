import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActivityCatalog } from "@/components/ActivityCatalog";
import { getTulaSeoPage, tulaSeoPages } from "@/lib/seo-pages";

export const dynamic = "force-dynamic";

type TulaSeoPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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
    alternates: {
      canonical: `/tula/${page.slug}`
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `https://vlyudi.ru/tula/${page.slug}`,
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
}

export default async function TulaSeoPage({ params, searchParams }: TulaSeoPageProps) {
  const { slug } = await params;
  const page = getTulaSeoPage(slug);

  if (!page) {
    notFound();
  }
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      <ActivityCatalog
        searchParams={searchParams ? await searchParams : {}}
        heading={page.heading}
        description={page.description}
        fixedFilters={page.filters}
        showCategoryFilter={false}
        basePath={`/tula/${page.slug}`}
      />

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[30px] border border-city-line bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
              Полезно знать
            </p>
            <h2 className="mt-3 text-2xl font-bold text-city-ink">{page.seoTitle}</h2>
            <p className="mt-4 leading-8 text-city-muted">{page.seoText}</p>
          </article>

          <article className="rounded-[30px] border border-city-line bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-bold text-city-ink">Вопросы перед посещением</h2>
            <div className="mt-5 space-y-4">
              {page.faq.map((item) => (
                <div key={item.question}>
                  <h3 className="font-semibold text-city-ink">{item.question}</h3>
                  <p className="mt-2 leading-7 text-city-muted">{item.answer}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
