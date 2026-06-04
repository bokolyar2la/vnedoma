import { ActivityStatus, PrismaClient } from "@prisma/client";
import { currentCategories } from "../lib/categories";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Игры и клубы",
    slug: "igry-i-kluby",
    description: "Настольные игры, квизы, клубы по интересам и дружеские встречи."
  },
  {
    name: "Танцы",
    slug: "tancy",
    description: "Социальные танцы, открытые уроки и вечеринки, куда можно прийти без пары."
  },
  {
    name: "Спорт и прогулки",
    slug: "sport-i-progulki",
    description: "Тренировки, городские прогулки и активные форматы в компании."
  },
  {
    name: "Творчество",
    slug: "tvorchestvo",
    description: "Керамика, рисование, ремесла и мастер-классы в небольших группах."
  },
  {
    name: "Кулинария",
    slug: "kulinariya",
    description: "Кулинарные мастер-классы, дегустации и встречи за общим столом."
  },
  {
    name: "Практики и здоровье",
    slug: "praktiki-i-zdorove",
    description: "Йога, мягкие практики, забота о себе и спокойные групповые занятия."
  },
  {
    name: "Книги и общение",
    slug: "knigi-i-obshchenie",
    description: "Книжные клубы, разговорные встречи и форматы для живого общения."
  },
  {
    name: "Волонтёрство",
    slug: "volonterstvo",
    description: "Добрые дела, городские инициативы и волонтёрские команды."
  },
  {
    name: "Театр и сцена",
    slug: "teatr-i-scena",
    description: "Импровизация, сценическая речь, открытые репетиции и театральные клубы."
  },
  {
    name: "Выезды и приключения",
    slug: "vyezdy-i-priklyucheniya",
    description: "Походы, поездки выходного дня и приключения в Тульской области."
  }
];

const tags = [
  ["Новичкам", "beginner"],
  ["Можно одному", "solo-friendly"],
  ["Вечером", "evening"],
  ["Выходные", "weekend"],
  ["Много общения", "social"],
  ["Спокойный темп", "slow-pace"],
  ["Выезд", "trip"],
  ["Бесплатно", "free"]
] as const;

type SeedActivity = {
  title: string;
  slug: string;
  description: string;
  categorySlug: string;
  organizerName: string;
  organizerDescription: string;
  address: string;
  priceFrom?: number;
  priceTo?: number;
  isFree?: boolean;
  beginnerFriendly?: boolean;
  canComeAlone?: boolean;
  contactPhone?: string;
  contactUrl?: string;
  priority?: number;
  isPromoted?: boolean;
  activityType: string;
  socialLevel: string;
  needsCheck?: boolean;
  editorComment?: string;
  tagSlugs: string[];
};

