# Déclarer une ressource

Une **ressource** est une cible à laquelle les utilisateurs accèdent via le bastion : un serveur SSH, une interface d'administration web, etc.

## Créer une ressource

1. Connectez-vous en tant qu'administrateur.
2. Allez dans **Ressources → Ajouter**.
3. Renseignez :
   - **Nom** : libellé lisible (ex. « Serveur de prod — DB »).
   - **Protocole** : `ssh` ou `http`/`https` (le `rdp`/`vnc` relève de l'édition Enterprise).
   - **Cible** : l'adresse de la machine (IP ou nom d'hôte **tel que vu par le bastion**).
   - **Port** : le port du service (22 pour SSH, 80/443 pour HTTP(S)…).
4. Enregistrez.

## Identifiants

- Vous pouvez associer un identifiant **stocké dans le coffre-fort** (voir [Coffre-fort](#/coffre)) : l'opérateur ouvre la session **sans jamais voir le mot de passe**.
- Ou laisser l'utilisateur saisir ses identifiants à la connexion.

## Donner accès

Par défaut, une ressource n'est visible que des administrateurs. Pour l'exposer à un opérateur :

1. **Utilisateurs → (l'utilisateur) → Périmètre d'accès**.
2. Accordez la ressource (ou un profil d'accès qui la contient).

Voir [Utilisateurs & rôles](#/utilisateurs).

## Tester

Depuis le tableau de bord, ouvrez une session vers la ressource :
- SSH → [Session SSH](#/session-ssh)
- Web → [Proxy HTTP & navigateur isolé](#/proxy-rbi)

> Pour atteindre des ressources sur un **réseau distant** (autre site, domicile d'un intervenant), un **relais** est nécessaire — fonctionnalité Enterprise.
