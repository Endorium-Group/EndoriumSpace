// Settings of the recent EndoriumFort features on resources of the capture,
// so the console shows them as an administrator would have set them:
// browser RDP with a published application (#113, #112), direct web access on
// a subdomain with server-side sign-in and transfer rules (#132, #134, #135).
// Their live streams need a real bastion; opening them says so (shell.js,
// api.js app-ticket).
export function seedRecentFeatures(s) {
  const rds = s.resources.find((r) => r.name === 'win-rds-01');
  if (rds) {
    rds.rdpProfile = {
      program: '||compta', args: '', workdir: '', clipboard: true, printers: false, drives: false,
      browser: true, certPolicy: 'strict', jpegQuality: 70, maxFps: 15
    };
    rds.description = 'Logiciel de compta publié seul (RemoteApp), ouvert dans le navigateur';
  }
  const grafana = s.resources.find((r) => r.name === 'grafana');
  if (grafana) {
    Object.assign(grafana, {
      webAccessMode: 'direct',
      appSubdomain: 'grafana',
      webLoginMode: 'form',
      webLoginUrl: '/login',
      webLoginUserSelector: 'input[name=user]',
      webLoginPasswordSelector: 'input[name=password]',
      webLoginSubmitSelector: 'button[type=submit]',
      webDlp: {
        readOnly: false,
        noCache: true,
        download: { mode: 'types', types: ['csv', 'png'], maxMb: 20 },
        upload: { mode: 'block', types: [], maxMb: 0 },
        csp: ''
      },
      description: 'Accès direct sur son sous-domaine, connexion automatique, téléchargements limités aux CSV et PNG'
    });
  }
}
