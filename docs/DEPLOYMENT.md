# Deployment guide

BuildTrack targets Node.js 24, PostgreSQL 18 and a static Angular bundle behind Nginx. The included Compose stack is for local development and was not executed on the current host because Docker is unavailable.

## Required production services

- A least-privileged PostgreSQL database with backups, point-in-time recovery and monitored storage.
- TLS termination and a reverse proxy that preserves the configured public origin.
- SMTP for password-reset delivery. Production startup rejects the local mail provider.
- Durable private object storage for documents. The current local filesystem adapter is suitable only for a single development instance and must be replaced or mounted on durable, backed-up storage before horizontal scaling.
- Central logs, uptime checks, alerting and retention policies.

## Release sequence

1. Build and test with Node 24 using `npm ci --ignore-scripts`, explicit Prisma generation, lint, builds and all test suites.
2. Run `npm audit --omit=dev` and review changes to the lockfile.
3. Back up the target database and run `prisma migrate deploy` as a controlled release step. Do not run `migrate dev` in production.
4. Build the backend and Angular images. Supply secrets through the deployment platform, never image layers or source control.
5. Start the API, verify `/api/ready`, then switch traffic. Serve Angular through TLS and proxy `/api` to the backend.
6. Verify login, refresh/logout, an authorized project read, a report download and a document download. Monitor errors and database connections before completing rollout.

## Required settings

Set a unique 48+ character `JWT_SECRET`, HTTPS `APP_ORIGIN`, production `DATABASE_URL`, SMTP settings and a restricted sender address. Disable demo seeding and remove demo accounts. Configure trusted proxy behavior explicitly before relying on IP rate limits behind a load balancer.

The local upload directory and development mail sink can contain sensitive data. Restrict permissions, exclude them from images and backups unless intentionally protected, and define retention/deletion procedures. Camera and weather endpoints stay in unconfigured/demo state until reviewed provider adapters and credentials are supplied.

## Rollback

Application rollback must remain schema-compatible with all already-applied migrations. Restore a database backup only as a coordinated incident procedure. Preserve uploaded document blobs and database rows together so version metadata never points to missing files.
