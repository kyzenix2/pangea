(function () {
  try {
    var t = localStorage.getItem("pangea.theme");
    var c = t === "light" || t === "dark" ? t : null;
    var d = document.documentElement;
    d.dataset.theme = c || "auto";
    if ((c || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark") d.classList.add("dark");
  } catch (e) {}
})();
