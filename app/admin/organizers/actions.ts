"use server";

import { revalidatePath } from "next/cache";
import { resolveOrganizerBilling } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

function getId(formData: FormData, key: string) {
  const value = Number(formData.get(key));

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Некорректный идентификатор.");
  }

  return value;
}

function refreshAdminPages() {
  revalidatePath("/admin/organizers");
  revalidatePath("/admin/organizer-requests");
  revalidatePath("/organizer");
  revalidatePath("/");
  revalidatePath("/tula");
  revalidatePath("/kuda-shodit-v-tule");
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalDate(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const date = new Date(`${value}T23:59:59.000`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Некорректная дата.");
  }

  return date;
}

function getBillingPlan(formData: FormData) {
  const plan = getString(formData, "billingPlan");

  if (plan === "active" || plan === "pro") {
    return plan;
  }

  return "free";
}

function getBillingStatus(formData: FormData) {
  const status = getString(formData, "billingStatus");

  if (status === "trial" || status === "active" || status === "expired") {
    return status;
  }

  return "free";
}

function getPriority(formData: FormData) {
  const value = Number(getString(formData, "priority"));

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function disableOrganizerAccount(formData: FormData) {
  const id = getId(formData, "accountId");

  await prisma.organizerAccount.update({
    where: { id },
    data: { isDisabled: true }
  });

  refreshAdminPages();
}

export async function enableOrganizerAccount(formData: FormData) {
  const id = getId(formData, "accountId");

  await prisma.organizerAccount.update({
    where: { id },
    data: { isDisabled: false }
  });

  refreshAdminPages();
}

export async function deleteOrganizerAccount(formData: FormData) {
  const id = getId(formData, "accountId");

  await prisma.organizerAccount.delete({
    where: { id }
  });

  refreshAdminPages();
}

export async function revokeOrganizerAccess(formData: FormData) {
  const id = getId(formData, "accessId");

  await prisma.organizerAccess.delete({
    where: { id }
  });

  refreshAdminPages();
}

export async function updateOrganizerBilling(formData: FormData) {
  const id = getId(formData, "accountId");
  const billingPlan = getBillingPlan(formData);
  const billingStatus = getBillingStatus(formData);
  const paidUntil = getOptionalDate(formData, "paidUntil");
  const trialUntil = getOptionalDate(formData, "trialUntil");
  const billingComment = getString(formData, "billingComment") || null;
  const platformBookingEnabled = formData.get("platformBookingEnabled") === "on";
  const promoteActivities = formData.get("promoteActivities") === "on";
  const priority = getPriority(formData);
  const resolvedBilling = resolveOrganizerBilling({
    billingPlan,
    billingStatus,
    paidUntil,
    trialUntil
  });
  const canUsePaidFeatures = resolvedBilling.isActive && billingPlan !== "free";
  const effectivePromoteActivities = promoteActivities && canUsePaidFeatures;

  const account = await prisma.organizerAccount.update({
    where: { id },
    data: {
      billingPlan,
      billingStatus: resolvedBilling.status,
      paidUntil,
      trialUntil,
      billingComment,
      platformBookingEnabled: platformBookingEnabled && canUsePaidFeatures
    } as any,
    include: {
      accesses: {
        select: {
          organizerId: true
        }
      }
    }
  });

  const organizerIds = account.accesses.map((access) => access.organizerId);

  if (organizerIds.length > 0) {
    await prisma.activity.updateMany({
      where: {
        organizerId: { in: organizerIds }
      },
      data: {
        isPromoted: effectivePromoteActivities,
        promotedUntil: effectivePromoteActivities ? paidUntil : null,
        priority: effectivePromoteActivities ? priority : 0
      }
    });
  }

  refreshAdminPages();
}

export async function deleteEmptyOrganizer(formData: FormData) {
  const id = getId(formData, "organizerId");
  const organizer = await prisma.organizer.findUniqueOrThrow({
    where: { id },
    select: {
      _count: {
        select: {
          activities: true
        }
      }
    }
  });

  if (organizer._count.activities > 0) {
    throw new Error("Нельзя удалить организатора, у которого есть активности.");
  }

  await prisma.organizer.delete({
    where: { id }
  });

  refreshAdminPages();
}

export async function deleteOrganizerWithActivities(formData: FormData) {
  const id = getId(formData, "organizerId");
  const confirmed = formData.get("confirmDeleteWithActivities") === "on";

  if (!confirmed) {
    throw new Error("Подтвердите удаление организатора вместе с активностями.");
  }

  await prisma.organizer.delete({
    where: { id }
  });

  refreshAdminPages();
  revalidatePath("/admin/activities");
  revalidatePath("/tula");
  revalidatePath("/");
}
