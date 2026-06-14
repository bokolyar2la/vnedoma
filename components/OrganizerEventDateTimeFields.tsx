"use client";

import { useState } from "react";

const inputClass =
  "min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green";

function toIsoDate(value: string) {
  const match = value.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return "";

  const [, dayRaw, monthRaw, yearRaw] = match;
  const day = Number(dayRaw);
  const month = Number(monthRaw);
  const year = Number(yearRaw);

  if (day < 1 || day > 31 || month < 1 || month > 12) return "";

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "";
  }

  return `${yearRaw}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeTime(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";

  const [, hoursRaw, minutesRaw] = match;
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (hours > 23 || minutes > 59) return "";

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function composeDateTime(dateValue: string, timeValue: string) {
  const date = toIsoDate(dateValue);
  const time = normalizeTime(timeValue);

  return date && time ? `${date}T${time}:00+03:00` : "";
}

export function OrganizerEventDateTimeFields() {
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  const startsAt = composeDateTime(startDate, startTime);
  const endsAt = endDate || endTime ? composeDateTime(endDate, endTime) : "";

  return (
    <div className="grid gap-4">
      <input type="hidden" name="startsAt" value={startsAt} readOnly />
      <input type="hidden" name="endsAt" value={endsAt} readOnly />

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="grid gap-3 rounded-2xl border border-city-line p-4">
          <legend className="px-1 text-sm font-semibold text-city-ink">
            Начало
          </legend>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-city-ink">Дата</span>
            <input
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              placeholder="15.06.2026"
              inputMode="numeric"
              pattern="[0-9]{1,2}[.][0-9]{1,2}[.][0-9]{4}"
              title="Введите дату в формате 15.06.2026"
              required
              className={inputClass}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-city-ink">Время</span>
            <input
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              placeholder="19:30"
              inputMode="numeric"
              pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
              title="Введите время в формате 19:30"
              required
              className={inputClass}
            />
          </label>
        </fieldset>

        <fieldset className="grid gap-3 rounded-2xl border border-city-line p-4">
          <legend className="px-1 text-sm font-semibold text-city-ink">
            Окончание
          </legend>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-city-ink">Дата</span>
            <input
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              placeholder="15.06.2026"
              inputMode="numeric"
              pattern="[0-9]{1,2}[.][0-9]{1,2}[.][0-9]{4}"
              title="Введите дату в формате 15.06.2026"
              className={inputClass}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-city-ink">Время</span>
            <input
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              placeholder="21:00"
              inputMode="numeric"
              pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
              title="Введите время в формате 21:00"
              className={inputClass}
            />
          </label>
        </fieldset>
      </div>

      <p className="text-sm leading-6 text-city-muted">
        Формат даты и времени: 15.06.2026 и 19:30. Окончание можно оставить
        пустым.
      </p>
    </div>
  );
}
