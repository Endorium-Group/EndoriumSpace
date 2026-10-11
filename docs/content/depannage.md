# Dépannage

## Le conteneur ne démarre pas

- `docker logs endoriumfort` pour lire l'erreur exacte.
- **« DB encryption key set but no SQLCipher »** : vous avez fourni `ENDORIUMFORT_DB_ENCRYPTION_KEY` à une image sans support de chiffrement, ou la base existante est en clair. Voir [Durcissement](#/durcissement) (migration), ou retirez la clé.
- Permissions de volume : `/app/data` doit être accessible en écriture par l'utilisateur du conteneur.

## J'ai perdu le mot de passe admin initial

Il n'est affiché **qu'une fois** dans les logs. Si le conteneur a redémarré depuis, relisez d'anciens logs, ou recréez le compte via une procédure d'amorçage (fournir `ENDORIUMFORT_BOOTSTRAP_ADMIN_PASSWORD` sur une base neuve).

## Impossible de se connecter — « MFA requise »

Avec `ENDORIUMFORT_REQUIRE_MFA=all`, il faut enrôler un second facteur avant d'accéder au reste. Suivez l'écran d'enrôlement ([MFA](#/mfa)). Pour une transition en douceur, basculez temporairement sur `admins` ou `none`.

## WebAuthn / passkey échoue

Le domaine doit être cohérent : configurez `ENDORIUMFORT_WEBAUTHN_RP_ID` et `ENDORIUMFORT_WEBAUTHN_ORIGIN` (ex. `app.example.com` / `https://app.example.com`). En local, `localhost` fonctionne.

## Session SSH qui échoue

- Vérifiez que la **cible est joignable depuis le conteneur** (réseau, pare-feu).
- Vérifiez l'identifiant (coffre ou saisie) et le port.

## Les secrets ne se déchiffrent plus

La `ENDORIUMFORT_VAULT_KEY` fournie diffère de celle utilisée au chiffrement. Restaurez la bonne clé (voir rotation dans [Coffre-fort](#/coffre)).

## Le journal d'audit est signalé « rompu »

Une entrée a été modifiée/supprimée, ou le fichier a été tronqué. Restaurez depuis une sauvegarde ; en HMAC, assurez-vous que `ENDORIUMFORT_AUDIT_HMAC_KEY` est la même qu'à l'écriture.

## Santé du service

```
docker exec endoriumfort curl -sf http://127.0.0.1:8080/api/health && echo OK
```

Besoin d'aide ? Posez votre question sur l'[espace communauté](../community/).
