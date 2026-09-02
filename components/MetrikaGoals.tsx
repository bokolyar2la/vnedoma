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

type ActivityStatType = "view" | "signup_click" | "nearest_event_click";

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

function sendActivityStat(activityId: number, type: ActivityStatType, eventId?: number) {
  if (typeof window === "undefined" || !activityId) {
    return;
  }

  const payload = JSON.stringify({
    activityId,
    eventId,
    type,
    path: window.location.pathname,
    referrer: document.referrer || null
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/activity-stats",
      new Blob([payload], { type: "application/json" })
    );
    return;
  }

  fetch("/api/activity-stats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true
  }).catch(() => undefined);
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
  activityStat?: {
    activityId: number;
    eventId?: number;
    type: ActivityStatType;
  };
};

export function TrackedExternalLink({
  goal,
  activityStat,
  children,
  onClick,
  ...props
}: TrackedExternalLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        reachMetrikaGoal(goal);
        if (activityStat) {
          sendActivityStat(activityStat.activityId, activityStat.type, activityStat.eventId);
        }
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

export function ActivityStatOnMount({
  activityId,
  type = "view"
}: {
  activityId: number;
  type?: ActivityStatType;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      sendActivityStat(activityId, type);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [activityId, type]);

  return null;
}
