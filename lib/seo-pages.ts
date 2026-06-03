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
    slug: "besplatno",
    title: "Бесплатные активности в Туле",
    heading: "Бесплатные активности в Туле",
    description:
      "Бесплатные встречи, прогулки, клубы и события в Туле, куда можно прийти одному и познакомиться с людьми.",
    filters: { isFree: true }
  },
  {
    slug: "mozhno-odnomu",
    title: "Куда сходить одному в Туле",
    heading: "Куда сходить одному в Туле",
    description:
      "Активности в Туле, куда комфортно прийти без компании: игры, танцы, прогулки, клубы и мастер-классы.",
    filters: { canComeAlone: true }
  },
  {
    slug: "dlya-novichkov",
    title: "Активности для новичков в Туле",
    heading: "Активности для новичков в Туле",
    description:
      "Встречи, занятия и клубы в Туле, которые подходят для первого раза и не требуют подготовки.",
    filters: { beginnerFriendly: true }
  },
  {
    slug: "igry-i-kluby",
    title: "Игры, квизы и клубы в Туле",
    heading: "Игры и клубы в Туле",
    description:
      "Настольные игры, квизы и клубные встречи в Туле, где легко включиться в компанию и познакомиться с людьми.",
    filters: { category: { slug: "igry-i-kluby" } }
  },
  {
    slug: "tancy",
    title: "Танцы в Туле",
    heading: "Танцы в Туле",
    description:
      "Социальные танцы, открытые уроки и танцевальные встречи в Туле, куда можно прийти одному.",
    filters: { category: { slug: "tancy" } }
  },
  {
    slug: "sport-i-progulki",
    title: "Спорт и прогулки в Туле",
    heading: "Спорт и прогулки в Туле",
    description:
      "Групповые тренировки, прогулки и активные встречи в Туле для тех, кто хочет выйти из дома и быть среди людей.",
    filters: { category: { slug: "sport-i-progulki" } }
  },
  {
    slug: "tvorchestvo",
    title: "Творческие мастер-классы в Туле",
    heading: "Творчество в Туле",
    description:
      "Керамика, рисование, ремесла и творческие встречи в Туле в небольших группах.",
    filters: { category: { slug: "tvorchestvo" } }
  },
  {
    slug: "kulinariya",
    title: "Кулинарные мастер-классы в Туле",
    heading: "Кулинария в Туле",
    description:
      "Кулинарные мастер-классы, дегустации и встречи за общим столом в Туле.",
    filters: { category: { slug: "kulinariya" } }
  },
  {
    slug: "praktiki-i-zdorove",
    title: "Практики и здоровье в Туле",
    heading: "Практики и здоровье в Туле",
    description:
      "Йога, мягкие практики и спокойные групповые занятия в Туле для заботы о себе и новых знакомств.",
    filters: { category: { slug: "praktiki-i-zdorove" } }
  },
  {
    slug: "knigi-i-obshchenie",
    title: "Книжные клубы и общение в Туле",
    heading: "Книги и общение в Туле",
    description:
      "Книжные клубы, разговорные встречи и спокойные форматы общения в Туле.",
    filters: { category: { slug: "knigi-i-obshchenie" } }
  },
  {
    slug: "volonterstvo",
    title: "Волонтёрство в Туле",
    heading: "Волонтёрство в Туле",
    description:
      "Волонтёрские команды, городские инициативы и добрые дела в Туле, где можно познакомиться через совместное действие.",
    filters: { category: { slug: "volonterstvo" } }
  },
  {
    slug: "teatr-i-scena",
    title: "Театр и сцена в Туле",
    heading: "Театр и сцена в Туле",
    description:
      "Импровизация, сценическая речь, театральные клубы и открытые занятия в Туле.",
    filters: { category: { slug: "teatr-i-scena" } }
  },
  {
    slug: "vyezdy-i-priklyucheniya",
    title: "Выезды, походы и приключения в Тульской области",
    heading: "Выезды и приключения в Тульской области",
    description:
      "Поездки выходного дня, выезды, походы и приключения недалеко от Тулы.",
    filters: { category: { slug: "vyezdy-i-priklyucheniya" } }
  },
  {
    slug: "kuda-poiti-odnomu",
    title: "Куда пойти одному в Туле",
    heading: "Куда пойти одному в Туле",
    description:
      "Подборка мест и активностей в Туле, куда можно прийти одному и не чувствовать себя лишним.",
    filters: { canComeAlone: true }
  },
  {
    slug: "chem-zanyatsya-v-vyhodnye",
    title: "Чем заняться в выходные в Туле",
    heading: "Чем заняться в выходные в Туле",
    description:
      "Активности на выходные в Туле и рядом: прогулки, клубы, мастер-классы и выездные форматы.",
    filters: {
      OR: [
        { activityType: "выездная активность" },
        { category: { slug: "vyezdy-i-priklyucheniya" } }
      ]
    }
  },
  {
    slug: "gde-poznakomitsya",
    title: "Где познакомиться с людьми в Туле",
    heading: "Где познакомиться с людьми в Туле",
    description:
      "Социальные активности в Туле с живым общением: игры, танцы, клубы, прогулки и совместные дела.",
    filters: { OR: [{ socialLevel: "высокая" }, { canComeAlone: true }] }
  }
];

export function getTulaSeoPage(slug: string) {
  return tulaSeoPages.find((page) => page.slug === slug);
}
