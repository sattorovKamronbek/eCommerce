const en = {
  title: "Two-step verification", intro: "Protect this site account with an authenticator app. This is separate from Steam Guard.",
  active: "This session has completed two-step verification.", needsCode: "Enter a code from your authenticator to verify this session.",
  start: "Set up an authenticator", scan: "Scan this QR code with your authenticator app, or enter the setup key manually.",
  qr: "Authenticator setup QR code", secret: "Setup key", secretNote: "Keep this key private. Do not send it to anyone.",
  code: "Code from this site's authenticator", factor: "Authenticator", verify: "Verify code", pending: "Please wait…",
  unfinished: "Unfinished setup", remove: "Remove unfinished setup", noFactor: "No authenticator is set up yet.",
  unavailable: "Two-step verification is unavailable. Please try again later.", invalid: "The code or authenticator is invalid. Try again.",
  stepUpRequired: "Verify an existing authenticator before changing setup.", pendingSetup: "Complete or remove the unfinished setup first.",
  securityLink: "Two-step verification",
};
const uz: typeof en = {
  title: "Ikki bosqichli himoya", intro: "Sayt akkauntingizni autentifikator ilovasi bilan himoyalang. Bu Steam Guard’dan alohida.",
  active: "Bu seans ikki bosqichli tasdiqdan o‘tgan.", needsCode: "Seansni tasdiqlash uchun autentifikator ilovasidagi kodni kiriting.",
  start: "Autentifikatorni sozlash", scan: "QR-kodni autentifikator ilovasida skanerlang yoki sozlash kalitini qo‘lda kiriting.",
  qr: "Autentifikatorni sozlash QR-kodi", secret: "Sozlash kaliti", secretNote: "Bu kalitni maxfiy saqlang. Uni hech kimga yubormang.",
  code: "Ushbu sayt autentifikatoridagi kod", factor: "Autentifikator", verify: "Kodni tasdiqlash", pending: "Kuting…",
  unfinished: "Tugallanmagan sozlash", remove: "Tugallanmagan sozlashni olib tashlash", noFactor: "Hali autentifikator sozlanmagan.",
  unavailable: "Ikki bosqichli himoya hozir ishlamayapti. Keyinroq qayta urinib ko‘ring.", invalid: "Kod yoki autentifikator noto‘g‘ri. Qayta urinib ko‘ring.",
  stepUpRequired: "Sozlashni o‘zgartirishdan oldin mavjud autentifikatorni tasdiqlang.", pendingSetup: "Avval tugallanmagan sozlashni yakunlang yoki olib tashlang.",
  securityLink: "Ikki bosqichli himoya",
};
const ru: typeof en = {
  title: "Двухэтапная защита", intro: "Защитите аккаунт сайта приложением-аутентификатором. Это отдельно от Steam Guard.",
  active: "Этот сеанс прошёл двухэтапную проверку.", needsCode: "Введите код из приложения-аутентификатора для подтверждения сеанса.",
  start: "Настроить аутентификатор", scan: "Отсканируйте QR-код в приложении или введите ключ настройки вручную.",
  qr: "QR-код настройки аутентификатора", secret: "Ключ настройки", secretNote: "Храните ключ в секрете. Никому его не отправляйте.",
  code: "Код аутентификатора этого сайта", factor: "Аутентификатор", verify: "Подтвердить код", pending: "Подождите…",
  unfinished: "Незавершённая настройка", remove: "Удалить незавершённую настройку", noFactor: "Аутентификатор ещё не настроен.",
  unavailable: "Двухэтапная проверка недоступна. Повторите попытку позже.", invalid: "Неверный код или аутентификатор. Попробуйте ещё раз.",
  stepUpRequired: "Сначала подтвердите существующий аутентификатор.", pendingSetup: "Сначала завершите или удалите незавершённую настройку.",
  securityLink: "Двухэтапная защита",
};
export const mfaDictionaries = { en, uz, ru };
