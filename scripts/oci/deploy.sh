#!/bin/bash
# OCI Deployment Script - Deploy Consultancy Platform to Oracle Cloud
# Usage: ./deploy.sh [options]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR"))"
DOMAIN_NAME="${DOMAIN_NAME:-astro.echelonxventures.org}"
OCI_VM_IP="${OCI_VM_IP:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check OCI CLI
    if ! command -v oci &> /dev/null; then
        log_error "OCI CLI not installed. Install with: pip install oci-cli"
        exit 1
    fi

    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform not installed. Install from: https://terraform.io/downloads"
        exit 1
    fi

    # Check SSH key
    if [ ! -f ~/.oci/oci_api_key.pem ]; then
        log_warning "OCI API key not found at ~/.oci/oci_api_key.pem"
        log_info "Generate SSH key and upload to OCI Console"
    fi

    log_success "Prerequisites checked"
}

# Initialize Terraform
init_terraform() {
    log_info "Initializing Terraform..."

    cd "$PROJECT_ROOT/infrastructure/terraform/oci"

    # Create tfvars if not exists
    if [ ! -f terraform.tfvars ]; then
        log_warning "terraform.tfvars not found"
        log_info "Creating from example..."
        cp terraform.tfvars.example terraform.tfvars
        log_warning "Edit terraform.tfvars with your OCI credentials"
        exit 1
    fi

    terraform init

    log_success "Terraform initialized"
}

# Deploy infrastructure
deploy_infrastructure() {
    log_info "Deploying OCI infrastructure..."

    cd "$PROJECT_ROOT/infrastructure/terraform/oci"

    # Plan
    log_info "Running terraform plan..."
    terraform plan -out=tfplan

    # Apply
    log_info "Applying infrastructure..."
    terraform apply tfplan

    # Get outputs
    OCI_VM_IP=$(terraform output -raw app_server_public_ip)
    LB_IP=$(terraform output -raw load_balancer_public_ip)

    log_success "Infrastructure deployed!"
    log_info "VM IP: $OCI_VM_IP"
    log_info "Load Balancer IP: $LB_IP"

    # Save IPs to file
    echo "VM_IP=$OCI_VM_IP" > "$PROJECT_ROOT/.oci-deploy-info"
    echo "LB_IP=$LB_IP" >> "$PROJECT_ROOT/.oci-deploy-info"
}

# Copy application to VM
copy_to_vm() {
    log_info "Copying application to VM..."

    if [ -z "$OCI_VM_IP" ]; then
        # Load from previous deployment
        if [ -f "$PROJECT_ROOT/.oci-deploy-info" ]; then
            source "$PROJECT_ROOT/.oci-deploy-info"
        else
            log_error "VM IP not found. Run deploy_infrastructure first."
            exit 1
        fi
    fi

    SSH_KEY="${SSH_KEY:-~/.oci/ssh_key}"

    # Wait for VM to be ready
    log_info "Waiting for VM to be ready..."
    sleep 30

    # Create app directory
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no opc@$OCI_VM_IP \
        "sudo mkdir -p /opt/consultancy-platform && sudo chown opc:opc /opt/consultancy-platform"

    # Copy files
    log_info "Copying project files..."
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
        "$PROJECT_ROOT/docker-compose.yml" \
        opc@$OCI_VM_IP:/opt/consultancy-platform/

    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
        "$PROJECT_ROOT/.env.example" \
        opc@$OCI_VM_IP:/opt/consultancy-platform/

    # Copy packages
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no opc@$OCI_VM_IP \
        "mkdir -p /opt/consultancy-platform/packages"

    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -r \
        "$PROJECT_ROOT/packages/shared" \
        opc@$OCI_VM_IP:/opt/consultancy-platform/packages/

    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -r \
        "$PROJECT_ROOT/packages/services" \
        opc@$OCI_VM_IP:/opt/consultancy-platform/packages/

    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -r \
        "$PROJECT_ROOT/packages/admin" \
        opc@$OCI_VM_IP:/opt/consultancy-platform/packages/

    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -r \
        "$PROJECT_ROOT/packages/web" \
        opc@$OCI_VM_IP:/opt/consultancy-platform/packages/

    log_success "Application copied to VM"
}

