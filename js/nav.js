export function initNav() {
  const header = document.querySelector("[data-site-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const navLinks = document.querySelector("[data-nav-links]");
  const links = [...document.querySelectorAll(".nav-link")];
  if (!header || !toggle || !navLinks) return;

  const closeMenu = () => {
    header.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
  };

  const syncHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 50);
  };

  toggle.addEventListener("click", () => {
    const open = !header.classList.contains("is-open");
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();

  const sections = [...document.querySelectorAll("[data-section]")];
  const byHash = new Map(links.map((link) => [link.getAttribute("href"), link]));
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    const active = byHash.get(`#${visible.target.id}`);
    if (!active) return;
    links.forEach((link) => link.classList.toggle("is-active", link === active));
  }, {
    rootMargin: "-30% 0px -55% 0px",
    threshold: [0.08, 0.18, 0.34]
  });

  sections.forEach((section) => observer.observe(section));
}
