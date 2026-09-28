const SCROLL_THRESHOLD = 300;

export function initScrollToTop() {
  const scrollButton = document.getElementById("scroll-to-top");
  if (!scrollButton) return;

  function updateScrollButton() {
    scrollButton?.classList.toggle(
      "visible",
      window.scrollY > SCROLL_THRESHOLD
    );
  }

  window.addEventListener("scroll", updateScrollButton, { passive: true });
  updateScrollButton();

  scrollButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
