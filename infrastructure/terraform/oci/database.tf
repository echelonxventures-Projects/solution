# Autonomous Database Configuration - PostgreSQL (Always Free)
# OCI Always Free: 2 Autonomous Databases (20GB each)

# Autonomous PostgreSQL Database
resource "oci_database_autonomous_database" "main" {
  compartment_id         = var.compartment_ocid
  display_name           = "${local.project_name}-postgres"
  db_name                = "CONSULTANCYDB"

  # Always Free tier
  is_free_tier           = true

  # PostgreSQL (new in OCI)
  db_workload            = "OLTP"
  db_version             = "19c"  # Use PostgreSQL compatible mode

  # Storage: 20GB (Always Free maximum per DB)
  data_storage_size_in_tbs = 1  # 1TB units, but free tier = 20GB

  # Compute: Always Free allows 1 OCPU, 1TB storage
  cpu_core_count = 1

  # Auto-scaling disabled for free tier
  is_auto_scaling_enabled = false

  # License type
  license_model = "LICENSE_INCLUDED"

  # Admin credentials (will be generated)
  admin_password = "ConsultancyAdmin2024!"  # Change this!

  # Network access
  # Option 1: Public endpoint with whitelisted IPs
  # Option 2: Private endpoint in VCN
  is_access_control_enabled = true
  whitelisted_ips = [
    oci_core_subnet.public.cidr_block,  # Allow from public subnet
  ]

  # Open all IPs for initial setup (restrict later)
  # is_access_control_enabled = false

  # Database character set
  character_set = "AL32UTF8"
  n_character_set = "AL16UTF16"

  # Backup retention (free tier: 7 days)
  backup_retention_period_in_days = 7

  # Auto backup
  is_auto_backup_enabled = true

  freeform_tags = {
    "Project"     = local.project_name
    "Environment" = "production"
  }
}

# Note: For PostgreSQL native support, OCI also offers:
# - Autonomous Transaction Processing (ATP) with JSON/PostgreSQL compatibility
# - Or use PostgreSQL in Docker container instead

# Database connection string output
# Format: postgresql://admin@CONSULTANCYDB:<password>@<host>:1522/CONSULTANCYDB_pdb1

# Alternative: Manual PostgreSQL in Docker
# If OCI Autonomous DB isn't ideal for this use case,
# we can run PostgreSQL in a Docker container on the VM instead.

# This is often preferred for:
# - Full PostgreSQL compatibility
# - Custom extensions
# - Direct control over configuration

# To use Docker PostgreSQL instead, comment out the Autonomous DB
# and use the docker-compose.yml configuration.