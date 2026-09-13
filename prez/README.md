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

Azure deployment is handled by the manually triggered **Deploy dev** workflow.
See [the deployment runbook](../docs/deploy-dev.md) for infrastructure and GitHub
settings. The workflow packages the full locked dependency set on Linux. Azure
does not publish or read `local.settings.json` in production.
