# Déclarer une ressource

Une **ressource** est une cible à laquelle les utilisateurs accèdent par le bastion. Seuls les administrateurs en créent.

## Types disponibles en CE

| Protocole | Ce que l'utilisateur obtient | Page |
|---|---|---|
| **SSH** | Un terminal dans le navigateur, avec transfert de fichiers optionnel. | [Session SSH](#/session-ssh) |
| **HTTP / HTTPS** | L'interface web de la cible, dans un navigateur isolé côté serveur. | [Proxy HTTP & navigateur isolé](#/proxy-rbi) |
| **Partage de fichiers** | Un lecteur web personnel, avec partages. | [Partage de fichiers](#/partage-fichiers) |

Les autres protocoles de la liste sont propres à l'édition Enterprise.

## Créer une ressource

**Administration → Ressources → Nouvelle ressource.** Le formulaire est découpé en quatre blocs.

### Identité

| Champ | Rôle |
|---|---|
| **Nom** | Libellé affiché sur la carte, ex. « Base de prod — PostgreSQL ». |
| **Description** | Texte libre : à quoi sert la cible, qui contacter. |
| **Zone** | Regroupement sur la carte (site, environnement, équipe). Choisissez une zone existante ou créez-en une. |
| **Autres tags** | Mots-clés séparés par des virgules, utiles à la recherche. |
| **Image** | Pictogramme optionnel. |

### Connexion

| Champ | Rôle |
|---|---|
| **Protocole** | SSH, HTTP, HTTPS ou Partage de fichiers. |
| **Adresse** | Nom d'hôte ou IP **tel que le bastion le résout**, pas tel que le voit votre poste. |
| **Port** | 22 pour SSH, 80 ou 443 pour le web, ou le port réel du service. |

Une ressource de partage de fichiers n'a ni adresse ni port : seulement un libellé.

### Identifiants

Le compte utilisé pour se connecter à la cible :

- **Enregistré dans le coffre** — renseignez le compte et le mot de passe : ils sont chiffrés et injectés par le bastion à la connexion. L'opérateur ne les voit jamais. C'est le mode recommandé ; gardez « Coffre » dans **Utilisation du secret**.
- **Saisi à la connexion** — laissez le mot de passe vide : l'opérateur le tape à chaque ouverture.

Le mode « Compte temporaire créé à chaque session » relève de l'édition Enterprise.

Pour une ressource web, renseignez le **compte HTTP** si l'interface utilise une authentification HTTP basique.

Lors d'une modification, laisser le mot de passe vide **conserve** celui qui est enregistré.

### Règles d'accès

Niveau de risque, motif obligatoire, politique adaptative, garde-fou SSH, transfert de fichiers. Le formulaire affiche en direct **« Ce que les utilisateurs devront faire »** pour ouvrir la ressource. Détails : [Règles d'accès](#/regles-acces).

## Donner accès

Une ressource nouvellement créée n'est visible que des administrateurs. Pour l'ouvrir à un opérateur :

**Administration → Utilisateurs → (le compte) → onglet Accès**, puis cochez la ressource.

Retirer l'affectation retire l'accès immédiatement : l'opérateur ne la voit plus et ne peut plus ouvrir de session. Voir [Utilisateurs & rôles](#/utilisateurs).

## Modifier, supprimer

- Les règles d'accès sont vérifiées à chaque ouverture de session : une modification vaut pour les sessions suivantes. Pour couper un accès en cours, terminez la session ([Sessions](#/sessions)).
- La suppression retire aussi toutes les affectations. Pour une ressource de partage de fichiers, elle **supprime aussi les fichiers** de son espace.
- Création, modification et suppression sont journalisées (`resource.create`, `resource.update`, `resource.delete`).

## Tester

Depuis la **Carte**, double-cliquez la ressource. En cas d'échec, voir [Dépannage](#/depannage).

> **Atteindre un autre réseau** — le bastion doit pouvoir joindre la cible directement. Pour des cibles situées sur un autre site ou derrière un NAT, l'édition Enterprise propose des relais ; en CE, passez par un VPN entre les deux réseaux.
