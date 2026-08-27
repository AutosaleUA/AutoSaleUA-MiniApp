const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  try {
    tg.setHeaderColor("#06101f");
    tg.setBackgroundColor("#f4f8fc");
  } catch (_) {}
}

function openSection(name) {
  // Temporary navigation hooks.
  // We will replace these with the real bots/channels after the visual screen is approved.
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred("light");
  }

  console.log("AutoSale UA section:", name);
}

document.querySelector(".buy").addEventListener("click", () => openSection("buy"));
document.querySelector(".rent").addEventListener("click", () => openSection("rent"));
document.querySelector(".sell").addEventListener("click", () => openSection("sell"));
document.querySelector(".give-rent").addEventListener("click", () => openSection("give-rent"));
document.querySelector(".insurance").addEventListener("click", () => openSection("insurance"));