# Configure environment on VM
configure_environment() {
    log_info "Configuring environment..."

    SSH_KEY="${SSH_KEY:-~/.oci/ssh_key}"
    source "$PROJECT_ROOT/.oci-deploy-info"

    ssh -i "$SSH_KEY" opc@$OCI_VM_IP << 'ENDSSH'
        cd /opt/consultancy-platform

        # Create .env file
        cp .env.example .env

        # Install dependencies
        npm install

        # Build shared package
        cd packages/shared && npm run build && cd ..

        log "Environment configured on VM"
ENDSSH

    log_success "Environment configured"
}

# Start services
start_services() {
    log_info "Starting services..."

    SSH_KEY="${SSH_KEY:-~/.oci/ssh_key}"
    source "$PROJECT_ROOT/.oci-deploy-info"

    ssh -i "$SSH_KEY" opc@$OCI_VM_IP << 'ENDSSH'
        cd /opt/consultancy-platform

        # Start Docker services
        docker-compose up -d

        # Wait for services to be healthy
        sleep 30

        # Check service status
        docker-compose ps

        # Check health endpoint
        curl -s http://localhost:3000/health || echo "Services starting..."
ENDSSH

    log_success "Services started"
}

# Configure DNS
configure_dns() {
    log_info "Configuring DNS..."

    source "$PROJECT_ROOT/.oci-deploy-info"

    log_warning "Manual DNS configuration required:"
    log_info "1. Go to your DNS provider (e.g., Cloudflare, Route53)"
    log_info "2. Add A record: $DOMAIN_NAME -> $LB_IP"
    log_info "3. Add A record: api.$DOMAIN_NAME -> $LB_IP"
    log_info "4. Add A record: admin.$DOMAIN_NAME -> $LB_IP"

    log_info "DNS propagation may take up to 24 hours"
}

# Setup SSL with Caddy
setup_ssl() {
    log_info "Setting up SSL with Caddy..."

    SSH_KEY="${SSH_KEY:-~/.oci/ssh_key}"
    source "$PROJECT_ROOT/.oci-deploy-info"

    ssh -i "$SSH_KEY" opc@$OCI_VM_IP << ENDSSH
        # Install Caddy
        sudo yum install -y caddy

        # Configure Caddyfile
        sudo tee /etc/caddy/Caddyfile > /dev/null << 'CADDYEOF'
            $DOMAIN_NAME {
                reverse_proxy localhost:3000
                encode gzip
                log {
                    output file /var/log/caddy/access.log
                }
            }

            api.$DOMAIN_NAME {
                reverse_proxy localhost:3000
            }

            admin.$DOMAIN_NAME {
                reverse_proxy localhost:1113
            }
CADDYEOF

        # Enable and start Caddy
        sudo systemctl enable caddy
        sudo systemctl start caddy

        # Check Caddy status
        sudo systemctl status caddy
ENDSSH

    log_success "SSL configured with Caddy"
}

# Full deployment
full_deploy() {
    log_info "Starting full deployment..."

    check_prerequisites
    init_terraform
    deploy_infrastructure
    copy_to_vm
    configure_environment
    start_services
    configure_dns
    setup_ssl

    log_success "Deployment complete!"
    log_info "Access your platform at: https://$DOMAIN_NAME"
}

# Main script
case "$1" in
    init)
        check_prerequisites
        init_terraform
        ;;
    deploy)
        deploy_infrastructure
        ;;
    copy)
        copy_to_vm
        ;;
    config)
        configure_environment
        ;;
    start)
        start_services
        ;;
    dns)
        configure_dns
        ;;
    ssl)
        setup_ssl
        ;;
    all)
        full_deploy
        ;;
    *)
        echo "Usage: $0 {init|deploy|copy|config|start|dns|ssl|all}"
        echo ""
        echo "Commands:"
        echo "  init    - Initialize Terraform"
        echo "  deploy  - Deploy OCI infrastructure"
        echo "  copy    - Copy application to VM"
        echo "  config  - Configure environment on VM"
        echo "  start   - Start Docker services"
        echo "  dns     - Show DNS configuration instructions"
        echo "  ssl     - Setup SSL with Caddy (Let's Encrypt)"
        echo "  all     - Full deployment pipeline"
        exit 1
        ;;
esac