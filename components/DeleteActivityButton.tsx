"use client";

import { deleteActivity } from "@/app/admin/activities/actions";

type DeleteActivityButtonProps = {
  id: number;
};

export function DeleteActivityButton({ id }: DeleteActivityButtonProps) {
  return (
    <form action={deleteActivity}>
      <input type="hidden" name="id" value={id} />
      <button
        className="rounded-full border border-city-coral/40 px-3 py-1.5 font-semibold text-city-coral transition hover:bg-city-coral hover:text-white"
        onClick={(event) => {
          if (
            !window.confirm(
              "Точно удалить активность?\nЭто действие нельзя отменить."
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        Удалить
      </button>
    </form>
  );
}
