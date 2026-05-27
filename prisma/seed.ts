import { PrismaClient, ActivityStatus } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Спорт",
    slug: "sport",
    description: "Секции, тренировки и мягкий старт в активный образ жизни."
  },
  {
    name: "Творчество",
    slug: "creativity",
    description: "Мастер-классы, рисование, керамика и ручные практики."
  },
  {
    name: "Танцы",
    slug: "dance",
    description: "Парные и сольные танцы с любым уровнем подготовки."
  },
  {
    name: "Обучение",
    slug: "education",
    description: "Языки, навыки, курсы и практические занятия."
  },
  {
    name: "Встречи и клубы",
    slug: "clubs",
    description: "Клубы по интересам, игры, прогулки и живое общение."
  },
  {
    name: "Лекции",
    slug: "lectures",
    description: "Городские лекции, культурные встречи и просветительские события."
  }
];

const tags = [
  ["Новичкам", "beginner"],
  ["Можно одному", "solo-friendly"],
  ["Вечером", "evening"],
  ["Выходные", "weekend"],
  ["Спокойный темп", "slow-pace"],
  ["Общение", "communication"],
  ["Практика", "practice"],
  ["Творчество", "creative"]
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
  tagSlugs: string[];
  events?: Array<{
    title: string;
    startsAt: Date;
    endsAt?: Date;
    price?: number;
    seatsAvailable?: number;
  }>;
};

const now = new Date();
const day = 24 * 60 * 60 * 1000;

