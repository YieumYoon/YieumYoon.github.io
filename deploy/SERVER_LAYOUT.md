# Oracle VM service layout

This VM is intended to host several small personal services and a background
agent system without Docker. Treat systemd and Unix accounts as the service
boundary.

## Rules

1. Give every service its own non-login or restricted Unix account. Service
   accounts do not receive sudo access and do not share writable directories.
2. Store versioned application releases under `/opt/<service>/releases`,
   runtime secrets under `/etc/<service>`, mutable data under
   `/var/lib/<service>`, caches under `/var/cache/<service>`, and backups under
   `/var/backups/<service>`.
3. Bind HTTP services to unique loopback ports. Keep a port registry in this
   document when services are added. Do not expose application or database
   ports in Oracle ingress rules.
4. Use one host PostgreSQL instance, but create a separate role and database
   for each service. Keep PostgreSQL bound to localhost.
5. Put interactive services in `personal-services.slice` and agents in
   `agent-services.slice`. The agent slice has lower CPU and IO weight so
   background work yields to interactive services under contention.
6. Add hard `MemoryHigh`, `MemoryMax`, `CPUQuota`, and `TasksMax` values only
   after measuring the VM. Limits should reflect actual RAM, swap, CPU count,
   and the agent workload.
7. Use journald for logs and systemd restart policies. Avoid separate process
   managers such as PM2 unless an application specifically requires one.
8. Back up PostgreSQL databases and `/etc/<service>` secrets separately. Git
   repositories are not a backup for database or credential state.

## Port registry

| Port | Service | Exposure |
| --- | --- | --- |
| 3000 | Pages CMS | Tailscale Serve HTTPS only |

Assign a new loopback port before adding each service. Prefer a separate
Tailscale Service name when a service needs its own HTTPS hostname. Otherwise,
use a distinct private HTTPS port. Path-prefix routing is suitable only when
the application explicitly supports a base path.

## Agent boundary

An agent that can execute shell commands is more privileged than an ordinary
web application. Run it as a dedicated account in `agent-services.slice`, give
it write access only to its workspace and state directory, and do not add it to
the `sudo`, `docker`, or application service groups.

systemd hardening protects the host from mistakes, but it is not a complete
security boundary for hostile or arbitrary code. If an agent later runs
untrusted third-party code, use a dedicated VM or a lightweight sandbox such
as a restricted transient systemd unit plus a filesystem sandbox. Do not grant
host-wide command execution merely for convenience.

## First SSH audit

Before choosing resource limits, record:

```bash
cat /etc/os-release
nproc
free -h
df -h
swapon --show
systemd --version
tailscale version
sudo ss -ltnup
sudo systemctl --failed
```

Use those results to decide whether swap or zram is needed and to set slice
memory limits. A small 1 GB VM needs a materially different plan from an Ampere
A1 instance with several CPUs and much more memory.
