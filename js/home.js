(function () {
  const CHAINS = [
    { key: "eth", label: "Ethereum", shade: "#8C8DFB" },
    { key: "base", label: "Base", shade: "#2F7CFF" },
    { key: "rh", label: "Robinhood", shade: "#35E07A" },
    { key: "bsc", label: "BSC", shade: "#F0B90B" },
    { key: "sol", label: "Solana", shade: "#9945FF" },
  ];
  const STOPS = [0, 0.6, 1];

  const hero = document.querySelector(".kn-hero");
  const claim = document.querySelector(".kn-claim");
  const lede = document.querySelector(".kn-lede");
  const openApp = document.querySelector("[data-open]");
  const launch = document.querySelector("[data-launch]");
  const steps = document.querySelector(".kn-steps");
  const today = document.querySelector("[data-today]");
  const future = document.querySelector("[data-future]");
  const when = document.querySelector(".kn-when");
  const track = document.querySelector(".kn-track");
  const legend = document.querySelector(".kn-legend");
  const canvas = document.querySelector(".kn-canvas");
  const langButtons = [...document.querySelectorAll(".kn-langs button")];
  const langSelect = document.querySelector(".kn-pick select");
  const themeButton = document.querySelector(".kn-round");

  let locales = [];
  let locale = null;
  let map = null;
  let progress = 0;

  function currentTheme() {
    const stored = document.documentElement.dataset.theme;
    if (stored === "light" || stored === "dark") return stored;
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(next) {
    document.documentElement.dataset.theme = next;
    document.documentElement.classList.toggle("dark", next === "dark");
    hero.dataset.theme = next;
    try { localStorage.setItem("pangea.theme", next); } catch (err) {}
    map?.retheme();
  }

  themeButton.addEventListener("click", () => {
    applyTheme(currentTheme() === "dark" ? "light" : "dark");
  });

  function splitClaim(text) {
    return text.split(/(?<=[,，、])/);
  }

  function paintCopy() {
    const copy = locale.copy;
    claim.replaceChildren(...splitClaim(copy.claim).map((part) => {
      const span = document.createElement("span");
      span.textContent = part;
      return span;
    }));
    lede.textContent = copy.lede;
    const ca = document.querySelector("[data-ca]");
    if (ca) ca.textContent = copy.ca || "0x9cf7b8cDD3384b6cC4DCeB45B871cC1f214B1146";
    openApp.textContent = copy.openApp;
    launch.firstChild.textContent = copy.ctaLaunch + " ";
    today.textContent = copy.time.today;
    future.textContent = "Pangea";
    document.documentElement.lang = locale.code;
    steps.replaceChildren(...copy.story.map((step, index) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      const tag = document.createElement("span");
      tag.className = "kn-tag";
      tag.textContent = step.tag;
      button.append(tag, document.createTextNode(step.text));
      button.addEventListener("click", () => map?.set(STOPS[index]));
      item.append(button);
      return item;
    }));
    langButtons.forEach((button) => {
      button.dataset.on = button.lang === locale.code ? "1" : "0";
      button.setAttribute("aria-pressed", button.lang === locale.code ? "true" : "false");
    });
    langSelect.value = locale.code;
    paintProgress(progress);
  }

  function setLocale(code) {
    locale = locales.find((item) => item.code === code) || locales[0];
    try { localStorage.setItem("pangea.locale", locale.code); } catch (err) {}
    paintCopy();
  }

  langButtons.forEach((button) => button.addEventListener("click", () => setLocale(button.lang)));
  langSelect.addEventListener("change", () => setLocale(langSelect.value));

  function paintLegend(t, hover) {
    const unite = Math.pow(Math.min(1, Math.max(0, (t - 0.85) / 0.15)), 2);
    legend.querySelector(".kn-legend-ring").setAttribute("opacity", unite.toFixed(3));
    legend.querySelector("[data-one]").setAttribute("opacity", unite.toFixed(3));
    CHAINS.forEach((chain, index) => {
      const group = legend.querySelector(`[data-chain="${chain.key}"]`);
      const origin = 108 * index + 5;
      const head = origin + (270 - origin) * t;
      group.setAttribute("opacity", hover >= 0 && hover !== index ? "0.35" : "1");
      group.querySelector("polyline").setAttribute("points", `${origin},84 ${origin},62 ${head.toFixed(2)},34`);
      group.querySelector("[data-head]").setAttribute("cx", head.toFixed(2));
    });
  }

  function paintProgress(t) {
    progress = t;
    hero.style.setProperty("--t", `${(100 * t).toFixed(2)}%`);
    const active = t < 0.3 ? 0 : t < 0.85 ? 1 : 2;
    [...steps.children].forEach((item, index) => {
      item.dataset.on = index === active ? "1" : "0";
      const button = item.querySelector("button");
      if (!button) return;
      if (index === active) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    today.dataset.on = t < 0.02 ? "1" : "0";
    future.dataset.on = t > 0.98 ? "1" : "0";
    paintLegend(t, Number(legend.dataset.hover || -1));
    if (!locale) return;
    const years = Math.round(250 * t);
    when.replaceChildren();
    if (t === 0) {
      when.textContent = locale.copy.time.now;
    } else {
      const [before, after] = locale.copy.time.ago.split("{n}");
      const strong = document.createElement("b");
      strong.textContent = String(years);
      when.append(document.createTextNode(before), strong, document.createTextNode(after));
    }
    track.setAttribute("aria-valuenow", String(years));
    track.setAttribute("aria-valuetext", when.textContent);
  }

  function pointerToProgress(clientX) {
    const box = track.getBoundingClientRect();
    map?.set((clientX - box.left) / box.width);
  }

  track.addEventListener("pointerdown", (event) => {
    pointerToProgress(event.clientX);
    const move = (ev) => pointerToProgress(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  });

  track.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") map?.nudge(0.04);
    if (event.key === "ArrowLeft") map?.nudge(-0.04);
  });

  hero.addEventListener("wheel", (event) => {
    if (document.documentElement.scrollHeight > window.innerHeight + 1) return;
    event.preventDefault();
    map?.nudge(0.0006 * event.deltaY);
  }, { passive: false });

  window.addEventListener("keydown", (event) => {
    const tag = event.target?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (event.key === "ArrowRight") map?.nudge(0.04);
    if (event.key === "ArrowLeft") map?.nudge(-0.04);
  });

  CHAINS.forEach((chain, index) => {
    const group = legend.querySelector(`[data-chain="${chain.key}"]`);
    group.addEventListener("mouseenter", () => {
      legend.dataset.hover = String(index);
      map?.highlight(index);
      paintLegend(progress, index);
    });
    group.addEventListener("mouseleave", () => {
      legend.dataset.hover = "-1";
      map?.highlight(-1);
      paintLegend(progress, -1);
    });
  });

  const storedTheme = document.documentElement.dataset.theme;
  hero.dataset.theme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "auto";

  map = window.mountPangeaMap(canvas, {
    url: "geo/pangea-dots.bin",
    colors: CHAINS.map((chain) => chain.shade),
    labels: CHAINS.map((chain) => chain.label),
    dotted: true,
    still: matchMedia("(prefers-reduced-motion: reduce)").matches,
    onDrift: paintProgress,
    onHover(chain) {
      legend.dataset.hover = String(chain);
      paintLegend(progress, chain);
    },
  });

  fetch("locales.json")
    .then((res) => res.json())
    .then((data) => {
      locales = data;
      let code = "en";
      try { code = localStorage.getItem("pangea.locale") || "en"; } catch (err) {}
      setLocale(code);
    });
})();