const activities: SeedActivity[] = [
  {
    title: "Вечер настольных игр",
    slug: "vecher-nastolnyh-igr",
    description:
      "Ведущий помогает выбрать игру, объясняет правила и собирает компании за столами. Хороший формат, если хочется прийти одному и быстро включиться в общение.",
    categorySlug: "igry-i-kluby",
    organizerName: "Клуб настольных встреч «Ход»",
    organizerDescription: "Вымышленный клуб дружеских игровых встреч в Туле.",
    address: "Тула, ул. Пирогова, 14",
    priceFrom: 400,
    beginnerFriendly: true,
    canComeAlone: true,
    contactPhone: "+7 4872 00-50-77",
    priority: 40,
    isPromoted: true,
    activityType: "регулярная встреча",
    socialLevel: "высокая",
    tagSlugs: ["beginner", "solo-friendly", "evening", "social"]
  },
  {
    title: "Бачата с нуля без пары",
    slug: "bachata-s-nulya-bez-pary",
    description:
      "Открытая группа по бачате: партнер не нужен, пары меняются по кругу, а преподаватель держит дружелюбный темп для новичков.",
    categorySlug: "tancy",
    organizerName: "Танцевальное пространство «Шаг ближе»",
    organizerDescription: "Вымышленная студия социальных танцев.",
    address: "Тула, ул. Фрунзе, 7",
    priceFrom: 700,
    priceTo: 1200,
    beginnerFriendly: true,
    canComeAlone: true,
    contactUrl: "https://vlyudi.ru/demo/bachata",
    priority: 36,
    activityType: "постоянная активность",
    socialLevel: "высокая",
    tagSlugs: ["beginner", "solo-friendly", "evening", "social"]
  },
  {
    title: "Клуб прогулок по городу",
    slug: "klub-progulok-po-gorodu",
    description:
      "Неспешные прогулки по районам Тулы с разговорами об архитектуре, привычках города и любимых маршрутах участников.",
    categorySlug: "sport-i-progulki",
    organizerName: "Сообщество «Тула пешком»",
    organizerDescription: "Вымышленное городское сообщество для прогулок и новых знакомств.",
    address: "Тула, сбор у площади Ленина",
    isFree: true,
    beginnerFriendly: true,
    canComeAlone: true,
    contactUrl: "https://vlyudi.ru/demo/walks",
    priority: 35,
    activityType: "регулярная встреча",
    socialLevel: "высокая",
    tagSlugs: ["solo-friendly", "weekend", "slow-pace", "social", "free"]
  },
  {
    title: "Мастер-класс по керамике",
    slug: "master-klass-po-keramike",
    description:
      "Небольшая группа, лепка чашки или тарелки, общая рабочая атмосфера и поддержка мастера на каждом этапе.",
    categorySlug: "tvorchestvo",
    organizerName: "Творческая мастерская «Глина и Свет»",
    organizerDescription: "Вымышленная камерная мастерская для творческих занятий.",
    address: "Тула, ул. Советская, 18",
    priceFrom: 1800,
    priceTo: 2600,
    beginnerFriendly: true,
    canComeAlone: true,
    contactPhone: "+7 4872 00-11-24",
    priority: 32,
    isPromoted: true,
    activityType: "разовое событие",
    socialLevel: "средняя",
    tagSlugs: ["beginner", "solo-friendly"]
  },
  {
    title: "Кулинарный вечер пасты",
    slug: "kulinarnyy-vecher-pasty",
    description:
      "Готовим пасту в мини-группе, делимся задачами и ужинаем за общим столом. Подходит для первого знакомства с кулинарными встречами.",
    categorySlug: "kulinariya",
    organizerName: "Кухня встреч «Тёплый стол»",
    organizerDescription: "Вымышленная площадка камерных кулинарных мастер-классов.",
    address: "Тула, ул. Тургеневская, 20",
    priceFrom: 2200,
    priceTo: 3200,
    beginnerFriendly: true,
    canComeAlone: true,
    contactUrl: "https://vlyudi.ru/demo/pasta",
    priority: 30,
    activityType: "разовое событие",
    socialLevel: "высокая",
    tagSlugs: ["beginner", "solo-friendly", "social", "weekend"]
  },
  {
    title: "Йога и чай после практики",
    slug: "yoga-i-chay-posle-praktiki",
    description:
      "Мягкая практика для новичков, а после занятия короткое чаепитие и спокойное общение в группе.",
    categorySlug: "praktiki-i-zdorove",
    organizerName: "Студия движения «Ровное дыхание»",
    organizerDescription: "Вымышленная студия спокойных групповых практик.",
    address: "Тула, ул. Демонстрации, 9",
    priceFrom: 600,
    priceTo: 1000,
    beginnerFriendly: true,
    canComeAlone: true,
    contactPhone: "+7 4872 00-32-10",
    priority: 28,
    activityType: "постоянная активность",
    socialLevel: "средняя",
    tagSlugs: ["beginner", "solo-friendly", "slow-pace"]
  },
  {
    title: "Книжный клуб современной прозы",
    slug: "knizhnyy-klub-sovremennoy-prozy",
    description:
      "Читаем современную прозу, обсуждаем без снобизма и вместе выбираем следующую книгу. Можно прийти, даже если пока никого не знаете.",
    categorySlug: "knigi-i-obshchenie",
    organizerName: "Городской клуб «После главы»",
    organizerDescription: "Вымышленное сообщество для спокойных книжных встреч.",
    address: "Тула, ул. Тургеневская, 12",
    priceFrom: 300,
    beginnerFriendly: true,
    canComeAlone: true,
    contactPhone: "+7 4872 00-43-90",
    priority: 26,
    activityType: "регулярная встреча",
    socialLevel: "высокая",
    tagSlugs: ["solo-friendly", "social", "slow-pace"]
  },
  {
    title: "Волонтёрская уборка берега",
    slug: "volonterskaya-uborka-berega",
    description:
      "Командная городская акция на выходных: выдаются мешки и перчатки, после уборки участники пьют чай и знакомятся.",
    categorySlug: "volonterstvo",
    organizerName: "Инициатива «Чистый берег»",
    organizerDescription: "Вымышленная городская волонтёрская инициатива.",
    address: "Тула, точка сбора уточняется",
    isFree: true,
    beginnerFriendly: true,
    canComeAlone: true,
    contactUrl: "https://vlyudi.ru/demo/clean-bank",
    priority: 24,
    activityType: "разовое событие",
    socialLevel: "высокая",
    needsCheck: true,
    editorComment: "Перед публикацией реальной карточки проверить дату и точку сбора.",
    tagSlugs: ["solo-friendly", "weekend", "social", "free"]
  },
  {
    title: "Импровизация для начинающих",
    slug: "improvizaciya-dlya-nachinayushchih",
    description:
      "Игровые упражнения, сценические миниатюры и безопасная атмосфера для тех, кто хочет попробовать сцену без давления.",
    categorySlug: "teatr-i-scena",
    organizerName: "Театральная лаборатория «Реплика»",
    organizerDescription: "Вымышленная лаборатория сценических практик.",
    address: "Тула, ул. Болдина, 98",
    priceFrom: 900,
    beginnerFriendly: true,
    canComeAlone: true,
    contactPhone: "+7 4872 00-86-02",
    priority: 22,
    activityType: "регулярная встреча",
    socialLevel: "высокая",
    tagSlugs: ["beginner", "solo-friendly", "social"]
  },
  {
    title: "Поездка выходного дня к усадьбам",
    slug: "poezdka-vyhodnogo-dnya-k-usadbam",
    description:
      "Небольшой групповой выезд по Тульской области: прогулка, экскурсионные остановки и время для общения в дороге.",
    categorySlug: "vyezdy-i-priklyucheniya",
    organizerName: "Клуб поездок «За город»",
    organizerDescription: "Вымышленный клуб коротких поездок и маршрутов выходного дня.",
    address: "Тула, сбор у Московского вокзала",
    priceFrom: 1800,
    priceTo: 2800,
    beginnerFriendly: true,
    canComeAlone: true,
    contactUrl: "https://vlyudi.ru/demo/usadby",
    priority: 34,
    activityType: "выездная активность",
    socialLevel: "средняя",
    needsCheck: true,
    editorComment: "Для реальной карточки проверить расписание и транспорт.",
    tagSlugs: ["solo-friendly", "weekend", "trip"]
  }
];

