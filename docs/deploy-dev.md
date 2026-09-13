# Deploy the PID register to Azure dev

The manually triggered **Deploy dev** GitHub Actions workflow packages Prez as a
Python 3.12 Azure Function and builds the themed Prez UI as static files. Hosting
is managed in `kai-infra/terraform/pidreg.tf`. The Docker Compose services remain
available for local development; Azure does not run those containers.

## 1. Prepare infrastructure

In kai-infra, supply the SPARQL password privately and set:

```bash
export TF_VAR_pidreg_github_oidc_subject='repo:AGLDWG@7861841/pid-register-config@1359786839:environment:dev'
```

Follow `kai-infra/docs/pidreg.md` to bootstrap the resources, create the three DNS
records, and complete the full Terraform apply. Confirm that the pidreg Fuseki
dataset and credentials are deployed. The Function settings must include
`DISABLE_PREFIX_GENERATION=true` and
`ENDPOINT_STRUCTURE=["catalogues", "catalogues", "items"]`, in addition to the
remote SPARQL connection and anonymous Function settings managed by Terraform.

## 2. Configure the GitHub dev environment

In **Settings → Environments → dev**, add these environment variables. Retrieve
values from the kai-infra root with `task terraform:output -- -raw OUTPUT_NAME`.

| GitHub variable | Terraform output |
| --- | --- |
| AZURE_CLIENT_ID | PIDREG_AZURE_CLIENT_ID |
| AZURE_TENANT_ID | PIDREG_AZURE_TENANT_ID |
| AZURE_SUBSCRIPTION_ID | PIDREG_AZURE_SUBSCRIPTION_ID |
| AZURE_FUNCTION_APP_NAME | PIDREG_AZURE_FUNCTION_APP_NAME |
| PREZ_API_ENDPOINT | PIDREG_PREZ_API_ENDPOINT |
| PREZ_UI_URL | PIDREG_PREZ_UI_URL |

Add environment **secret** `PREZ_UI_SWA_DEPLOYMENT_TOKEN` using the sensitive
output `PIDREG_PREZ_UI_SWA_DEPLOYMENT_TOKEN`. Retrieve and copy it privately.
The Fuseki password belongs in Terraform/Azure settings, not in GitHub or the UI.
No Azure client secret, publish profile, or container registry is needed.

The Azure identity trusts this repository's immutable-ID OIDC subject for `dev`.
The workflow declares `environment: dev` and `id-token: write`. If Actions policy
restricts third-party actions, allow the actions referenced by the workflow.

## 3. Push and run

Push these changes to `main`. Then open **Actions → Deploy dev → Run workflow**
and select `main`. A push alone does not deploy. Wait for the workflow to finish;
it builds both artifacts before deployment, then publishes Prez followed by UI.
Build dependencies must be downloadable by GitHub's runner, including the Prez
and rdf2geojson Git revisions in `prez/uv.lock`.

Prez dependencies are installed from the full lock export on a Linux Python 3.12
runner. `--no-deps` preserves that exported set, including the locked rdf2geojson
Git source. The prebuilt package includes `.python_packages`, Functions host
files, and repository configuration; remote rebuilding is disabled. Local
settings and credentials are excluded by the explicit file copy.

The UI reuses `prez-ui/Dockerfile` and its version defaults, theme overrides, logo,
and Static Web Apps routing file. It calls the public API directly; the local
nginx `/api` proxy is not used in Azure. The existing Terraform CORS setting
allows browser requests to that API.

## 4. Verify and update

Open <https://pidreg.dev.kurrawong.ai/catalogues> and confirm the registers and
individual entries load. The workflow checks the API catalogue route and UI
homepage; the browser check verifies the complete integration.

For later changes, push and run **Deploy dev** again. Rebuild the UI after an API
URL change. A failure after the API deploy can leave the API updated while the
UI is unchanged; fix the failure and rerun the workflow. For OIDC failures,
check the exact subject, environment, and Azure IDs. For API failures, inspect
`pidreg-dev` Application Insights and confirm upstream Fuseki access.
