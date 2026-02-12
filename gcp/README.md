# GCP Deployment — Cloud Resume Challenge

This project deploys a static resume website to **Google Cloud Platform** using **Terraform** (infrastructure) and **Ansible** (deployment orchestration with secrets management).

## Architecture

```
Frontend files (HTML/CSS/JS/PDF)
        │
        ▼
  GCS Bucket (static website hosting)
        │
        ▼
  Backend Bucket + Cloud CDN
        │
        ▼
  HTTP(S) Load Balancer
        │
        ▼
  Global Static IP  ←── DNS (your domain)
```

---

## Prerequisites

### 1. Install Terraform

```bash
sudo apt-get update && sudo apt-get install -y gnupg software-properties-common
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt-get update && sudo apt-get install terraform
terraform --version
```

### 2. Install Ansible

```bash
pipx install --include-deps ansible
ansible --version
```

### 3. Install Google Cloud SDK (gcloud CLI)

```bash
# https://cloud.google.com/sdk/docs/install
curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz
tar -xf google-cloud-cli-linux-x86_64.tar.gz
./google-cloud-sdk/install.sh
gcloud init
```

---

## Manual Steps (do these first!)

### Step 1 — Create a GCP Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use existing): `cloud-resume-challenge-486522`

### Step 2 — Enable Required APIs

Run these in your terminal or enable them via the GCP Console:

```bash
gcloud services enable storage.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

### Step 3 — Create a Service Account & Download Key

```bash
# Create the service account
gcloud iam service-accounts create terraform-deployer \
  --display-name="Terraform Deployer"

# Grant roles
gcloud projects add-iam-policy-binding cloud-resume-challenge-486522 \
  --member="serviceAccount:terraform-deployer@cloud-resume-challenge-486522.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding cloud-resume-challenge-486522 \
  --member="serviceAccount:terraform-deployer@cloud-resume-challenge-486522.iam.gserviceaccount.com" \
  --role="roles/compute.admin"

# Download JSON key
gcloud iam service-accounts keys create gcp-key.json \
  --iam-account=terraform-deployer@cloud-resume-challenge-486522.iam.gserviceaccount.com
```

### Step 4 — Set Up Ansible Vault Secrets

```bash
# Copy the example and fill in your service account key
cp playbooks/vaults/secrets.yml.example playbooks/vaults/secrets.yml

# Paste the contents of your gcp-key.json into the gcp_service_account_key field
# Then encrypt it
ansible-vault encrypt playbooks/vaults/secrets.yml
```

### Step 5 — Configure terraform.tfvars

Edit `terraform.tfvars` with your actual values:

```hcl
project_id  = "cloud-resume-challenge-486522"
region      = "us-east1"
bucket_name = "wesleyjeantyresume.com"
domain_name = "wesleyjeantyresume.com"
```

---

## Deployment

### Option A — Using the deploy script (recommended)

```bash
chmod +x bin/deploy
./bin/deploy
# You will be prompted for the Ansible vault password
```

### Option B — Using Terraform directly

```bash
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/gcp-key.json"
terraform init
terraform plan     # Review changes
terraform apply    # Deploy
```

---

## After Deployment

1. **Get your load balancer IP** from the Terraform output:
   ```bash
   terraform output load_balancer_ip
   ```

2. **Point your domain DNS** — Create an **A record** pointing your domain to the load balancer IP.

3. **(Optional) Set up HTTPS** — Use a Google-managed SSL certificate:
   - Add a `google_compute_managed_ssl_certificate` resource to `main.tf`
   - Create an HTTPS proxy and forwarding rule
   - Add an HTTP→HTTPS redirect

---

## File Structure

```
gcp/
├── bin/
│   └── deploy              # Deployment wrapper script
├── playbooks/
│   ├── deploy.yml           # Ansible playbook
│   └── vaults/
│       ├── secrets.yml.example  # Template for secrets
│       └── secrets.yml          # Encrypted secrets (git-ignored)
├── main.tf                  # Terraform resources
├── variables.tf             # Terraform variable definitions
├── terraform.tfvars         # Terraform variable values (git-ignored)
├── outputs.tf               # Terraform outputs
├── .gitignore               # Ignores secrets and state files
└── README.md                # This file
```

## Tear Down

```bash
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/gcp-key.json"
terraform destroy
```
