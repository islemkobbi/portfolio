import { NeuralBg } from "./neural-bg.js";
import { loadAllContent } from "./content-loader.js";
import { initNav } from "./nav.js";
import { initScrollReveal } from "./scroll-reveal.js";
import { initTheme } from "./theme.js";

initTheme();

const canvas = document.getElementById("neural-bg");
if (canvas) {
  new NeuralBg(canvas);
}

initNav();

loadAllContent()
  .then(() => {
    startHeroIntro();
    initScrollReveal();
  })
  .catch((error) => {
    console.error(error);
    showLoadFailure(error);
    startHeroIntro();
    initScrollReveal();
  });

function startHeroIntro() {
  const title = document.getElementById("hero-name");
  const content = document.querySelector(".hero-content");
  if (!title || !content) return;

  const full = title.textContent.trim();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    title.textContent = full;
    content.classList.add("is-typed");
    return;
  }

  title.textContent = "";
  let index = 0;
  const timer = window.setInterval(() => {
    title.textContent = full.slice(0, index + 1);
    index += 1;
    if (index >= full.length) {
      window.clearInterval(timer);
      content.classList.add("is-typed");
    }
  }, 40);
}

function showLoadFailure(error) {
  const main = document.getElementById("main");
  if (!main) return;
  const message = document.createElement("div");
  message.className = "section-inner empty-state";
  message.textContent = `The portfolio shell loaded, but content JSON could not be fetched. Run a local server and reload. ${error.message}`;
  main.prepend(message);
}
