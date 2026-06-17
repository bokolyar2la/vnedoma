export function getEventExpiresAt(event: {
  startsAt: Date;
  endsAt: Date | null;
}) {
  return event.endsAt ?? event.startsAt;
}

export function getUpcomingEventWhere(now: Date) {
  return {
    OR: [
      {
        endsAt: {
          gte: now
        }
      },
      {
        endsAt: null,
        startsAt: {
          gte: now
        }
      }
    ]
  };
}
