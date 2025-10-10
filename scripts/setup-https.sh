#!/bin/bash

# HTTPS Setup Script for Secure Payments Portal
# This script sets up self-signed certificates for development

set -e

echo "🔒 Setting up HTTPS certificates for development..."

# Create certificates directory
mkdir -p certs

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert is not installed. Please install it first:"
    echo "   - macOS: brew install mkcert"
    echo "   - Linux: https://github.com/FiloSottile/mkcert#installation"
    echo "   - Windows: choco install mkcert"
    exit 1
fi

# Install local CA
echo "📋 Installing local CA..."
mkcert -install

# Generate certificates
echo "🔐 Generating certificates..."
mkcert -key-file certs/server-key.pem -cert-file certs/server-cert.pem localhost 127.0.0.1 ::1

# Set proper permissions
chmod 600 certs/server-key.pem
chmod 644 certs/server-cert.pem

echo "✅ HTTPS certificates generated successfully!"
echo "📁 Certificates location: ./certs/"
echo "🔑 Private key: certs/server-key.pem"
echo "📜 Certificate: certs/server-cert.pem"
echo ""
echo "🚀 You can now start the server with HTTPS enabled."
echo "   Set NODE_ENV=production to use HTTPS in your .env file."



