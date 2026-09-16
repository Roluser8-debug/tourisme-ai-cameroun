// Carte interactive (Leaflet.js) — sites écotouristiques, aires culturelles, villes hôtelières

document.addEventListener("DOMContentLoaded", () => {
  const mapEl = document.getElementById("carte-cameroun");
  if (!mapEl || typeof L === "undefined") return;

  const map = L.map(mapEl).setView([5.7, 12.4], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  function makeIcon(emoji) {
    return L.divIcon({
      html: `<span class="map-marker">${emoji}</span>`,
      className: "map-marker-wrapper",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }

  const layers = {
    sites: L.layerGroup().addTo(map),
    culture: L.layerGroup().addTo(map),
    hotels: L.layerGroup().addTo(map),
  };

  Promise.all([
    fetch("data/sites.json").then((r) => r.json()),
    fetch("data/cultural-areas.json").then((r) => r.json()),
    fetch("data/villes.json").then((r) => r.json()),
    fetch("data/hotels.json").then((r) => r.json()),
  ])
    .then(([sites, areas, villes, hotels]) => {
      sites.forEach((site) => {
        if (!site.lat || !site.lng) return;
        L.marker([site.lat, site.lng], { icon: makeIcon(site.icone || "🌿") })
          .bindPopup(
            `<strong>${site.icone || "🌿"} ${site.nom}</strong><br>${site.region}<br><a href="eco-tourisme.html">Voir la fiche</a>`
          )
          .addTo(layers.sites);
      });

      areas.forEach((area) => {
        if (!area.lat || !area.lng) return;
        L.marker([area.lat, area.lng], { icon: makeIcon(area.icone || "🏛️") })
          .bindPopup(
            `<strong>${area.icone || "🏛️"} ${area.nom}</strong><br>${area.region}<br><a href="culture-gastronomie.html">Voir la fiche</a>`
          )
          .addTo(layers.culture);
      });

      const hotelCountByVille = {};
      hotels.forEach((h) => {
        hotelCountByVille[h.ville] = (hotelCountByVille[h.ville] || 0) + 1;
      });

      villes.forEach((v) => {
        const count = hotelCountByVille[v.ville] || 0;
        if (count === 0) return;
        L.marker([v.lat, v.lng], { icon: makeIcon("🏨") })
          .bindPopup(
            `<strong>🏨 ${v.ville}</strong><br>${count} hôtel${count > 1 ? "s" : ""}<br><a href="hotels.html?ville=${encodeURIComponent(v.ville)}">Voir les hôtels</a>`
          )
          .addTo(layers.hotels);
      });
    })
    .catch((err) => {
      console.error("Erreur de chargement des données de la carte :", err);
    });

  document.querySelectorAll(".map-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.filter;
      const isActive = btn.classList.toggle("active");
      if (isActive) {
        map.addLayer(layers[key]);
      } else {
        map.removeLayer(layers[key]);
      }
    });
  });
});
