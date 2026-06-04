# Влюди

SEO-first MVP агрегатора социальных офлайн-активностей в Туле: игры, танцы, прогулки, мастер-классы, клубы и встречи, куда можно прийти одному и оказаться среди людей.

Планируемый домен: `vlyudi.ru`.

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

2. Создайте `.env` на основе `.env.example`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tula_activities?schema=public"
ADMIN_USER="admin"
ADMIN_PASSWORD="change-me"
```

3. Примените миграции:

```bash
npx prisma migrate dev
```

4. Синхронизируйте актуальные категории:

```bash
npm run categories:sync
```

5. Заполните базу тестовыми данными:

```bash
npx prisma db seed
```

6. Запустите проект:

```bash
npm run dev
```

После запуска откройте `http://localhost:3000`.

## Админка

Все маршруты `/admin` закрыты Basic Auth через `middleware.ts`.

Логин и пароль задаются в `.env`:

```bash
ADMIN_USER="admin"
ADMIN_PASSWORD="change-me"
```

В development, если переменные не заданы, используется временный доступ `admin/admin`. В production дефолтный пароль не используется: задайте `ADMIN_USER` и `ADMIN_PASSWORD` явно.

## Основные страницы

- `/` — главная страница с поиском, быстрым выбором и подборками социальных активностей.
- `/tula` — каталог опубликованных активностей с поиском и фильтрами.
- `/tula/[slug]` — SEO-страницы категорий и подборок.
- `/activity/[slug]` — детальная страница активности.
- `/add` — публичная форма добавления активности в статусе `draft`.
- `/admin` — временная MVP-админка, закрытая Basic Auth.

## Команды

```bash
npm run dev
npm run typecheck
npm run build
npm run categories:sync
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```
