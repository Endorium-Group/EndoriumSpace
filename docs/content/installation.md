# Installation (Docker)

EndoriumFort CE se déploie en **une seule image**. Le conteneur embarque le backend, l'interface web (derrière nginx) et l'agent.

## Démarrage rapide

```
docker run -d --name endoriumfort \
  -p 443:443 -p 80:80 \
  -v ef-data:/app/data \
  -v ef-recordings:/app/recordings \
  ghcr.io/endorium-group/endoriumfort:latest
```

- **Ports** : nginx écoute en `80` (HTTP) et `443` (HTTPS). Le backend tourne en interne sur `8080`.
- **Volumes** : `/app/data` (base, configuration, licence) et `/app/recordings` (enregistrements de sessions) doivent être **persistants**.

> Les ports 80/443 sont des ports privilégiés sur l'hôte. Pour éviter cela, mappez par exemple `-p 8443:443 -p 8080:80` et accédez via `https://votre-hote:8443`.

## docker compose

```
services:
  endoriumfort:
    image: ghcr.io/endorium-group/endoriumfort:latest
    container_name: endoriumfort
    restart: unless-stopped
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ef-data:/app/data
      - ef-recordings:/app/recordings
    environment:
      # Clé de chiffrement du coffre (64 hex). À générer : openssl rand -hex 32
      ENDORIUMFORT_VAULT_KEY: "change-me-64-hex"
volumes:
  ef-data:
  ef-recordings:
```

Lancez : `docker compose up -d`.

## Vérifier que le service tourne

```
# Santé du backend (interne)
docker exec endoriumfort curl -sf http://127.0.0.1:8080/api/health
# Logs (le mot de passe admin initial s'y affiche une seule fois)
docker logs endoriumfort
```

## Kubernetes

Un chart Helm est disponible pour les déploiements K8s. Reportez-vous au dépôt pour les valeurs (`values.yaml`) et le chart.

Ensuite : [Premier démarrage](#/premier-demarrage).
