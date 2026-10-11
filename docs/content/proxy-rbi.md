# Proxy HTTP & navigateur isolé (RBI)

Pour les cibles **web** (interfaces d'administration, consoles…), EndoriumFort propose deux modes.

## Proxy HTTP

Le bastion agit comme **reverse-proxy authentifié** vers l'application web cible. L'utilisateur accède à l'interface via le bastion, qui applique l'authentification et la journalisation.

- Déclarez une ressource de protocole `http`/`https` ([Déclarer une ressource](#/ressources)).
- Ouvrez-la depuis le tableau de bord : l'interface cible s'affiche derrière le bastion.

## Navigateur isolé (RBI)

Le **Remote Browser Isolation** exécute un navigateur **côté serveur** (dans le conteneur) et ne renvoie que le rendu à l'utilisateur. Idéal pour :

- Les interfaces sensibles (hyperviseurs, équipements réseau) que l'on ne veut pas exposer directement.
- Éviter que le poste de l'opérateur touche directement la cible.

Fonctions associées : **copier-coller contrôlé** et **transfert de fichiers** (par ex. déposer une image ISO sur un hyperviseur à travers le bastion). Les politiques fines de transfert (DLP, sens autorisés, tailles) relèvent de l'édition Enterprise.

## Choix du moteur RBI

Le moteur de navigateur isolé est sélectionné automatiquement selon l'image. Reportez-vous au dépôt pour les variables liées au RBI (taille max d'upload, moteur).

> Accès graphiques **RDP/VNC** : édition Enterprise.
