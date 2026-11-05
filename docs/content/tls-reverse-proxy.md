# TLS & reverse-proxy

Le bastion se sert **uniquement en HTTPS** en production : les mots de passe, les codes MFA et le contenu des sessions y transitent, et les passkeys refusent de fonctionner sans HTTPS.

Le conteneur sert déjà HTTPS sur le port `443`, avec un certificat **auto-signé** intégré à l'image.

> **Ne le gardez pas en production.** Ce certificat est généré une fois, à la construction de l'image : sa clé privée est **la même pour toutes les installations** qui utilisent cette image, et n'importe qui peut l'en extraire. Il sert aux essais et au saut interne derrière un reverse-proxy, rien de plus.

Trois façons de le remplacer.

## Option 1 — Let's Encrypt intégré

Le plus simple si le bastion est joignable depuis Internet sur le port 80, sous un nom DNS public.

```
ACME_ENABLED=1
ACME_DOMAIN=bastion.example.com
ACME_EMAIL=admin@example.com
```

Au démarrage, le conteneur obtient le certificat (validation HTTP sur le port 80), l'installe et le renouvelle seul. Montez `/etc/letsencrypt` sur un volume pour le conserver entre deux redémarrages — le fichier compose fourni le fait déjà.

En cas d'échec, le certificat courant est conservé et la raison apparaît dans `docker logs endoriumfort`.

## Option 2 — derrière un reverse-proxy existant

Caddy, Traefik, nginx ou HAProxy terminent le TLS et relaient vers le bastion.

Points à respecter :

- **WebSocket** — les terminaux SSH et le navigateur isolé utilisent des WebSocket de longue durée. Le proxy doit les relayer, avec des délais d'inactivité d'au moins une heure.
- **En-têtes** — transmettez `Host`, `X-Forwarded-For` et `X-Forwarded-Proto: https`. Ce dernier active l'en-tête HSTS.
- **Vraie adresse IP** — déclarez l'adresse du proxy pour que le journal et la limitation de débit voient l'IP des clients et non celle du proxy :

```
ENDORIUMFORT_TRUSTED_PROXIES=10.0.0.5,172.18.0.0/16
```

Adresses ou plages CIDR, séparées par des virgules. Vide par défaut : personne n'est cru, et un client ne peut pas choisir l'adresse qui sera journalisée.

- **Taille des requêtes** — autorisez des corps de requête assez gros pour les transferts de fichiers (le partage de fichiers accepte 2 Go par défaut).

### Exemple Caddy

```
bastion.example.com {
    reverse_proxy https://endoriumfort:443 {
        transport http {
            tls_insecure_skip_verify
        }
    }
}
```

Le bastion reste en HTTPS derrière le proxy (certificat auto-signé, d'où `tls_insecure_skip_verify` sur ce seul saut interne). Caddy relaie les WebSocket sans réglage supplémentaire.

### Exemple nginx

```
location / {
    proxy_pass https://127.0.0.1:8443;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
    client_max_body_size 2g;
}
```

## Option 3 — votre propre certificat

Montez le certificat et sa clé à l'emplacement attendu par nginx dans le conteneur :

```
volumes:
  - ./certs/fullchain.pem:/etc/nginx/tls/tls.crt:ro
  - ./certs/privkey.pem:/etc/nginx/tls/tls.key:ro
```

Pour le paquet Debian, voir [Installation (paquet Debian)](#/installation-debian).

## Domaine et passkeys

Quel que soit le choix, déclarez le nom définitif :

```
ENDORIUMFORT_WEBAUTHN_RP_ID=bastion.example.com
ENDORIUMFORT_WEBAUTHN_ORIGIN=https://bastion.example.com
```

L'origine doit correspondre **exactement** à l'URL tapée par les utilisateurs, port compris s'il n'est pas 443.

## En-têtes de sécurité

Le bastion applique d'office une politique de sécurité du contenu stricte (`default-src 'self'`), interdit l'intégration dans un cadre tiers, désactive les API sensibles du navigateur (caméra, micro, géolocalisation, USB…) et interdit la mise en cache des réponses. HSTS est envoyé dès que la requête arrive en HTTPS.

## Vérifier

```
curl -sI https://bastion.example.com/ | grep -i strict-transport
```
