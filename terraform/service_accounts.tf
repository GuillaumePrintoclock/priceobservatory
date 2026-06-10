# Deux service accounts aux rôles disjoints :
#   po-pipeline — identité d'EXÉCUTION (functions, workflows, scheduled queries)
#   po-deploy   — identité de DÉPLOIEMENT (GitHub Actions via WIF, jamais de clé)

resource "google_service_account" "pipeline" {
  account_id   = "po-pipeline"
  display_name = "Price Observatory — runtime pipeline"
  description  = "Exécute les Cloud Functions, Workflows et scheduled queries"
}

resource "google_service_account" "deploy" {
  account_id   = "po-deploy"
  display_name = "Price Observatory — déploiement CI/CD"
  description  = "Utilisé par GitHub Actions via Workload Identity Federation"
}

# ── Rôles du runtime ─────────────────────────────────────────────────
# Lancer des jobs BigQuery (requêtes, loads)
resource "google_project_iam_member" "pipeline_bq_jobuser" {
  project = var.project_id
  role    = "roles/bigquery.jobUser"
  member  = google_service_account.pipeline.member
}

# Écriture limitée AU dataset analytics (pas tout le projet)
resource "google_bigquery_dataset_iam_member" "pipeline_dataeditor" {
  dataset_id = google_bigquery_dataset.analytics.dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = google_service_account.pipeline.member
}

# Gemini via Vertex AI (fn-extract)
resource "google_project_iam_member" "pipeline_aiplatform" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = google_service_account.pipeline.member
}

# Lecture des secrets (clé FireCrawl…)
resource "google_project_iam_member" "pipeline_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = google_service_account.pipeline.member
}

# Workflows : invoquer les functions (Gen 2 = Cloud Run sous le capot)
resource "google_project_iam_member" "pipeline_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = google_service_account.pipeline.member
}

# ── Rôles du déploiement (GitHub Actions) ────────────────────────────
resource "google_project_iam_member" "deploy_functions" {
  project = var.project_id
  role    = "roles/cloudfunctions.developer"
  member  = google_service_account.deploy.member
}

resource "google_project_iam_member" "deploy_workflows" {
  project = var.project_id
  role    = "roles/workflows.editor"
  member  = google_service_account.deploy.member
}

resource "google_project_iam_member" "deploy_scheduler" {
  project = var.project_id
  role    = "roles/cloudscheduler.admin"
  member  = google_service_account.deploy.member
}

# Déployer une function qui "run as" po-pipeline exige actAs sur ce SA précis
resource "google_service_account_iam_member" "deploy_actas_pipeline" {
  service_account_id = google_service_account.pipeline.name
  role               = "roles/iam.serviceAccountUser"
  member             = google_service_account.deploy.member
}
