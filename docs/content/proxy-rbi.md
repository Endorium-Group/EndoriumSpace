# Proxy HTTP & navigateur isolé (RBI)

Pour les cibles **web** — consoles d'hyperviseur, interfaces d'équipements réseau, outils d'administration — EndoriumFort utilise le **navigateur isolé** (Remote Browser Isolation, RBI).

## Principe

À l'ouverture d'une ressource HTTP ou HTTPS, le bastion lance un **navigateur Chromium jetable, côté serveur**, le dirige vers la cible et ne renvoie au poste de l'opérateur que **des images** de la page. Clavier et souris sont relayés en retour.

```
poste de l'opérateur  ◄── images ───  bastion (Chromium jetable)  ── HTTP(S) ──►  cible
                      ─── clavier/souris ──►
```

Conséquences :

- **le navigateur de l'opérateur ne touche jamais la cible** : un contenu web hostile reste confiné sur le serveur ;
- la cible n'a besoin d'être joignable **que depuis le bastion** ;
- les applications qui fonctionnent mal derrière un reverse-proxy classique (chemins réécrits, scripts exigeants) s'affichent exactement comme en accès direct ;
- chaque session a son propre navigateur et son propre profil, détruits à la fermeture : aucun cookie ni cache ne persiste d'une session à l'autre.

## Utilisation

1. Déclarez une ressource **HTTP** ou **HTTPS** avec l'adresse et le port de l'interface ([Déclarer une ressource](#/ressources)).
2. Sur la carte, ouvrez-la : le navigateur isolé s'affiche dans un **nouvel onglet**, en plein écran.
3. Fermez l'onglet pour terminer la session.

Si le navigateur bloque l'ouverture d'onglet, la session s'affiche dans une fenêtre par-dessus la console.

Le compte HTTP renseigné sur la ressource sert à l'authentification HTTP basique de la cible ; pour une page de connexion classique, l'opérateur se connecte dans le navigateur isolé.

## Copier-coller et fichiers

- **Coller** du texte depuis le poste vers la page isolée.
- **Déposer** un fichier vers la page — par exemple une image ISO sur le datastore d'un hyperviseur : glissez le fichier sur la vue, ou utilisez le bouton d'envoi de la page cible, et le bastion vous demande le fichier local.
- **Télécharger** un fichier produit par la page cible.

Les gros fichiers sont écrits sur disque côté bastion, pas chargés en mémoire. `ENDORIUMFORT_RBI_MAX_UPLOAD_MB` plafonne la taille d'un dépôt (défaut : sans limite).

> **Important en CE** — ces transferts fonctionnent, mais **ne sont pas arbitrés** : il n'existe pas de politique pour refuser un sens, plafonner un volume par type ou bloquer des extensions. **Tout transfert est autorisé** dès que la ressource est accessible. Si vous devez cloisonner les flux de fichiers, n'exposez pas la ressource à des opérateurs qui ne doivent pas en échanger. La gouvernance des transferts relève de l'édition Enterprise.

## Moteurs de rendu

| Moteur | Où | Remarques |
|---|---|---|
| `tiles` | images Docker publiées | Rendu par zones modifiées. Gère les listes déroulantes natives et les transferts de fichiers. Choisi automatiquement quand il est présent. |
| `cdp` | paquet Debian, images construites sans le module | Chromium en flux d'images. Ne sait pas afficher les menus déroulants natifs (`<select>`) ni transférer de fichiers. |

Le moteur actif est affiché dans les journaux de démarrage du conteneur. Pour forcer un choix : `ENDORIUMFORT_RBI_ENGINE=tiles` ou `cdp`.

## Capacité et qualité

Chaque session lance un navigateur complet : comptez quelques centaines de Mo de mémoire par session active.

| Variable | Défaut | Rôle |
|---|---|---|
| `ENDORIUMFORT_RBI_MAX_SESSIONS` | `12` | Navigateurs isolés simultanés. Au-delà, l'ouverture est refusée avec un message explicite. |
| `ENDORIUMFORT_RBI_MAX_FPS` | `20` | Images par seconde au maximum (0 à 60). |
| `ENDORIUMFORT_RBI_JPEG_QUALITY` | `55` | Qualité d'image (1 à 100). Plus haut : plus net, plus de bande passante. |
| `ENDORIUMFORT_RBI_MAX_WIDTH` / `_MAX_HEIGHT` | `1600` / `900` | Résolution maximale de la page distante. |
| `ENDORIUMFORT_RBI_MAX_UPLOAD_MB` | `0` | Taille maximale d'un dépôt de fichier (0 = sans limite). |

Sur une liaison lente, baissez d'abord la qualité, puis le nombre d'images par seconde.

## Traçabilité

Ouverture et fermeture du navigateur isolé sont journalisées (`rbi.open`, `rbi.close`), en plus des événements de session habituels.

## Limites

- **Linux uniquement** : le bastion doit tourner sur un hôte Linux (c'est le cas de l'image Docker).
- Pas de son, pas de webcam ni de micro.
- Les accès graphiques **RDP et VNC** relèvent de l'édition Enterprise.
