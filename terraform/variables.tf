variable "project_id" {
  description = "Projet GCP dédié Price Observatory"
  type        = string
  default     = "priceobservatory-498507"
}

variable "region" {
  description = "Région par défaut — alignée sur la source BigQuery pocv2 (cross-region interdit)"
  type        = string
  default     = "europe-west9"
}

variable "github_repository" {
  description = "Repo GitHub autorisé à déployer via Workload Identity Federation (owner/name)"
  type        = string
  default     = "GuillaumePrintoclock/priceobservatory"
}
