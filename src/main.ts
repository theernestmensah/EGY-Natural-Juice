import "./style.css";

type Flavor = {
  id: string;
  accentVar: string;
};

const FLAVORS: Flavor[] = [
  { id: "pinemango", accentVar: "--flavor-mango" },
  { id: "watermelon-beetroot", accentVar: "--flavor-berry" },
  { id: "passionfruit", accentVar: "--flavor-passion" },
];

type CartLine = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
};

const cart = new Map<string, CartLine>();

const money = (n: number) => `GH₵${n.toFixed(2)}`;

/* ---------- Preloader ---------- */
function initPreloader() {
  const preloader = document.getElementById("preloader");
  if (!preloader) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    preloader.remove();
    return;
  }

  preloader.addEventListener("animationend", (e) => {
    if (e.target === preloader) preloader.remove();
  });
}

/* ---------- Mobile nav ---------- */
function initNav() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------- Hero flavor switcher ---------- */
function initHero() {
  const heroSection = document.querySelector<HTMLElement>(".hero");
  const switcher = document.getElementById("hero-switcher");
  const prevBtn = document.getElementById("hero-prev");
  const nextBtn = document.getElementById("hero-next");
  if (!heroSection || !switcher || !prevBtn || !nextBtn) return;

  let activeIndex = -1;

  function applyFlavor(index: number, direction: 1 | -1 = 1, immediate = false) {
    const nextIndex = (index + FLAVORS.length) % FLAVORS.length;
    if (nextIndex === activeIndex) return;

    const outgoing = activeIndex >= 0 ? FLAVORS[activeIndex] : null;
    activeIndex = nextIndex;
    const flavor = FLAVORS[activeIndex];

    heroSection!.style.setProperty("--flavor-accent", `var(${flavor.accentVar})`);

    switcher!.querySelectorAll<HTMLButtonElement>("button").forEach((btn) => {
      const isActive = btn.dataset.flavor === flavor.id;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });

    document.querySelectorAll<HTMLImageElement>(".hero__bottle").forEach((img) => {
      if (img.dataset.flavor === flavor.id) {
        // Incoming bottle enters from the side of whichever arrow was pressed.
        img.style.setProperty("--enter-x", `${direction * 55}%`);
        img.classList.remove("is-active");

        if (immediate) {
          img.style.transition = "none";
          img.classList.add("is-active");
          void img.offsetWidth;
          img.style.transition = "";
        } else {
          void img.offsetWidth; // commit the starting position before animating in
          img.classList.add("is-active");
        }
      } else if (outgoing && img.dataset.flavor === outgoing.id) {
        // Outgoing bottle exits toward the opposite side.
        img.style.setProperty("--enter-x", `${direction * -55}%`);
        img.classList.remove("is-active");
      } else {
        img.classList.remove("is-active");
      }
    });
  }

  const AUTO_ADVANCE_MS = 3000;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let autoTimer: number | undefined;

  function stopAuto() {
    if (autoTimer !== undefined) {
      window.clearInterval(autoTimer);
      autoTimer = undefined;
    }
  }

  function startAuto() {
    if (reduceMotion) return;
    stopAuto();
    autoTimer = window.setInterval(() => {
      applyFlavor(activeIndex + 1, 1);
    }, AUTO_ADVANCE_MS);
  }

  function onManualChange(index: number, direction: 1 | -1) {
    applyFlavor(index, direction);
    startAuto();
  }

  switcher.querySelectorAll<HTMLButtonElement>("button").forEach((btn, i) => {
    btn.addEventListener("click", () => {
      const direction = i >= activeIndex ? 1 : -1;
      onManualChange(i, direction);
    });
  });

  prevBtn.addEventListener("click", () => onManualChange(activeIndex - 1, -1));
  nextBtn.addEventListener("click", () => onManualChange(activeIndex + 1, 1));

  heroSection.addEventListener("mouseenter", stopAuto);
  heroSection.addEventListener("mouseleave", startAuto);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  applyFlavor(0, 1, true);
  startAuto();
}

/* ---------- Scroll reveal ---------- */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || items.length === 0) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
  );

  items.forEach((el) => observer.observe(el));
}

/* ---------- Per-card quantity steppers ---------- */
function initQtySteppers() {
  document.querySelectorAll<HTMLElement>(".qty-stepper").forEach((stepper) => {
    const valueEl = stepper.querySelector<HTMLElement>("[data-qty-value]");
    const minus = stepper.querySelector<HTMLButtonElement>(".qty-minus");
    const plus = stepper.querySelector<HTMLButtonElement>(".qty-plus");
    if (!valueEl || !minus || !plus) return;

    let qty = 1;
    const render = () => {
      valueEl.textContent = String(qty);
    };

    minus.addEventListener("click", () => {
      qty = Math.max(1, qty - 1);
      render();
    });

    plus.addEventListener("click", () => {
      qty = Math.min(20, qty + 1);
      render();
    });

    (stepper as HTMLElement & { getQty?: () => number }).getQty = () => qty;
  });
}

/* ---------- Cart ---------- */
const MINUS_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" class="icon"><path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z"/></svg>';
const PLUS_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" class="icon"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>';
const BAG_ICON_MUTED =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" class="icon" style="width:28px;height:28px;color:var(--text-faint)"><path d="M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15Z"/></svg>';

