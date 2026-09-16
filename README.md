# CAMTOUR AI

Site web réalisé pour le concours « L'IA dans le Tourisme » — Journée Mondiale du Tourisme 2026 (Yaoundé, 23–27 septembre 2026).

## Voir le site en local

Le chatbot et le planificateur de voyage ont besoin de la fonction serveur pour fonctionner, donc pour les tester il faut utiliser **Netlify CLI** plutôt que d'ouvrir directement `index.html` :

1. Copie `.env.example` en `.env` et colle ta vraie clé API Anthropic dedans.
2. Dans un terminal, à la racine du projet : `npx netlify dev`
3. Ouvre l'adresse affichée (en général `http://localhost:8888`).

Si tu veux juste voir les pages sans le chatbot ni le planificateur, tu peux toujours ouvrir `index.html` directement dans le navigateur.

⚠️ **Le planificateur de voyage (`/api/trip-plan`) n'a pas pu être testé avec un vrai appel à l'API Claude pendant cette session** (pas de clé API disponible dans cet environnement) — seule la partie formulaire/affichage a été vérifiée avec des réponses simulées. Teste-le avec `netlify dev` (ou sur le site en ligne après déploiement) avant la démo, en particulier la fonction « Modifier mon voyage ».

## Où en est le projet

⚠️ La Journée Mondiale du Tourisme a lieu du **23 au 27 septembre 2026** — il reste très peu de temps.

Site en ligne : **https://camtour-ai.netlify.app/**

Plan complet : `C:\Users\Rol-User\.claude\plans\stateful-yawning-puppy.md`

- [x] Phase 1 — Squelette et navigation
- [x] Phase 2 — Chatbot IA multilingue (testé et fonctionnel en ligne)
- [x] Phase 3 — Écotourisme (13 parcs/réserves/sites naturels)
- [x] Phase 4 — Culture, gastronomie, artisanat (4 aires culturelles, 14 mets)
- [x] Phase 5 — Annuaire d'hôtels (16 hôtels, recherche ville/budget)
- [x] Phase 6 — Finitions et préparation démo (côté code ; reste la répétition et la vidéo de secours côté utilisateur)
- [x] Phase 7 — Planificateur de voyage IA (`planificateur.html`) et carte interactive (`carte.html`), renommage du site en « CAMTOUR AI », section artisanat — **à tester en priorité avant la démo** (voir avertissement ci-dessus)

## Script de démo (5 minutes)

