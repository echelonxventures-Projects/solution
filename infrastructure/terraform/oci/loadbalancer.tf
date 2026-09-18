# Load Balancer Configuration - Public Load Balancer
# Always Free: 1 Load Balancer (10Mbps bandwidth)

resource "oci_load_balancer" "main" {
  compartment_id = var.compartment_ocid
  display_name   = "${local.project_name}-lb"
  shape          = "flexible"

  # Free tier: 10Mbps minimum bandwidth
  shape_details {
    minimum_bandwidth_in_mbps = 10
    maximum_bandwidth_in_mbps = 10
  }

  # Public load balancer
  is_private = false

  # Subnet placement
  subnet_ids = [
    oci_core_subnet.public.id
  ]

  # Network security groups (optional)
  # network_security_group_ids = []

  freeform_tags = {
    "Project"     = local.project_name
    "Environment" = "production"
  }
}

# Backend Set - HTTP (80)
resource "oci_load_balancer_backend_set" "http" {
  load_balancer_id = oci_load_balancer.main.id
  name             = "http-backend-set"
  policy           = "ROUND_ROBIN"

  health_checker {
    protocol            = "HTTP"
    port                = 3000
    url_path            = "/health"
    interval_ms         = 10000
    timeout_in_millis   = 3000
    retries             = 3
    return_code         = 200
  }

  # Session persistence disabled
  session_persistence_configuration {
    disable_persistence = true
  }

  backend {
    ip_address  = data.oci_core_vnic.app_server_vnic.public_ip_address
    port        = 3000
    weight      = 1
    drain       = false
    backup      = false
    offline     = false
  }
}

# HTTPS Listener (443) - SSL
# Note: TLS termination can be handled by Caddy/Traefik on the VM (Let's Encrypt),
# or by uncommenting the ssl_certificate block once a certificate is created in OCI.
resource "oci_load_balancer_listener" "https" {
  load_balancer_id = oci_load_balancer.main.id
  name             = "https-listener"
  default_backend_set_name = oci_load_balancer_backend_set.http.name

  protocol = "HTTP"
  port     = 443
}

# HTTP Listener (80) - Redirect to HTTPS
resource "oci_load_balancer_listener" "http" {
  load_balancer_id = oci_load_balancer.main.id
  name             = "http-listener"
  default_backend_set_name = oci_load_balancer_backend_set.http.name

  protocol = "HTTP"
  port     = 80

  # Connection routing rules
  connection_configuration {
    idle_timeout_in_seconds = 120
  }
}

# WebSocket support for video sessions
resource "oci_load_balancer_backend_set" "websocket" {
  load_balancer_id = oci_load_balancer.main.id
  name             = "websocket-backend-set"
  policy           = "ROUND_ROBIN"

  health_checker {
    protocol          = "TCP"
    port              = 3004
    interval_ms       = 10000
    timeout_in_millis = 3000
    retries           = 3
  }

  backend {
    ip_address  = data.oci_core_vnic.app_server_vnic.public_ip_address
    port        = 3004
    weight      = 1
  }
}

# WebSocket listener (for video sessions)
# Note: OCI LB supports WebSocket
resource "oci_load_balancer_listener" "websocket" {
  load_balancer_id = oci_load_balancer.main.id
  name             = "websocket-listener"
  default_backend_set_name = oci_load_balancer_backend_set.websocket.name

  protocol = "HTTP"
  port     = 8080
}