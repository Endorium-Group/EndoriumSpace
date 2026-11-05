# Sauvegarde & restauration

## Ce qu'il faut sauvegarder

| Quoi | Où | Indispensable |
|---|---|---|
| Volume de données | `/app/data` (Docker), `/var/lib/endoriumfort` (Debian) | **oui** : base SQLite, journal d'audit |
| Base PostgreSQL | votre serveur | **oui**, si vous l'utilisez ([Base de données](#/base-de-donnees)) |
| Volume du partage de fichiers | `/data` du conteneur `endoriumfort-files`, `/var/lib/endoriumfort-files` (Debian) | si vous utilisez les lecteurs |
| Clés et configuration | votre fichier `.env`, `docker-compose.override.yml` ou `/etc/endoriumfort/` | **oui** |

> **Les clés ne sont pas dans les volumes.** `ENDORIUMFORT_VAULT_KEY` déchiffre les secrets ; `ENDORIUMFORT_AUDIT_HMAC_KEY` permet de vérifier le journal. Sans elles, une sauvegarde de volume ne restaure ni les secrets ni la preuve d'intégrité. Conservez-les dans un gestionnaire de secrets, **séparément** des archives de données.

Le volume du partage de fichiers est **séparé** de celui du bastion : il s'oublie facilement.

## Sauvegarder (Docker)

Arrêtez le bastion le temps de la copie, pour une base et un journal cohérents :

```
docker stop endoriumfort endoriumfort-files

docker run --rm -v ef-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/ef-data-$(date +%F).tar.gz -C /data .

docker run --rm -v ef-files:/data -v "$PWD":/backup alpine \
  tar czf /backup/ef-files-$(date +%F).tar.gz -C /data .

docker start endoriumfort-files endoriumfort
```

L'interruption dure quelques secondes. Sans arrêt, préférez un **instantané** du système de fichiers ou du volume (LVM, ZFS, snapshot cloud) : une copie à chaud d'une base SQLite en cours d'écriture peut être incohérente.

Planifiez la sauvegarde (cron, timer systemd) et testez une restauration au moins une fois.

## Sauvegarder (Debian)

```
sudo systemctl stop endoriumfort endoriumfort-files
sudo tar czf ef-$(date +%F).tar.gz /var/lib/endoriumfort /var/lib/endoriumfort-files /etc/endoriumfort
sudo systemctl start endoriumfort-files endoriumfort
```

`/etc/endoriumfort` contient vos clés : chiffrez l'archive, ou stockez-la à part.

## Restaurer (Docker)

```
docker stop endoriumfort
docker run --rm -v ef-data:/data -v "$PWD":/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/ef-data-AAAA-MM-JJ.tar.gz -C /data"
docker start endoriumfort
```

Même principe pour `ef-files`. Fournissez au bastion **exactement les mêmes clés** qu'au moment de la sauvegarde.

## Vérifier après restauration

- `docker logs endoriumfort` : pas d'erreur de base.
- Connexion administrateur, ressources présentes.
- Une session vers une ressource dont le mot de passe est dans le coffre : elle s'authentifie, donc la clé du coffre est la bonne.
- **Journal → Vérifier l'intégrité** : intègre.

## Plan de reprise

Notez quelque part hors du bastion :

- la version de l'image en service ;
- l'emplacement des sauvegardes et des clés ;
- la procédure ci-dessus.

Un bastion est un point de passage obligé : s'il tombe, plus personne n'administre rien. Prévoyez un accès de secours documenté aux cibles critiques, sous scellés.
