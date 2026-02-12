variable "project_id" {
  description = "cloud-resume-challenge-486522"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-east1"
}

variable "bucket_name" {
  description = "wesleyjeantyresume.com"
  type        = string
}

variable "domain_name" {
  description = "wesleyjeantyresume.com"
  type        = string
  default     = ""
}

variable "firestore_location" {
  description = "Firestore database location (multi-region or single region)"
  type        = string
  default     = "nam5"
}
