# DelivTrack

Plateforme de livraison urbaine complète développée dans le cadre d'un Projet de Fin d'Études (PFE). DelivTrack connecte clients, livreurs et gestionnaires autour d'une expérience de livraison en temps réel — inspirée de Glovo.

---

## Architecture

```
pfe3/
├── delivery-backend/      API REST Node.js + Express + PostgreSQL
├── delivery-frontend/     Dashboard gestionnaire React.js
└── delivery-mobile/       App mobile React Native (Expo) — Clients & Livreurs
```

---

## Fonctionnalités

### Clients (App mobile)
- Parcourir le catalogue : Café, Restaurants, Shopping, Pharmacie
- Passer une commande avec géocodage automatique de l'adresse (Nominatim)
- Suivre la livraison en temps réel sur la carte GPS
- Annuler une commande (avant prise en charge)
- Évaluer le livreur avec une note et un commentaire

### Livreurs (App mobile)
- Voir les commandes disponibles et les accepter
- Itinéraire optimisé avec navigation Google Maps
- Mise à jour du statut de chaque point : Livré / Échec
- Envoi de la position GPS en temps réel (toutes les 30 s)

### Gestionnaire (Dashboard Web)
- Tableau de bord analytique : KPI, taux de succès, temps moyen
- Carte live avec positions GPS des livreurs actifs
- Créer et gérer des tournées manuelles
- Gestion des livreurs : ajout, activation/désactivation, suppression

---

## Stack technique

| Couche | Technologies |
|---|---|
| Backend | Node.js, Express, Sequelize ORM, PostgreSQL |
| Frontend | React.js, React Router, Zustand, Leaflet |
| Mobile | React Native, Expo, React Navigation, Zustand |
| Carte & GPS | Leaflet (web), React Native Maps (mobile), Nominatim (géocodage) |
| Auth | JWT (JSON Web Token), bcryptjs |
| Temps réel | Polling 10–30 s sur positions GPS |

---

## Installation

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- Expo CLI (`npm install -g expo-cli`)

---

### 1. Backend

```bash
cd delivery-backend
npm install
```

Démarrer :
 
```bash
npm run dev
```
 
L'API sera disponible sur `http://localhost:3000`.

---


### 2. Frontend (Dashboard)

```bash
cd delivery-frontend
npm install
```


```

Dashboard disponible sur `http://localhost:5173`.

---

### 3. App mobile (Expo)

```bash
cd delivery-mobile
npm install
```

Modifier `src/api/api.js` :

```js
// Remplacer localhost par l'IP locale de votre machine
// Android émulateur : 10.0.2.2
// Appareil physique  : 192.168.x.x (votre IP locale)
const BASE_URL = 'http://192.168.x.x:3000/api';
```

Démarrer :

```bash
npx expo start
```

Scanner le QR code avec l'app **Expo Go** sur votre téléphone.

---



---

## Endpoints principaux

```
POST   /api/auth/login                  Connexion (client / livreur / gestionnaire)
POST   /api/auth/register               Inscription

GET    /api/orders                      Toutes les tournées
POST   /api/orders                      Créer une tournée (gestionnaire)
GET    /api/drivers/available-orders    Commandes disponibles (livreur)
POST   /api/drivers/accept-point/:id    Accepter une commande (livreur)
GET    /api/drivers/me/orders           Mes tournées (livreur)

POST   /api/client/order                Passer une commande (client)
GET    /api/client/my-orders            Mes commandes (client)
PATCH  /api/client/cancel/:id           Annuler une commande

POST   /api/tracking/gps               Envoyer position GPS (livreur)
GET    /api/tracking/live              Positions en direct (gestionnaire)
GET    /api/tracking/position/:id      Position d'un livreur (client)

PATCH  /api/points/:id/status          Mettre à jour statut (livré / échec)
POST   /api/client/rate/:id            Évaluer une livraison
```

---

## Rôles utilisateurs

| Rôle | Identifiant | Accès |
|---|---|---|
| `manager` | Email + mot de passe | Dashboard web |
| `driver` | Téléphone + mot de passe | App mobile (onglet livreur) |
| `client` | Email + mot de passe | App mobile (onglet client) |

---

## Captures d'écran

| Login | Dashboard | Carte live |
|---|---|---|
| App mobile | Commande | Itinéraire |

---



## Géocodage

Les adresses des clients sont automatiquement converties en coordonnées GPS via l'API **Nominatim (OpenStreetMap)** — gratuite, sans clé API requise. Le livreur est ensuite redirigé vers la position exacte dans Google Maps.

---

## Développé avec

- **Expo** — développement React Native simplifié
- **Sequelize** — ORM pour PostgreSQL
- **Zustand** — gestion d'état légère (React & React Native)
- **Leaflet / React Native Maps** — cartographie
- **Nominatim** — géocodage d'adresses

---

## Auteur

Projet de Fin du module — 2026  
Marrakech, Maroc
