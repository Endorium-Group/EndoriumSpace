# Partage de fichiers

Une ressource de type **`fileshare`** ouvre, dans un onglet dédié, un **drive web** : dossiers, téléversement par glisser-déposer, téléchargement (dossiers en `.zip`), renommage, suppression et jauge de quota.

Chaque utilisateur dispose de son **espace personnel** et peut **partager** un dossier ou un fichier avec d'autres comptes autorisés sur la même ressource, en lecture seule ou en lecture/écriture, avec une expiration optionnelle. Les vues « Partagés avec moi » et « Mes partages » permettent de suivre et de révoquer les partages.

**Édition** : Community et Enterprise, sans licence.

## Un service à part

Les fichiers ne sont **jamais** stockés ni servis par le bastion. Ils vivent dans un service séparé (`endoriumfort-files`), avec son propre conteneur et son propre volume :

- aucun accès à la base du bastion ni au réseau sortant ;
- utilisateur non-root, système de fichiers en lecture seule, aucune capacité ;
- accès disque confiné : `..`, chemins absolus et liens symboliques ne peuvent pas sortir d'un drive ;
- téléchargements toujours en pièce jointe, sous une CSP `sandbox` : un fichier HTML ou SVG déposé ne s'exécute jamais.

## Contrôle d'accès

Ouvrir le drive est une **session normale** du bastion : affectation de la ressource, politiques, justification, double validation, MFA, durée maximale. Terminer la session ferme le drive.

Le bastion remet au navigateur un ticket signé, valable 60 secondes et à usage unique, que le service de fichiers échange contre un accès de 15 minutes renouvelé tant que la session reste active.

## Journalisation

- Bastion : `fileshare.open`, en plus des événements habituels de session.
- Service de fichiers : chaque action (liste, téléchargement, envoi, création, renommage, suppression, partage), autorisée ou refusée, dans un journal chaîné par SHA-256.

## Déploiement

Les fichiers Docker Compose déclarent déjà le service. Il suffit de définir la clé partagée :

```bash
ENDORIUMFORT_FILESHARE_SECRET=$(openssl rand -hex 32)
```

Sans clé, le service répond `503` et le reste du bastion n'est pas affecté. Le chart Helm déploie le service séparément, avec son volume et une politique réseau qui n'admet que le bastion.

Supprimer une ressource `fileshare` purge son espace de stockage.
