document.querySelectorAll("[data-mark]").forEach((slot) => {
  const size = slot.getAttribute("data-mark") || "26";
  slot.innerHTML = '<svg width="' + size + '" height="' + size + '" viewBox="196.5 196.5 630 630" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="' + window.PANGEA_MARK + '"></path></svg>';
});
