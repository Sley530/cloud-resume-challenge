output "bucket_url" {
  description = "Direct GCS bucket website URL"
  value       = "https://storage.googleapis.com/${google_storage_bucket.website.name}/index.html"
}

output "load_balancer_ip" {
  description = "Global IP address for the load balancer (point your DNS here)"
  value       = google_compute_global_address.website_ip.address
}

output "http_url" {
  description = "HTTP URL via load balancer"
  value       = "http://${google_compute_global_address.website_ip.address}"
}

output "visitor_counter_url" {
  description = "Cloud Function URL for the visitor counter API"
  value       = google_cloudfunctions2_function.visitor_counter.url
}
