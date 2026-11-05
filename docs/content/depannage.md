# Dépannage

Premier réflexe, toujours : les journaux.

```
docker logs endoriumfort --tail 100        # Docker
journalctl -u endoriumfort -n 100          # paquet Debian
```

## Le conteneur ne démarre pas

- **`FATAL: database open failed`** : la base est inaccessible. En SQLite, vérifiez que le volume `/app/data` est monté et accessible en écriture. En PostgreSQL, vérifiez `ENDORIUMFORT_DB_DSN`, le réseau et les identifiants ([Base de données](#/base-de-donnees)).
- **`invalid ENDORIUMFORT_TRUSTED_PROXIES entry`** : seules des adresses IP ou des plages CIDR séparées par des virgules sont acceptées.
- **Port déjà utilisé** : un autre service occupe 80 ou 443 sur l'hôte. Changez `EF_HTTP_PORT` / `EF_HTTPS_PORT`.

## Santé du service

```
docker exec endoriumfort curl -sf http://127.0.0.1:8080/api/health
```

Une réponse `{"status":"ok",…}` indique que le backend tourne. Si la console reste inaccessible, le problème est entre le navigateur et nginx : ports, pare-feu, reverse-proxy.

## Connexion

### « Identifiants invalides » avec le compte initial

Le compte `admin` / `Admin123` n'existe que sur une base **neuve**. Si le volume a déjà servi, c'est le mot de passe choisi alors qui s'applique.

### Bloqué sur l'écran de configuration initiale

C'est voulu : un administrateur doit changer son mot de passe et enrôler un second facteur avant tout le reste ([Premier démarrage](#/premier-demarrage)).

### « Trop de tentatives »

Plus de 10 échecs en 5 minutes pour un identifiant ou une IP déclenchent un blocage temporaire, de 30 secondes à 30 minutes. Attendez ; même le bon mot de passe est refusé pendant le blocage. Le blocage est en mémoire : un redémarrage le lève.

Si **tout le monde** est bloqué en même temps derrière un reverse-proxy, le bastion voit l'IP du proxy pour tous : renseignez `ENDORIUMFORT_TRUSTED_PROXIES` ([TLS & reverse-proxy](#/tls-reverse-proxy)).

### Code TOTP refusé

L'heure du serveur ou du téléphone dérive. Vérifiez la synchronisation NTP de l'hôte (`timedatectl`) et l'heure automatique du téléphone.

### La passkey échoue

- Le bastion doit être en HTTPS avec un certificat valide.
- `ENDORIUMFORT_WEBAUTHN_RP_ID` et `ENDORIUMFORT_WEBAUTHN_ORIGIN` doivent correspondre **exactement** à l'URL tapée, port compris.
- Une passkey créée sous un autre nom de domaine ne fonctionne pas : enrôlez-en une nouvelle.

Le bilan **Administration → Sécurité** signale une configuration WebAuthn invalide.

### Second facteur perdu

Voir [MFA → Perte d'un facteur](#/mfa).

## Sessions SSH

### La session ne s'ouvre pas

- La cible doit être **joignable depuis le bastion** : `docker exec endoriumfort sh -c 'nc -zv <cible> 22'`, si `nc` est disponible, ou un test depuis l'hôte.
- La cible doit accepter l'authentification **par mot de passe** (`PasswordAuthentication yes` dans `sshd_config`) pour le compte utilisé.
- Vérifiez le compte et le mot de passe enregistrés sur la ressource.

### « This resource requires… »

Une [règle d'accès](#/regles-acces) attend un motif, un objet de session ou un ticket. Si le message parle de **dual approval**, la case « Approbation par un second administrateur » est cochée : décochez-la en CE.

### « Command blocked by bastion guard »

Le [garde-fou](#/garde-fou-ssh) a retenu la saisie : commande interdite, ou caractère non ASCII (lettre accentuée) sur une ressource gardée.

### Un transfert de fichier est refusé

- Le transfert est désactivé par défaut, et s'active par ressource **et par sens**.
- Vérifiez le plafond (`ENDORIUMFORT_SSH_TRANSFER_MAX_UPLOAD_MB`, 100 Mo par défaut).
- Sans SFTP sur la cible, le repli SCP transfère mais ne liste pas les répertoires.

## Navigateur isolé

- **« autant de navigateurs isolés qu'il peut »** : la limite `ENDORIUMFORT_RBI_MAX_SESSIONS` est atteinte. Attendez ou relevez-la si la mémoire le permet.
- **Les menus déroulants ne s'ouvrent pas, les fichiers ne passent pas** : le moteur `cdp` est actif. Vérifiez le moteur dans les journaux de démarrage ([Navigateur isolé](#/proxy-rbi)).
- **Page blanche ou erreur de connexion** : la cible doit être joignable depuis le bastion, à l'adresse et au port de la ressource.
- **Rien ne s'ouvre** : le navigateur a bloqué l'ouverture d'onglet. Autorisez les fenêtres surgissantes pour le bastion.
- **Image saccadée** : baissez `ENDORIUMFORT_RBI_JPEG_QUALITY`, puis `ENDORIUMFORT_RBI_MAX_FPS`.

## Partage de fichiers

### `/files/` répond 503

C'est le comportement attendu quand la clé de tickets manque ou ne correspond pas :

- `ENDORIUMFORT_FILESHARE_SECRET` doit être **identique** sur le bastion et sur `endoriumfort-files`, et faire 32 caractères au moins ;
- `ENDORIUMFORT_FILESHARE_UPSTREAM` doit pointer sur le service, ex. `http://endoriumfort-files:8090` ;
- `docker logs endoriumfort-files` donne l'erreur exacte.

Le reste du bastion n'est pas affecté.

### Un dépôt est refusé

Quota de l'espace (`EF_FS_QUOTA_MB`) ou taille maximale par fichier (`EF_FS_MAX_UPLOAD_MB`). Derrière un reverse-proxy, vérifiez aussi sa taille maximale de requête.

## Coffre et journal

### Les sessions n'arrivent plus à s'authentifier après une restauration

La `ENDORIUMFORT_VAULT_KEY` fournie n'est pas celle qui a chiffré les secrets. Remettez la bonne clé ; à défaut, ressaisissez les mots de passe ([Coffre-fort](#/coffre)).

### Le journal est signalé « rompu »

Une ligne a été modifiée, supprimée, ou le fichier tronqué (disque plein, copie interrompue). Notez le numéro de ligne indiqué, conservez le fichier en l'état comme élément d'enquête, et comparez avec votre dernière sauvegarde. Avec une clé HMAC, vérifiez aussi que `ENDORIUMFORT_AUDIT_HMAC_KEY` est celle utilisée à l'écriture.

## Tous les administrateurs sont bloqués

Il n'existe pas de procédure de secours intégrée. Restaurez une sauvegarde antérieure du volume de données où un compte administrateur est encore utilisable — en sachant que les événements depuis seront perdus. D'où l'intérêt d'un compte `admin` de réserve et de facteurs de secours.

## Toujours bloqué ?

Posez la question dans la [Communauté](../community/), avec la version, le mode de déploiement et les journaux **sans secrets**.
