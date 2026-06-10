# APIs nécessaires au pipeline (idempotent — adopte celles déjà activées).
# disable_on_destroy=false : un `terraform destroy` ne coupe pas les APIs,
# trop dangereux sur un projet vivant.

locals {
  apis = [
    "bigquery.googleapis.com",
    "bigquerydatatransfer.googleapis.com", # scheduled queries (Quick Win)
    "cloudfunctions.googleapis.com",
    "cloudbuild.googleapis.com", # build des functions Gen 2
    "run.googleapis.com",        # runtime des functions Gen 2
    "artifactregistry.googleapis.com",
    "workflows.googleapis.com",
    "cloudscheduler.googleapis.com",
    "aiplatform.googleapis.com",    # Gemini (fn-extract)
    "secretmanager.googleapis.com", # clé FireCrawl, etc.
    "logging.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com", # Workload Identity Federation
    "sts.googleapis.com",            # Workload Identity Federation
    "storage.googleapis.com",
  ]
}

resource "google_project_service" "apis" {
  for_each = toset(local.apis)

  service            = each.value
  disable_on_destroy = false
}
