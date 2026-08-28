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

const API_BASE = "https://autosaleukrainebot-production.up.railway.app";
const RENT_API_BASE = "https://autorentua-production.up.railway.app";

let LIVE_LISTINGS = null; // null = ще не завантажено / API вимкнено -> демо-дані
let usingDemoData = false;

async function fetchFrom(base, defaultType) {
  const res = await fetch(`${base}/listings`);
  if (!res.ok) throw new Error("bad response");
  const data = await res.json();
  return data.map((item) => ({
    ...item,
    id: `${defaultType}-${item.id}`,
    type: item.type || defaultType,
  }));
}

async function loadListings() {
  if (!API_BASE && !RENT_API_BASE) { usingDemoData = true; return CAR_LISTINGS; }
  try {
    const [saleResult, rentResult] = await Promise.allSettled([
      API_BASE ? fetchFrom(API_BASE, "sale") : Promise.resolve([]),
      RENT_API_BASE ? fetchFrom(RENT_API_BASE, "rent") : Promise.resolve([]),
    ]);

    const sale = saleResult.status === "fulfilled" ? saleResult.value : [];
    const rent = rentResult.status === "fulfilled" ? rentResult.value : [];

    if (saleResult.status === "rejected") {
      console.warn("AutoSale UA: API продажу недоступний", saleResult.reason);
    }
    if (rentResult.status === "rejected") {
      console.warn("AutoSale UA: API оренди недоступний", rentResult.reason);
    }

    const combined = [...sale, ...rent];
    if (!combined.length && saleResult.status === "rejected" && rentResult.status === "rejected") {
      throw new Error("both APIs unavailable");
    }

    usingDemoData = false;
    return combined;
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
  if (item.photos && item.photos.length) {
    return `url('${item.photos[0]}') center/cover`;
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
  empty: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 16.5V12l1.6-4.5A2 2 0 0 1 7.5 6h9a2 2 0 0 1 1.9 1.5L20 12v4.5" stroke="#8b97a5" stroke-width="1.4" stroke-linejoin="round"/><rect x="3" y="16" width="18" height="3.4" rx="1.4" fill="#8b97a5"/><path d="M2 2l20 20" stroke="#8b97a5" stroke-width="1.4"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
};

function parseHash() {
  const raw = location.hash.replace(/^#/, "") || "/list";
  const [path, query] = raw.split("?");
  const params = new URLSearchParams(query || "");
  return { path, params };
}

function fmtPrice(item) {
  const n = Number(item.price) || 0;
  return item.type === "rent" ? `${n} грн/тиждень` : `$${n}`;
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
    state.type = params.get("type") === "rent" ? "rent" : "sale";
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
    <div class="topbar topbar--${state.type}">
      <div class="topbar-row">
        <button class="iconbtn" id="backHome" aria-label="Назад" style="width:40px;height:40px;border-radius:50%;background:#ffd166;color:#06101f;font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center;border:none;box-shadow:0 2px 6px rgba(0,0,0,.25);">‹</button>
        <h1>Каталог <span class="brand">AutoSale</span> <span class="brand-ua">UA</span><small>${state.type === "rent" ? "Оренда авто" : "Купівля авто"}</small></h1>
      </div>
      <div class="flag-stripe"><span></span><span></span></div>
    </div>
    <div class="hero-banner">
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
      const newType = btn.dataset.type;
      state.brand = "all"; state.city = "all"; state.sort = "default";
      const newHash = newType === "rent" ? "#/list?type=rent" : "#/list";
      if (location.hash === newHash) {
        state.type = newType;
        render();
      } else {
        location.hash = newHash;
      }
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
  const hasPhoto = item.photos && item.photos.length;
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

/* ---------- photo gallery (detail view) ---------- */
const MAX_GALLERY_PHOTOS = 5;
let galleryIndex = 0;
let galleryPhotos = [];

function galleryHtml(item) {
  galleryPhotos = (item.photos || []).slice(0, MAX_GALLERY_PHOTOS);
  galleryIndex = 0;

  if (!galleryPhotos.length) {
    return `<div class="hero" style="position:relative;overflow:hidden;background:#0b1524;">
      <div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:linear-gradient(135deg, ${listingColor(item)}, #06101f)">${ICON.car}</div>
    </div>`;
  }

  const multi = galleryPhotos.length > 1;

  return `
    <div class="hero" id="heroWrap" style="position:relative;overflow:hidden;background:#0b1524;">
      <img id="heroImg" src="${galleryPhotos[0]}" alt="${item.brand} ${item.model}" style="width:100%;height:100%;display:block;object-fit:contain;background:#0b1524;">
      ${multi ? `
        <button id="prevPhoto" aria-label="Попереднє фото" style="position:absolute;left:6px;top:50%;transform:translateY(-50%) rotate(180deg);width:34px;height:34px;border:none;border-radius:50%;background:rgba(6,16,31,.55);display:flex;align-items:center;justify-content:center;">${ICON.chevron}</button>
        <button id="nextPhoto" aria-label="Наступне фото" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);width:34px;height:34px;border:none;border-radius:50%;background:rgba(6,16,31,.55);display:flex;align-items:center;justify-content:center;">${ICON.chevron}</button>
        <div id="photoCounter" style="position:absolute;top:8px;right:8px;background:rgba(6,16,31,.6);color:#fff;font-size:12px;padding:2px 8px;border-radius:10px;">1/${galleryPhotos.length}</div>
        <div id="photoDots" style="position:absolute;bottom:10px;left:0;right:0;display:flex;justify-content:center;gap:6px;">
          ${galleryPhotos.map((_, i) => `<span class="dot" data-i="${i}" style="width:7px;height:7px;border-radius:50%;background:${i === 0 ? "#fff" : "rgba(255,255,255,.4)"};"></span>`).join("")}
        </div>
      ` : ""}
    </div>
    ${multi ? `
      <div id="thumbStrip" style="display:flex;gap:6px;padding:8px 0;overflow-x:auto;">
        ${galleryPhotos.map((p, i) => `<img data-i="${i}" src="${p}" style="flex:0 0 auto;width:56px;height:42px;object-fit:cover;border-radius:6px;cursor:pointer;opacity:${i === 0 ? "1" : ".6"};border:2px solid ${i === 0 ? "#0956f5" : "transparent"};">`).join("")}
      </div>
    ` : ""}
  `;
}

function setGalleryIndex(i) {
  if (!galleryPhotos.length) return;
  galleryIndex = (i + galleryPhotos.length) % galleryPhotos.length;

  const img = document.getElementById("heroImg");
  if (img) img.src = galleryPhotos[galleryIndex];

  const counter = document.getElementById("photoCounter");
  if (counter) counter.textContent = `${galleryIndex + 1}/${galleryPhotos.length}`;

  document.querySelectorAll("#photoDots .dot").forEach((dot, i2) => {
    dot.style.background = i2 === galleryIndex ? "#fff" : "rgba(255,255,255,.4)";
  });
  document.querySelectorAll("#thumbStrip img").forEach((t, i2) => {
    t.style.opacity = i2 === galleryIndex ? "1" : ".6";
    t.style.border = `2px solid ${i2 === galleryIndex ? "#0956f5" : "transparent"}`;
  });
}

function wireGallery() {
  if (galleryPhotos.length <= 1) return;

  document.getElementById("prevPhoto")?.addEventListener("click", () => setGalleryIndex(galleryIndex - 1));
  document.getElementById("nextPhoto")?.addEventListener("click", () => setGalleryIndex(galleryIndex + 1));
  document.querySelectorAll("#photoDots .dot").forEach((dot) => {
    dot.addEventListener("click", () => setGalleryIndex(Number(dot.dataset.i)));
  });
  document.querySelectorAll("#thumbStrip img").forEach((thumb) => {
    thumb.addEventListener("click", () => setGalleryIndex(Number(thumb.dataset.i)));
  });

  // swipe support
  const wrap = document.getElementById("heroWrap");
  if (wrap) {
    let startX = null;
    wrap.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
    wrap.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) setGalleryIndex(galleryIndex + (dx < 0 ? 1 : -1));
      startX = null;
    });
  }
}

