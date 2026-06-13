export function initScrollReveal() {
  document.documentElement.classList.add("js-animations");
  const items = [...document.querySelectorAll(".reveal:not([data-reveal-bound])")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((item) => {
      item.classList.add("is-visible");
      runCounters(item);
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      runCounters(entry.target);
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.16
  });

  items.forEach((item, index) => {
    item.dataset.revealBound = "true";
    item.style.transitionDelay = `${Math.min(index * 35, 220)}ms`;
    observer.observe(item);
  });
}

function runCounters(scope) {
  const counters = [...scope.querySelectorAll("[data-count]")];
  if (scope.matches && scope.matches("[data-count]")) counters.push(scope);

  counters.forEach((counter) => {
    if (counter.dataset.counted === "true") return;
    counter.dataset.counted = "true";

    const target = Number(counter.dataset.count || 0);
    const suffix = counter.dataset.suffix || "";
    const duration = 620;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });
}