1. **Intro (30s)** — présente le contexte : concours « L'IA dans le Tourisme », JMT 2026. Ouvre la page d'accueil.
2. **Page d'accueil (20s)** — montre les 4 axes du site (nature, culture, gastronomie, artisanat) et le bouton « Construire mon voyage ».
3. **Planificateur de voyage IA en direct (90s)** — clique sur « Mon voyage », remplis les 5 étapes (ex. Yaoundé, 3 jours, 150 000 FCFA, en couple, Nature + Culture), montre l'itinéraire jour par jour et le budget généré, puis tape « Réduis le budget à 80 000 FCFA » dans « Modifier mon voyage » pour montrer que l'IA recalcule.
4. **Assistant IA conversationnel (45s)** — clique sur la bulle de chat et pose 1-2 questions, par exemple :
   - En français : *« Quel parc me conseilles-tu si j'aime les gorilles ? »*
   - En anglais : *« Can you suggest a traditional dish from the North-West region? »*
   - Montre que l'assistant s'appuie sur le contenu du site (pas d'invention) et privilégie le tourisme durable.
5. **Carte interactive (30s)** — ouvre la page Carte, montre les filtres Nature/Culture/Hébergement et clique sur un marqueur.
6. **Contenu du site (45s)** — parcours rapide des pages Écotourisme, Culture &amp; Gastronomie (mets + artisanat), puis Hôtels (montre le filtre par ville/budget).
7. **Page « À propos » (20s)** — montre explicitement comment le projet répond aux 4 critères du jury, et les sources officielles MINTOUL.
8. **Conclusion (20s)** — rappelle l'ambition : une seule plateforme pour tout le tourisme camerounais, prête à être enrichie avec de vrais partenaires après le concours.

## Avant la démo — checklist

- [ ] Tester le Wi-Fi sur place à Yaoundé avant le passage (le site et le chatbot ont besoin d'internet).
- [ ] Préparer une **vidéo de secours** en cas de coupure Wi-Fi le jour J : enregistre un screen recording de ce script de démo en amont (par ex. avec l'enregistreur d'écran Windows : `Win + Alt + R`), et garde-la accessible **hors ligne** (clé USB ou stockée localement sur l'ordinateur de démo, pas seulement dans le cloud).
- [ ] Charger complètement le téléphone/ordinateur utilisé pour la démo.
- [ ] Répéter le script à voix haute au moins une fois avant le jour J.
- [ ] Vérifier que le site est bien accessible publiquement (`https://camtour-ai.netlify.app/`) depuis un réseau différent de chez toi (ex. data mobile).

## État des photos

**Photos officielles réelles (archives MINTOUL, ajoutées le 16/09/2026) :**
- `images/eco/chutes-lobe.jpg` — vraies chutes de la Lobé à Kribi (remplace une photo de la côte californienne affichée par erreur)
- `images/eco/waza.jpg` — vraies girafes du parc national de Waza
- `images/eco/benoue.jpg` — vrais éléphants du parc national de la Bénoué
- `images/eco/lobeke.jpg` — vrai bongo du parc national de Lobéké (crédit MINFOF)
- `images/eco/mont-cameroun.jpg` — vraie vue depuis le sentier sommital du Mont Cameroun
- `images/culture/grassfields.jpg` — vraie chefferie traditionnelle bamiléké
- `images/culture/sudano-sahelienne.jpg` — vrai pic de Rhumsiki
- `images/culture/fang-beti.jpg` — vraie case pygmée baka

**Photos réelles du lieu exact (Wikimedia Commons, ajoutées en septembre 2026) :**
- `images/eco/ekom-nkam.jpg` — vraies chutes d'Ekom-Nkam
- `images/eco/campo-maan.jpg` — vrai gorille du programme d'habituation du parc de Campo-Ma'an
- `images/eco/bamboutos.jpg` — vraie cascade dans les Monts Bamboutos
- `images/eco/menchum.jpg` — vraies chutes de la Menchum

**Photos encore génériques (illustration du thème, pas le lieu exact) :** `images/eco/korup.jpg`, `dja.jpg`, `mefou.jpg`, `lac-ossa.jpg`, `images/culture/sawa.jpg`, `images/dishes/*.jpg`, `images/hero.jpg` — à remplacer si d'autres vraies photos deviennent disponibles. Liste des crédits dans `a-propos.html`.

## Structure du projet

- `index.html`, `eco-tourisme.html`, `culture-gastronomie.html`, `hotels.html`, `planificateur.html`, `carte.html`, `a-propos.html` — les pages du site
- `css/style.css` — le style visuel (couleurs, mise en page, menu mobile, bulle de chat, planificateur, carte)
- `js/main.js` — le comportement du menu
- `js/chatbot-widget.js` — la bulle de discussion, parle à `/api/chat`
- `js/trip-planner.js` — le formulaire en 5 étapes et l'affichage de l'itinéraire, parle à `/api/trip-plan`
- `js/map.js` — la carte interactive (Leaflet.js, chargé depuis un CDN)
- `js/render-artisanat.js` — la section « Route des artisans » sur la page Culture &amp; Gastronomie
- `data/chatbot-knowledge.json` — les informations que connaissent le chatbot et le planificateur
- `data/villes.json` — coordonnées des villes hôtelières, utilisées par la carte
- `netlify/functions/chat.js` — la fonction serveur qui appelle l'API Claude pour le chatbot
- `netlify/functions/trip-plan.js` — la fonction serveur qui appelle l'API Claude pour le planificateur de voyage
- `.env.example` — modèle pour ta clé API en local (jamais la vraie clé dans le code)
