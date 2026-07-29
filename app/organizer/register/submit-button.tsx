"use client";

import { useFormStatus } from "react-dom";

export function OrganizerRegisterSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="min-h-12 rounded-full bg-city-green px-6 font-semibold text-white transition hover:bg-city-blue disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Отправляем..." : "Отправить на проверку"}
    </button>
  );
}
