"use client";

import Link from "next/link";
import type { LinkProps } from "next/link";
import type React from "react";
import { useEffect } from "react";

type GoalName =
  | "search_submit"
  | "view_all_activities_click"
  | "quick_choice_click"
  | "add_activity_click"
  | "add_activity_submit"
  | "organizer_contact_click";

type YmWindow = Window & {
  ym?: (
    counterId: number,
    methodName: "hit" | "init" | "reachGoal",
    urlOrOptions?: string | Record<string, unknown>,
    options?: Record<string, unknown>
  ) => void;
};

const metrikaId = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || "109691466");

export function reachMetrikaGoal(goalName: GoalName) {
  if (!metrikaId || typeof window === "undefined") {
    return;
  }

  (window as YmWindow).ym?.(metrikaId, "reachGoal", goalName);
}

type TrackedLinkProps = LinkProps & {
  goal: GoalName;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
};

export function TrackedLink({
  goal,
  children,
  className,
  ariaLabel,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      {...props}
      aria-label={ariaLabel}
      className={className}
      onClick={() => reachMetrikaGoal(goal)}
    >
      {children}
    </Link>
  );
}

type TrackedExternalLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  goal: GoalName;
};

export function TrackedExternalLink({
  goal,
  children,
  onClick,
  ...props
}: TrackedExternalLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        reachMetrikaGoal(goal);
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}

type TrackedFormProps = React.FormHTMLAttributes<HTMLFormElement> & {
  goal: GoalName;
};

export function TrackedForm({ goal, children, onSubmit, ...props }: TrackedFormProps) {
  return (
    <form
      {...props}
      onSubmit={(event) => {
        reachMetrikaGoal(goal);
        onSubmit?.(event);
      }}
    >
      {children}
    </form>
  );
}

export function MetrikaGoalOnMount({ goal }: { goal: GoalName }) {
  useEffect(() => {
    reachMetrikaGoal(goal);
  }, [goal]);

  return null;
}
