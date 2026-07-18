# Private Pages CMS deployment

This directory packages Pages CMS as a native systemd service for an Oracle
Cloud VM. PostgreSQL runs as the host database service and listens only on
localhost. Pages CMS also listens only on `127.0.0.1:3000`; Tailscale Serve
provides the private HTTPS endpoint.

The release builder uses `fnm`, pins Pages CMS to commit
`6f4e860a35d934406580287e7042e5e111e207a1` (release 2.1.8), and applies the
files under `overlay/`. The overlay contains the private-email login fallback
and timestamp buttons used by this blog.

## Filesystem layout

```text
/opt/pagescms/releases/<upstream>-<overlay>/  immutable application releases
/opt/pagescms/current                         active release symlink
/opt/pagescms/node/current                    fnm-selected Node bin symlink
/opt/pagescms/bin/start.sh                    systemd start wrapper
/etc/pagescms/pagescms.env                    runtime configuration
/etc/pagescms/github-app.pem                  GitHub App private key
/var/lib/pagescms                             systemd-managed state directory
/var/cache/pagescms                           systemd-managed cache directory
/var/backups/pagescms                         local database dumps
```

## Server prerequisites

- Ubuntu or another systemd-based Linux distribution
- Git, curl, build tools, PostgreSQL client/server, and Tailscale
- Node.js 24 installed with `fnm` for the `pagescms` service account
- The existing GitHub App installed only on `YieumYoon.github.io`
- No Oracle ingress rules for TCP 3000 or 5432

The exact package installation commands should be run after checking the VM's
distribution and resources over SSH.

## Initial installation

Create a dedicated account and directories:

```bash
sudo useradd --system --create-home --home-dir /home/pagescms --shell /bin/bash pagescms
sudo install -d -o pagescms -g pagescms -m 0750 \
  /opt/pagescms /opt/pagescms/bin /opt/pagescms/releases /opt/pagescms/node
sudo install -d -o root -g pagescms -m 0750 /etc/pagescms
sudo install -d -o pagescms -g pagescms -m 0700 /var/backups/pagescms
```

Install `fnm` and Node 24 while logged in as the service account. Do not run
the Pages CMS process as your normal SSH user or as root.

Create a PostgreSQL role and database named `pagescms`. Use a hexadecimal
password generated with `openssl rand -hex 32`, and confirm PostgreSQL listens
only on loopback:

```bash
sudo ss -ltnp | grep 5432
```

Install configuration and the service files from this directory:

```bash
sudo install -o root -g pagescms -m 0640 .env.example /etc/pagescms/pagescms.env
sudo install -o root -g pagescms -m 0640 github-app.pem.example /etc/pagescms/github-app.pem
sudo install -o root -g root -m 0755 scripts/start.sh /opt/pagescms/bin/start.sh
sudo install -o root -g root -m 0644 ../systemd/personal-services.slice /etc/systemd/system/personal-services.slice
sudo install -o root -g root -m 0644 systemd/pagescms.service /etc/systemd/system/pagescms.service
```

Replace every placeholder under `/etc/pagescms`. Keep the private key as a
normal PEM file rather than embedding multiline content in an environment
variable.

Build the pinned release as the service account:

```bash
sudo -iu pagescms
cd /path/to/YieumYoon.github.io/deploy/pagescms
./scripts/build-release.sh
exit
```

Enable the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now pagescms
sudo systemctl status pagescms
curl --fail http://127.0.0.1:3000/api/app/version
```

Database migrations run automatically before the CMS process starts.

## Tailscale and GitHub App

Expose only the loopback service to the tailnet:

```bash
sudo tailscale serve --bg 3000
sudo tailscale serve status
```

Set `BASE_URL` to the printed HTTPS URL without a trailing slash. This must be
Tailscale Serve, not Funnel.

Update the existing GitHub App settings:

```text
Homepage URL:  https://oracle-node.tailnet.ts.net
Callback URL:  https://oracle-node.tailnet.ts.net/api/auth/callback/github
Setup URL:     https://oracle-node.tailnet.ts.net/
Webhook:       inactive
```

Restart Pages CMS after changing its environment file:

```bash
sudo systemctl restart pagescms
```

## Operations

Logs and status:

```bash
sudo journalctl -u pagescms -f
sudo systemctl status pagescms
```

Build and activate a changed overlay:

```bash
sudo -iu pagescms /path/to/deploy/pagescms/scripts/build-release.sh
sudo systemctl restart pagescms
```

Clear stale CMS cache after editing content outside Pages CMS:

```bash
sudo -u pagescms env \
  PATH=/opt/pagescms/node/current:/usr/local/bin:/usr/bin \
  bash -lc 'set -a; source /etc/pagescms/pagescms.env; set +a; cd /opt/pagescms/current; npm run db:clear-cache'
sudo systemctl restart pagescms
```

Back up the CMS database:

```bash
sudo -u pagescms ./scripts/backup.sh
```

The blog content itself is already in GitHub. PostgreSQL contains login,
session, collaborator, and cache state.

## Security boundary

- Pages CMS and PostgreSQL bind only to loopback.
- The CMS runs as the unprivileged `pagescms` account with no sudo access.
- systemd makes the host filesystem read-only to the running CMS except for its
  state and cache directories.
- Tailscale ACLs and GitHub login are separate access controls.
- Secrets stay in `/etc/pagescms`, outside the Git checkout.
- Public Tailscale Funnel is not used.

## Updating upstream

The upstream commit is deliberately pinned in `scripts/build-release.sh`.
Updating it requires comparing the overlay files with the new upstream source,
building a new release, and completing a create-draft round trip before the
`current` symlink is activated. Do not deploy from a floating branch.
