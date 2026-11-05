# MFA — TOTP & passkeys

EndoriumFort prend en charge deux seconds facteurs :

- **TOTP** — un code à 6 chiffres renouvelé toutes les 30 secondes, produit par une application d'authentification (FreeOTP, Aegis, Google Authenticator, 1Password…) ;
- **passkeys / WebAuthn** — empreinte, reconnaissance faciale, code de l'appareil ou clé de sécurité FIDO2 (YubiKey, SoloKey…).

## Qui doit enrôler un second facteur

| Compte | Second facteur |
|---|---|
| **Administrateurs** | **obligatoire** : un nouvel administrateur ne peut rien faire tant qu'il n'en a pas enrôlé un. |
| **Opérateurs et auditeurs** | recommandé, à l'initiative de chacun. |

L'obligation est appliquée **côté serveur** : tant que l'enrôlement n'est pas fait, le compte n'accède qu'aux écrans de configuration initiale, et aucun jeton ne permet de le contourner.

Un administrateur ne peut pas retirer son **dernier** facteur : pour supprimer son TOTP, il doit avoir une passkey, et inversement.

Le bilan **Administration → Sécurité** signale les administrateurs sans MFA.

## Enrôler un TOTP

1. **Mon compte → Sécurité**, ou l'écran de configuration initiale.
2. Scannez le QR code avec votre application, ou saisissez le secret affiché.
3. Validez avec le code à 6 chiffres.

L'heure du serveur et celle du téléphone doivent être justes : un décalage de plus de quelques dizaines de secondes fait échouer les codes.

## Enrôler une passkey

1. **Mon compte → Sécurité → Ajouter une passkey.**
2. Suivez l'invite du navigateur : biométrie, code de l'appareil ou clé de sécurité.

Vous pouvez enregistrer plusieurs passkeys, par exemple une sur l'ordinateur et une clé physique de secours. Chacune peut être retirée individuellement.

### Prérequis des passkeys

Les passkeys sont liées au **nom de domaine** du bastion. Elles exigent :

- un accès en **HTTPS** avec un certificat valide (sauf `localhost` en test) ;
- un domaine stable, déclaré au bastion :

```
ENDORIUMFORT_WEBAUTHN_RP_ID=bastion.example.com
ENDORIUMFORT_WEBAUTHN_ORIGIN=https://bastion.example.com
```

Changer de domaine plus tard rend les passkeys existantes inutilisables : chacun devra en enrôler une nouvelle. Le bilan **Sécurité** signale une configuration invalide.

## Se connecter

Après le mot de passe, la console demande le second facteur. Si vous en avez deux, elle propose d'abord votre **méthode préférée** (TOTP, passkey, ou « au choix »), réglable dans **Mon compte → Sécurité**.

## Perte d'un facteur

- **Un facteur perdu sur deux** : connectez-vous avec l'autre, retirez le facteur perdu et enrôlez-en un nouveau.
- **Seul facteur perdu** : la console ne propose pas de réinitialisation de MFA. Un administrateur supprime le compte puis le recrée sous le même identifiant ; l'historique reste dans le journal d'audit. Pensez à réaffecter ses ressources.
- **Tous les administrateurs bloqués** : il n'existe pas de procédure de secours intégrée. D'où l'importance d'un second facteur de secours et d'un compte `admin` de réserve. Voir [Dépannage](#/depannage).

## Bonnes pratiques

- Enrôlez **au moins deux facteurs** : une passkey et un TOTP de secours, ou deux clés physiques.
- Préférez les passkeys : elles résistent à l'hameçonnage, un code TOTP non.
- Demandez aux opérateurs d'enrôler un second facteur, même s'il ne leur est pas imposé.

## Événements

`user.webauthn.register` et `user.webauthn.delete` tracent l'ajout et le retrait des passkeys ; les connexions apparaissent sous `auth.login.success` et `auth.login.failure`.