function renderCart() {
  const itemsEl = document.getElementById("cart-items");
  const emptyEl = document.getElementById("cart-empty");
  const subtotalEl = document.getElementById("cart-subtotal-value");
  const countEl = document.getElementById("cart-count");
  const checkoutBtn = document.getElementById("cart-checkout") as HTMLButtonElement | null;
  if (!itemsEl || !subtotalEl || !countEl || !checkoutBtn) return;

  itemsEl.querySelectorAll(".cart-item").forEach((el) => el.remove());

  let subtotal = 0;
  let count = 0;

  cart.forEach((line) => {
    subtotal += line.price * line.qty;
    count += line.qty;

    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div class="cart-item__thumb">${
        line.image ? `<img src="${line.image}" alt="" />` : BAG_ICON_MUTED
      }</div>
      <div class="cart-item__body">
        <div class="cart-item__top">
          <span class="cart-item__name">${line.name}</span>
          <span class="cart-item__price">${money(line.price * line.qty)}</span>
        </div>
        <div class="cart-item__bottom">
          <div class="qty-stepper" data-cart-qty-for="${line.id}">
            <button type="button" class="qty-minus" aria-label="Decrease quantity">${MINUS_ICON}</button>
            <span class="qty-stepper__value">${line.qty}</span>
            <button type="button" class="qty-plus" aria-label="Increase quantity">${PLUS_ICON}</button>
          </div>
          <button type="button" class="cart-item__remove" data-remove="${line.id}">Remove</button>
        </div>
      </div>
    `;
    itemsEl.appendChild(row);
  });

  if (emptyEl) emptyEl.style.display = cart.size === 0 ? "flex" : "none";
  subtotalEl.textContent = money(subtotal);
  countEl.textContent = String(count);
  checkoutBtn.disabled = cart.size === 0;

  itemsEl.querySelectorAll<HTMLButtonElement>("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      cart.delete(btn.dataset.remove!);
      renderCart();
    });
  });

  itemsEl.querySelectorAll<HTMLElement>("[data-cart-qty-for]").forEach((stepper) => {
    const id = stepper.dataset.cartQtyFor!;
    stepper.querySelector(".qty-minus")?.addEventListener("click", () => {
      const line = cart.get(id);
      if (!line) return;
      line.qty = Math.max(1, line.qty - 1);
      renderCart();
    });
    stepper.querySelector(".qty-plus")?.addEventListener("click", () => {
      const line = cart.get(id);
      if (!line) return;
      line.qty = Math.min(20, line.qty + 1);
      renderCart();
    });
  });
}

function openCart() {
  document.getElementById("cart-drawer")?.classList.add("is-open");
  document.getElementById("cart-backdrop")?.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  document.getElementById("cart-drawer")?.classList.remove("is-open");
  document.getElementById("cart-backdrop")?.classList.remove("is-open");
  document.body.style.overflow = "";
}

function initCart() {
  document.getElementById("cart-toggle")?.addEventListener("click", openCart);
  document.getElementById("cart-close")?.addEventListener("click", closeCart);
  document.getElementById("cart-backdrop")?.addEventListener("click", closeCart);
  document.getElementById("cart-empty-shop")?.addEventListener("click", () => {
    closeCart();
    document.getElementById("flavors")?.scrollIntoView({ behavior: "smooth" });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCart();
  });

  document.querySelectorAll<HTMLElement>("[data-product-id]").forEach((card) => {
    const addBtn = card.querySelector<HTMLButtonElement>(".add-to-cart");
    if (!addBtn) return;

    addBtn.addEventListener("click", () => {
      const id = card.dataset.productId!;
      const name = card.dataset.productName!;
      const price = parseFloat(card.dataset.productPrice!);
      const image = card.querySelector("img")?.getAttribute("src") ?? undefined;

      const stepper = card.querySelector<HTMLElement & { getQty?: () => number }>(".qty-stepper");
      const qty = stepper?.getQty ? stepper.getQty() : 1;

      const existing = cart.get(id);
      if (existing) {
        existing.qty += qty;
      } else {
        cart.set(id, { id, name, price, qty, image });
      }

      renderCart();
      openCart();

      const originalLabel = addBtn.textContent;
      addBtn.textContent = "Added";
      addBtn.disabled = true;
      setTimeout(() => {
        addBtn.textContent = originalLabel;
        addBtn.disabled = false;
      }, 1200);
    });
  });

  document.getElementById("cart-checkout")?.addEventListener("click", () => {
    const note = document.getElementById("cart-checkout-note");
    if (note) {
      note.textContent = "Checkout isn't connected yet. This is a design preview, not the live store.";
    }
  });

  renderCart();
}

/* ---------- Reviews marquee ---------- */
function initReviewsMarquee() {
  const row = document.querySelector<HTMLElement>(".reviews__row");
  if (!row) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return; // keep the plain manual-scroll row for these users

  const originalCards = Array.from(row.children);
  originalCards.forEach((card) => {
    const clone = card.cloneNode(true) as HTMLElement;
    clone.setAttribute("aria-hidden", "true");
    row.appendChild(clone);
  });

  row.classList.add("reviews__row--auto");
}

/* ---------- Newsletter (front-end only) ---------- */
function initNewsletter() {
  const form = document.getElementById("newsletter-form") as HTMLFormElement | null;
  const note = document.getElementById("newsletter-note");
  if (!form || !note) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    note.textContent = "Thanks. This form isn't wired up to anything yet.";
    form.reset();
  });
}

initPreloader();
initNav();
initHero();
initReveal();
initQtySteppers();
initCart();
initReviewsMarquee();
initNewsletter();
