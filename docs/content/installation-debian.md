# Installation (paquet Debian)

Pour une installation sans Docker, la CE est publiée en paquet `.deb` dans un **dépôt APT signé**. Le paquet `endoriumfort-server` installe le backend, l'interface web, la configuration nginx et le service de partage de fichiers, chacun sous un utilisateur système dédié.

Testé sur Debian et Ubuntu récentes, en amd64.

## Ajouter le dépôt et installer

```
curl -fsSL https://endorium-group.github.io/EndoriumFort-CE/endoriumfort-archive-keyring.asc \
  | sudo gpg --dearmor -o /usr/share/keyrings/endoriumfort.gpg

echo "deb [signed-by=/usr/share/keyrings/endoriumfort.gpg] https://endorium-group.github.io/EndoriumFort-CE stable main" \
  | sudo tee /etc/apt/sources.list.d/endoriumfort.list

sudo apt-get update
sudo apt-get install endoriumfort-server
```

Le paquet est aussi joint à chaque version publiée sur GitHub, pour une installation hors-ligne : `sudo apt install ./endoriumfort-server_<version>_amd64.deb`.

## Ce que l'installation met en place

| Élément | Emplacement |
|---|---|
| Binaires | `/opt/endoriumfort/bin/` |
| Données (base, journal d'audit) | `/var/lib/endoriumfort/` |
| Configuration du bastion | `/etc/endoriumfort/endoriumfort.env` |
| Configuration du partage de fichiers | `/etc/endoriumfort/fileshare.env` |
| Clé des tickets de partage | `/etc/endoriumfort/fileshare.key`, générée à l'installation |
| Certificat TLS | `/etc/endoriumfort/tls/`, auto-signé à l'installation |
| Site nginx | `/etc/nginx/sites-available/endoriumfort.conf` |
| Services systemd | `endoriumfort.service`, `endoriumfort-files.service` |

Le bastion écoute en interne sur `8080`, nginx sur `80` et `443`, et le service de fichiers uniquement sur `127.0.0.1:8090`.

## Configurer

Ajoutez vos réglages dans `/etc/endoriumfort/endoriumfort.env`, une variable par ligne, puis redémarrez :

```
# /etc/endoriumfort/endoriumfort.env
ENDORIUMFORT_PORT=8080
ENDORIUMFORT_TOKEN_TTL_SECONDS=3600
ENDORIUMFORT_VAULT_KEY=<openssl rand -hex 32>
ENDORIUMFORT_AUDIT_HMAC_KEY=<openssl rand -hex 32>
ENDORIUMFORT_WEBAUTHN_RP_ID=bastion.example.com
ENDORIUMFORT_WEBAUTHN_ORIGIN=https://bastion.example.com
```

```
sudo chmod 640 /etc/endoriumfort/endoriumfort.env
sudo chown root:endoriumfort /etc/endoriumfort/endoriumfort.env
sudo systemctl restart endoriumfort
```

Toutes les variables sont listées dans [Variables d'environnement](#/configuration).

## Certificat

Remplacez le certificat auto-signé par le vôtre, en gardant les mêmes noms de fichiers :

```
sudo cp fullchain.pem /etc/endoriumfort/tls/tls.crt
sudo cp privkey.pem   /etc/endoriumfort/tls/tls.key
sudo chmod 600 /etc/endoriumfort/tls/tls.key
sudo systemctl reload nginx
```

## Navigateur isolé

Le paquet n'installe pas de navigateur. Pour utiliser le [navigateur isolé](#/proxy-rbi), installez Chromium sur l'hôte ; le bastion le trouve seul dans le `PATH` :

```
sudo apt-get install chromium fonts-liberation
```

## Durcissement systemd

Les deux services tournent sous des comptes distincts (`endoriumfort`, `endoriumfort-files`) avec `NoNewPrivileges`, `ProtectSystem=strict` et un accès en écriture limité à leur propre répertoire. Le service de fichiers n'a aucune sortie réseau et ses données (`/var/lib/endoriumfort-files`, mode `0700`) sont illisibles par le bastion.

## Commandes utiles

```
systemctl status endoriumfort endoriumfort-files
journalctl -u endoriumfort -f
curl -sf http://127.0.0.1:8080/api/health
```

## Désinstaller

`sudo apt-get remove endoriumfort-server` retire les binaires et garde données et configuration.

> **`purge` supprime tout** : configuration, clés, base, journal d'audit **et** lecteurs de fichiers (`/etc/endoriumfort`, `/var/lib/endoriumfort`, `/var/lib/endoriumfort-files`). [Sauvegardez](#/sauvegarde) avant.

## Ensuite

[Premier démarrage](#/premier-demarrage).
