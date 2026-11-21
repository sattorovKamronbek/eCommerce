const en = {
  manage: "Manage access", intro: "Review this account’s role and marketplace access.",
  role: "Role", status: "Marketplace access", active: "Active", suspended: "Suspended", providerRestricted: "Restricted by sign-in provider", blockedIntro: "Your marketplace access is suspended.",
  customer: "Customer", admin: "Administrator", owner: "Owner",
  suspend: "Suspend account", unsuspend: "Restore access", grant_admin: "Grant administrator access", revoke_admin: "Revoke administrator access",
  verify: "Confirm the person controls this exact account ID before granting administrator access.",
  fresh: "Sign in again and verify your authenticator to change administrator roles. The verification is valid for ten minutes.",
  reason: "Reason for the change", history: "Recent access changes",
};

const uz: typeof en = {
  manage: "Kirish huquqini boshqarish", intro: "Hisob roli va marketplace’ga kirish holatini tekshiring.",
  role: "Rol", status: "Marketplace’ga kirish", active: "Faol", suspended: "Bloklangan", providerRestricted: "Kirish xizmatida cheklangan", blockedIntro: "Marketplace’ga kirish huquqingiz bloklangan.",
  customer: "Mijoz", admin: "Administrator", owner: "Egasi",
  suspend: "Hisobni bloklash", unsuspend: "Kirishni tiklash", grant_admin: "Admin huquqini berish", revoke_admin: "Admin huquqini olib tashlash",
  verify: "Admin huquqini berishdan oldin shu aniq hisob IDsi kimning nazoratida ekanini tekshiring.",
  fresh: "Admin huquqini o‘zgartirish uchun qayta kiring va autentifikatorni tasdiqlang. Tasdiq o‘n daqiqa amal qiladi.",
  reason: "O‘zgarish sababi", history: "Kirish huquqidagi so‘nggi o‘zgarishlar",
};

const ru: typeof en = {
  manage: "Управление доступом", intro: "Проверьте роль и доступ аккаунта к маркетплейсу.",
  role: "Роль", status: "Доступ к маркетплейсу", active: "Активен", suspended: "Заблокирован", providerRestricted: "Ограничен сервисом входа", blockedIntro: "Ваш доступ к маркетплейсу заблокирован.",
  customer: "Клиент", admin: "Администратор", owner: "Владелец",
  suspend: "Заблокировать аккаунт", unsuspend: "Восстановить доступ", grant_admin: "Назначить администратором", revoke_admin: "Снять права администратора",
  verify: "Перед назначением администратора проверьте, что человек контролирует аккаунт с этим точным ID.",
  fresh: "Войдите снова и подтвердите код аутентификатора для смены роли администратора. Проверка действует десять минут.",
  reason: "Причина изменения", history: "Последние изменения доступа",
};

export const accessDictionaries = { en, uz, ru };
