import { storeConfig } from "@/lib/config";

const uz = {
  title: "Sotish ruxsati",
  intro: `Bu hisob ${storeConfig.name} nomidan tanlangan yo‘nalishda e’lon joylaydi va bandlovlarni sozlaydi.`,
  current: "Belgilangan ruxsat",
  legacy: "Avvalgi sotuvchi tasdig‘i",
  scope: "Ruxsat doirasi",
  cs2: "CS2 skinlar",
  fashion: "Kiyimlar",
  both: "CS2 skinlar va kiyimlar",
  none: "Ruxsat yo‘q",
  revokeNote: "Olib tashlangan yo‘nalishdagi e’lonlar va yangi bandlovlar yopiladi. Mavjud buyurtmalar davom etadi.",
  unavailable: "Sotish ruxsatini yuklab bo‘lmadi.",
  save: "Ruxsatni saqlash",
  pending: "Saqlanmoqda…",
  saved: "Sotish ruxsati saqlandi.",
  errors: {
    invalid: "Ruxsat doirasini tanlang.",
    changed: "Ruxsat o‘zgargan. Sahifani yangilab, qayta urining.",
    failed: "Sotish ruxsatini saqlab bo‘lmadi.",
  },
};

const en: typeof uz = {
  title: "Catalog selling access",
  intro: `This account can publish listings and set up reservations on behalf of ${storeConfig.name} in the selected categories.`,
  current: "Assigned access",
  legacy: "Earlier seller approval",
  scope: "Selling scope",
  cs2: "CS2 skins",
  fashion: "Clothing",
  both: "CS2 skins and clothing",
  none: "No selling access",
  revokeNote: "Removing a category hides its listings and closes new reservations. Existing orders can continue.",
  unavailable: "Selling access could not be loaded.",
  save: "Save selling access",
  pending: "Saving…",
  saved: "Selling access saved.",
  errors: {
    invalid: "Select a selling scope.",
    changed: "Selling access changed. Reload the page and try again.",
    failed: "Selling access could not be saved.",
  },
};

const ru: typeof uz = {
  title: "Доступ к продажам",
  intro: `Аккаунт может публиковать объявления и настраивать бронирование от имени ${storeConfig.name} в выбранных категориях.`,
  current: "Назначенный доступ",
  legacy: "Ранее одобренная заявка продавца",
  scope: "Категории продаж",
  cs2: "Скины CS2",
  fashion: "Одежда",
  both: "Скины CS2 и одежда",
  none: "Нет доступа к продажам",
  revokeNote: "При отзыве доступа объявления категории скрываются, а новые бронирования закрываются. Текущие заказы можно продолжить.",
  unavailable: "Не удалось загрузить доступ к продажам.",
  save: "Сохранить доступ",
  pending: "Сохранение…",
  saved: "Доступ к продажам сохранён.",
  errors: {
    invalid: "Выберите категории продаж.",
    changed: "Доступ к продажам изменился. Обновите страницу и повторите попытку.",
    failed: "Не удалось сохранить доступ к продажам.",
  },
};

export const catalogSalesDictionaries = { uz, en, ru };
