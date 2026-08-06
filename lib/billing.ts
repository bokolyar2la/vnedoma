type BillingSource = {
  billingPlan: string;
  billingStatus: string;
  paidUntil: Date | null;
  trialUntil: Date | null;
};

type PromotionSource = {
  isPromoted?: boolean | null;
  promotedUntil?: Date | null;
};

export type ResolvedBilling = {
  plan: "free" | "active" | "pro";
  status: "free" | "trial" | "active" | "expired";
  until: Date | null;
  isActive: boolean;
  isExpired: boolean;
};

function normalizePlan(plan: string): ResolvedBilling["plan"] {
  return plan === "active" || plan === "pro" ? plan : "free";
}

function normalizeStatus(status: string): ResolvedBilling["status"] {
  if (status === "trial" || status === "active" || status === "expired") {
    return status;
  }

  return "free";
}

function isPast(date: Date | null, now: Date) {
  return Boolean(date && date.getTime() < now.getTime());
}

export function resolveOrganizerBilling(
  billing: BillingSource,
  now = new Date()
): ResolvedBilling {
  const rawPlan = normalizePlan(billing.billingPlan);
  const rawStatus = normalizeStatus(billing.billingStatus);
  const until = rawStatus === "trial" ? billing.trialUntil : billing.paidUntil;

  if (rawStatus === "trial") {
    const expired = isPast(billing.trialUntil, now);

    return {
      plan: expired ? "free" : rawPlan,
      status: expired ? "expired" : "trial",
      until: billing.trialUntil,
      isActive: !expired,
      isExpired: expired
    };
  }

  if (rawStatus === "active") {
    const expired = isPast(billing.paidUntil, now);

    return {
      plan: expired ? "free" : rawPlan,
      status: expired ? "expired" : "active",
      until: billing.paidUntil,
      isActive: !expired,
      isExpired: expired
    };
  }

  if (rawStatus === "expired") {
    return {
      plan: "free",
      status: "expired",
      until,
      isActive: false,
      isExpired: true
    };
  }

  return {
    plan: "free",
    status: "free",
    until: null,
    isActive: false,
    isExpired: false
  };
}

export function isEffectivelyPromoted(activity: PromotionSource, now = new Date()) {
  return Boolean(
    activity.isPromoted &&
      (!activity.promotedUntil || activity.promotedUntil.getTime() >= now.getTime())
  );
}
