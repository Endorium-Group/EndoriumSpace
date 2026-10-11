# Premier démarrage

## 1. Récupérer le mot de passe admin initial

Au tout premier lancement, EndoriumFort crée un compte **`admin`** avec un **mot de passe aléatoire affiché une seule fois** dans les logs :

```
docker logs endoriumfort
# [SECURITY] Default admin 'admin' created with a one-time random password (shown only once):
#
#     <MOT_DE_PASSE_ALEATOIRE>
#
# Log in now and change it; MFA enrollment is enforced.
```

> Vous pouvez aussi fixer ce mot de passe à l'avance via `ENDORIUMFORT_BOOTSTRAP_ADMIN_PASSWORD` (utile pour le provisioning automatisé).

## 2. Se connecter

Ouvrez `https://votre-hote/` et connectez-vous avec `admin` + le mot de passe des logs.

## 3. Changement de mot de passe + MFA (imposés)

Au premier login, le compte admin **doit** :

1. **Changer son mot de passe** (politique : 12 caractères minimum par défaut, voir [Durcissement](#/durcissement)).
2. **Enrôler un second facteur** (TOTP ou passkey) — voir [MFA](#/mfa).

Tant que la MFA n'est pas enrôlée, l'accès aux autres fonctions est bloqué (politique `ENDORIUMFORT_REQUIRE_MFA=all` par défaut).

## 4. Étapes suivantes

- [Déclarer une ressource](#/ressources) (un serveur SSH, une interface web…).
- [Créer des utilisateurs & rôles](#/utilisateurs).
- [Ranger vos identifiants dans le coffre](#/coffre).
- [Durcir la configuration](#/durcissement) avant la mise en production.
