terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# --------------------------------------------------
# GCS Bucket — Static Website Hosting
# --------------------------------------------------
resource "google_storage_bucket" "website" {
  name          = var.bucket_name
  location      = var.region
  force_destroy = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }

  uniform_bucket_level_access = true
  public_access_prevention    = "inherited"
}

# Make the bucket publicly readable
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.website.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# --------------------------------------------------
# Upload frontend files to the bucket
# --------------------------------------------------
locals {
  frontend_dir = "${path.module}/../frontend"

  mime_types = {
    ".html" = "text/html"
    ".css"  = "text/css"
    ".js"   = "application/javascript"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".pdf"  = "application/pdf"
    ".txt"  = "text/plain"
    ".md"   = "text/markdown"
  }

  # Short cache for code files so Cloudflare picks up changes quickly.
  # Static assets (images, PDFs) get a longer cache.
  cache_control = {
    ".html" = "public, max-age=60"
    ".css"  = "public, max-age=300"
    ".js"   = "public, max-age=60"
    ".json" = "public, max-age=60"
    ".png"  = "public, max-age=86400"
    ".jpg"  = "public, max-age=86400"
    ".jpeg" = "public, max-age=86400"
    ".gif"  = "public, max-age=86400"
    ".svg"  = "public, max-age=86400"
    ".ico"  = "public, max-age=86400"
    ".pdf"  = "public, max-age=86400"
  }
}

resource "google_storage_bucket_object" "frontend_files" {
  for_each = fileset(local.frontend_dir, "**/*")

  name          = each.value
  source        = "${local.frontend_dir}/${each.value}"
  bucket        = google_storage_bucket.website.name
  content_type  = lookup(local.mime_types, regex("\\.[^.]+$", each.value), "application/octet-stream")
  cache_control = lookup(local.cache_control, regex("\\.[^.]+$", each.value), "public, max-age=3600")
}

# --------------------------------------------------
# Cloud CDN + HTTPS Load Balancer (optional, for custom domain)
# --------------------------------------------------
resource "google_compute_backend_bucket" "website_backend" {
  name        = "${replace(var.bucket_name, ".", "-")}-backend"
  bucket_name = google_storage_bucket.website.name
  enable_cdn  = true
}

resource "google_compute_url_map" "website_url_map" {
  name            = "${replace(var.bucket_name, ".", "-")}-url-map"
  default_service = google_compute_backend_bucket.website_backend.id
}

# HTTP proxy (serves traffic or redirects to HTTPS when SSL is set up)
resource "google_compute_target_http_proxy" "website_http_proxy" {
  name    = "${replace(var.bucket_name, ".", "-")}-http-proxy"
  url_map = google_compute_url_map.website_url_map.id
}

resource "google_compute_global_forwarding_rule" "website_http_rule" {
  name       = "${replace(var.bucket_name, ".", "-")}-http-rule"
  target     = google_compute_target_http_proxy.website_http_proxy.id
  port_range = "80"
  ip_address = google_compute_global_address.website_ip.address
}

resource "google_compute_global_address" "website_ip" {
  name = "${replace(var.bucket_name, ".", "-")}-ip"
}

# ==================================================
# BACKEND — Firestore + Cloud Function (Visitor Counter)
# ==================================================

# --------------------------------------------------
# Enable required APIs
# --------------------------------------------------
resource "google_project_service" "firestore" {
  service            = "firestore.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "cloudfunctions" {
  service            = "cloudfunctions.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "cloudbuild" {
  service            = "cloudbuild.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "run" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifactregistry" {
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

# --------------------------------------------------
# Firestore Database (Native mode)
# --------------------------------------------------
resource "google_firestore_database" "default" {
  name        = "(default)"
  project     = var.project_id
  location_id = var.firestore_location
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.firestore]
}

# --------------------------------------------------
# GCS bucket to hold Cloud Function source code
# --------------------------------------------------
resource "google_storage_bucket" "functions_source" {
  name          = "${var.project_id}-cf-source"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true
}

# Archive the Cloud Function source
data "archive_file" "function_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/api"
  output_path = "${path.module}/tmp/function-source.zip"
}

resource "google_storage_bucket_object" "function_source" {
  name   = "function-source-${data.archive_file.function_zip.output_md5}.zip"
  bucket = google_storage_bucket.functions_source.name
  source = data.archive_file.function_zip.output_path
}

# --------------------------------------------------
# Service account for the Cloud Function (Firestore access)
# --------------------------------------------------
resource "google_service_account" "cloud_function_sa" {
  account_id   = "visitor-counter-sa"
  display_name = "Visitor Counter Cloud Function SA"
}

resource "google_project_iam_member" "cf_firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.cloud_function_sa.email}"
}

# --------------------------------------------------
# Cloud Function (2nd Gen) — Visitor Counter API
# --------------------------------------------------
resource "google_cloudfunctions2_function" "visitor_counter" {
  name     = "visitor-counter"
  location = var.region

  build_config {
    runtime     = "python312"
    entry_point = "visitor_counter"

    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = google_storage_bucket_object.function_source.name
      }
    }
  }

  service_config {
    max_instance_count    = 5
    min_instance_count    = 0
    available_memory      = "256M"
    timeout_seconds       = 60
    service_account_email = google_service_account.cloud_function_sa.email

    environment_variables = {
      GCP_PROJECT = var.project_id
    }
  }

  depends_on = [
    google_project_service.cloudfunctions,
    google_project_service.cloudbuild,
    google_project_service.run,
    google_project_service.artifactregistry,
    google_firestore_database.default,
    google_project_iam_member.cf_firestore_user,
  ]
}

# Allow unauthenticated (public) invocations
resource "google_cloud_run_service_iam_member" "invoker" {
  project  = var.project_id
  location = var.region
  service  = google_cloudfunctions2_function.visitor_counter.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
