# Вне дома

SEO-first MVP агрегатора офлайн-активностей в Туле: кружки, секции, мастер-классы, лекции и клубы по интересам.

Планируемый домен: `vnedoma.com`.

## Стек

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM

## Запуск

1. Установите зависимости:

```bash
npm install
```

2. Создайте `.env` на основе `.env.example` и укажите строку подключения:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tula_activities?schema=public"
```

3. Примените миграции:

```bash
npx prisma migrate dev
```

4. Заполните базу тестовыми данными:

```bash
npx prisma db seed
```

5. Запустите проект:

```bash
npm run dev
```

После запуска откройте `http://localhost:3000`.

## Основные страницы

- `/` — главная страница с поиском, категориями, популярными активностями и CTA.
- `/tula` — каталог опубликованных активностей с фильтрами.
- `/tula/[slug]` — SEO-страницы направлений: мастер-классы, спорт, танцы, творчество, лекции, бесплатно, можно одному, для новичков.
- `/activity/[slug]` — детальная страница активности.
- `/add` — публичная форма добавления активности в статусе `draft`.

## Что уже есть

- Prisma schema с моделями `City`, `Category`, `Organizer`, `Activity`, `Event`, `Tag`, `ActivityTag`.
- Enum статусов активности: `draft`, `published`, `archived`.
- Seed для города Тула, 6 категорий и 13 вымышленных активностей.
- SEO metadata для главной, страницы города и страниц активностей.
- `sitemap.ts` и `robots.ts` для индексации.
- Адаптивный светлый интерфейс на Tailwind CSS.
