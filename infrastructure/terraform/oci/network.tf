# Network Configuration - VCN (Virtual Cloud Network)
# Always Free: 1 VCN with public subnet

resource "oci_core_vcn" "main" {
  compartment_id = var.compartment_ocid
  display_name   = "${local.project_name}-vcn"
  dns_label      = "consultancy"

  # Always Free allows up to 65536 IPs in VCN
  cidr_blocks = ["10.0.0.0/16"]

  freeform_tags = {
    "Project"     = local.project_name
    "Environment" = "production"
  }
}

# Internet Gateway for public access
resource "oci_core_internet_gateway" "main" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${local.project_name}-igw"
  enabled        = true

  freeform_tags = {
    "Project" = local.project_name
  }
}

# Public Subnet for Load Balancer and VMs
resource "oci_core_subnet" "public" {
  compartment_id      = var.compartment_ocid
  vcn_id              = oci_core_vcn.main.id
  display_name        = "${local.project_name}-public-subnet"
  dns_label           = "public"

  cidr_block          = "10.0.1.0/24"
  availability_domain = local.availability_domain

  # Route to Internet Gateway
  route_table_id = oci_core_route_table.public.id

  # Allow public IPs
  prohibit_public_ip_on_vnic = false

  security_list_ids = [
    oci_core_security_list.public.id
  ]

  freeform_tags = {
    "Project" = local.project_name
  }
}

# Route Table - Routes traffic to Internet Gateway
resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${local.project_name}-public-route"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.main.id
  }
}

# Security List - Firewall rules for public subnet
resource "oci_core_security_list" "public" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${local.project_name}-public-security"

  # Allow inbound HTTP (80)
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"

    tcp_options {
      destination_port_range {
        min = 80
        max = 80
      }
    }
    description = "Allow HTTP traffic"
  }

  # Allow inbound HTTPS (443)
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"

    tcp_options {
      destination_port_range {
        min = 443
        max = 443
      }
    }
    description = "Allow HTTPS traffic"
  }

  # Allow inbound SSH (22) - for admin access
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"

    tcp_options {
      destination_port_range {
        min = 22
        max = 22
      }
    }
    description = "Allow SSH access"
  }

  # Allow all outbound traffic
  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
    description = "Allow all outbound traffic"
  }
}

# Private Subnet for Autonomous DB (if needed)
# Note: Autonomous DB has its own private endpoint, this subnet is optional
resource "oci_core_subnet" "private" {
  compartment_id      = var.compartment_ocid
  vcn_id              = oci_core_vcn.main.id
  display_name        = "${local.project_name}-private-subnet"
  dns_label           = "private"

  cidr_block          = "10.0.2.0/24"
  availability_domain = local.availability_domain

  # No public IPs
  prohibit_public_ip_on_vnic = true

  security_list_ids = [
    oci_core_security_list.private.id
  ]

  freeform_tags = {
    "Project" = local.project_name
  }
}

# Security List for private subnet (DB access)
resource "oci_core_security_list" "private" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${local.project_name}-private-security"

  # Allow PostgreSQL from public subnet
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "10.0.1.0/24"
    source_type = "CIDR_BLOCK"

    tcp_options {
      destination_port_range {
        min = 5432
        max = 5432
      }
    }
    description = "Allow PostgreSQL from public subnet"
  }

  # Allow Redis from public subnet
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "10.0.1.0/24"
    source_type = "CIDR_BLOCK"

    tcp_options {
      destination_port_range {
        min = 6379
        max = 6379
      }
    }
    description = "Allow Redis from public subnet"
  }
}