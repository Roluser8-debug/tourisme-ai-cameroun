# Assistant Touristique IA du Cameroun

Site web réalisé pour le concours « L'IA dans le Tourisme » — Journée Mondiale du Tourisme 2026 (Yaoundé, 23–27 septembre 2026).

## Voir le site en local

Le chatbot a besoin de la fonction serveur pour fonctionner, donc pour le tester il faut utiliser **Netlify CLI** plutôt que d'ouvrir directement `index.html` :

1. Copie `.env.example` en `.env` et colle ta vraie clé API Anthropic dedans.
2. Dans un terminal, à la racine du projet : `npx netlify dev`
3. Ouvre l'adresse affichée (en général `http://localhost:8888`).

Si tu veux juste voir les pages sans le chatbot, tu peux toujours ouvrir `index.html` directement dans le navigateur.

## Où en est le projet

⚠️ La Journée Mondiale du Tourisme a lieu du **23 au 27 septembre 2026** — il reste très peu de temps.

Site en ligne : **https://camtour-ai.netlify.app/**

Plan complet : `C:\Users\Rol-User\.claude\plans\stateful-yawning-puppy.md`

- [x] Phase 1 — Squelette et navigation
- [x] Phase 2 — Chatbot IA multilingue (testé et fonctionnel en ligne)
- [~] Phase 3 — Écotourisme (contenu écrit, en attente de vérification)
- [ ] Phase 4 — Culture, gastronomie, artisanat (contenu)
- [ ] Phase 5 — Annuaire d'hôtels (contenu)
- [ ] Phase 6 — Finitions et préparation démo

## Structure du projet

- `index.html`, `eco-tourisme.html`, `culture-gastronomie.html`, `hotels.html`, `a-propos.html` — les pages du site
- `css/style.css` — le style visuel (couleurs, mise en page, menu mobile, bulle de chat)
- `js/main.js` — le comportement du menu
- `js/chatbot-widget.js` — la bulle de discussion, parle à `/api/chat`
- `data/chatbot-knowledge.json` — les informations que connaît le chatbot (à enrichir en Phases 3-5)
- `netlify/functions/chat.js` — la fonction serveur qui appelle l'API Claude (clé API gardée secrète)
- `.env.example` — modèle pour ta clé API en local (jamais la vraie clé dans le code)
