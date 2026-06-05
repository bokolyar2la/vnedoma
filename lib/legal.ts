export const legalConfig = {
  projectName: "Влюди",
  siteUrl: "https://vlyudi.ru",
  ownerName: "Боколяр Даниил Григорьевич",
  ownerStatus: "плательщик налога на профессиональный доход (самозанятый)",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hellovlyudi.ru@gmail.com"
};

export const legalOwnerLabel = `${legalConfig.ownerName}, ${legalConfig.ownerStatus}`;
