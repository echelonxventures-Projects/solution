# OCI Provider Configuration
# Oracle Cloud Infrastructure - Always Free Tier

terraform {
  required_version = ">= 1.0"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 4.0"
    }
  }

  # Store state locally (for production, use OCI Object Storage)
  # backend "oci" {
  #   bucket    = "terraform-state"
  #   namespace = "<your-namespace>"
  #   region    = "us-ashburn-1"
  # }
}

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# Variables for authentication
variable "tenancy_ocid" {
  description = "OCI Tenancy OCID"
  type        = string
}

variable "user_ocid" {
  description = "OCI User OCID"
  type        = string
}

variable "fingerprint" {
  description = "OCI API Key Fingerprint"
  type        = string
}

variable "private_key_path" {
  description = "Path to OCI API Private Key"
  type        = string
  default     = "~/.oci/oci_api_key.pem"
}

variable "region" {
  description = "OCI Region (Always Free works in home region)"
  type        = string
  default     = "us-ashburn-1"
}

variable "compartment_ocid" {
  description = "OCI Compartment OCID"
  type        = string
}

variable "ssh_public_key" {
  description = "SSH Public Key for VM access"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the platform"
  type        = string
  default     = "astro.echelonxventures.org"
}

# Availability Domain (Always Free uses AD-1)
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

locals {
  # Always Free tier uses the first availability domain
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name

  # Resource naming
  project_name = "consultancy-platform"
}