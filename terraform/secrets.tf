# Conteneurs de secrets — les VALEURS ne passent jamais par Terraform
# (ni par l'état) : elles sont versionnées via gcloud :
#   echo -n "<valeur>" | gcloud secrets versions add FIRECRAWL_API_KEY --data-file=-

resource "google_secret_manager_secret" "firecrawl_api_key" {
  secret_id = "FIRECRAWL_API_KEY"

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}
