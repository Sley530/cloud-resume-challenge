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
}

resource "google_storage_bucket_object" "frontend_files" {
  for_each = fileset(local.frontend_dir, "**/*")

  name         = each.value
  source       = "${local.frontend_dir}/${each.value}"
  bucket       = google_storage_bucket.website.name
  content_type = lookup(local.mime_types, regex("\\.[^.]+$", each.value), "application/octet-stream")
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
