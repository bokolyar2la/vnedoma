export const activityTypeOptions = [
  "постоянная активность",
  "регулярная встреча",
  "разовое событие",
  "площадка с мероприятиями",
  "выездная активность"
] as const;

export const socialLevelOptions = ["высокая", "средняя", "низкая"] as const;

export function getSocialLevelLabel(level: string | null | undefined) {
  if (level === "высокая") {
    return "высокая социальность";
  }

  if (level === "средняя") {
    return "средняя социальность";
  }

  if (level === "низкая") {
    return "низкая социальность";
  }

  return null;
}

export function isTripActivity(activityType: string | null | undefined) {
  return activityType === "выездная активность";
}
