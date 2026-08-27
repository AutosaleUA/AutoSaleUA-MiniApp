const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  try {
    tg.setHeaderColor("#06101f");
    tg.setBackgroundColor("#f4f8fc");
  } catch (_) {}
}

// Реальний бот подачі оголошень про продаж (вже працює й публікує в канал)
const SELL_BOT_URL = "https://t.me/AutoSaleUkraine_bot";

// Розділи, для яких бот ще не створено — показуємо акуратне повідомлення
function comingSoon(title) {
  const msg = `Розділ «${title}» ще в розробці. Скоро тут з'явиться бот для подачі заявки.`;
  if (tg?.showPopup) {
    tg.showPopup({ title: "Незабаром", message: msg, buttons: [{ type: "ok" }] });
  } else {
    alert(msg);
  }
}

function openExternal(url) {
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(url);
  } else {
    window.open(url, "_blank");
  }
}

function openSection(name) {
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("light");

  switch (name) {
    case "buy":
      location.href = "catalog.html#/list";
      break;
    case "rent":
      location.href = "catalog.html#/list?type=rent";
      break;
    case "sell":
      openExternal(SELL_BOT_URL);
      break;
    case "give-rent":
      comingSoon("Здати авто в оренду");
      break;
    case "insurance":
      comingSoon("Страхування авто");
      break;
    default:
      console.log("AutoSale UA section:", name);
  }
}

document.querySelectorAll(".action").forEach((button) => {
  button.addEventListener("click", () => openSection(button.dataset.section));
});
