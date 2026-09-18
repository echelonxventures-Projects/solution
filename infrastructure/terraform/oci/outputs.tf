# Terraform Outputs

output "app_server_public_ip" {
  description = "Public IP address of the application server"
  value       = data.oci_core_vnic.app_server_vnic.public_ip_address
}

output "app_server_private_ip" {
  description = "Private IP address of the application server"
  value       = data.oci_core_vnic.app_server_vnic.private_ip_address
}

output "load_balancer_public_ip" {
  description = "Public IP address of the load balancer"
  value       = oci_load_balancer.main.ip_address_details[0].ip_address
}

output "database_connection_string" {
  description = "Autonomous Database connection string"
  value       = oci_database_autonomous_database.main.connection_strings[0].profiles[0].value
  sensitive   = true
}

output "database_wallet_url" {
  description = "URL to download database wallet"
  value       = "https://console.${var.region}.oraclecloud.com/database/autonomous-databases/${oci_database_autonomous_database.main.id}/wallet"
}

output "vcn_id" {
  description = "VCN ID"
  value       = oci_core_vcn.main.id
}

output "public_subnet_id" {
  description = "Public subnet ID"
  value       = oci_core_subnet.public.id
}

output "ssh_connection_command" {
  description = "SSH command to connect to app server"
  value       = "ssh -i ~/.oci/ssh_key opc@${data.oci_core_vnic.app_server_vnic.public_ip_address}"
}

output "deployment_instructions" {
  description = "Instructions for deploying the application"
  value       = <<-EOT
    1. SSH to the server:
       ssh -i ~/.oci/ssh_key opc@${data.oci_core_vnic.app_server_vnic.public_ip_address}

    2. Navigate to app directory:
       cd /opt/consultancy-platform

    3. Configure environment:
       cp .env.example .env
       nano .env  # Add your API keys

    4. Start services:
       docker-compose up -d

    5. Check service health:
       docker-compose ps

    6. Access the platform:
       http://${var.domain_name} or http://${oci_load_balancer.main.ip_address_details[0].ip_address}

    7. Configure DNS:
       Point ${var.domain_name} to ${oci_load_balancer.main.ip_address_details[0].ip_address}

    8. Setup SSL:
       Use Caddy or Traefik for automatic Let's Encrypt certificates
  EOT
}