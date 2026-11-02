// Browses the real EndoriumFort Enterprise interface (Vite dev server proxied
// to the seeded bastion) as each demo role and records every /api exchange.
// Run by capture.mjs.
const ADMIN_SECTIONS = ['resources', 'users', 'routing', 'jit', 'enterprise', 'vault', 'itdr', 'k8s', 'appearance', 'security', 'license'];
const PAGES = ['/carte', '/sessions', '/demandes', '/journal', '/preuves', '/rapports', '/zones', '/compte'];

// `chromium` comes from the EE checkout's Playwright (see capture.mjs).
export async function recordUi(UI, logins, chromium) {
  const exchanges = [];
  const browser = await chromium.launch();
  for (const [role, login] of Object.entries(logins)) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR' });
    await context.addCookies([{ name: 'endoriumfort_token', value: login.token, url: UI, httpOnly: true, sameSite: 'Strict' }]);
    await context.addInitScript((value) => localStorage.setItem('endoriumfort_auth', value), JSON.stringify({
      token: login.token, user: login.user, role: login.role, permissions: login.permissions || [], expiresAt: login.expiresAt || ''
    }));
    const page = await context.newPage();
    page.on('response', async (response) => {
      const url = new URL(response.url());
      if (!url.pathname.startsWith('/api/')) return;
      const request = response.request();
      let body = null;
      try { body = await response.text(); } catch (_) {}
      exchanges.push({
        role,
        method: request.method(),
        path: url.pathname,
        query: url.search,
        requestBody: request.postData() || null,
        status: response.status(),
        licenseRequired: response.headers()['x-endoriumfort-license-required'] === '1',
        contentType: response.headers()['content-type'] || '',
        body
      });
    });
    const visit = async (path) => {
      try {
        await page.goto(UI + path);
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(700);
      } catch (e) {
        console.log('[ui]', role, path, e.message.split('\n')[0]);
      }
    };
    for (const path of PAGES) await visit(path);
    if (role === 'admin') for (const section of ADMIN_SECTIONS) await visit(`/admin/${section}`);
    console.log('[ui]', role, 'done,', exchanges.filter((x) => x.role === role).length, 'exchanges');
    await context.close();
  }
  await browser.close();
  return exchanges;
}
