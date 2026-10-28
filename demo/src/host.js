// Scripted Linux host: what the demo's simulated servers print. Shared by the
// in-browser terminal and the capture's fake SSH server (demo/capture/).
export function hostOutput(cmd, ctx) {
  const [name, ...args] = cmd.split(/\s+/);
  const now = new Date();
  const host = ctx.host;
  switch (name) {
    case 'help':
      return 'Commandes de démo : ls, pwd, whoami, hostname, uname -a, uptime, df -h, free -h,\r\nps, systemctl status nginx, tail /var/log/syslog, cat /etc/os-release, clear, exit\r\nEssayez aussi une commande dangereuse (ex. « rm -rf / ») : la garde SSH du bastion la bloque.';
    case 'ls':
      return args.includes('-la') || args.includes('-l')
        ? 'total 28\r\ndrwxr-x--- 4 ' + ctx.user + ' ' + ctx.user + ' 4096 ' + now.toDateString().slice(4, 10) + ' 09:12 .\r\n-rw-r--r-- 1 ' + ctx.user + ' ' + ctx.user + '  220 Jan  6  2026 .bash_logout\r\n-rw-r--r-- 1 ' + ctx.user + ' ' + ctx.user + ' 3771 Jan  6  2026 .bashrc\r\ndrwxr-xr-x 3 ' + ctx.user + ' ' + ctx.user + ' 4096 Oct  2 14:03 releases\r\n-rwxr-xr-x 1 ' + ctx.user + ' ' + ctx.user + ' 1204 Oct  2 14:03 deploy.sh'
        : '\x1b[1;34mreleases\x1b[0m  \x1b[1;32mdeploy.sh\x1b[0m';
    case 'pwd':
      return '/home/' + ctx.user;
    case 'whoami':
      return ctx.user;
    case 'id':
      return `uid=1001(${ctx.user}) gid=1001(${ctx.user}) groups=1001(${ctx.user}),27(sudo)`;
    case 'hostname':
      return host;
    case 'uname':
      return `Linux ${host} 6.12.48+deb13-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.12.48-1 x86_64 GNU/Linux`;
    case 'uptime':
      return ` ${now.toTimeString().slice(0, 8)} up 41 days,  3:27,  1 user,  load average: 0.31, 0.27, 0.22`;
    case 'df':
      return 'Filesystem      Size  Used Avail Use% Mounted on\r\n/dev/vda1        48G   17G   29G  37% /\r\ntmpfs           3.9G     0  3.9G   0% /dev/shm\r\n/dev/vdb1       200G   84G  117G  42% /srv';
    case 'free':
      return '               total        used        free      shared  buff/cache   available\r\nMem:           7.8Gi       2.1Gi       3.4Gi        41Mi       2.5Gi       5.6Gi\r\nSwap:          2.0Gi          0B       2.0Gi';
    case 'ps':
      return '    PID TTY          TIME CMD\r\n  48213 pts/0    00:00:00 bash\r\n  48377 pts/0    00:00:00 ps';
    case 'systemctl':
      return `\x1b[1;32m●\x1b[0m nginx.service - A high performance web server and a reverse proxy server\r\n     Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled; preset: enabled)\r\n     Active: \x1b[1;32mactive (running)\x1b[0m since ${new Date(now - 3 * 86400000).toUTCString()}\r\n   Main PID: 912 (nginx)\r\n      Tasks: 5 (limit: 9374)\r\n     Memory: 18.4M`;
    case 'tail':
      return [3, 2, 1].map((m) => `${new Date(now - m * 60000).toISOString().slice(0, 19)} ${host} CRON[${40100 + m}]: (root) CMD (/usr/local/bin/healthcheck)`).join('\r\n');
    case 'cat':
      return args[0] === '/etc/os-release'
        ? 'PRETTY_NAME="Debian GNU/Linux 13 (trixie)"\r\nNAME="Debian GNU/Linux"\r\nVERSION_ID="13"\r\nID=debian'
        : `cat: ${args[0] || ''}: Permission denied`;
    case 'cd':
      return '';
    case 'git':
      return args[0] === 'log'
        ? `\x1b[33mcommit 4f1c2e9a7b3d8e0c5a6f1b2d3e4c5a6b7c8d9e0f\x1b[0m\r\nAuthor: CI Portail <ci@interne.local>\r\nDate:   ${new Date(now - 7200000).toString()}\r\n\r\n    release 4.12 : correctif cache sessions`
        : 'usage: git [--version] [--help] <command> [<args>]';
    case 'echo':
      return args.join(' ');
    case 'date':
      return now.toString();
    case 'sudo':
      return `[sudo] password for ${ctx.user}: \r\nSorry, user ${ctx.user} may not run "${args.join(' ')}" on ${host} in this demo.`;
    default:
      return `-bash: ${name}: command not found`;
  }
}
