# Sauvegarde & restauration

Toutes les données persistantes d'EndoriumFort vivent dans les **volumes** `/app/data` (base, configuration, licence, journal d'audit) et `/app/recordings` (enregistrements de sessions, EE).

## Ce qu'il faut sauvegarder

1. Le volume **`/app/data`** (indispensable).
2. Le volume **`/app/recordings`** (si vous utilisez l'enregistrement).
3. **Hors volume** : vos clés/secrets d'environnement — en particulier `ENDORIUMFORT_VAULT_KEY`, `ENDORIUMFORT_DB_ENCRYPTION_KEY`, `ENDORIUMFORT_AUDIT_HMAC_KEY`. **Sans ces clés, les données chiffrées sont irrécupérables.**

## Sauvegarde (exemple)

```
# Arrêter proprement pour une copie cohérente (ou s'appuyer sur un snapshot)
docker stop endoriumfort

# Archiver les volumes
docker run --rm -v ef-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/ef-data-$(date +%F).tar.gz -C /data .

docker start endoriumfort
```

Planifiez cette sauvegarde (cron) et **stockez les clés d'environnement séparément**, dans un gestionnaire de secrets.

## Restauration

```
docker stop endoriumfort
docker run --rm -v ef-data:/data -v "$PWD":/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/ef-data-AAAA-MM-JJ.tar.gz -C /data"
docker start endoriumfort
```

Fournissez au conteneur restauré **les mêmes variables d'environnement** (mêmes clés) que lors de la sauvegarde.

## Vérifier après restauration

- `docker logs endoriumfort` ne signale pas d'erreur de base/déchiffrement.
- Connexion admin OK, ressources et secrets présents.
- [Journal d'audit](#/audit) → « Vérifier l'intégrité » → intègre.
