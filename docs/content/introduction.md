# Introduction

**EndoriumFort** est un **bastion** de gestion des accès à privilèges (PAM), auto-hébergé et souverain. Il centralise et sécurise vos accès d'administration — SSH, HTTP, navigateur isolé, partage de fichiers — derrière une authentification forte, un coffre-fort de secrets et un journal d'audit infalsifiable.

Cette documentation couvre l'**édition Community (CE)** : **gratuite pour un usage non commercial**, à code source ouvert à la lecture et à l'audit, et pleinement fonctionnelle seule.

> **Licence** — la CE est publiée sous une licence **« source-available »**, et non sous une licence open source au sens de l'OSI. Elle est gratuite pour les usages personnels, pédagogiques, de recherche, d'évaluation et internes **hors production**. Tout **usage commercial ou en production exige une licence Enterprise**. Voir [Éditions (CE/EE)](#/editions).

## Ce que fait la Community Edition

- **Terminal SSH dans le navigateur** — pas de client ni de clé à déployer sur les postes.
- **Transfert de fichiers SSH** — parcourir, télécharger et déposer sur la cible (SFTP, repli SCP), désactivé par défaut, autorisé ressource par ressource et sens par sens, plafonné en taille, chaque fichier tracé avec son SHA-256.
- **Snippets SSH** — commandes réutilisables, injectées ou exécutées en un clic.
- **Garde-fou de commandes** — blocage côté serveur des commandes dangereuses, avec ses propres événements d'audit.
- **Proxy HTTP & navigateur isolé (RBI)** — accéder à des interfaces d'administration web de façon isolée.
- **Partage de fichiers** — un lecteur web par utilisateur, avec partages et expiration, servi par un service séparé et durci ([Partage de fichiers](#/partage-fichiers)).
- **Coffre-fort de secrets** — identifiants chiffrés en AES-256-GCM, jamais exposés en clair aux opérateurs.
- **MFA forte** — TOTP et passkeys/WebAuthn, imposables à toute l'organisation.
- **RBAC** — rôles et permissions (admin, opérateur, auditeur…), avec périmètre d'accès par utilisateur.
- **Motif d'accès** — popup de justification et numéro de ticket exigibles par ressource, rattachés à l'audit.
- **Sessions en direct**, supervision en lecture seule, et **journal d'audit infalsifiable** (chaîne de hachage vérifiable) exportable en CSV.
- **1 nœud autonome**, déployé en **deux conteneurs** (le bastion et le service de partage de fichiers).

## Au-delà de la CE

Les capacités avancées — RDP/VNC, shells Kubernetes, relais multi-sites, SSO/LDAP/SCIM, cluster/HA, enregistrement de sessions, gouvernance JIT, secrets dynamiques, ITDR, Security Center — relèvent de l'**édition Enterprise (EE)**, débloquée par une licence hors-ligne. Voir [Éditions (CE/EE)](#/editions).

## Prérequis

- Un hôte Linux avec **Docker** (ou Kubernetes).
- Un volume persistant pour les données.
- Un nom de domaine + certificat TLS (recommandé en production).

Prêt ? Passez à l'[installation](#/installation).
