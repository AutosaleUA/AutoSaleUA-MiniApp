const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  try {
    tg.setHeaderColor("#06101f");
    tg.setBackgroundColor("#eef3f9");
  } catch (_) {}
}

const app = document.getElementById("app");
const state = { type: "sale", brand: "all", city: "all", sort: "default" };

// ЗАПОВНІТЬ після деплою API на Railway, наприклад:
// "https://autosaleua-bot-production.up.railway.app"
const API_BASE = "";

let LIVE_LISTINGS = null; // null = ще не завантажено / API вимкнено -> демо-дані
let usingDemoData = false;

async function loadListings() {
  if (!API_BASE) { usingDemoData = true; return CAR_LISTINGS; }
  try {
    const res = await fetch(`${API_BASE}/api/listings`);
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    usingDemoData = false;
    return data.listings || [];
  } catch (e) {
    console.warn("AutoSale UA: API недоступний, показую демо-дані", e);
    usingDemoData = true;
    return CAR_LISTINGS;
  }
}

function listingColor(item) {
  if (item.color) return item.color;
  const palette = ["#0956f5", "#09a63a", "#ff9b00", "#731cf0", "#087e9b", "#e51d48"];
  const key = (item.brand || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return palette[key % palette.length];
}

function thumbBg(item) {
  if (API_BASE && item.photos && item.photos.length) {
    return `url('${API_BASE}${item.photos[0]}') center/cover`;
  }
  return `linear-gradient(135deg, ${listingColor(item)}, #06101f)`;
}

/* ---------- icons (inline SVG, no external images needed) ---------- */
const ICON = {
  car: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 16.5V12l1.6-4.5A2 2 0 0 1 7.5 6h9a2 2 0 0 1 1.9 1.5L20 12v4.5" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><rect x="3" y="16" width="18" height="3.4" rx="1.4" fill="#fff"/><circle cx="7.5" cy="19.4" r="1.6" fill="#fff"/><circle cx="16.5" cy="19.4" r="1.6" fill="#fff"/><path d="M5 12h14" stroke="#fff" stroke-width="1.4"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 1 1 3.2 6.4L4 19l1-3.4A7.96 7.96 0 0 1 4 12Z" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
  gauge: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="#0a36c9" stroke-width="1.6"/><path d="M12 12l3.2-3.2" stroke="#0a36c9" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none"><rect x="6" y="9" width="12" height="8" rx="2" stroke="#0a36c9" stroke-width="1.6"/><path d="M9 9V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V9" stroke="#0a36c9" stroke-width="1.6"/></svg>`,
  fuel: `<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="9" height="16" rx="1.6" stroke="#0a36c9" stroke-width="1.6"/><path d="M14 9h2a2 2 0 0 1 2 2v4.5a1.5 1.5 0 0 0 3 0V9l-2-2.5" stroke="#0a36c9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="5.5" width="16" height="14.5" rx="2" stroke="#0a36c9" stroke-width="1.6"/><path d="M4 10h16M8 3.5v3M16 3.5v3" stroke="#0a36c9" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 21s-6.5-6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5-6.5 11-6.5 11Z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="10" r="2.2" stroke="currentColor" stroke-width="1.6"/></svg>`,
  empty: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 16.5V12l1.6-4.5A2 2 0 0 1 7.5 6h9a2 2 0 0 1 1.9 1.5L20 12v4.5" stroke="#8b97a5" stroke-width="1.4" stroke-linejoin="round"/><rect x="3" y="16" width="18" height="3.4" rx="1.4" fill="#8b97a5"/><path d="M2 2l20 20" stroke="#8b97a5" stroke-width="1.4"/></svg>`
};

function parseHash() {
  const raw = location.hash.replace(/^#/, "") || "/list";
  const [path, query] = raw.split("?");
  const params = new URLSearchParams(query || "");
  return { path, params };
}

function fmtPrice(item) {
  const n = Number(item.price) || 0;
  return item.type === "rent" ? `$${n.toLocaleString("uk-UA")}/добу` : `$${n.toLocaleString("uk-UA")}`;
}
function fmtMeta(item) {
  const mileage = Number(item.mileage) || 0;
  return `${item.year} · ${mileage.toLocaleString("uk-UA")} км · ${item.transmission} · ${item.fuel}`;
}
function uniqueValues(list, key) { return [...new Set(list.map((i) => i[key]))].sort(); }

let ALL_LISTINGS = [];

function render() {
  const { path, params } = parseHash();
  if (path.startsWith("/car/")) {
    renderDetail(path.split("/car/")[1]);
  } else {
    if (params.get("type") === "rent") state.type = "rent";
    renderList();
  }
  window.scrollTo(0, 0);
}

function getFiltered() {
  let items = ALL_LISTINGS.filter((i) => i.type === state.type);
  if (state.brand !== "all") items = items.filter((i) => i.brand === state.brand);
  if (state.city !== "all") items = items.filter((i) => i.city === state.city);
  switch (state.sort) {
    case "price-asc": items = [...items].sort((a, b) => a.price - b.price); break;
    case "price-desc": items = [...items].sort((a, b) => b.price - a.price); break;
    case "year-desc": items = [...items].sort((a, b) => b.year - a.year); break;
    case "mileage-asc": items = [...items].sort((a, b) => a.mileage - b.mileage); break;
  }
  return items;
}

function renderList() {
  const all = ALL_LISTINGS.filter((i) => i.type === state.type);
  const brands = uniqueValues(all, "brand");
  const cities = uniqueValues(all, "city");
  const items = getFiltered();

  app.innerHTML = `
    <div class="topbar">
      <div class="topbar-row">
        <button class="iconbtn" id="backHome" aria-label="Назад">‹</button>
        <h1>Каталог AutoSale UA<small>${state.type === "rent" ? "Оренда авто" : "Купівля авто"}</small></h1>
      </div>
    </div>
    <div class="hero-banner">
      <div class="eyebrow">🇺🇦 AutoSale UA${usingDemoData ? " · демо-дані" : " · перевірені оголошення"}</div>
      <div class="stat">${all.length}<span>оголошень зараз</span></div>
      <div class="sub">Без посередників · реальні авто від власників</div>
      <div class="flag-stripe"><span></span><span></span></div>
    </div>
    <div class="type-toggle">
      <button data-type="sale" class="${state.type === "sale" ? "active" : ""}">Купити</button>
      <button data-type="rent" class="${state.type === "rent" ? "active" : ""}">Орендувати</button>
    </div>
    <div class="filters">
      <select id="fBrand">
        <option value="all">Усі марки</option>
        ${brands.map((b) => `<option value="${b}" ${state.brand === b ? "selected" : ""}>${b}</option>`).join("")}
      </select>
      <select id="fCity">
        <option value="all">Усі міста</option>
        ${cities.map((c) => `<option value="${c}" ${state.city === c ? "selected" : ""}>${c}</option>`).join("")}
      </select>
      <select id="fSort" class="full">
        <option value="default">Сортування: за замовчуванням</option>
        <option value="price-asc">Дешевші спочатку</option>
        <option value="price-desc">Дорожчі спочатку</option>
        <option value="year-desc">Новіші спочатку</option>
        <option value="mileage-asc">Менший пробіг спочатку</option>
      </select>
    </div>
    <div class="list">
      ${items.length ? items.map(cardHtml).join("") : `<div class="empty">${ICON.empty}<br>Оголошень за цими фільтрами поки немає.<br>Спробуйте змінити фільтри.</div>`}
    </div>
  `;

  document.getElementById("backHome").addEventListener("click", () => (location.href = "index.html"));
  document.querySelectorAll(".type-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.type = btn.dataset.type;
      state.brand = "all"; state.city = "all"; state.sort = "default";
      render();
    });
  });
  document.getElementById("fBrand").addEventListener("change", (e) => { state.brand = e.target.value; render(); });
  document.getElementById("fCity").addEventListener("change", (e) => { state.city = e.target.value; render(); });
  document.getElementById("fSort").value = state.sort;
  document.getElementById("fSort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => (location.hash = `/car/${card.dataset.id}`));
  });
}