const activities: SeedActivity[] = [
  {
    title: "Мастер-класс по керамике",
    slug: "keramika-dlya-vzroslyh",
    description:
      "Спокойное занятие в небольшой группе: лепка чашки или тарелки, базовые техники и поддержка мастера на каждом этапе.",
    categorySlug: "creativity",
    organizerName: "Творческая мастерская «Глина и Свет»",
    organizerDescription: "Вымышленная камерная мастерская для творческих занятий взрослых.",
    address: "Тула, ул. Советская, 18",
    priceFrom: 1800,
    priceTo: 2600,
    beginnerFriendly: true,
    canComeAlone: true,
    contactPhone: "+7 4872 00-11-24",
    contactUrl: "https://vnedoma.com/demo/keramika",
    priority: 30,
    isPromoted: true,
    tagSlugs: ["beginner", "solo-friendly", "creative", "weekend"],
    events: [
      {
        title: "Керамика: первая чашка",
        startsAt: new Date(now.getTime() + 3 * day),
        endsAt: new Date(now.getTime() + 3 * day + 2 * 60 * 60 * 1000),
        price: 2200,
        seatsAvailable: 6
      }
    ]
  },
  {
    title: "Разговорный английский клуб",
    slug: "razgovornyy-angliyskiy-klub",
    description:
      "Еженедельные встречи для практики разговорного английского без школьного напряжения: темы, мини-игры и общение.",
    categorySlug: "education",
    organizerName: "Клуб языковой практики «Открытая речь»",
    organizerDescription: "Вымышленный клуб для тех, кому нужна живая языковая практика.",
    address: "Тула, пр-т Ленина, 54",
    priceFrom: 600,
    beginnerFriendly: true,
    canComeAlone: true,
    contactPhone: "+7 4872 00-21-45",
    priority: 25,
    tagSlugs: ["beginner", "solo-friendly", "evening", "communication"]
  },
  {
    title: "Йога для начинающих",
    slug: "yoga-dlya-nachinayushchih",
    description:
      "Мягкая практика без сложных асан: дыхание, растяжка, базовая техника и комфортный темп для первого знакомства с йогой.",
    categorySlug: "sport",
    organizerName: "Студия движения «Ровное дыхание»",
    organizerDescription: "Вымышленная студия спокойных тренировок и групповых практик.",
    address: "Тула, ул. Демонстрации, 9",
    priceFrom: 500,
    priceTo: 900,
    beginnerFriendly: true,
    canComeAlone: true,
    contactPhone: "+7 4872 00-32-10",
    priority: 24,
    tagSlugs: ["beginner", "solo-friendly", "slow-pace"]
  },
  {
    title: "Бачата с нуля",
    slug: "bachata-s-nulya",
    description:
      "Парные танцы без опыта. Партнер не обязателен: на занятиях работает смена пар и простая структура урока.",
    categorySlug: "dance",
    organizerName: "Танцевальное пространство «Шаг ближе»",
    organizerDescription: "Вымышленная танцевальная школа с открытыми группами.",
    address: "Тула, ул. Фрунзе, 7",
    priceFrom: 700,
    priceTo: 1200,
    beginnerFriendly: true,
    canComeAlone: true,
    contactUrl: "https://vnedoma.com/demo/bachata",
    priority: 23,
    tagSlugs: ["beginner", "solo-friendly", "evening", "communication"]
  },
  {
    title: "Книжный клуб современной прозы",
    slug: "knizhnyy-klub-sovremennoy-prozy",
    description:
      "Встречи раз в две недели: читаем современную прозу, обсуждаем без снобизма и выбираем следующую книгу вместе.",
    categorySlug: "clubs",
    organizerName: "Городской клуб «После главы»",
    organizerDescription: "Вымышленное сообщество для спокойных книжных встреч.",
    address: "Тула, ул. Тургеневская, 12",
    priceFrom: 300,
    beginnerFriendly: true,
    canComeAlone: true,
    contactPhone: "+7 4872 00-43-90",
    priority: 20,
    tagSlugs: ["solo-friendly", "communication", "slow-pace"]
  },
  {
    title: "Лекция по истории Тулы",
    slug: "lekciya-po-istorii-tuly",
    description:
      "Открытая лекция о городских легендах, старых улицах и том, как менялась Тула в XX веке.",
    categorySlug: "lectures",
    organizerName: "Лекторий «Городские сюжеты»",
    organizerDescription: "Вымышленный лекторий о культуре, истории и городской среде.",
    address: "Тула, ул. Менделеевская, 6",
    isFree: true,
    beginnerFriendly: true,
    canComeAlone: true,
    contactUrl: "https://vnedoma.com/demo/tula-history",
    priority: 22,
    tagSlugs: ["solo-friendly", "weekend"]
  },
  {
    title: "Настольные игры",
    slug: "nastolnye-igry-dlya-vzroslyh",
    description:
      "Вечер современных настольных игр: ведущий объясняет правила, помогает подобрать игру и собрать компанию.",
    categorySlug: "clubs",
    organizerName: "Клуб настольных встреч «Ход»",
    organizerDescription: "Вымышленный клуб настольных игр и дружеских встреч.",
    address: "Тула, ул. Пирогова, 14",
    priceFrom: 400,
    beginnerFriendly: true,
    canComeAlone: true,
    contactPhone: "+7 4872 00-50-77",
    priority: 19,
    tagSlugs: ["beginner", "solo-friendly", "evening", "communication"]
  },
  {
    title: "Рисование акрилом",
    slug: "risovanie-akrilom",
    description:
      "Практический мастер-класс по акриловой живописи: композиция, цвет, фактуры и готовая работа к концу занятия.",
    categorySlug: "creativity",
    organizerName: "Арт-студия «Палитра рядом»",
    organizerDescription: "Вымышленная студия рисования и творческих практик.",
    address: "Тула, Красноармейский пр-т, 23",
    priceFrom: 1500,
    priceTo: 2300,
    beginnerFriendly: true,
    canComeAlone: true,
    contactUrl: "https://vnedoma.com/demo/acrylic",
    priority: 18,
    tagSlugs: ["beginner", "solo-friendly", "creative"]
  },
  {
    title: "Бокс для начинающих",
    slug: "boks-dlya-nachinayushchih",
    description:
      "Тренировки с нуля: стойка, базовые удары, координация и общая физическая подготовка без давления.",
    categorySlug: "sport",
    organizerName: "Спортивный зал «Первый раунд»",
    organizerDescription: "Вымышленный зал групповых тренировок.",
    address: "Тула, ул. Кауля, 11",
    priceFrom: 800,
    priceTo: 1400,
    beginnerFriendly: true,
    canComeAlone: true,
    contactPhone: "+7 4872 00-64-18",
    priority: 17,
    tagSlugs: ["beginner", "solo-friendly", "practice"]
  },
  {
    title: "Клуб прогулок по городу",
    slug: "klub-progulok-po-gorodu",
    description:
      "Неспешные прогулки по районам Тулы с разговорами об архитектуре, привычках города и любимых маршрутах участников.",
    categorySlug: "clubs",
    organizerName: "Сообщество «Тула пешком»",
    organizerDescription: "Вымышленное городское сообщество для прогулок и новых знакомств.",
    address: "Тула, сбор у площади Ленина",
    isFree: true,
    beginnerFriendly: true,
    canComeAlone: true,
    contactUrl: "https://vnedoma.com/demo/walks",
    priority: 21,
    tagSlugs: ["solo-friendly", "weekend", "slow-pace", "communication"]
  },
  {
    title: "Фотопрогулка для новичков",
    slug: "fotoprogulka-dlya-novichkov",
    description:
      "Двухчасовая прогулка с практикой кадра, света и городских деталей. Подойдет для телефона или простой камеры.",
    categorySlug: "education",
    organizerName: "Фотошкола «Кадр в городе»",
    organizerDescription: "Вымышленная фотошкола коротких практических занятий.",
    address: "Тула, Казанская набережная",
    priceFrom: 900,
    beginnerFriendly: true,
    canComeAlone: true,
    contactPhone: "+7 4872 00-75-30",
    priority: 15,
    tagSlugs: ["beginner", "solo-friendly", "practice", "weekend"]
  },
  {
    title: "Сальса open level",
    slug: "salsa-open-level",
    description:
      "Динамичное танцевальное занятие: базовые шаги, музыкальность и простые связки в дружелюбной группе.",
    categorySlug: "dance",
    organizerName: "Танцевальная студия «Ритм улиц»",
    organizerDescription: "Вымышленная студия социальных танцев.",
    address: "Тула, ул. Октябрьская, 31",
    priceFrom: 700,
    beginnerFriendly: true,
    canComeAlone: true,
    contactUrl: "https://vnedoma.com/demo/salsa",
    priority: 14,
    tagSlugs: ["beginner", "solo-friendly", "evening"]
  },
  {
    title: "Лекторий о личных финансах",
    slug: "lektoriy-o-lichnyh-finansah",
    description:
      "Понятная встреча о бюджете, финансовых целях и привычках без сложных терминов и инвестиционных обещаний.",
    categorySlug: "lectures",
    organizerName: "Лекторий «Практичный вечер»",
    organizerDescription: "Вымышленная площадка прикладных лекций.",
    address: "Тула, ул. Болдина, 98",
    priceFrom: 500,
    beginnerFriendly: true,
    canComeAlone: true,
    contactPhone: "+7 4872 00-86-02",
    priority: 13,
    tagSlugs: ["beginner", "solo-friendly", "evening"]
  }
];

