# API REST

La console s'appuie entièrement sur une API REST en JSON, servie sous `/api/` par le bastion. Tout ce que fait la console peut être scripté.

Cette page couvre les routes de l'édition Community. Les droits sont ceux du [rôle](#/utilisateurs) du compte utilisé : un script n'a jamais plus de pouvoir que son compte.

## S'authentifier

```
curl -s https://bastion.example.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"robot","password":"…","totpCode":"123456"}'
```

La réponse contient un `token` et sa date d'expiration `expiresAt`. Passez-le ensuite dans chaque requête :

```
curl -s https://bastion.example.com/api/sessions \
  -H "Authorization: Bearer $TOKEN"
```

- Si le compte a un second facteur et que `totpCode` manque, la réponse vaut `"status": "mfa_required"` avec les méthodes possibles ; renvoyez la requête avec le code.
- Le jeton expire au bout de `ENDORIUMFORT_TOKEN_TTL_SECONDS`. `POST /api/auth/logout` l'invalide aussitôt.
- Un compte en configuration initiale (mot de passe à changer, MFA à enrôler) ne peut rien faire d'autre par l'API.

Pour un usage automatisé, créez un compte dédié, avec le rôle minimal nécessaire : **auditeur** pour lire le journal et les rapports.

## Codes de réponse

| Code | Signification |
|---|---|
| `200` | Succès. |
| `400` | Requête invalide, ou règle d'accès non satisfaite (le message dit laquelle). |
| `401` | Pas de jeton, ou jeton expiré. |
| `403` | Le rôle n'a pas ce droit, ou la ressource n'est pas affectée. |
| `404` | Objet inexistant — ou route d'une fonction absente de la CE. |
| `429` | Trop de tentatives de connexion. |

## Routes principales

### Authentification et compte

| Méthode | Route | Rôle |
|---|---|---|
| `POST` | `/api/auth/login` | Se connecter. |
| `POST` | `/api/auth/logout` | Invalider le jeton. |
| `POST` | `/api/auth/change-password` | Changer son mot de passe. |
| `GET` | `/api/auth/2fa-status` | État de ses seconds facteurs. |
| `POST` | `/api/auth/setup-2fa`, `/api/auth/verify-2fa`, `/api/auth/disable-2fa` | Gérer son TOTP. |
| `POST` | `/api/auth/webauthn/register/options`, `…/verify` | Enregistrer une passkey. |
| `DELETE` | `/api/auth/webauthn/credentials/<id>` | Retirer une passkey. |

### Ressources

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/api/resources` | Ressources visibles par le compte. |
| `POST` | `/api/resources` | Créer (administrateur). |
| `PUT` / `DELETE` | `/api/resources/<id>` | Modifier, supprimer (administrateur). |

### Utilisateurs

| Méthode | Route | Rôle |
|---|---|---|
| `GET` / `POST` | `/api/users` | Lister, créer (administrateur). |
| `PUT` / `DELETE` | `/api/users/<id>` | Modifier, supprimer (administrateur). |
| `GET` | `/api/users/<id>/resources` | Ressources affectées. |
| `POST` / `DELETE` | `/api/users/<id>/resources/<resourceId>` | Affecter, retirer. |

### Sessions

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/api/sessions` | Lister ; filtres `status`, `user`, `target`, `protocol`. |
| `POST` | `/api/sessions` | Ouvrir (`resourceId`, `justification`, `ticketId`, `purpose`…). |
| `GET` | `/api/sessions/<id>` | Détail. |
| `POST` | `/api/sessions/<id>/terminate` | Terminer. |
| `GET` | `/api/sessions/stream` | Flux temps réel (Server-Sent Events). |

### Journal et rapports

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/api/audit` | Événements ; filtres `actor`, `family`, `category`, `from`, `to`, `text`, `sessionId`, pagination par curseur. |
| `GET` | `/api/audit/verify` | Vérifier la chaîne d'intégrité. |
| `GET` | `/api/reports` | Rapport : `period` (`day`, `month`, `quarter` ou `year`), `date=AAAA-MM-JJ`, `top` (1 à 50). |
| `GET` | `/api/reports/export` | Le même rapport en CSV. |

### Plateforme

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/api/health` | Santé et version. Sans authentification. |
| `GET` | `/api/stats` | Indicateurs du tableau de bord. |
| `GET` / `PUT` | `/api/ssh-guard/rules`, `/api/ssh-guard/rules/<nom>` | Règles du garde-fou SSH (administrateur). |
| `GET` | `/api/license/status` | Édition et état de licence. |

## Exemples

Vérifier l'intégrité du journal chaque nuit :

```
curl -sf https://bastion.example.com/api/audit/verify \
  -H "Authorization: Bearer $TOKEN" | jq '.intact, .firstBrokenLine'
```

Exporter le rapport du mois précédent :

```
curl -sf "https://bastion.example.com/api/reports/export?period=month&date=2026-10-01" \
  -H "Authorization: Bearer $TOKEN" -o rapport-2026-10.csv
```

Superviser la disponibilité :

```
curl -sf https://bastion.example.com/api/health
```

## Stabilité

Les routes listées ici sont celles qu'utilise la console. Elles peuvent évoluer d'une version à l'autre : lisez les notes de version avant de mettre à jour un outil qui en dépend.
