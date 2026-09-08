# Prez configuration

The endpoint definition under `config/` is copied into the Prez API
image by the repository's root `Dockerfile`.

## Azure Functions

This directory is also an Azure Functions Python project. It wraps Prez's ASGI
application, uses the remote SPARQL repository configured in `local.settings.json`,
and merges `config/` with Prez's packaged reference data at startup.

From the repository root, prepare and run it with:

```bash
task prez:uv:sync
task prez:dev
```

The local Functions host listens on <http://localhost:7071>. Copy
`local.settings.example.json` to the ignored `local.settings.json` before first use.

The `prez:uv:export` task can produce a temporary `requirements.txt` for a later
Azure Python remote build. Deployment automation and production credential
settings are intentionally deferred. Azure does not publish or read
`local.settings.json` in production.
