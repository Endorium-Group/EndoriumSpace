# Introduction

**EndoriumFort** est un **bastion** de gestion des accès à privilèges (PAM), auto-hébergé et souverain. Il centralise et sécurise vos accès d'administration — SSH, HTTP, navigateur isolé — derrière une authentification forte, un coffre-fort de secrets et un journal d'audit infalsifiable.

Cette documentation couvre l'**édition Community (CE)** : gratuite, open-source, et pleinement fonctionnelle seule.

## Ce que fait la Community Edition

- **Terminal SSH dans le navigateur** — pas de client ni de clé à déployer sur les postes.
- **Proxy HTTP & navigateur isolé (RBI)** — accéder à des interfaces d'administration web de façon isolée.
- **Coffre-fort de secrets** — identifiants chiffrés en AES-256-GCM, jamais exposés en clair aux opérateurs.
- **MFA forte** — TOTP et passkeys/WebAuthn, imposables à toute l'organisation.
- **RBAC** — rôles et permissions (admin, opérateur, auditeur…).
- **Sessions en direct** + **journal d'audit infalsifiable** (chaîne de hachage vérifiable).
- **1 nœud autonome**, déployé en **une seule image Docker**.

## Au-delà de la CE

Les capacités avancées (RDP/VNC, relais multi-sites, SSO/LDAP/SCIM, cluster/HA, enregistrement de sessions, gouvernance JIT, Security Center…) relèvent de l'**édition Enterprise (EE)**, débloquée par une licence hors-ligne. Voir [Éditions (CE/EE)](#/editions).

## Prérequis

- Un hôte Linux avec **Docker** (ou Kubernetes).
- Un volume persistant pour les données.
- Un nom de domaine + certificat TLS (recommandé en production).

Prêt ? Passez à l'[installation](#/installation).
