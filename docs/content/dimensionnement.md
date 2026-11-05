# Dimensionnement

Ce dont un bastion EndoriumFort a besoin en CPU, mémoire, disque et bande passante, et quels réglages relever quand on dépasse les valeurs livrées.

En bref : **le nombre de cibles et de comptes compte à peine. Ce qui consomme, c'est le nombre de sessions ouvertes en même temps, leur type, et la durée de conservation des enregistrements.** Une session de navigateur isolé (RBI) coûte autant de mémoire qu'une centaine de sessions SSH, et les enregistrements sont presque toujours le premier poste de disque.

> Pas envie de calculer à la main ? Le [calculateur de la page d'accueil](../index.html#sizing) fait ces calculs à partir de vos chiffres et donne les réglages Docker Compose ou Helm à appliquer.

Les chiffres ci-dessous viennent de mesures de l'image actuelle, arrondis vers le haut. Quand ils dépendent de l'usage, ils sont donnés en fourchette. Vérifiez-les sur votre installation après quelques semaines (voir « Vérifier en production » en bas de page).

## Profils types

| Profil | Sessions simultanées | Cibles / comptes | vCPU | RAM | Disque des enregistrements | Base |
|---|---|---|---|---|---|---|
| **Lab / PoC** | jusqu'à 10 SSH, 1 à 2 RBI | ≤ 50 / ≤ 20 | 2–3 | 2–3 Go | 20 Go (30 jours) | SQLite |
| **Petite équipe** | jusqu'à 50 SSH ou tunnels, ≤ 5 RBI | ≤ 500 / ≤ 100 | 2–4 | 4–6 Go | 0,3–1 To (1 an) | SQLite |
| **Taille moyenne** | jusqu'à 200 SSH ou tunnels, ≤ 12 RBI | ≤ 2 000 / ≤ 500 | 4–8 | 8–12 Go | 1–3 To (1 an) | PostgreSQL conseillé |
| **Grande taille** | 500 et plus, 20 RBI et plus | 5 000+ / 1 000+ | 8–16 | 16–32 Go | 3 To et plus (1 an) | PostgreSQL externe |

- La colonne **disque** suppose l'enregistrement RBI actif (Enterprise). Avec des terminaux seulement, divisez-la par dix ou plus.
- **Simultanées** veut dire ouvertes au même moment, pas utilisateurs par jour. Une équipe de 100 administrateurs a rarement plus de 20 à 30 sessions ouvertes à la fois.
- Pour la **grande taille**, placez des relais au plus près de chaque zone réseau : ils déchargent le bastion du trafic des tunnels.
- Le service de partage de fichiers se dimensionne à part : son disque est la somme des quotas des espaces utilisateurs (`EF_FS_QUOTA_MB`, 10 Go par utilisateur par défaut). Voir [Partage de fichiers](#/partage-fichiers).

## Ce que coûte chaque élément

### Mémoire et CPU

| Élément | Mémoire | CPU | Remarques |
|---|---|---|---|
| Bastion au repos (backend et nginx) | ~30 Mo | ~0 | Mesuré : le backend seul prend 15 Mo avec une base vide |
| Système et marge | 512 Mo à 1 Go | — | À garder quel que soit le profil |
| Terminal SSH web | 2–5 Mo | < 1 % d'un cœur | Un thread de lecture par session |
| Shell Kubernetes (Enterprise) | 40–60 Mo | faible | Chaque shell lance son propre processus `kubectl exec` |
| Tunnel agent : RDP natif, VNC, TCP | 1–2 Mo | suit le trafic | Les octets sont relayés, pas décodés |
| VNC dans le navigateur (noVNC) | 1–2 Mo | faible | Le bastion relaie le flux RFB |
| Session du proxy de base de données (Enterprise) | 1–3 Mo | faible | Plus une ligne en base par requête SQL (voir le disque) |
| **Navigateur isolé (RBI)** | **300–500 Mo** | **0,3 à 1 cœur** quand la page bouge | Mesuré : un Chromium headless prend ~290 Mo et 77 threads sur une page simple. Les applications web lourdes (vCenter, Grafana) dépassent 500 Mo |
| 1 000 cibles ou comptes | ~5–10 Mo | ~0 | Gardés en mémoire ; leur nombre n'est pas un facteur de dimensionnement |

### Formules

```
RAM   ≈ 1 Go
      + 5 Mo   × sessions SSH, tunnels et proxy de base simultanés
      + 50 Mo  × shells Kubernetes simultanés
      + 400 Mo × sessions RBI simultanées
      puis 30 % de marge

vCPU  ≈ 1
      + 0,5 × sessions RBI simultanées
      + 1 par tranche de ~300 sessions SSH simultanées
      + 1 par tranche de ~500 Mbit/s de trafic de tunnel (TLS)
      minimum 2
```

Exemple : 60 sessions SSH, 10 tunnels et 6 sessions RBI. RAM ≈ 1 Go + 70 × 5 Mo + 6 × 400 Mo ≈ 3,75 Go, donc 5 Go avec la marge. vCPU ≈ 1 + 3 + 1 = 5, donc 4 à 6 vCPU.

## Disque : enregistrements et journaux

Les enregistrements sont gardés jusqu'à ce que vous les supprimiez : **il n'y a pas de purge automatique**. Dimensionnez le volume des enregistrements pour toute la durée de conservation voulue, et surveillez-le.

| Donnée | Emplacement | Taille typique | Remarques |
|---|---|---|---|
| Enregistrement SSH ou Kubernetes (`.cast`, Enterprise) | volume des enregistrements | 0,1–1 Mo par heure de travail interactif | Les commandes qui affichent beaucoup (`tail -f`, `cat` de logs, builds) montent à 10–100 Mo par heure |
| Enregistrement RBI (`.efr`, Enterprise) | volume des enregistrements | 0,3–1 Go par heure d'utilisation | Images JPEG, écrites seulement quand la page change. Jusqu'à ~5 Go par heure pour un contenu toujours en mouvement (vidéo, tableaux de bord rafraîchis en continu) |
| Index de recherche des enregistrements (Enterprise) | base | une fraction de la taille des `.cast` | Seul le texte visible est indexé, pas les séquences d'échappement |
| Journal d'audit | volume de données | ~0,5 Ko par événement, 20 à 50 événements par session | ~1 Mo pour 1 000 sessions. Il grossit tant que le bastion tourne : exportez-le vers un SIEM pour la conservation longue ([Journal d'audit](#/audit)) |
| Journal des requêtes du proxy de base (Enterprise) | base | 0,3–1 Ko par requête SQL | Une application qui envoie des milliers de requêtes par minute à travers le proxy le remplit vite |
| Base (comptes, cibles, sessions) | volume de données ou PostgreSQL | < 100 Mo pour la plupart des installations | |

```
Disque des enregistrements ≈ heures de session par jour × taille par heure × jours de conservation × 1,2
```

Exemple, sur un an de conservation :

- 40 administrateurs × 4 h de SSH par jour × 0,5 Mo/h × 365 jours ≈ **30 Go** ;
- 5 utilisateurs × 2 h de RBI par jour × 0,5 Go/h × 365 jours ≈ **1,8 To**.

L'enregistrement RBI est de loin le premier poste. Pour le réduire, baissez `ENDORIUMFORT_RBI_MAX_FPS` (20 par défaut) et `ENDORIUMFORT_RBI_JPEG_QUALITY` (55 par défaut). Avec une licence Enterprise, toutes les sessions RBI sont enregistrées : prévoyez le disque plutôt que de compter le désactiver cible par cible.

Mettez le volume de données sur un stockage rapide en écriture : la base SQLite et le journal d'audit sont écrits à chaque action. Un stockage de capacité convient au volume des enregistrements.

## Bande passante

Par session simultanée, entre le navigateur de l'opérateur et le bastion :

| Session | Bande passante |
|---|---|
| Terminal SSH ou Kubernetes | quelques Ko/s |
| RDP natif par le tunnel agent | 0,1–2 Mbit/s ; 10 Mbit/s et plus avec de la vidéo |
| VNC (tunnel ou noVNC) | 1–5 Mbit/s |
| RBI | 2–12 Mbit/s quand la page bouge, presque rien quand elle est fixe |
| Proxy de base de données | ce qu'envoie l'application |

Le bastion consomme la même bande passante une seconde fois vers les cibles, sauf si un relais porte ce trajet.

## Limites à relever

Les fichiers livrés sont réglés pour une petite installation. Relevez ces limites en même temps que la machine.

| Où | Réglage | Valeur livrée | Quand la changer |
|---|---|---|---|
| `docker-compose.prod.yml` | `mem_limit`, `cpus` | 1 Go, 1,5 | Au-delà d'environ 50 sessions simultanées, ou dès que vous utilisez le RBI : mettez le résultat des formules |
| `docker-compose.prod.yml` | `pids_limit` | 256 | **Dès que vous utilisez le RBI.** Chaque navigateur isolé utilise environ 80 threads, et la limite compte les threads : à 256, seules deux ou trois sessions RBI démarrent. Comptez 100 par session RBI plus 100 (par exemple 1 400 pour 12 sessions RBI) |
| Helm `values.yaml` | `resources.limits` | 1 CPU, 1 Gi | Même règle que `mem_limit` et `cpus` |
| Helm `values.yaml` | `persistence` | données 2 Gi, enregistrements 10 Gi | Taille des enregistrements selon la formule du disque |
| Environnement | `ENDORIUMFORT_RBI_MAX_SESSIONS` | 12 | Baissez-la si la machine n'a pas 400 Mo à donner par session. Au-delà du plafond, les nouvelles sessions RBI sont refusées proprement au lieu d'épuiser la mémoire |
| `docker-compose.prod.yml` | `ulimits.nofile` | 65 535 | Suffit pour plusieurs milliers de sessions, rien à changer |

## SQLite ou PostgreSQL

- **SQLite** (par défaut) ne demande aucun serveur et suffit pour les profils Lab et Petite équipe. Il fonctionne sur un seul nœud.
- **PostgreSQL** est conseillé à partir de la taille moyenne, quand le proxy de base de données Enterprise journalise beaucoup de requêtes, et dès que plusieurs instances du bastion partagent une même base. Voir [Base de données](#/base-de-donnees).

## Vérifier en production

- **Mémoire et CPU** : `docker stats endoriumfort`, ou les métriques du pod sous Kubernetes. Regardez les pics aux heures de travail, pas la moyenne.
- **Sessions** : la métrique Prometheus `endoriumfort_sessions_active` (par protocole), exposée sur `/api/metrics`, donne les sessions simultanées.
- **Disque** : `du -sh` sur les volumes des enregistrements et des données, une fois par semaine le premier mois, puis extrapolez à votre durée de conservation.
- **RBI** : le message « Server at RBI capacity, retry shortly » signale que `ENDORIUMFORT_RBI_MAX_SESSIONS` est atteint. Un navigateur qui ne démarre pas signale en général un `pids_limit` ou une mémoire épuisés.
