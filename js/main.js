// Comportement partagé : menu mobile + surlignage du lien actif + lieux choisis pour « Mon voyage »

// Lieux ajoutés depuis la carte, mémorisés dans le navigateur (localStorage).
// Chaque lieu : { id, cat, nom, icone, lieu }. La page Mon voyage les envoie à l'IA.
window.CamtourTrip = (() => {
  const KEY = "camtour-lieux";

  function read() {
    try {
      const list = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  function write(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (err) {
      /* stockage indisponible (navigation privée...) : on garde juste l'affichage courant */
    }
    window.dispatchEvent(new CustomEvent("camtour-trip-changed"));
  }

  return {
    get: read,
    has: (id) => read().some((p) => p.id === id),
    add(place) {
      const list = read();
      if (!list.some((p) => p.id === place.id)) write([...list, place]);
    },
    remove: (id) => write(read().filter((p) => p.id !== id)),
    clear: () => write([]),
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  // Pastille sur « Mon voyage » : nombre de lieux choisis
  const tripLink = document.querySelector('.main-nav a[data-page="planificateur"]');
  if (tripLink) {
    const badge = document.createElement("span");
    badge.className = "nav-badge";
    tripLink.appendChild(badge);
    const updateBadge = () => {
      const n = window.CamtourTrip.get().length;
      badge.textContent = n;
      badge.hidden = n === 0;
    };
    updateBadge();
    window.addEventListener("camtour-trip-changed", updateBadge);
    window.addEventListener("storage", updateBadge);
  }

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
