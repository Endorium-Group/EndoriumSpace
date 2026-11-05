# Installation (Docker)

Docker est la voie la plus simple. Deux autres méthodes existent : [paquet Debian](#/installation-debian) et [Kubernetes (Helm)](#/kubernetes).

L'image du bastion embarque le backend, l'interface web et nginx. Le **partage de fichiers** tourne dans un second conteneur, volontairement séparé ; le bastion seul suffit si vous n'utilisez pas les lecteurs de fichiers.

| Image | Rôle |
|---|---|
| `ghcr.io/endorium-group/endoriumfort` | Le bastion. |
| `ghcr.io/endorium-group/endoriumfort-files` | Le service de partage de fichiers. |

GHCR est le registre de référence. Un miroir Docker Hub (`nergyr/endoriumfort`, `nergyr/endoriumfort-files`) est aussi publié. Les images sont signées (Cosign) et accompagnées d'une provenance SLSA.

## Essai rapide

```
docker run -d --name endoriumfort \
  -p 443:443 -p 80:80 \
  -v ef-data:/app/data \
  -e ENDORIUMFORT_VAULT_KEY="$(openssl rand -hex 32)" \
  ghcr.io/endorium-group/endoriumfort:latest
```

Ouvrez `https://votre-hote/` et poursuivez avec le [premier démarrage](#/premier-demarrage). Le certificat par défaut est **auto-signé** : le navigateur affiche un avertissement, c'est normal pour un essai.

> Cette commande génère une clé de coffre sans la conserver. Pour un essai, ça suffit ; pour tout usage durable, utilisez la méthode compose ci-dessous et **gardez la clé** : sans elle, les secrets enregistrés deviennent illisibles.

## Installation avec docker compose

Le dépôt fournit un `docker-compose.yml` complet, avec le bastion, le service de fichiers, leurs volumes et le réseau interne.

```
git clone https://github.com/Endorium-Group/EndoriumFort-CE.git
cd EndoriumFort-CE
```

Créez un fichier `.env` à côté :

```
# Images de référence (GHCR) et version épinglée
DOCKER_IMAGE=ghcr.io/endorium-group/endoriumfort
DOCKER_IMAGE_FILES=ghcr.io/endorium-group/endoriumfort-files
DOCKER_TAG=<version>

# Clé des tickets de partage de fichiers (32 caractères minimum)
ENDORIUMFORT_FILESHARE_SECRET=<openssl rand -hex 32>

# Ports exposés sur l'hôte et fuseau horaire
EF_HTTP_PORT=80
EF_HTTPS_PORT=443
TZ=Europe/Paris
```

Le fichier compose fourni ne transmet pas les clés de chiffrement au conteneur. Ajoutez-les par un fichier `docker-compose.override.yml`, que compose lit automatiquement :

```
services:
  endoriumfort:
    environment:
      # Clé du coffre-fort : 64 caractères hexadécimaux (openssl rand -hex 32)
      - ENDORIUMFORT_VAULT_KEY=${ENDORIUMFORT_VAULT_KEY}
      # Clé de la chaîne d'audit (recommandée)
      - ENDORIUMFORT_AUDIT_HMAC_KEY=${ENDORIUMFORT_AUDIT_HMAC_KEY}
```

et les deux valeurs correspondantes dans `.env`. Puis :

```
docker compose up -d
```

> **Rangez ces clés hors de l'hôte** (gestionnaire de secrets, coffre d'équipe). Elles ne sont pas dans les volumes, et une sauvegarde de volume sans elles est inutilisable. Voir [Sauvegarde](#/sauvegarde).

### Exemple minimal

Si vous préférez écrire votre propre fichier :

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
    environment:
      ENDORIUMFORT_VAULT_KEY: ${ENDORIUMFORT_VAULT_KEY}
      ENDORIUMFORT_AUDIT_HMAC_KEY: ${ENDORIUMFORT_AUDIT_HMAC_KEY}
      ENDORIUMFORT_FILESHARE_SECRET: ${ENDORIUMFORT_FILESHARE_SECRET}
      ENDORIUMFORT_FILESHARE_UPSTREAM: "http://endoriumfort-files:8090"
    networks: [default, files]

  endoriumfort-files:
    image: ghcr.io/endorium-group/endoriumfort-files:latest
    container_name: endoriumfort-files
    restart: unless-stopped
    read_only: true
    cap_drop: [ALL]
    security_opt: ["no-new-privileges:true"]
    volumes:
      - ef-files:/data
    environment:
      ENDORIUMFORT_FILESHARE_SECRET: ${ENDORIUMFORT_FILESHARE_SECRET}
    networks: [files]

volumes:
  ef-data:
  ef-files:

networks:
  files:
    internal: true
```

## Ports

| Port | Où | Rôle |
|---|---|---|
| `443` | hôte | Interface web, API et WebSocket, en HTTPS. |
| `80` | hôte | Redirection vers HTTPS, et validation Let's Encrypt si activée. |
| `8080` | interne | Backend. Jamais exposé : nginx le sert. |
| `8090` | interne | Service de partage de fichiers, sur le réseau `files` uniquement. |

Pour éviter les ports privilégiés : `EF_HTTP_PORT=8080 EF_HTTPS_PORT=8443`, puis `https://votre-hote:8443`.

## Volumes

| Volume | Montage | Contenu |
|---|---|---|
| `ef-data` | `/app/data` | Base de données, journal d'audit, configuration. **Indispensable.** |
| `ef-files` | `/data` (conteneur `endoriumfort-files`) | Lecteurs de fichiers des utilisateurs et leur journal. |
| `ef-letsencrypt`, `ef-certbot-www` | `/etc/letsencrypt`, `/var/www/certbot` | Certificat Let's Encrypt, si activé. |

Le fichier compose déclare aussi `ef-recordings`, utilisé par l'édition Enterprise ; il reste vide en CE.

## Vérifier l'installation

```
# Santé du backend
docker exec endoriumfort curl -sf http://127.0.0.1:8080/api/health
# {"status":"ok","message":"EndoriumFort API online","version":"…"}

# Journaux de démarrage
docker logs endoriumfort
```

Les journaux indiquent le moteur du navigateur isolé, l'état du backend et, le cas échéant, l'obtention du certificat Let's Encrypt.

## Certificat TLS

Trois options, détaillées dans [TLS & reverse-proxy](#/tls-reverse-proxy) :

- **Let's Encrypt intégré** — `ACME_ENABLED=1`, `ACME_DOMAIN`, `ACME_EMAIL`.
- **Reverse-proxy existant** (Caddy, Traefik, nginx) qui termine le TLS.
- **Certificat d'entreprise** monté dans le conteneur.

## Ensuite

[Premier démarrage](#/premier-demarrage).
