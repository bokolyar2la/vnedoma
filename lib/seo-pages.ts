import type { Prisma } from "@prisma/client";

export type TulaSeoPage = {
  slug: string;
  title: string;
  heading: string;
  description: string;
  filters: Prisma.ActivityWhereInput;
};

export const tulaSeoPages: TulaSeoPage[] = [
  {
    slug: "master-klassy",
    title: "Мастер-классы в Туле",
    heading: "Мастер-классы в Туле",
    description: "Творческие и практические мастер-классы в Туле: керамика, рисование и новые навыки.",
    filters: { category: { slug: "creativity" } }
  },
  {
    slug: "sport",
    title: "Спортивные секции и занятия в Туле",
    heading: "Спорт и тренировки в Туле",
    description: "Найдите тренировки, секции и спортивные занятия в Туле.",
    filters: { category: { slug: "sport" } }
  },
  {
    slug: "tancy",
    title: "Танцы в Туле",
    heading: "Танцы в Туле",
    description: "Бачата, сальса и другие танцевальные занятия в Туле.",
    filters: { category: { slug: "dance" } }
  },
  {
    slug: "tvorchestvo",
    title: "Творческие занятия в Туле",
    heading: "Творческие занятия в Туле",
    description: "Рисование, керамика и другие творческие занятия в Туле.",
    filters: { category: { slug: "creativity" } }
  },
  {
    slug: "lekcii",
    title: "Лекции в Туле",
    heading: "Лекции в Туле",
    description: "Городские, культурные и прикладные лекции в Туле.",
    filters: { category: { slug: "lectures" } }
  },
  {
    slug: "besplatno",
    title: "Бесплатные занятия и события в Туле",
    heading: "Бесплатные занятия в Туле",
    description: "Бесплатные лекции, прогулки, клубы и другие активности в Туле.",
    filters: { isFree: true }
  },
  {
    slug: "mozhno-odnomu",
    title: "Куда пойти одному в Туле",
    heading: "Занятия, куда можно прийти одному",
    description: "Активности в Туле, куда комфортно прийти без компании.",
    filters: { canComeAlone: true }
  },
  {
    slug: "dlya-novichkov",
    title: "Занятия для новичков в Туле",
    heading: "Занятия для новичков в Туле",
    description: "Секции, мастер-классы и клубы в Туле, которые подходят для первого раза.",
    filters: { beginnerFriendly: true }
  }
];

export function getTulaSeoPage(slug: string) {
  return tulaSeoPages.find((page) => page.slug === slug);
}
