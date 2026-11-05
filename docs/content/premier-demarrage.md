# Premier démarrage

## 1. Se connecter avec le compte initial

Sur une base neuve, EndoriumFort crée un unique compte administrateur :

| Identifiant | Mot de passe |
|---|---|
| `admin` | `Admin123` |

Ouvrez `https://votre-hote/` et connectez-vous avec ces identifiants.

> Ce mot de passe est public : il figure dans cette documentation. **Faites ce premier démarrage immédiatement après l'installation**, et n'exposez pas le bastion à Internet avant. Tant que la configuration initiale n'est pas terminée, le compte ne peut rien faire d'autre — mais n'importe qui peut la terminer à votre place.

## 2. Configuration de sécurité initiale (imposée)

Un écran **« Configuration de sécurité initiale »** bloque tout le reste de la console jusqu'à ce que deux conditions soient remplies :

1. **Choisir un mot de passe privé** — au moins 8 caractères, avec une majuscule, une minuscule et un chiffre. Visez beaucoup plus long : c'est le compte le plus sensible du bastion.
2. **Enrôler un second facteur** — un code TOTP (application d'authentification) ou une passkey. Voir [MFA](#/mfa).

Le blocage est appliqué **côté serveur** : ni l'API ni un jeton ne permettent de contourner cet écran.

## 3. Créer vos comptes nominatifs

Le compte `admin` est partagé par nature. Créez un compte **administrateur nominatif** par personne, puis gardez `admin` comme compte de secours, avec un mot de passe long rangé dans un coffre.

**Administration → Utilisateurs → Nouvel utilisateur.** Chaque nouvel administrateur devra lui aussi enrôler un second facteur à sa première connexion. Voir [Utilisateurs & rôles](#/utilisateurs).

## 4. Vérifier la clé du coffre

Avant d'enregistrer le moindre mot de passe de cible, assurez-vous que `ENDORIUMFORT_VAULT_KEY` est bien fournie au conteneur. Sans elle, les identifiants sont stockés **en clair** dans la base. Voir [Coffre-fort](#/coffre).

## 5. Configurer le domaine

Pour les passkeys, le bastion doit être servi en HTTPS sous son nom définitif, et connaître ce nom :

```
ENDORIUMFORT_WEBAUTHN_RP_ID=bastion.example.com
ENDORIUMFORT_WEBAUTHN_ORIGIN=https://bastion.example.com
```

Voir [TLS & reverse-proxy](#/tls-reverse-proxy).

## Liste de contrôle

- [ ] Mot de passe `admin` changé, second facteur enrôlé.
- [ ] Un administrateur nominatif par personne.
- [ ] `ENDORIUMFORT_VAULT_KEY` fournie et sauvegardée hors de l'hôte.
- [ ] `ENDORIUMFORT_AUDIT_HMAC_KEY` fournie et sauvegardée hors de l'hôte.
- [ ] Certificat TLS valide et domaine WebAuthn configuré.
- [ ] Sauvegarde planifiée ([Sauvegarde](#/sauvegarde)).

## Ensuite

- [Visite de la console](#/console)
- [Déclarer une ressource](#/ressources)
- [Durcissement](#/durcissement) avant la mise en production