function cardHtml(item) {
  const hasPhoto = API_BASE && item.photos && item.photos.length;
  return `
    <button class="card" data-id="${item.id}">
      <div class="thumb" style="background:${thumbBg(item)}">
        ${hasPhoto ? "" : ICON.car}
        <span class="verified">${ICON.check}</span>
      </div>
      <div class="card-body">
        <p class="card-title">${item.brand} ${item.model}</p>
        <p class="card-meta">${fmtMeta(item)}</p>
      </div>
      <div class="card-right">
        <div class="card-price">${fmtPrice(item)}</div>
        <div class="card-city">${ICON.pin.replace("currentColor", "#7c8a99")} ${item.city}</div>
      </div>
    </button>
  `;
}

function renderDetail(id) {
  const item = ALL_LISTINGS.find((i) => String(i.id) === String(id));
  if (!item) {
    app.innerHTML = `<div class="topbar"><div class="topbar-row"><button class="iconbtn" id="back">‹</button><h1>Оголошення</h1></div></div><div class="empty">Оголошення не знайдено.</div>`;
    document.getElementById("back").addEventListener("click", () => (location.hash = "/list"));
    return;
  }

  app.innerHTML = `
    <div class="topbar">
      <div class="topbar-row">
        <button class="iconbtn" id="back" aria-label="Назад">‹</button>
        <h1>${item.brand} ${item.model}</h1>
      </div>
    </div>
    <div class="detail">
      <div class="hero" style="background:${thumbBg(item)}">
        <div class="hero-top">
          <div class="hero-icon-wrap">${API_BASE && item.photos && item.photos.length ? "" : ICON.car}</div>
          <div class="verified-chip">${ICON.check} Перевірено</div>
        </div>
        <h2>${item.brand} ${item.model}</h2>
        <div class="year">${ICON.pin.replace("currentColor", "#fff")} ${item.city} · ${item.year} рік</div>
        <div class="flag-stripe"><span></span><span></span></div>
      </div>
      <div class="spec-grid">
        <div class="spec"><div class="spec-icon">${ICON.gauge}</div><div><div class="label">Пробіг</div><div class="value">${(Number(item.mileage) || 0).toLocaleString("uk-UA")} км</div></div></div>
        <div class="spec"><div class="spec-icon">${ICON.gear}</div><div><div class="label">Коробка</div><div class="value">${item.transmission}</div></div></div>
        <div class="spec"><div class="spec-icon">${ICON.fuel}</div><div><div class="label">Паливо</div><div class="value">${item.fuel}</div></div></div>
        <div class="spec"><div class="spec-icon">${ICON.calendar}</div><div><div class="label">Рік</div><div class="value">${item.year}</div></div></div>
      </div>
      <div class="price-box">
        <div>
          <div class="ptype">${item.type === "rent" ? "Оренда" : "Ціна продажу"}</div>
          <div class="price">${fmtPrice(item)}</div>
        </div>
      </div>
      <div class="desc">
        <h3>Опис</h3>
        <p>${item.description}</p>
      </div>
      <button class="contact-btn" id="contactBtn">${ICON.chat} Написати продавцю</button>
      <div class="note">Оголошення розміщене через AutoSale UA. Перевіряйте авто особисто перед оплатою.</div>
    </div>
  `;

  document.getElementById("back").addEventListener("click", () => (location.hash = "/list"));
  document.getElementById("contactBtn").addEventListener("click", () => {
    const url = `https://t.me/${item.seller}`;
    if (tg?.openTelegramLink) tg.openTelegramLink(url); else window.open(url, "_blank");
  });
}

function loadingHtml() {
  return `
    <div class="topbar"><div class="topbar-row"><h1>Каталог AutoSale UA</h1></div></div>
    <div class="empty">Завантаження оголошень…</div>
  `;
}

async function init() {
  app.innerHTML = loadingHtml();
  ALL_LISTINGS = await loadListings();
  render();
}

window.addEventListener("hashchange", render);
init();
