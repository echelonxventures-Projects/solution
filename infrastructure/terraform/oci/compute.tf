# Compute Configuration - ARM Ampere A1 Flex VMs
# Always Free: Up to 4 OCPUs, 24GB RAM total

# Main Application Server - Runs all services
# Using full allocation: 4 OCPUs, 24GB RAM (Always Free maximum)
resource "oci_core_instance" "app_server" {
  compartment_id      = var.compartment_ocid
  availability_domain = local.availability_domain
  display_name        = "${local.project_name}-app-server"

  # ARM Ampere A1 Flex shape (Always Free)
  shape = "VM.Standard.A1.Flex"

  shape_config {
    # Always Free maximum: 4 OCPUs, 24GB RAM
    ocpus         = 4
    memory_in_gbs = 24

    # Optional: reduce for multiple VMs
    # ocpus = 2
    # memory_in_gbs = 12
  }

  # Create VNIC (network interface)
  create_vnic_details {
    subnet_id        = oci_core_subnet.public.id
    display_name     = "${local.project_name}-app-vnic"
    assign_public_ip = true  # Get public IP for direct access

    hostname_label = "app-server"
  }

  # Source image - Oracle Linux 8 (ARM64)
  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ol8_arm.id
    boot_volume_size_in_gbs = "50"  # Free tier allows up to 200GB total block storage
    boot_volume_vpus_per_gb = "10"  # Balanced performance
  }

  # Metadata for cloud-init
  metadata = {
    ssh_authorized_keys = var.ssh_public_key

    # Cloud-init user data for Docker setup
    user_data = base64encode(templatefile("${path.module}/cloud-init/app-server.yaml", {
      domain_name = var.domain_name
    }))
  }

  # Agent plugins for monitoring
  agent_config {
    are_all_plugins_disabled = false
    is_management_disabled   = false
    is_monitoring_disabled   = false

    plugins_config {
      name   = "OS Management Service Agent"
      enabled = true
    }
    plugins_config {
      name   = "Compute Instance Monitoring"
      enabled = true
    }
  }

  freeform_tags = {
    "Project"     = local.project_name
    "Role"        = "application-server"
    "Environment" = "production"
  }

  # Volume attachments for Docker data
  # Note: Boot volume already attached automatically
}

# Block Volume for Docker data (10GB - part of free tier)
resource "oci_core_volume" "docker_data" {
  compartment_id      = var.compartment_ocid
  availability_domain = local.availability_domain
  display_name        = "${local.project_name}-docker-data"

  size_in_gbs = 50
  vpus_per_gb = "10"

  freeform_tags = {
    "Project" = local.project_name
    "Purpose" = "docker-data"
  }
}

# Attach block volume to app server
resource "oci_core_volume_attachment" "docker_data_attach" {
  instance_id  = oci_core_instance.app_server.id
  volume_id    = oci_core_volume.docker_data.id
  attachment_type = "iscsi"
  display_name    = "${local.project_name}-docker-attachment"

  # ISCSI login details
  iscsi_login_state = true
}

# Oracle Linux 8 ARM64 Image
data "oci_core_images" "ol8_arm" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Oracle Linux"
  operating_system_version = "8"
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"

  # Filter to get latest image
  filter {
    name   = "state"
    values = ["AVAILABLE"]
  }
}

# Get instance public IP
data "oci_core_vnic_attachments" "app_server_vnics" {
  compartment_id = var.compartment_ocid
  instance_id    = oci_core_instance.app_server.id
}

data "oci_core_vnic" "app_server_vnic" {
  vnic_id = data.oci_core_vnic_attachments.app_server_vnics.vnic_attachments[0].vnic_id
}