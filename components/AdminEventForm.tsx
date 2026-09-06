"use client";

import { useRef, useState, type ReactNode, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AdminEventForm({ action, children, className }: {
  action: (data: FormData) => Promise<{ error?: string; success?: string }>;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ error?: string; success?: string }>({});
  const [formKey, setFormKey] = useState(0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    submitting.current = true;
    setPending(true);
    setMessage({});
    try {
      const result = await action(data);
      setMessage(result);
      if (result.success) {
        setFormKey((key) => key + 1);
        router.refresh();
      }
    } catch {
      setMessage({ error: "Не удалось получить ответ сервера. Данные остались в форме. Проверьте список событий перед повторной отправкой." });
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className={className} aria-busy={pending}>
      {message.error ? <p role="alert" className="mb-4 rounded-2xl bg-red-50 p-4 text-red-800">{message.error}</p> : null}
      {message.success ? <p role="status" className="mb-4 rounded-2xl bg-city-green/10 p-4 text-city-green">{message.success}</p> : null}
      <fieldset key={formKey} disabled={pending} className="min-w-0 disabled:opacity-60">
        {children}
      </fieldset>
      {pending ? <p role="status" className="mt-3 text-sm text-city-muted">Сохраняем событие…</p> : null}
    </form>
  );
}
