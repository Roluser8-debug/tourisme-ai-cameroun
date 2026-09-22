// Affiche les 14 mets emblématiques (data/dishes.json) sous forme de cartes.

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("dishes-grid");
  if (!grid) return;

  fetch("data/dishes.json")
    .then((res) => res.json())
    .then((dishes) => {
      const render = () => (grid.innerHTML = dishes.map(renderDishCard).join(""));
      render();
      window.addEventListener("camtour-lang-changed", render);
    })
    .catch((err) => {
      console.error("Erreur de chargement des mets emblématiques :", err);
      const t = window.CamtourI18n.t;
      grid.innerHTML = `<div class="placeholder-block"><strong>${t("culture_dishes_error")}</strong>${t("retry_later")}</div>`;
    });
});

function renderDishCard(dish) {
  const { tf, t } = window.CamtourI18n;
  return `
    <div class="card">
      <div class="card-image">
        <img src="${dish.image}" alt="${dish.nom}" loading="lazy" />
        <span class="card-region-badge">${tf(dish, "region")}</span>
      </div>
      <div class="card-body">
        <h3>🍽️ ${dish.nom}</h3>
        <p>${tf(dish, "description")}</p>
        <p class="card-meta"><strong>${t("culture_accompagnement_label")}</strong> ${tf(dish, "accompagnement")}</p>
      </div>
    </div>
  `;
}
