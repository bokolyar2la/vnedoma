"use client";

import { useState } from "react";

const inputClass =
  "min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green";

function TimeSelect({ value, onChange, required, name }: {
  value: string;
  onChange: (value: string) => void;
  required: boolean;
  name: string;
}) {
  const [hours = "", minutes = ""] = value.split(":");
  function update(nextHours: string, nextMinutes: string) {
    onChange(nextHours || nextMinutes ? `${nextHours}:${nextMinutes}` : "");
  }
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-semibold text-city-ink">Время</legend>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <select
          aria-label="Часы"
          value={hours}
          required={required || Boolean(minutes)}
          onChange={(event) => update(event.target.value, minutes)}
          className={`${inputClass} min-w-0 w-full bg-white`}
        >
          <option value="">Час</option>
          {Array.from({ length: 24 }, (_, index) => {
            const option = String(index).padStart(2, "0");
            return <option key={option} value={option}>{option}</option>;
          })}
        </select>
        <span aria-hidden="true">:</span>
        <select
          aria-label="Минуты"
          value={minutes}
          required={required || Boolean(hours)}
          onChange={(event) => update(hours, event.target.value)}
          className={`${inputClass} min-w-0 w-full bg-white`}
        >
          <option value="">Мин.</option>
          {Array.from({ length: 60 }, (_, index) => {
            const option = String(index).padStart(2, "0");
            return <option key={option} value={option}>{option}</option>;
          })}
        </select>
      </div>
    </fieldset>
  );
}

function toIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : "";
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

function fromDateTimeLocal(value?: string | null) {
  if (!value) {
    return { date: "", time: "" };
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) {
    return { date: "", time: "" };
  }

  const [, year, month, day, hours, minutes] = match;
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`
  };
}

function composeDateTime(dateValue: string, timeValue: string) {
  const date = toIsoDate(dateValue);
  const time = normalizeTime(timeValue);

  return date && time ? `${date}T${time}:00+03:00` : "";
}

type OrganizerEventDateTimeFieldsProps = {
  defaultStartsAt?: string | null;
  defaultEndsAt?: string | null;
};

export function OrganizerEventDateTimeFields({
  defaultStartsAt,
  defaultEndsAt
}: OrganizerEventDateTimeFieldsProps) {
  const startDefault = fromDateTimeLocal(defaultStartsAt);
  const endDefault = fromDateTimeLocal(defaultEndsAt);
  const [startDate, setStartDate] = useState(startDefault.date);
  const [startTime, setStartTime] = useState(startDefault.time);
  const [endDate, setEndDate] = useState(endDefault.date);
  const [endTime, setEndTime] = useState(endDefault.time);

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
              type="date"
              name="startDate"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              autoComplete="off"
              inputMode="numeric"
              title="Выберите дату в календаре"
              required
              className={inputClass}
            />
          </label>
          <TimeSelect
            name="startTime"
            value={startTime}
            onChange={setStartTime}
            required={true}
          />
        </fieldset>

        <fieldset className="grid gap-3 rounded-2xl border border-city-line p-4">
          <legend className="px-1 text-sm font-semibold text-city-ink">
            Окончание
          </legend>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-city-ink">Дата</span>
            <input
              type="date"
              name="endDate"
              min={startDate || undefined}
              required={Boolean(endTime)}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              autoComplete="off"
              inputMode="numeric"
              title="Выберите дату в календаре"
              className={inputClass}
            />
          </label>
          <TimeSelect
            name="endTime"
            value={endTime}
            onChange={setEndTime}
            required={Boolean(endDate)}
          />
        </fieldset>
      </div>

      <p className="text-sm leading-6 text-city-muted">
        Выберите дату в календаре. Часы и минуты выберите из списков. Время — по Москве, от 00:00 до 23:59.
        Окончание необязательно; если указали его, заполните и дату, и время.
      </p>
    </div>
  );
}
