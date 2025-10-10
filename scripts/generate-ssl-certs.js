const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create certs directory if it doesn't exist
const certsDir = path.join(__dirname, '..', 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

console.log('🔐 Generating SSL certificates for development...');

try {
  // Generate private key
  execSync('openssl genrsa -out certs/server-key.pem 2048', { stdio: 'inherit' });
  
  // Generate certificate signing request
  execSync('openssl req -new -key certs/server-key.pem -out certs/server.csr -subj "/C=ZA/ST=Western Cape/L=Cape Town/O=Secure Payments Portal/OU=Development/CN=localhost"', { stdio: 'inherit' });
  
  // Generate self-signed certificate
  execSync('openssl x509 -req -in certs/server.csr -signkey certs/server-key.pem -out certs/server-cert.pem -days 365', { stdio: 'inherit' });
  
  // Clean up CSR file
  fs.unlinkSync('certs/server.csr');
  
  console.log('✅ SSL certificates generated successfully!');
  console.log('📁 Certificates saved to: ./certs/');
  console.log('🔒 server-key.pem - Private key');
  console.log('🔒 server-cert.pem - Certificate');
  
} catch (error) {
  console.error('❌ Error generating SSL certificates:', error.message);
  console.log('💡 Make sure OpenSSL is installed on your system');
  console.log('💡 On Windows, you can install OpenSSL via:');
  console.log('   - Chocolatey: choco install openssl');
  console.log('   - Or download from: https://slproweb.com/products/Win32OpenSSL.html');
}

