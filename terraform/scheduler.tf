# Déclencheur quotidien du pipeline concurrentiel — porte d'entrée unique.
# Exécute le workflow avec les couples produit × concurrent à traiter.
# NB : les pairs sont figés ici pour le MVP ; à terme ils seront générés
# depuis config/products.yaml × competitors.yaml (fn-plan ou étape workflow).

resource "google_project_iam_member" "pipeline_workflows_invoker" {
  project = var.project_id
  role    = "roles/workflows.invoker"
  member  = google_service_account.pipeline.member
}

resource "google_cloud_scheduler_job" "daily_pipeline" {
  name = "price-observatory-daily"
  # Cloud Scheduler n'est pas disponible en europe-west9 ; le job ne fait
  # qu'un POST vers l'API Workflows, sa région propre est sans incidence.
  region    = "europe-west1"
  schedule  = "30 7 * * *" # 07:30 Europe/Paris — après l'historisation interne (05:00 UTC = 07:00 Paris)
  time_zone = "Europe/Paris"

  http_target {
    http_method = "POST"
    uri         = "https://workflowexecutions.googleapis.com/v1/projects/${var.project_id}/locations/${var.region}/workflows/price-observatory/executions"

    body = base64encode(jsonencode({
      argument = jsonencode({
        pairs = [
          { product_id = "flyer-a5-135cb-recto", competitor_id = "pixart" },
        ]
      })
    }))

    oauth_token {
      service_account_email = google_service_account.pipeline.email
    }
  }

  retry_config {
    retry_count = 1
  }
}
