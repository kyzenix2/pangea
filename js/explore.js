(function () {
  const grid = document.querySelector("[data-coins]");
  if (!grid) return;
  const search = document.querySelector(".app-search");
  const buttons = [...document.querySelectorAll("[data-sort]")];
  const count = document.querySelector("[data-count]");
  let sort = "mcap";
  let query = "";

  function render() {
    const q = query.trim().toLowerCase();
    let rows = window.PANGEA_COINS.filter((coin) =>
      !q || [coin.name, coin.symbol, coin.addr, coin.id].join(" ").toLowerCase().includes(q)
    );
    rows.sort((a, b) => {
      if (sort === "new") return a.ageMin - b.ageMin;
      if (sort === "vol") return b.vol - a.vol;
      if (sort === "gain") return b.chg - a.chg;
      return b.mcap - a.mcap;
    });
    if (count) count.textContent = rows.length + " coins";
    grid.replaceChildren(...rows.map((coin) => {
      const link = document.createElement("a");
      link.className = "coin";
      link.href = "token.html?id=" + coin.id;
      const chgClass = coin.chg < 0 ? "down" : "up";
      const sign = coin.chg > 0 ? "+" : "";
      link.innerHTML = `
        <div class="coin-head">
          <div class="avatar" style="background:${coin.color};color:${coin.ink || "#17131c"}">${coin.tick}</div>
          <div><strong>${coin.name}</strong><em>$${coin.symbol}</em></div>
        </div>
        <div class="coin-sub"><span>${coin.chains} of 5 chains live</span><span>${coin.age}</span></div>
        <div class="coin-mcap"><span>${window.pangeaMoney(coin.mcap)}</span><span class="${chgClass}">${sign}${coin.chg.toFixed(2)}%</span></div>
        <div class="stats">
          <div>Price<b>${coin.price}</b></div>
          <div>Traded in 24h<b>${window.pangeaMoney(coin.vol)}</b></div>
          <div>In pools<b>${window.pangeaMoney(coin.pools)}</b></div>
        </div>`;
      return link;
    }));
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      sort = button.dataset.sort;
      buttons.forEach((item) => item.setAttribute("aria-pressed", item === button ? "true" : "false"));
      render();
    });
  });
  search?.addEventListener("input", () => {
    query = search.value;
    render();
  });
  render();
})();
