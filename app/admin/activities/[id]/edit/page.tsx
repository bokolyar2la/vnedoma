import type { Metadata } from "next";
import Link from "next/link";
import { ActivityStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { updateActivity } from "@/app/admin/activities/actions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Редактировать активность"
};

export const dynamic = "force-dynamic";

type EditActivityPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditActivityPage({ params }: EditActivityPageProps) {
  const { id } = await params;
  const activityId = Number(id);

  if (!Number.isInteger(activityId) || activityId <= 0) {
    notFound();
  }

  const [activity, categories] = await Promise.all([
    prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        category: true,
        organizer: true,
        city: true
      }
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } })
  ]);

  if (!activity) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
            Админка · {activity.city.name}
          </p>
          <h1 className="mt-3 text-3xl font-bold text-city-ink">
            Редактировать активность
          </h1>
        </div>
        <Link href="/admin/activities" className="text-sm font-semibold text-city-green">
          К списку
        </Link>
      </div>

      <form action={updateActivity} className="mt-8 space-y-5 rounded-3xl border border-city-line bg-white p-5 shadow-soft sm:p-6">
        <input type="hidden" name="id" value={activity.id} />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="title" className="text-sm font-semibold text-city-ink">
              Название
            </label>
            <input
              id="title"
              name="title"
              required
              defaultValue={activity.title}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            />
          </div>
          <div>
            <label htmlFor="slug" className="text-sm font-semibold text-city-ink">
              Slug
            </label>
            <input
              id="slug"
              name="slug"
              required
              defaultValue={activity.slug}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="text-sm font-semibold text-city-ink">
            Описание
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={6}
            defaultValue={activity.description}
            className="mt-2 w-full rounded-2xl border border-city-line px-4 py-3 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="categoryId" className="text-sm font-semibold text-city-ink">
              Категория
            </label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={activity.categoryId}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="organizerName" className="text-sm font-semibold text-city-ink">
              Организатор
            </label>
            <input
              id="organizerName"
              name="organizerName"
              defaultValue={activity.organizer.name}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            />
          </div>
          <div>
            <label htmlFor="status" className="text-sm font-semibold text-city-ink">
              Статус
            </label>
            <select
              id="status"
              name="status"
              defaultValue={activity.status}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            >
              <option value={ActivityStatus.draft}>draft</option>
              <option value={ActivityStatus.published}>published</option>
              <option value={ActivityStatus.archived}>archived</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="address" className="text-sm font-semibold text-city-ink">
            Адрес
          </label>
          <input
            id="address"
            name="address"
            defaultValue={activity.address}
            className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="priceFrom" className="text-sm font-semibold text-city-ink">
              Цена от
            </label>
            <input
              id="priceFrom"
              name="priceFrom"
              type="number"
              min="0"
              defaultValue={activity.priceFrom ?? ""}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            />
          </div>
          <div>
            <label htmlFor="priceTo" className="text-sm font-semibold text-city-ink">
              Цена до
            </label>
            <input
              id="priceTo"
              name="priceTo"
              type="number"
              min="0"
              defaultValue={activity.priceTo ?? ""}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            />
          </div>
        </div>

        <div className="grid gap-3 text-sm text-city-muted sm:grid-cols-4">
          <label className="flex items-center gap-2">
            <input name="isFree" type="checkbox" defaultChecked={activity.isFree} className="h-4 w-4 accent-city-green" />
            Бесплатно
          </label>
          <label className="flex items-center gap-2">
            <input name="beginnerFriendly" type="checkbox" defaultChecked={activity.beginnerFriendly} className="h-4 w-4 accent-city-green" />
            Новичкам
          </label>
          <label className="flex items-center gap-2">
            <input name="canComeAlone" type="checkbox" defaultChecked={activity.canComeAlone} className="h-4 w-4 accent-city-green" />
            Можно одному
          </label>
          <label className="flex items-center gap-2">
            <input name="isVerified" type="checkbox" defaultChecked={activity.isVerified} className="h-4 w-4 accent-city-green" />
            Проверено
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contactPhone" className="text-sm font-semibold text-city-ink">
              Телефон
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              defaultValue={activity.contactPhone ?? ""}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            />
          </div>
          <div>
            <label htmlFor="contactUrl" className="text-sm font-semibold text-city-ink">
              Ссылка для записи
            </label>
            <input
              id="contactUrl"
              name="contactUrl"
              type="url"
              defaultValue={activity.contactUrl ?? ""}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="sourceUrl" className="text-sm font-semibold text-city-ink">
              Source URL
            </label>
            <input
              id="sourceUrl"
              name="sourceUrl"
              type="url"
              defaultValue={activity.sourceUrl ?? ""}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            />
          </div>
          <div>
            <label htmlFor="imageUrl" className="text-sm font-semibold text-city-ink">
              Image URL
            </label>
            <input
              id="imageUrl"
              name="imageUrl"
              type="url"
              defaultValue={activity.imageUrl ?? ""}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            />
          </div>
        </div>

        <button className="min-h-12 rounded-full bg-city-green px-6 font-semibold text-white transition hover:bg-city-blue">
          Сохранить
        </button>
      </form>
    </div>
  );
}
