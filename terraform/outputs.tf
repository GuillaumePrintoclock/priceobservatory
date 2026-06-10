# Valeurs à renseigner comme secrets GitHub Actions :
#   GCP_WORKLOAD_IDENTITY_PROVIDER ← wif_provider
#   GCP_SERVICE_ACCOUNT            ← deploy_service_account

output "wif_provider" {
  description = "Identifiant complet du provider WIF (secret GHA GCP_WORKLOAD_IDENTITY_PROVIDER)"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "deploy_service_account" {
  description = "Email du SA de déploiement (secret GHA GCP_SERVICE_ACCOUNT)"
  value       = google_service_account.deploy.email
}

output "pipeline_service_account" {
  description = "Email du SA runtime — à utiliser comme identité des functions/workflows"
  value       = google_service_account.pipeline.email
}
