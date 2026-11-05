# Base de données

EndoriumFort stocke comptes, ressources, sessions et réglages dans une base. Deux moteurs, choisis au démarrage, sans changer d'image.

| Moteur | Quand le choisir |
|---|---|
| **SQLite** (défaut) | Installation autonome, air-gap, rien à administrer. Un fichier `endoriumfort.db` dans le volume de données. |
| **PostgreSQL** | Vous avez déjà un PostgreSQL sauvegardé et supervisé, ou vous voulez sortir la base du volume du bastion. |

Le **journal d'audit** n'est pas dans la base : il reste un fichier sur le volume de données, quel que soit le moteur ([Journal d'audit](#/audit)). Le volume reste donc indispensable.

## Choisir le moteur

Une seule variable :

```
# SQLite (défaut) : vide, ou un chemin de fichier
ENDORIUMFORT_DB_DSN=

# PostgreSQL
ENDORIUMFORT_DB_DSN=postgresql://endoriumfort:<mot-de-passe>@db.example.com:5432/endoriumfort?sslmode=require
```

Le journal de démarrage confirme le choix : `[config] database backend=postgresql`.

Si la base est injoignable au démarrage, le bastion **refuse de démarrer** plutôt que de tourner sans comptes ni journal. La politique de redémarrage du conteneur réessaie, ce qui règle le cas d'un PostgreSQL qui démarre plus lentement.

## Préparer PostgreSQL

```
CREATE ROLE endoriumfort LOGIN PASSWORD '<mot-de-passe>';
CREATE DATABASE endoriumfort OWNER endoriumfort;
```

Le bastion crée lui-même ses tables au premier démarrage. Utilisez une connexion chiffrée (`sslmode=require` ou `verify-full`) dès que la base n'est pas sur le même hôte.

Pour Kubernetes, le dépôt fournit un manifeste PostgreSQL de référence (`deploy/k8s/postgresql.yaml`), volontairement séparé du chart pour qu'un `helm uninstall` n'emporte pas les données.

## Migrer de SQLite vers PostgreSQL

Le dépôt fournit `scripts/migrate-sqlite-to-postgres.py`, qui produit un script SQL relisible avant application :

1. **Sauvegardez**, puis arrêtez le bastion.
2. Démarrez-le **une fois** avec le nouveau `ENDORIUMFORT_DB_DSN` pour créer les tables, puis arrêtez-le.
3. Générez et appliquez les données :

```
scripts/migrate-sqlite-to-postgres.py --replace /chemin/vers/endoriumfort.db > load.sql
psql "postgresql://..." -v ON_ERROR_STOP=1 -f load.sql
```

4. Redémarrez le bastion avec `ENDORIUMFORT_DB_DSN`.

`--replace` vide les tables cibles avant de charger : à n'utiliser que sur une base qui ne contient que l'amorçage du bastion, **jamais** sur une base en service. Sans cette option, le script refuse de s'exécuter si les tables contiennent déjà des données.

La clé du coffre (`ENDORIUMFORT_VAULT_KEY`) doit rester **la même** : les secrets migrés sont chiffrés avec elle.

## Une seule instance du bastion

Même avec PostgreSQL, ne faites tourner **qu'une seule instance** du bastion à la fois : une partie de son état vit en mémoire, et le journal d'audit est une chaîne strictement séquentielle.

## Sauvegarde

- **SQLite** : la base est dans le volume de données, sauvegardée avec lui ([Sauvegarde](#/sauvegarde)).
- **PostgreSQL** : sauvegardez la base avec vos outils habituels (`pg_dump`, sauvegarde continue), **et** le volume de données pour le journal d'audit.
