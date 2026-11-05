# Garde-fou de commandes SSH

Le **garde-fou** (« SSH guard » dans la console) bloque côté serveur les commandes dangereuses tapées dans une session SSH. Une commande bloquée **n'atteint jamais la cible** : le bastion la retient et journalise le blocage.

## Activer sur une ressource

**Administration → Ressources → (ressource SSH) → Règles d'accès → SSH guard (bloque les commandes dangereuses).**

Le garde-fou ne s'applique qu'aux ressources où il est coché. Le bilan de l'onglet **Sécurité** signale les ressources SSH à risque élevé qui ne l'ont pas.

## Règles fournies

Cinq règles sont livrées actives :

| Règle | Ce qu'elle bloque |
|---|---|
| `wipe_root` | `rm -rf /` |
| `fork_bomb` | la « bombe fork » shell classique |
| `disk_format` | `mkfs` et ses variantes (`mkfs.ext4`…) |
| `raw_disk_dd` | `dd` écrivant vers un périphérique `/dev/…` |
| `power_command` | `shutdown`, `poweroff`, `reboot` |

Elles sont reconnues en début de ligne ou après un séparateur (`;`, `&`, `|`), précédées ou non de `sudo` ou d'un chemin (`/sbin/reboot`).

Les règles fournies peuvent être **désactivées** une par une, mais pas supprimées : on assouplit le garde-fou délibérément, on ne perd pas une protection en éditant une liste.

## Ajouter vos règles

**Administration → Sécurité → règles du SSH guard.** Saisissez un nom et une commande **en clair**, par exemple `systemctl stop postgresql` ou `iptables -F`. Le bastion la convertit lui-même en motif, avec les mêmes tolérances que les règles fournies (séparateurs, `sudo`, chemin).

Les expressions régulières brutes ne sont volontairement pas acceptées : une expression erronée bloquerait tout ou rien, et elle serait évaluée à chaque frappe.

Les règles s'appliquent à **toutes** les ressources où le garde-fou est actif.

## Ce qui se passe lors d'un blocage

- la ligne n'est pas envoyée à la cible ;
- l'opérateur voit l'avertissement « Command blocked by bastion guard » ;
- un événement `command_guard.block` est écrit dans le [journal d'audit](#/audit), avec la session concernée et la règle déclenchée.

## Caractères acceptés

Sur une ressource gardée, la saisie est limitée aux caractères ASCII imprimables usuels : lettres sans accent, chiffres, espaces et ponctuation du shell. Une saisie contenant d'autres caractères — lettres accentuées, emoji, caractères Unicode — est bloquée comme une commande interdite (raison `non_whitelisted_input`). Les touches d'édition (Entrée, Retour arrière, Ctrl-C, flèches) passent normalement.

Si vos opérateurs doivent saisir du texte accentué sur une cible, n'activez pas le garde-fou sur cette ressource.

## Ses limites

Le garde-fou reconstitue la ligne telle que le shell la lirait, guillemets et échappements retirés : `r''m`, `"rm"` et `r\m` sont tous lus `rm`. Il ne résout pas en revanche les variables (`$IFS`, `${x}`), ni les substitutions de commande, ni le contenu d'un script exécuté.

> Le garde-fou **élève le niveau** face aux erreurs et aux contournements occasionnels. Ce n'est **pas** une frontière de sécurité face à un opérateur déterminé et malveillant. Combinez-le avec des comptes cibles aux droits minimaux, le motif obligatoire et la relecture du journal.
