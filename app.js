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
// Реальний бот подачі оголошень про оренду (deep-link одразу відкриває анкету)
const RENT_SELL_BOT_URL = "https://t.me/AutoRentUkraine_bot?start=sell";
// Реальний бот подачі заявки на страхування
const INSURANCE_BOT_URL = "https://t.me/AutoInsureUkraine_bot";

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
      openExternal(RENT_SELL_BOT_URL);
      break;
    case "insurance":
      openExternal(INSURANCE_BOT_URL);
      break;
    default:
      console.log("AutoSale UA section:", name);
  }
}

document.querySelectorAll(".action").forEach((button) => {
  button.addEventListener("click", () => openSection(button.dataset.section));
});
