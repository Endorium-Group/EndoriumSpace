# Coffre-fort de secrets

Le coffre-fort stocke les identifiants des ressources **chiffrés en AES-256-GCM**. Les opérateurs ouvrent des sessions **sans jamais voir les secrets en clair**.

## Configurer la clé de chiffrement

Le coffre a besoin d'une clé de 32 octets (64 caractères hexadécimaux), fournie par variable d'environnement :

```
# Générer une clé
openssl rand -hex 32

# La fournir au conteneur
ENDORIUMFORT_VAULT_KEY="<64 caractères hex>"
```

> **Conservez cette clé en lieu sûr.** Sans elle, les secrets chiffrés ne peuvent plus être déchiffrés. Stockez-la hors du volume de données (secret d'orchestrateur, gestionnaire de secrets).

## Ajouter un secret

1. **Ressources → (une ressource) → Identifiants**, ou la section **Coffre**.
2. Saisissez le login/mot de passe (ou la clé).
3. Enregistrez : la valeur est chiffrée **avant** d'être écrite en base.

## Rotation de la clé (sans interruption)

Vous pouvez changer la clé primaire tout en gardant l'ancienne pour le déchiffrement, le temps de ré-chiffrer :

```
ENDORIUMFORT_VAULT_KEY="<nouvelle clé>"
ENDORIUMFORT_VAULT_KEY_OLD="<ancienne clé>[,<encore plus ancienne>]"
```

Les nouveaux secrets sont chiffrés avec la nouvelle clé ; les anciens restent déchiffrables via `_OLD`.

## Au repos

En plus du chiffrement applicatif des secrets, la **base elle-même peut être chiffrée au repos** (voir [Durcissement](#/durcissement) → chiffrement de la base).

> La **rotation automatique et planifiée** des secrets est une fonctionnalité Enterprise.
