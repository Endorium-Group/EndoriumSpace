# Coffre-fort de secrets

Le coffre-fort stocke les identifiants des ressources **chiffrés en AES-256-GCM**. Le bastion les déchiffre au moment de la connexion et les injecte lui-même : l'opérateur ouvre sa session **sans jamais voir le secret**, et ne peut donc pas le réutiliser en dehors du bastion.

## La clé du coffre

Le chiffrement repose sur une clé de 32 octets, fournie en **64 caractères hexadécimaux** :

```
# Générer une clé
openssl rand -hex 32

# La fournir au bastion
ENDORIUMFORT_VAULT_KEY=<64 caractères hexadécimaux>
```

> **Sans clé valide, les secrets sont stockés en clair.** Si `ENDORIUMFORT_VAULT_KEY` est absente, ou n'a pas exactement 64 caractères hexadécimaux, le bastion démarre quand même et enregistre les nouveaux identifiants **sans chiffrement**. Vérifiez la clé **avant** d'enregistrer le premier secret.

### Conserver la clé

- Rangez-la dans un gestionnaire de secrets, **hors** de l'hôte et des sauvegardes de volumes.
- Une sauvegarde de base sans la clé ne permet pas de relire les secrets.
- Une clé perdue ne se récupère pas : il faudra ressaisir tous les identifiants.

### Changer de clé

La CE ne sait pas rechiffrer le coffre avec une nouvelle clé. Pour en changer : notez les ressources concernées, remplacez la clé, puis **ressaisissez** chaque mot de passe. Les anciens secrets, chiffrés avec l'ancienne clé, ne sont plus lisibles.

### Activer le chiffrement après coup

Si des secrets ont été enregistrés sans clé, fournir une clé ensuite ne les chiffre pas rétroactivement : ils restent lisibles mais en clair. Ressaisissez-les pour qu'ils soient chiffrés.

## Enregistrer un secret

**Administration → Ressources → (la ressource) → Identifiants** : renseignez le compte et le mot de passe. La valeur est chiffrée **avant** d'être écrite en base.

L'onglet **Administration → Coffre-fort** récapitule les ressources et l'état de leurs identifiants.

## Qui peut lire un secret

La console n'affiche jamais un secret enregistré, et la connexion l'utilise sans le montrer.

L'API comporte toutefois une route de lecture des identifiants SSH d'une ressource (`GET /api/resources/<id>/credentials`). Elle répond aux administrateurs, et aux opérateurs **pour les ressources qui leur sont affectées** ; les auditeurs n'y ont pas accès. Chaque lecture est journalisée (`credential.access`), avec l'utilisateur et la ressource.

- Surveillez `credential.access` dans le [journal d'audit](#/audit) : en usage normal, cet événement est rare.
- N'affectez une ressource qu'aux personnes qui doivent l'ouvrir.
- Si un secret a pu être exposé, changez-le sur la cible, puis dans le bastion.

## Comment le chiffrement est fait

- AES-256-GCM, chiffrement authentifié : une valeur altérée en base est détectée au déchiffrement.
- Un vecteur d'initialisation aléatoire par secret.
- Format stocké : `aes256:v1:<iv>:<tag>:<chiffré>`, en hexadécimal.

## Au-delà du coffre

- La base elle-même n'est pas chiffrée par la CE : placez le volume de données sur un stockage chiffré (LUKS, chiffrement du fournisseur) — voir [Durcissement](#/durcissement).
- La rotation automatique des mots de passe des cibles et les comptes éphémères relèvent de l'édition Enterprise.
