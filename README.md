<div align="center">
  <img src="https://img.icons8.com/color/96/000000/delivery.png" width="80" height="80" alt="Logo DelivTrack"/>
  <h1> DelivTrack</h1>
  <p><strong>Plateforme de livraison urbaine complète — Connectez clients, livreurs et gestionnaires en temps réel</strong></p>
  
  [![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14.x-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
  [![React Native](https://img.shields.io/badge/React_Native-0.72-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-49.x-000020?logo=expo&logoColor=white)](https://expo.dev/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  
  <p><i>Projet de Fin d'Études (PFE) - Marrakech, Maroc 2026</i></p>
</div>

---

## À propos

**DelivTrack** est une plateforme de livraison urbaine inspirée de **Glovo**, développée dans le cadre d'un Projet de Fin d'Études. Elle permet aux clients de passer des commandes, aux livreurs de les accepter et de suivre leurs tournées, et aux gestionnaires de superviser l'ensemble des opérations en temps réel.

---

##  Architecture


```
pfm/
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
