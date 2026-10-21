(function () {
  const app = document.querySelector(".app");
  const side = document.querySelector(".app-side");
  if (!app || !side) return;
  const page = app.dataset.page;
  const count = (window.PANGEA_COINS || []).length;

  side.innerHTML = `
    <div class="side-top">
      <a href="../index.html" aria-label="Pangea, home"><span data-mark="32"></span></a>
      <button type="button" class="side-collapse" aria-label="Collapse the sidebar">«</button>
    </div>
    <nav class="app-nav">
      <a href="explore.html" ${page === "explore" ? 'aria-current="page"' : ""}>Explore <span class="nav-count">${count}</span></a>
      <a href="bridge.html" ${page === "bridge" ? 'aria-current="page"' : ""}>Bridge</a>
      <a href="live.html" ${page === "live" ? 'aria-current="page"' : ""}>Live data</a>
    </nav>
    <a class="side-launch" href="launch.html">+ &nbsp;Launch</a>
    <div class="side-foot">
      <a class="side-docs" href="docs.html">Docs <span>↗</span></a>
      <a class="side-token" href="token.html?id=pangea"><b>$PANGEA</b><span>$1.75M</span></a>
      <div class="side-langs" aria-label="Language"></div>
    </div>`;

  const langs = [
    ["en", "EN"], ["zh", "中文"], ["ja", "日本語"], ["ko", "한국어"], ["es", "ES"],
    ["pt", "PT"], ["ru", "RU"], ["tr", "TR"], ["fr", "FR"], ["de", "DE"]
  ];
  const box = side.querySelector(".side-langs");
  let current = "en";
  try { current = localStorage.getItem("pangea.locale") || "en"; } catch (err) {}
  langs.forEach(([code, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.on = code === current ? "1" : "0";
    button.addEventListener("click", () => {
      try { localStorage.setItem("pangea.locale", code); } catch (err) {}
      document.documentElement.lang = code;
      box.querySelectorAll("button").forEach((item) => { item.dataset.on = item === button ? "1" : "0"; });
    });
    box.append(button);
  });

  side.querySelector(".side-collapse").addEventListener("click", () => {
    app.classList.toggle("is-collapsed");
  });

  const top = document.querySelector(".app-top");
  if (top && !top.childElementCount) {
    top.innerHTML = `
      <input class="app-search" type="search" placeholder="Search name, ticker or address" aria-label="Search tokens">
      <button type="button" class="icon-btn" data-theme aria-label="Switch between light and dark">◐</button>
      <button type="button" class="connect-btn" data-connect>Connect</button>`;
  }

  document.querySelector("[data-theme]")?.addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme === "dark"
      || (document.documentElement.dataset.theme !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.classList.toggle("dark", next === "dark");
    try { localStorage.setItem("pangea.theme", next); } catch (err) {}
  });

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.hidden = true;
  modal.innerHTML = `<section><h2 style="margin:0 0 8px">Connect</h2><p style="color:var(--soft);margin:0 0 16px">This is a local preview of Pangea. It does not connect a wallet or send a transaction.</p><button type="button" class="primary" data-close>Close</button></section>`;
  document.body.append(modal);
  const open = () => { modal.hidden = false; };
  document.querySelectorAll("[data-connect]").forEach((button) => button.addEventListener("click", open));
  modal.querySelector("[data-close]").addEventListener("click", () => { modal.hidden = true; });
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.hidden = true; });

  if (window.fillPangeaMarks) window.fillPangeaMarks();
  else document.querySelectorAll("[data-mark]").forEach((slot) => {
    const size = slot.getAttribute("data-mark") || "26";
    slot.innerHTML = '<svg width="' + size + '" height="' + size + '" viewBox="196.5 196.5 630 630" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="' + window.PANGEA_MARK + '"></path></svg>';
  });
})();