async function main() {
  await prisma.activityTag.deleteMany();
  await prisma.event.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.organizer.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();

  const city = await prisma.city.upsert({
    where: { slug: "tula" },
    update: { name: "Тула" },
    create: { name: "Тула", slug: "tula" }
  });

  for (const category of currentCategories) {
    await prisma.category.create({ data: category });
  }

  for (const [name, slug] of tags) {
    await prisma.tag.create({ data: { name, slug } });
  }

  for (const activity of activities) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: activity.categorySlug }
    });

    const organizer = await prisma.organizer.create({
      data: {
        name: activity.organizerName,
        description: activity.organizerDescription,
        address: activity.address,
        cityId: city.id,
        phone: activity.contactPhone,
        websiteUrl: activity.contactUrl
      }
    });

    await prisma.activity.create({
      data: {
        title: activity.title,
        slug: activity.slug,
        description: activity.description,
        cityId: city.id,
        categoryId: category.id,
        organizerId: organizer.id,
        address: activity.address,
        priceFrom: activity.priceFrom,
        priceTo: activity.priceTo,
        isFree: activity.isFree ?? false,
        isForAdults: true,
        beginnerFriendly: activity.beginnerFriendly ?? false,
        canComeAlone: activity.canComeAlone ?? false,
        contactPhone: activity.contactPhone,
        contactUrl: activity.contactUrl,
        activityType: activity.activityType,
        socialLevel: activity.socialLevel,
        needsCheck: activity.needsCheck ?? false,
        editorComment: activity.editorComment,
        status: ActivityStatus.published,
        isPromoted: activity.isPromoted ?? false,
        priority: activity.priority ?? 0,
        tags: {
          create: activity.tagSlugs.map((slug) => ({
            tag: { connect: { slug } }
          }))
        }
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
