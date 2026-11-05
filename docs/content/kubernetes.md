# Installation (Kubernetes / Helm)

> Avant d'installer, estimez la machine nécessaire : [Dimensionnement](#/dimensionnement), ou le [calculateur](../index.html#sizing).

Le chart Helm est publié dans le registre OCI de GHCR, avec les mêmes numéros de version que les images.

## Installer

```
helm install ef oci://ghcr.io/endorium-group/charts/endoriumfort \
  --version <X.Y.Z> \
  --namespace endoriumfort --create-namespace \
  -f mes-valeurs.yaml
```

## Valeurs essentielles

```
# mes-valeurs.yaml
ingress:
  enabled: true
  className: nginx
  hosts:
    - host: bastion.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: endoriumfort-tls
      hosts: [bastion.example.com]

config:
  timezone: Europe/Paris
  webauthn:
    rpId: bastion.example.com
    origin: https://bastion.example.com
  # Adresses de l'ingress, pour que l'audit et la limitation de débit
  # voient la vraie IP des clients
  trustedProxies: ["10.42.0.0/16"]

secrets:
  # Préférez un Secret existant (clé ENDORIUMFORT_VAULT_KEY)
  existingSecret: endoriumfort-secrets
```

Créez le Secret à part, pour qu'aucune clé ne figure dans vos valeurs :

```
kubectl -n endoriumfort create secret generic endoriumfort-secrets \
  --from-literal=ENDORIUMFORT_VAULT_KEY="$(openssl rand -hex 32)"
```

Les variables sans valeur dédiée dans le chart (par exemple `ENDORIUMFORT_AUDIT_HMAC_KEY`) passent par `extraEnv`, idéalement en référence à un Secret.

## TLS et ingress

Le pod sert déjà du HTTPS sur `443` avec un certificat auto-signé. L'ingress termine le TLS public (cert-manager par exemple) et **ré-chiffre** vers le pod : avec nginx-ingress, l'annotation `nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"` est posée par défaut.

Sur **k3s**, qui fournit Traefik, utilisez l'exemple `values-k3s.yaml` du chart : il active un `ServersTransport` Traefik qui accepte le certificat auto-signé du pod.

Les sessions SSH et le navigateur isolé passent par des WebSocket longues ; le chart relève les délais de l'ingress à une heure.

## Une seule réplique

La base SQLite intégrée n'accepte qu'un écrivain, et le journal d'audit est une chaîne strictement séquentielle. Le chart impose donc :

- `replicaCount: 1` ;
- une stratégie `Recreate` : l'ancien pod s'arrête avant que le nouveau démarre. Une mise à jour coupe le service quelques secondes.

**Ne passez pas en `RollingUpdate`** : deux pods simultanés produiraient deux états divergents écrivant les mêmes fichiers, et une rupture de la chaîne d'audit.

## Base PostgreSQL

Pour sortir la base du volume, voir [Base de données](#/base-de-donnees) :

```
database:
  type: postgresql
  postgresql:
    existingSecret: endoriumfort-db
    existingSecretKey: ENDORIUMFORT_DB_DSN
```

Le volume `data` reste nécessaire : il contient le journal d'audit.

## Partage de fichiers

Activé par défaut (`fileshare.enabled`). Le chart déploie le service dans un **Deployment séparé**, avec son propre PVC, sans privilège, système de fichiers en lecture seule, sans jeton de compte de service, et une **NetworkPolicy** qui n'admet que le pod du bastion et interdit toute sortie. La clé des tickets est générée à la première installation et conservée entre les mises à jour.

| Valeur | Défaut | Rôle |
|---|---|---|
| `fileshare.quotaMb` | `10240` | Quota par lecteur utilisateur. |
| `fileshare.maxUploadMb` | `2048` | Taille maximale d'un fichier. |
| `fileshare.persistence.size` | `20Gi` | Taille du volume du service. |

## Volumes

| Valeur | Défaut | Contenu |
|---|---|---|
| `persistence.data.size` | `2Gi` | Base SQLite, journal d'audit. |
| `fileshare.persistence.size` | `20Gi` | Lecteurs de fichiers. |

Les deux volumes sont en `ReadWriteOnce` : sauvegardez-les par snapshot de votre classe de stockage, ou voir [Sauvegarde](#/sauvegarde).

## Vérifier

```
kubectl -n endoriumfort get pods
kubectl -n endoriumfort logs deploy/ef-endoriumfort
```

Les sondes interrogent le port `443` : un pod « Ready » signifie que nginx **et** le backend répondent.

## Ensuite

[Premier démarrage](#/premier-demarrage).