async function main() {
  const city = await prisma.city.upsert({
    where: { slug: "tula" },
    update: { name: "Тула" },
    create: { name: "Тула", slug: "tula" }
  });

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category
    });
  }

  for (const [name, slug] of tags) {
    await prisma.tag.upsert({
      where: { slug },
      update: { name },
      create: { name, slug }
    });
  }

  for (const activity of activities) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: activity.categorySlug }
    });

    const organizer = await prisma.organizer.upsert({
      where: {
        name_cityId: {
          name: activity.organizerName,
          cityId: city.id
        }
      },
      update: {
        description: activity.organizerDescription,
        address: activity.address,
        phone: activity.contactPhone,
        websiteUrl: activity.contactUrl
      },
      create: {
        name: activity.organizerName,
        description: activity.organizerDescription,
        address: activity.address,
        cityId: city.id,
        phone: activity.contactPhone,
        websiteUrl: activity.contactUrl
      }
    });

    await prisma.activity.upsert({
      where: { slug: activity.slug },
      update: {
        title: activity.title,
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
        status: ActivityStatus.published,
        isPromoted: activity.isPromoted ?? false,
        promotedUntil: activity.isPromoted ? new Date(now.getTime() + 30 * day) : null,
        priority: activity.priority ?? 0,
        tags: {
          deleteMany: {},
          create: activity.tagSlugs.map((slug) => ({
            tag: { connect: { slug } }
          }))
        },
        events: {
          deleteMany: {},
          create: activity.events ?? []
        }
      },
      create: {
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
        status: ActivityStatus.published,
        isPromoted: activity.isPromoted ?? false,
        promotedUntil: activity.isPromoted ? new Date(now.getTime() + 30 * day) : null,
        priority: activity.priority ?? 0,
        tags: {
          create: activity.tagSlugs.map((slug) => ({
            tag: { connect: { slug } }
          }))
        },
        events: {
          create: activity.events ?? []
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
