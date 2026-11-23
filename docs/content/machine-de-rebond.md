# Machine de rebond native

La **machine de rebond** (*jump host*) est un bureau jetable ouvert dans la console. Il n'y a pas de serveur de rebond à construire, à patcher ni à durcir dans l'infrastructure : le bastion fournit le bureau, dans le navigateur de l'opérateur.

```
opérateur ◄─ images ── bastion : bureau jetable ── liste blanche ──► intranet, wiki
(navigateur) ─ clavier ─► (Chromium, proxy de sortie) ── refusé ──► tout le reste
```

Le bureau réunit :

| Fenêtre | Ce qu'elle fait |
|---|---|
| **Navigateur** | Barre d'adresse, précédent/suivant, onglets. Seuls les sites de la liste blanche s'ouvrent. |
| **Fichiers** | Le **dossier de session**, sur le bastion : les téléchargements y arrivent. De là, enregistrer sur le poste, envoyer depuis le poste, renommer, supprimer, ou copier vers un **drive** de partage. |
| **Terminal** | Une session SSH ordinaire vers une ressource SSH accessible à l'utilisateur, dans sa propre fenêtre. |

Une barre des tâches (menu **Démarrer**, fenêtres ouvertes, bouton d'arrêt) complète l'ensemble. Le bureau s'ouvre dans un onglet à part (`/?desk=<session>`).

## Déclarer une machine de rebond

Dans **Administration › Ressources**, créez une ressource au protocole **Machine de rebond (bureau)** :

| Champ | Rôle |
|---|---|
| Page d’accueil | La **page d’accueil** du bureau, par exemple `https://intranet.cabinet.local/`. Son hôte et son port sont toujours autorisés. |
| Sites autorisés | La liste blanche, une entrée par ligne : les seules destinations que le navigateur du bureau peut joindre. |

Formes acceptées dans la liste blanche :

| Entrée | Autorise |
|---|---|
| `wiki.cabinet.local` | cet hôte, ports 80 et 443 |
| `*.cabinet.local` | tous les sous-domaines (pas `cabinet.local` lui-même) |
| `supervision.cabinet.local:3000` | cet hôte, ce port seulement |
| `outils.cabinet.local:*` | cet hôte, tous les ports |
| `10.20.0.0/16` | une plage d'adresses IPv4 |

Attribuez la ressource aux personnes concernées comme toute autre ressource ; les règles d'accès (MFA, justification, horaires, approbation) s'appliquent à l'ouverture du bureau.

## Le cloisonnement

Chaque bureau a son propre **proxy de sortie**, sur le bastion :

- le navigateur ne résout aucun nom lui-même et ne sort que par ce proxy ;
- le proxy refuse toute destination hors de la liste blanche, et ce que le bastion refuse déjà (adresses de boucle locale, métadonnées de cloud…) ;
- une page refusée affiche un message dans le bureau ; la destination est journalisée une fois.

Rien ne persiste : profil du navigateur, cookies, dossier de session sont détruits à la fermeture du bureau.

## Fichiers et drives

- Un fichier téléchargé dans le navigateur arrive dans le **dossier de session**, jamais directement sur le poste.
- **Enregistrer sur ce poste** le transfère au poste de l'opérateur ; **Envoyer depuis ce poste** fait l'inverse (glisser-déposer accepté).
- Quand une page demande un fichier (bouton « Parcourir »), le bureau propose le dossier de session.
- Le panneau **Drive** ouvre un drive de [partage de fichiers](#/partage-fichiers) de l'utilisateur, avec les mêmes règles que depuis la carte. Les copies se font entre le drive et le dossier de session, **sur le bastion** : le fichier ne passe pas par le poste. `ENDORIUMFORT_JUMPHOST_DRIVE_MAX_MB` (défaut `256`) plafonne une copie.

## Presse-papiers

- **Coller** du texte du poste vers une page du bureau, comme dans le navigateur isolé.
- **Ctrl+C / Ctrl+X** dans une page du bureau copie dans le presse-papiers du poste.

Chaque copie est journalisée (`rbi.clipboard`) avec son sens, sa longueur et son empreinte SHA-256 — jamais le texte. En Enterprise, la politique de transfert peut interdire la copie vers le poste.

## Atteindre un site distant (Enterprise)

Une machine de rebond rattachée à un [relais](#/relais) joint chaque site de sa liste blanche **par ce relais**, jamais directement. Si le relais est hors ligne, le bureau ne s'ouvre pas.

## Traçabilité

| Événement | Quand |
|---|---|
| `rbi.open` / `rbi.close` | ouverture et fermeture du bureau |
| `jumphost.navigate` | chaque page principale visitée |
| `jumphost.blocked` | destination refusée (une fois par hôte et port) |
| `jumphost.file` | téléchargement, envoi, renommage, suppression, copie vers ou depuis un drive |
| `rbi.clipboard` | copie ou collage |

Les terminaux ouverts depuis le bureau sont des sessions SSH ordinaires, avec leur propre journal et leur enregistrement.

## Limites

- Repose sur le moteur `cdp` du [navigateur isolé](#/proxy-rbi) ; le moteur `tiles` est refusé pour un bureau.
- Pas de son ni de périphériques. Les applications Windows passent par l'[accès RDP](#/rdp-navigateur) (Enterprise).

> **Démo** — connectez-vous comme `c.moreau` et ouvrez **bureau-rebond** : le bureau, la liste blanche, le dossier de session, les drives et le terminal y sont simulés.
