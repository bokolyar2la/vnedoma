export const currentCategories = [
  {
    name: "Игры и клубы",
    slug: "igry-i-kluby",
    description: "Квизы, настольные игры, мафия, НРИ и клубные встречи."
  },
  {
    name: "Танцы",
    slug: "tancy",
    description: "Социальные танцы, открытые уроки и танцевальные встречи."
  },
  {
    name: "Спорт и прогулки",
    slug: "sport-i-progulki",
    description: "Бег, вело, походы, SUP, прогулки и групповой спорт."
  },
  {
    name: "Творчество",
    slug: "tvorchestvo",
    description: "Мастер-классы, арт-вечера, керамика, свечи и творческие практики."
  },
  {
    name: "Кулинария",
    slug: "kulinariya",
    description: "Кулинарные мастер-классы, гастро-вечера и совместная готовка."
  },
  {
    name: "Практики и здоровье",
    slug: "praktiki-i-zdorove",
    description: "Йога, медитации, телесные практики и мягкие форматы для восстановления."
  },
  {
    name: "Книги и общение",
    slug: "knigi-i-obshchenie",
    description: "Книжные клубы, обсуждения, лекции, встречи и разговорные форматы."
  },
  {
    name: "Волонтёрство",
    slug: "volonterstvo",
    description: "Добровольческие проекты, помощь людям, животным и городские инициативы."
  },
  {
    name: "Театр и сцена",
    slug: "teatr-i-scena",
    description: "Стендап, театр, открытые микрофоны, квартирники и сценические форматы."
  },
  {
    name: "Выезды и приключения",
    slug: "vyezdy-i-priklyucheniya",
    description: "Походы, лагеря для взрослых, выезды на выходные и приключения в области."
  }
] as const;

export const currentCategorySlugs: string[] = currentCategories.map((category) => category.slug);

export const legacyCategorySlugMap: Record<string, string> = {
  clubs: "igry-i-kluby",
  lectures: "knigi-i-obshchenie",
  education: "knigi-i-obshchenie",
  sport: "sport-i-progulki",
  dance: "tancy",
  creativity: "tvorchestvo"
};
