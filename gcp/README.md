# GCP Deployment

This project is deployed on Google Cloud Platform (GCP) using **Terraform** for infrastructure as code.

## Prerequisites

### Install Terraform

```bash
# Add HashiCorp GPG key and repository
sudo apt-get update && sudo apt-get install -y gnupg software-properties-common
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list

# Install Terraform
sudo apt-get update && sudo apt-get install terraform

# Verify installation
terraform --version
```
