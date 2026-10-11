# Mise à jour

EndoriumFort étant livré en **image Docker**, mettre à jour revient à tirer une nouvelle image et recréer le conteneur — les données restent dans les volumes.

## Avant de commencer

1. **Sauvegardez** (voir [Sauvegarde & restauration](#/sauvegarde)).
2. Notez la version en cours et lisez les notes de version de la cible.
3. Assurez-vous d'avoir vos **clés d'environnement** à portée (elles ne changent pas).

## Procédure (docker run)

```
docker pull ghcr.io/endorium-group/endoriumfort:latest
docker stop endoriumfort
docker rm endoriumfort
docker run -d --name endoriumfort \
  -p 443:443 -p 80:80 \
  -v ef-data:/app/data -v ef-recordings:/app/recordings \
  -e ENDORIUMFORT_VAULT_KEY="$EF_VAULT_KEY" \
  ghcr.io/endorium-group/endoriumfort:latest
```

Les volumes réutilisés conservent base, configuration et licence : la migration de schéma éventuelle s'exécute au démarrage.

## Procédure (docker compose)

```
docker compose pull
docker compose up -d
```

## Épingler une version

En production, préférez un **tag de version** plutôt que `latest` pour des mises à jour maîtrisées :

```
ghcr.io/endorium-group/endoriumfort:<version>
```

## Après la mise à jour

- `docker logs endoriumfort` : pas d'erreur, ligne `[config]` cohérente.
- Connexion OK, ressources présentes.
- [Journal d'audit](#/audit) → « Vérifier l'intégrité ».

## Rollback

Recréez le conteneur avec le **tag précédent** et une sauvegarde `/app/data` antérieure si une migration de schéma a eu lieu.