function renderDetail(id) {
  const item = ALL_LISTINGS.find((i) => String(i.id) === String(id));
  if (!item) {
    app.innerHTML = `<div class="topbar"><div class="topbar-row"><button class="iconbtn" id="back" style="width:40px;height:40px;border-radius:50%;background:#ffd166;color:#06101f;font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center;border:none;box-shadow:0 2px 6px rgba(0,0,0,.25);">‹</button></div></div><div class="empty">Оголошення не знайдено.</div>`;
    document.getElementById("back").addEventListener("click", () => (location.hash = "/list"));
    return;
  }

  app.innerHTML = `
    <div class="topbar topbar--${item.type}">
      <div class="topbar-row">
        <button class="iconbtn" id="back" aria-label="Назад" style="width:40px;height:40px;border-radius:50%;background:#ffd166;color:#06101f;font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center;border:none;box-shadow:0 2px 6px rgba(0,0,0,.25);">‹</button>
        <h1>${item.brand} ${item.model}</h1>
      </div>
    </div>
    ${galleryHtml(item)}
    <div class="detail">
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
    const username = (item.seller || "").replace(/^@/, "");
    if (!username || /\s/.test(username)) {
      alert("У продавця немає юзернейму в Telegram — зв'язатися напряму неможливо.");
      return;
    }
    const url = `https://t.me/${username}`;
    if (tg?.openTelegramLink) tg.openTelegramLink(url); else window.open(url, "_blank");
  });

  wireGallery();
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
