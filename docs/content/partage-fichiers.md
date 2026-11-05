# Partage de fichiers

Une ressource de protocole **Partage de fichiers** ouvre un **lecteur web** : un espace personnel par utilisateur, des dossiers, du téléversement et du téléchargement, et des partages entre comptes du bastion.

Les fichiers ne sont **jamais** stockés ni servis par le bastion. Ils vivent dans un **service séparé** (`endoriumfort-files`), avec son propre conteneur, son propre volume et aucun accès à la base du bastion.

```
Navigateur ──/api/───►  bastion          décide QUI peut ouvrir le lecteur
     │                     │  ticket signé (60 s, usage unique)
     └──/files/──► endoriumfort-files    stocke et sert les fichiers
                   volume dédié, réseau interne, non-root
```

## Activer le service

Les deux fichiers compose déclarent déjà le service, son volume et son réseau. Il suffit de fournir la clé partagée qui signe les tickets :

```
# .env
ENDORIUMFORT_FILESHARE_SECRET=<openssl rand -hex 32>
```

Sans clé, le service démarre mais répond `503` — le reste du bastion n'est pas affecté.

| Variable | Côté | Défaut | Rôle |
|---|---|---|---|
| `ENDORIUMFORT_FILESHARE_SECRET` | les deux | — | Clé de signature des tickets (≥ 32 caractères). |
| `ENDORIUMFORT_FILESHARE_UPSTREAM` | bastion | — | URL du service, ex. `http://endoriumfort-files:8090`. |
| `ENDORIUMFORT_FILESHARE_MAX_BODY` | bastion | `2g` | Taille maximale d'une requête vers `/files/`. |
| `EF_FS_QUOTA_MB` | service | `10240` | Quota par espace utilisateur (0 = illimité). |
| `EF_FS_MAX_UPLOAD_MB` | service | `2048` | Taille maximale d'un fichier. |
| `EF_FS_SESSION_TTL_SECONDS` | service | `900` | Durée de l'accès au lecteur entre deux renouvellements. |
| `EF_FS_MAX_ZIP_ENTRIES` | service | `20000` | Nombre maximal d'éléments d'un dossier téléchargé en `.zip`. |

## Créer la ressource

**Ressources → Ajouter → protocole « Partage de fichiers »**. Il n'y a ni adresse ni port à renseigner : seulement un libellé. Affectez ensuite la ressource aux utilisateurs concernés, comme n'importe quelle autre.

Les règles d'accès s'appliquent normalement : périmètre, motif obligatoire, niveau de risque ([Règles d'accès](#/regles-acces)). Ouvrir un lecteur crée une **session** visible dans la console, qu'un administrateur peut terminer : le lecteur se ferme alors au plus tard à l'expiration de son accès, 15 minutes par défaut (`EF_FS_SESSION_TTL_SECONDS`).

## Partager

Un utilisateur peut partager un dossier ou un fichier avec d'autres comptes, en **lecture seule** ou en **lecture/écriture**, avec une **expiration** optionnelle. Les vues « Partagés avec moi » et « Mes partages » listent les deux sens.

- Seuls les comptes autorisés **sur la même ressource** apparaissent dans la liste des destinataires.
- On ne partage que ses propres éléments : pas de re-partage en cascade.
- Un fichier seul est toujours partagé en lecture seule.

## Traçabilité

Chaque action — `session.open`, `list`, `download`, `upload`, `mkdir`, `rename`, `delete`, `share.create`, `share.revoke` — est écrite par le service dans son propre journal, réussie **ou refusée**. Chaque ligne contient le hachage de la précédente : supprimer ou modifier une ligne casse la chaîne.

Côté bastion, l'ouverture d'un lecteur produit un événement `fileshare.open` dans le [journal d'audit](#/audit).

## Durcissement

Le service est segmenté par construction : conteneur et image distincts, réseau interne sans accès sortant, exécution non-root, système de fichiers en lecture seule hors `/data`, et refus noyau de toute sortie d'arborescence (`..`, chemins absolus, liens symboliques). Les téléchargements partent en `attachment` sous CSP `sandbox`, pour qu'un HTML ou un SVG déposé ne puisse jamais s'exécuter dans l'origine du bastion.

## Supprimer

Supprimer une ressource de partage supprime aussi son espace : le bastion envoie au service un ordre de purge signé, coupe les sessions ouvertes, et journalise le résultat des deux côtés.

> **Sauvegarde** — le volume du service est séparé de celui du bastion. Sauvegardez-le aussi ([Sauvegarde & restauration](#/sauvegarde)). Il n'y a pas de chiffrement applicatif au repos : utilisez un volume chiffré si nécessaire.

## Gérer les espaces en ligne de commande

Si le service était injoignable au moment d'une suppression de ressource, l'événement `fileshare.purge` du journal porte `outcome: failed`. Les espaces restants se listent et se purgent depuis le conteneur :

```
docker exec endoriumfort-files /endoriumfort-files spaces      # id, utilisateurs, octets
docker exec endoriumfort-files /endoriumfort-files purge 12    # supprime l'espace 12
```

## Limites

- Une seule instance du service. Un redémarrage oblige seulement l'interface à redemander un accès, ce qu'elle fait seule.
- Pas de chiffrement applicatif au repos : placez le volume sur un stockage chiffré si nécessaire.
