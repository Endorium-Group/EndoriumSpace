# Capturing the demo fixtures

`demo/src/fixtures.json` holds answers recorded from a real EndoriumFort
**Enterprise** bastion, so the static demo replays the product's exact response
shapes. Regenerate it after a product upgrade that changes the API.

Nothing here ships secrets: every account, host and ticket is fictitious, and
`capture.mjs` replaces the capture's passwords, tokens and local addresses
before writing the file.

## Prerequisites

- The Enterprise sources (private repository), e.g. `git archive origin/dev | tar -x -C /tmp/ee`.
- An Enterprise license the bastion accepts. Without access to the release keys,
  build with a throwaway local issuer (`ENDORIUMFORT_LICENSE_LOCAL_*`, see
  `backend/CMakeLists.txt`) and mint a short labs license with
  `scripts/sign-license.sh`. Delete that key pair afterwards; never reuse it.
- `npm ci` in `<ee>/frontend` (provides Vite, Playwright and `ssh2`), and
  `npx playwright install chromium`.
- The backend must be linked against **OpenSSL ≥ 3.5** (ML-DSA): with an older
  library every license is refused as `ml-dsa signature invalid`.

## Run

```bash
# 0. The file share service binary (Go), next to its sources
(cd /tmp/ee/fileshare && go build -o endoriumfort-files .)
export ENDORIUMFORT_FILESHARE_SECRET=$(openssl rand -hex 32)

# 1. A brand-new bastion with the license (empty data directory)
mkdir /tmp/efdata && cd /tmp/efdata
ENDORIUMFORT_PORT=8095 ENDORIUMFORT_VAULT_KEY=$(openssl rand -hex 32) \
ENDORIUMFORT_LICENSE_FILE=/path/to/license.jws ENDORIUMFORT_WEBAUTHN_RP_ID=localhost \
ENDORIUMFORT_FILESHARE_UPSTREAM=http://127.0.0.1:8090 \
  /tmp/ee/backend/build/endoriumfort_backend

# 2. Seed, browse the interface as each role, record (starts the file service on :8090)
node demo/capture/capture.mjs /tmp/ee http://localhost:8095
```

`seed.mjs` creates the data, `record-ui.mjs` visits every page of the real
interface (admin, operator, auditor) and keeps each `/api` exchange.
