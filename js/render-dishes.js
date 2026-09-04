// Affiche les 14 mets emblématiques (data/dishes.json) sous forme de cartes.

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("dishes-grid");
  if (!grid) return;

  fetch("data/dishes.json")
    .then((res) => res.json())
    .then((dishes) => {
      grid.innerHTML = dishes.map(renderDishCard).join("");
    })
    .catch((err) => {
      console.error("Erreur de chargement des mets emblématiques :", err);
      grid.innerHTML =
        '<div class="placeholder-block"><strong>Impossible de charger les mets emblématiques</strong>Merci de réessayer plus tard.</div>';
    });
});

function renderDishCard(dish) {
  return `
    <div class="card">
      <div class="card-body">
        <span class="card-region-badge">${dish.region}</span>
        <h3>🍽️ ${dish.nom}</h3>
        <p>${dish.description}</p>
        <p class="card-meta"><strong>Se déguste avec :</strong> ${dish.accompagnement}</p>
      </div>
    </div>
  `;
}
