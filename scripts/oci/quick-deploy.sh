#!/bin/bash
# Quick Deploy Script - One-command deployment to OCI
# Usage: ./quick-deploy.sh

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Consultancy Platform - OCI Quick Deploy               ║"
echo "║     Domain: astro.echelonxventures.org                     ║"
echo "╚════════════════════════════════════════════════════════════╝"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT="$SCRIPT_DIR/deploy.sh"

# Step 1: Check prerequisites
echo ""
echo "Step 1: Checking prerequisites..."
if ! command -v oci &> /dev/null; then
    echo "Installing OCI CLI..."
    pip install oci-cli
fi

if ! command -v terraform &> /dev/null; then
    echo "Installing Terraform..."
    brew install terraform || apt-get install terraform
fi

# Step 2: Setup OCI config
echo ""
echo "Step 2: OCI Configuration"
if [ ! -f ~/.oci/config ]; then
    echo "OCI config not found. Run: oci setup config"
    echo "You need:"
    echo "  - Tenancy OCID"
    echo "  - User OCID"
    echo "  - API Key fingerprint"
    echo "  - API Key file"
    echo ""
    echo "Get these from OCI Console: https://cloud.oracle.com"
    exit 1
fi

# Step 3: Create SSH key
echo ""
echo "Step 3: SSH Key for VM"
SSH_KEY=~/.oci/consultancy_ssh_key
if [ ! -f "$SSH_KEY" ]; then
    echo "Generating SSH key..."
    ssh-keygen -t rsa -b 4096 -f "$SSH_KEY" -N "" -C "consultancy@oci"
    echo "SSH key generated: $SSH_KEY"
    echo "Public key:"
    cat "$SSH_KEY.pub"
fi

# Step 4: Update terraform.tfvars
echo ""
echo "Step 4: Updating terraform.tfvars"
TFVARS="$SCRIPT_DIR/../infrastructure/terraform/oci/terraform.tfvars"
if [ ! -f "$TFVARS" ]; then
    cp "$SCRIPT_DIR/../infrastructure/terraform/oci/terraform.tfvars.example" "$TFVARS"

    # Get values from OCI config
    TENANCY=$(oci config get-value tenancy)
    USER=$(oci config get-value user)
    FINGERPRINT=$(oci config get-value fingerprint)
    REGION=$(oci config get-value region)

    # Update tfvars
    sed -i "s/ocid1.tenancy.oc1..your-tenancy-id/$TENANCY/g" "$TFVARS"
    sed -i "s/ocid1.user.oc1..your-user-id/$USER/g" "$TFVARS"
    sed -i "s/xx:xx:xx:xx/$FINGERPRINT/g" "$TFVARS"
    sed -i "s/us-ashburn-1/$REGION/g" "$TFVARS"

    # Add SSH public key
    SSH_PUB=$(cat "$SSH_KEY.pub")
    sed -i "s|ssh-rsa AAAAB3NzaC1yc2E...|$SSH_PUB|g" "$TFVARS"

    echo "terraform.tfvars updated"
fi

# Step 5: Deploy
echo ""
echo "Step 5: Deploying infrastructure..."
echo "This will create:"
echo "  - 1 ARM VM (4 OCPUs, 24GB RAM)"
echo "  - 1 Autonomous Database (PostgreSQL)"
echo "  - 1 Load Balancer"
echo "  - VCN with public subnet"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read -r

"$DEPLOY_SCRIPT" all

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                 Deployment Complete!                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Configure DNS: Point astro.echelonxventures.org to Load Balancer IP"
echo "2. Add API keys in .env file"
echo "3. Access: https://astro.echelonxventures.org"
echo ""