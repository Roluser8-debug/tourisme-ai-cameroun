// Comportement partagé : menu mobile + surlignage du lien actif

document.addEventListener("DOMContentLoaded", () => {
  const skipLink = document.createElement("a");
  skipLink.href = "#main-content";
  skipLink.className = "skip-link";
  skipLink.textContent = "Aller au contenu principal";
  document.body.insertBefore(skipLink, document.body.firstChild);

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => nav.classList.remove("open"));
    });
  }

  const currentPage = document.body.dataset.page;
  if (currentPage) {
    document.querySelectorAll(".main-nav a").forEach((link) => {
      if (link.dataset.page === currentPage) {
        link.classList.add("active");
      }
    });
  }

  const header = document.querySelector(".site-header");
  if (header) {
    const updateHeaderShadow = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    updateHeaderShadow();
    window.addEventListener("scroll", updateHeaderShadow, { passive: true });
  }

  document.querySelectorAll(".chat-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const launcher = document.querySelector(".chatbot-launcher");
      if (launcher) launcher.click();
    });
  });
});
