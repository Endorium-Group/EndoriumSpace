# Mise à jour

Les mises à jour sont publiées sous forme de **versions** numérotées. Seule la **dernière version** reçoit les correctifs de sécurité : restez à jour.

Suivez les nouvelles versions sur la page [Releases du dépôt](https://github.com/Endorium-Group/EndoriumFort-CE/releases) ou dans la catégorie *Announcements* des [discussions](https://github.com/Endorium-Group/EndoriumFort-CE/discussions).

## Avant de commencer

1. **Sauvegardez** ([Sauvegarde & restauration](#/sauvegarde)).
2. Notez la version en service : `curl -sk https://votre-hote/api/health`.
3. Lisez les notes de version de la cible, en particulier les changements de comportement.

Le schéma de la base est mis à jour automatiquement au démarrage de la nouvelle version.

## Épingler une version

En production, préférez un **numéro de version** à `latest`, pour décider vous-même quand mettre à jour :

```
ghcr.io/endorium-group/endoriumfort:<version>
ghcr.io/endorium-group/endoriumfort-files:<version>
```

Le bastion et le service de partage de fichiers se mettent à jour **ensemble, à la même version** : ils partagent le format des tickets d'accès.

## Docker compose

Changez `DOCKER_TAG` dans `.env`, puis :

```
docker compose pull
docker compose up -d
```

## docker run

```
docker pull ghcr.io/endorium-group/endoriumfort:<version>
docker stop endoriumfort && docker rm endoriumfort
docker run -d --name endoriumfort ... ghcr.io/endorium-group/endoriumfort:<version>
```

Reprenez **exactement** les mêmes volumes et variables d'environnement qu'avant.

## Paquet Debian

```
sudo apt-get update
sudo apt-get install --only-upgrade endoriumfort-server
```

Les services redémarrent d'eux-mêmes ; vos fichiers de `/etc/endoriumfort/` sont conservés.

## Kubernetes

```
helm upgrade ef oci://ghcr.io/endorium-group/charts/endoriumfort --version <X.Y.Z> -f mes-valeurs.yaml
```

Le chart arrête l'ancien pod avant de démarrer le nouveau : prévoyez une courte coupure.

## Vérifier l'authenticité d'une image

Les images sont signées par Cosign (signature *keyless* liée au dépôt) :

```
cosign verify ghcr.io/endorium-group/endoriumfort:<version> \
  --certificate-identity-regexp 'https://github.com/Endorium-Group/EndoriumFort-CE/' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

## Après la mise à jour

- `api/health` renvoie la nouvelle version.
- `docker logs endoriumfort` : démarrage sans erreur.
- Connexion, ouverture d'une session de test.
- **Journal → Vérifier l'intégrité** : intègre.

## Revenir en arrière

Recréez le conteneur avec le **numéro de version précédent**. Si la nouvelle version a modifié le schéma de la base, restaurez aussi la sauvegarde faite juste avant : une ancienne version ne lit pas forcément un schéma plus récent.
