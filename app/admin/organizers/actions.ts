"use server";

import { revalidatePath } from "next/cache";
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
