const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  if (tg.setHeaderColor) tg.setHeaderColor("#f7f8fa");
  if (tg.setBackgroundColor) tg.setBackgroundColor("#f7f8fa");
}

// These are intentionally placeholders.
// We will replace them with the real bot/channel/group routes
// after the Telegram infrastructure is defined.
const ROUTES = {
  buy: null,        // Mini App feed: sale listings
  rent: null,       // Mini App feed: rental listings
  sell: null,       // Bot: create sale listing
  "give-rent": null,// Bot: create rental listing
  insurance: null   // Bot: insurance request
};

function openRoute(route) {
  if (!route) {
    tg?.showAlert?.("Цей розділ підключимо на наступному етапі.");
    return;
  }

  // Telegram links can be opened directly from a Mini App.
  if (tg?.openTelegramLink && route.startsWith("https://t.me/")) {
    tg.openTelegramLink(route);
  } else {
    window.location.href = route;
  }
}

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    openRoute(ROUTES[button.dataset.action]);
  });
});
