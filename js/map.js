// Carte intelligente (Leaflet.js) : 6 catégories de lieux, fiche détaillée au clic,
// « Explorer autour de moi » (position ou ville choisie) et « Ajouter à mon voyage ».
// Les lieux ajoutés sont mémorisés par window.CamtourTrip (voir main.js) et repris par la page Mon voyage.

document.addEventListener("DOMContentLoaded", () => {
  const mapEl = document.getElementById("carte-cameroun");
  if (!mapEl || typeof L === "undefined") return;

  const detailEl = document.getElementById("map-detail");
  const nearbyEl = document.getElementById("map-nearby");
  const trayEl = document.getElementById("map-tray");
  const locateBtn = document.getElementById("map-locate");
  const citySelect = document.getElementById("map-city");
  const statusEl = document.getElementById("map-locate-status");

  const map = L.map(mapEl).setView([5.7, 12.4], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // "decalage" (en pixels) écarte les pastilles de catégories différentes qui partagent le même point
  // (par exemple culture, gastronomie et artisanat d'une même aire culturelle).
  const CATEGORIES = {
    nature: { label: "Nature", icone: "🌿", decalage: [0, 0] },
    culture: { label: "Culture", icone: "🏛️", decalage: [-30, -16] },
    gastronomie: { label: "Gastronomie", icone: "🍲", decalage: [0, -32] },
    artisanat: { label: "Artisanat", icone: "🎨", decalage: [30, -16] },
    evenements: { label: "Événements", icone: "🎉", decalage: [-20, 26] },
    hotels: { label: "Hôtels", icone: "🏨", decalage: [20, 26] },
  };

  const layers = {};
  Object.keys(CATEGORIES).forEach((cat) => {
    layers[cat] = L.layerGroup().addTo(map);
  });
  const activeCats = new Set(Object.keys(CATEGORIES));

  const places = [];
  const markers = {};
  let selectedId = null;
  let origin = null; // { lat, lng, label, marker }

  // ---------- Outils ----------

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]);
  }

  function norm(text) {
    return String(text)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace("soudano", "sudano");
  }

  // Distance à vol d'oiseau en km (formule de haversine)
  function distanceKm(lat1, lng1, lat2, lng2) {
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLng = (lng2 - lng1) * rad;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(a));
  }

  function withDistance(place) {
    return origin ? distanceKm(origin.lat, origin.lng, place.lat, place.lng) : null;
  }

  // ---------- Construction des lieux à partir des données du site ----------

  function addPlace(place) {
    if (typeof place.lat !== "number" || typeof place.lng !== "number") return;
    place.lignes = (place.lignes || []).filter(([, text]) => text);
    places.push(place);
  }

  function buildPlaces({ sites, areas, villes, hotels, dishes, events }) {
    sites.forEach((site) =>
      addPlace({
        id: `site-${site.id}`,
        cat: "nature",
        nom: site.nom,
        icone: site.icone || "🌿",
        lieu: site.region,
        lat: site.lat,
        lng: site.lng,
        resume: site.description,
        lignes: [
          ["🧭", site.activites && `Activités : ${site.activites.join(", ")}`],
          ["🗓️", site.meilleure_periode && `Meilleure période : ${site.meilleure_periode}`],
          ["🌱", site.conseil_durable],
        ],
        lien: { href: "eco-tourisme.html", label: "Voir la fiche" },
      })
    );

    areas.forEach((area) => {
      addPlace({
        id: `culture-${area.id}`,
        cat: "culture",
        nom: `Aire culturelle ${area.nom}`,
        icone: area.icone || "🏛️",
        lieu: area.region,
        lat: area.lat,
        lng: area.lng,
        resume: area.description,
        lignes: [["🎭", area.traditions && `Traditions : ${area.traditions.join(", ")}`]],
        lien: { href: "culture-gastronomie.html", label: "Voir la fiche" },
      });

      const areaDishes = dishes.filter((d) => norm(d.region).includes(norm(area.nom)));
      if (areaDishes.length) {
        addPlace({
          id: `gastronomie-${area.id}`,
          cat: "gastronomie",
          nom: `Cuisine ${area.nom}`,
          icone: "🍲",
          lieu: area.region,
          lat: area.lat,
          lng: area.lng,
          resume: `${areaDishes.length} mets emblématiques : ${areaDishes.map((d) => d.nom).join(", ")}.`,
          lignes: areaDishes.map((d) => ["🍲", `${d.nom} — ${d.description}`]),
          lien: { href: "culture-gastronomie.html", label: "Voir les mets" },
        });
      }

      if (area.artisanat) {
        addPlace({
          id: `artisanat-${area.id}`,
          cat: "artisanat",
          nom: `Artisanat ${area.nom}`,
          icone: "🎨",
          lieu: area.region,
          lat: area.lat,
          lng: area.lng,
          resume: area.artisanat,
          lignes: [],
          lien: { href: "culture-gastronomie.html", label: "Voir la route des artisans" },
        });
      }
    });

    events.forEach((ev) =>
      addPlace({
        id: `event-${ev.id}`,
        cat: "evenements",
        nom: ev.nom,
        icone: "🎉",
        lieu: `${ev.ville} · ${ev.aire}`,
        lat: ev.lat,
        lng: ev.lng,
        resume: ev.description,
        lignes: [
          ["📅", [ev.frequence, ev.periode].filter(Boolean).join(" — ")],
          ["⚠️", ev.approximatif && "Position approximative : vérifiez le lieu exact avant de partir."],
          ["ℹ️", "Dates exactes à confirmer auprès des organisateurs ou de l'office de tourisme."],
        ],
        lien: { href: "culture-gastronomie.html", label: "Voir la culture de la région" },
      })
    );

    const hotelsByVille = {};
    hotels.forEach((h) => {
      (hotelsByVille[h.ville] = hotelsByVille[h.ville] || []).push(h);
    });
    const budgetOrder = ["Économique", "Milieu de gamme", "Haut de gamme"];

    villes.forEach((v) => {
      const list = hotelsByVille[v.ville];
      if (!list) return;
      const budgets = budgetOrder.filter((b) => list.some((h) => h.budget === b));
      addPlace({
        id: `hotels-${v.ville}`,
        cat: "hotels",
        nom: `Hôtels à ${v.ville}`,
        icone: "🏨",
        lieu: v.ville,
        lat: v.lat,
        lng: v.lng,
        resume: `${list.length} hôtel${list.length > 1 ? "s" : ""} référencé${list.length > 1 ? "s" : ""} dans cette ville.`,
        lignes: list.slice(0, 4).map((h) => ["🏨", `${h.nom} (${h.budget})`]),
        budget: budgets.length ? `Hébergement : ${budgets.join(", ")}` : null,
        lien: { href: `hotels.html?ville=${encodeURIComponent(v.ville)}`, label: "Voir les hôtels" },
      });
    });
  }

  // ---------- Marqueurs ----------

  function makeIcon(place, selected) {
    const [dx, dy] = CATEGORIES[place.cat].decalage;
    return L.divIcon({
      html: `<span class="map-marker${selected ? " is-selected" : ""}">${place.icone}</span>`,
      className: "map-marker-wrapper",
      iconSize: [32, 32],
      iconAnchor: [16 - dx, 16 - dy],
    });
  }

  function addMarkers() {
    places.forEach((place) => {
      const marker = L.marker([place.lat, place.lng], { icon: makeIcon(place, false), title: place.nom })
        .bindTooltip(place.nom, { direction: "top", offset: [0, -14] })
        .on("click", () => showPlace(place))
        .addTo(layers[place.cat]);
      markers[place.id] = marker;
    });
  }

  // ---------- Fiche détaillée ----------

  function showPlace(place, { fly = false } = {}) {
    if (selectedId && markers[selectedId]) {
      const previous = places.find((p) => p.id === selectedId);
      markers[selectedId].setIcon(makeIcon(previous, false));
    }
    selectedId = place.id;
    markers[place.id].setIcon(makeIcon(place, true));
    if (fly) map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 9));

    const cat = CATEGORIES[place.cat];
    const d = withDistance(place);
    const added = window.CamtourTrip.has(place.id);

    detailEl.innerHTML = `
      <span class="map-badge">${cat.icone} ${cat.label}</span>
      <h3>${esc(place.icone)} ${esc(place.nom)}</h3>
      <p class="map-detail-place">📍 ${esc(place.lieu)}${d !== null ? ` · à environ ${Math.round(d)} km` : ""}</p>
      ${place.resume ? `<p class="map-detail-resume">${esc(place.resume)}</p>` : ""}
      ${
        place.lignes.length
          ? `<ul class="map-detail-lines">${place.lignes
              .map(([icon, text]) => `<li><span>${icon}</span> ${esc(text)}</li>`)
              .join("")}</ul>`
          : ""
      }
      <p class="map-detail-budget">💰 ${
        place.budget
          ? esc(place.budget)
          : "Budget : estimé par CAMTOUR AI dans votre itinéraire, une fois le lieu ajouté à votre voyage."
      }</p>
      <div class="map-detail-actions">
        <button type="button" id="map-add" class="btn ${added ? "btn-outline-dark" : "btn-gold"}">${
          added ? "✓ Ajouté — retirer" : "➕ Ajouter à mon voyage"
        }</button>
        ${place.lien ? `<a class="btn btn-outline-dark" href="${esc(place.lien.href)}">${esc(place.lien.label)}</a>` : ""}
      </div>
    `;

    document.getElementById("map-add").addEventListener("click", () => {
      if (window.CamtourTrip.has(place.id)) {
        window.CamtourTrip.remove(place.id);
      } else {
        window.CamtourTrip.add({
          id: place.id,
          cat: place.cat,
          nom: place.nom,
          icone: place.icone,
          lieu: place.lieu,
        });
      }
    });

    if (window.matchMedia("(max-width: 900px)").matches) {
      detailEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  // ---------- Explorer autour de moi ----------

  function refreshNearby() {
    if (!origin) {
      nearbyEl.hidden = true;
      return;
    }
    const nearest = places
      .filter((p) => activeCats.has(p.cat))
      .map((p) => ({ place: p, d: withDistance(p) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 8);

    if (!nearest.length) {
      nearbyEl.innerHTML = '<p class="map-panel-hint">Aucune catégorie active : activez au moins un filtre.</p>';
      nearbyEl.hidden = false;
      return;
    }

    nearbyEl.innerHTML = `
      <h3>📍 Autour de ${esc(origin.label)}</h3>
      <ol class="map-nearby-list">
        ${nearest
          .map(
            ({ place, d }) => `
          <li><button type="button" data-id="${esc(place.id)}">
            <span class="map-nearby-icon">${esc(place.icone)}</span>
            <span class="map-nearby-name">${esc(place.nom)}<small>${CATEGORIES[place.cat].label} · ${esc(place.lieu)}</small></span>
            <span class="map-nearby-dist">${Math.round(d)} km</span>
          </button></li>`
          )
          .join("")}
      </ol>
    `;
    nearbyEl.hidden = false;
    nearbyEl.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => showPlace(places.find((p) => p.id === btn.dataset.id), { fly: true }));
    });
    return nearest;
  }

  function setOrigin(lat, lng, label, { fromGps = false } = {}) {
    if (origin && origin.marker) map.removeLayer(origin.marker);
    origin = { lat, lng, label };
    origin.marker = L.circleMarker([lat, lng], {
      radius: 9,
      color: "#fff",
      weight: 3,
      fillColor: "#2f6b45",
      fillOpacity: 1,
    })
      .bindTooltip(fromGps ? "Vous êtes ici" : label)
      .addTo(map);

    const nearest = refreshNearby();
    if (!nearest || !nearest.length) return;

    if (nearest[0].d > 300) {
      // Loin du Cameroun : on montre les lieux les plus proches plutôt que la position
      map.fitBounds(L.latLngBounds(nearest.map(({ place }) => [place.lat, place.lng])), { padding: [40, 40] });
      statusEl.textContent = fromGps
        ? `Vous semblez être à plus de ${Math.round(nearest[0].d)} km du lieu le plus proche. Choisissez une ville du Cameroun dans la liste pour explorer autour d'elle.`
        : "";
    } else {
      map.flyTo([lat, lng], 9);
      statusEl.textContent = `${nearest.length} lieux à découvrir autour de ${label}.`;
    }
  }

  locateBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      statusEl.textContent = "Votre navigateur ne sait pas vous localiser. Choisissez une ville dans la liste.";
      return;
    }
    statusEl.textContent = "Localisation en cours…";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        citySelect.value = "";
        setOrigin(pos.coords.latitude, pos.coords.longitude, "vous", { fromGps: true });
      },
      () => {
        statusEl.textContent = "Impossible de vous localiser (accès refusé ou indisponible). Choisissez une ville dans la liste.";
      },
      { timeout: 10000 }
    );
  });

  // ---------- Mon voyage (lieux ajoutés) ----------

  function renderTray() {
    const list = window.CamtourTrip.get();
    if (!list.length) {
      trayEl.hidden = true;
      trayEl.innerHTML = "";
      return;
    }
    trayEl.innerHTML = `
      <h3>🧳 Mon voyage : ${list.length} lieu${list.length > 1 ? "x" : ""} choisi${list.length > 1 ? "s" : ""}</h3>
      <ul class="map-tray-list">
        ${list
          .map(
            (p) => `
          <li>${esc(p.icone)} ${esc(p.nom)}
            <button type="button" data-remove="${esc(p.id)}" aria-label="Retirer ${esc(p.nom)}">✕</button>
          </li>`
          )
          .join("")}
      </ul>
      <div class="map-tray-actions">
        <a class="btn btn-gold" href="planificateur.html">✨ Créer mon voyage avec ces lieux</a>
        <button type="button" id="map-tray-clear" class="btn btn-outline-dark">Vider la liste</button>
      </div>
    `;
    trayEl.hidden = false;
    trayEl.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => window.CamtourTrip.remove(btn.dataset.remove));
    });
    document.getElementById("map-tray-clear").addEventListener("click", () => window.CamtourTrip.clear());
  }

  window.addEventListener("camtour-trip-changed", () => {
    renderTray();
    const selected = places.find((p) => p.id === selectedId);
    if (selected) showPlace(selected); // remet à jour le bouton Ajouter / Retirer
  });

  // ---------- Filtres ----------

  document.querySelectorAll(".map-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.filter;
      const isActive = btn.classList.toggle("active");
      btn.setAttribute("aria-pressed", String(isActive));
      if (isActive) {
        activeCats.add(key);
        map.addLayer(layers[key]);
      } else {
        activeCats.delete(key);
        map.removeLayer(layers[key]);
      }
      refreshNearby();
    });
    btn.setAttribute("aria-pressed", "true");
  });

  // ---------- Chargement des données ----------

  Promise.all([
    fetch("data/sites.json").then((r) => r.json()),
    fetch("data/cultural-areas.json").then((r) => r.json()),
    fetch("data/villes.json").then((r) => r.json()),
    fetch("data/hotels.json").then((r) => r.json()),
    fetch("data/dishes.json").then((r) => r.json()),
    fetch("data/events.json").then((r) => r.json()),
  ])
    .then(([sites, areas, villes, hotels, dishes, events]) => {
      buildPlaces({ sites, areas, villes, hotels, dishes, events });
      addMarkers();
      renderTray();

      villes.forEach((v) => {
        const option = document.createElement("option");
        option.value = v.ville;
        option.textContent = v.ville;
        citySelect.appendChild(option);
      });
      citySelect.addEventListener("change", () => {
        const ville = villes.find((v) => v.ville === citySelect.value);
        if (ville) setOrigin(ville.lat, ville.lng, ville.ville);
      });
    })
    .catch((err) => {
      console.error("Erreur de chargement des données de la carte :", err);
      detailEl.innerHTML =
        '<p class="map-panel-hint">Impossible de charger les lieux de la carte. Merci de réessayer plus tard.</p>';
    });
});
