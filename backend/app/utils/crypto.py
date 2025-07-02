import os
import random
import string
import subprocess
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID, ExtensionOID
from cryptography.hazmat.backends import default_backend
from datetime import datetime, timedelta
import tempfile
from typing import Dict, Any, Optional

def generate_password(length: int = 25) -> str:
    """Generate a password with uppercase, lowercase and numbers"""
    chars = string.ascii_uppercase + string.ascii_lowercase + string.digits
    # Ensure at least one of each type
    password = [
        random.choice(string.ascii_uppercase),
        random.choice(string.ascii_lowercase),
        random.choice(string.digits)
    ]
    # Fill the rest
    for _ in range(length - 3):
        password.append(random.choice(chars))
    # Shuffle
    random.shuffle(password)
    return ''.join(password)

def generate_private_key(key_size: int = 2048) -> bytes:
    """Generate RSA private key"""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=key_size,
        backend=default_backend()
    )
    
    pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )
    return pem

def generate_csr(private_key_pem: bytes, csr_data: Dict[str, str]) -> bytes:
    """Generate Certificate Signing Request"""
    # Load private key
    private_key = serialization.load_pem_private_key(
        private_key_pem,
        password=None,
        backend=default_backend()
    )
    
    # Build subject attributes
    subject_attributes = [
        x509.NameAttribute(NameOID.COUNTRY_NAME, csr_data['country']),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, csr_data['state']),
        x509.NameAttribute(NameOID.LOCALITY_NAME, csr_data['locality']),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, csr_data['organization']),
        x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, csr_data['organizational_unit']),
        x509.NameAttribute(NameOID.COMMON_NAME, csr_data['common_name']),
    ]
    
    # Add email only if provided
    if csr_data.get('email'):
        subject_attributes.append(x509.NameAttribute(NameOID.EMAIL_ADDRESS, csr_data['email']))
    
    subject = x509.Name(subject_attributes)
    
    # Create CSR
    csr = x509.CertificateSigningRequestBuilder().subject_name(
        subject
    ).sign(private_key, hashes.SHA256(), backend=default_backend())
    
    # Serialize to PEM
    return csr.public_bytes(serialization.Encoding.PEM)

def create_pfx(cert_pem: bytes, key_pem: bytes, ca_bundle_pem: bytes, password: str) -> bytes:
    """Create PFX/P12 file using OpenSSL command line"""
    with tempfile.TemporaryDirectory() as temp_dir:
        cert_file = os.path.join(temp_dir, "cert.pem")
        key_file = os.path.join(temp_dir, "key.pem")
        ca_file = os.path.join(temp_dir, "ca.pem")
        pfx_file = os.path.join(temp_dir, "output.pfx")
        
        # Write files
        with open(cert_file, 'wb') as f:
            f.write(cert_pem)
        with open(key_file, 'wb') as f:
            f.write(key_pem)
        with open(ca_file, 'wb') as f:
            f.write(ca_bundle_pem)
        
        # Run OpenSSL command
        cmd = [
            'openssl', 'pkcs12', '-export',
            '-out', pfx_file,
            '-inkey', key_file,
            '-in', cert_file,
            '-certfile', ca_file,
            '-password', f'pass:{password}'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"OpenSSL error: {result.stderr}")
        
        # Read PFX file
        with open(pfx_file, 'rb') as f:
            return f.read()

def validate_private_key(key_data: bytes) -> Dict[str, Any]:
    """Validate and get info from private key"""
    try:
        # Try to load without password first
        private_key = serialization.load_pem_private_key(
            key_data,
            password=None,
            backend=default_backend()
        )
        
        # Get key info
        if isinstance(private_key, rsa.RSAPrivateKey):
            public_key = private_key.public_key()
            public_numbers = public_key.public_numbers()
            
            return {
                'valid': True,
                'key_type': 'RSA',
                'key_size': private_key.key_size,
                'modulus': str(public_numbers.n)[:50] + '...',  # First 50 chars
                'public_exponent': public_numbers.e,
                'encrypted': False
            }
        else:
            return {
                'valid': True,
                'key_type': 'Unknown',
                'error': 'Unsupported key type',
                'encrypted': False
            }
    except ValueError as e:
        error_msg = str(e)
        if 'password' in error_msg.lower() or 'encrypted' in error_msg.lower():
            return {
                'valid': False,
                'error': 'A chave privada está protegida por senha. Por favor, remova a senha antes de importar.',
                'encrypted': True
            }
        return {
            'valid': False,
            'error': str(e),
            'encrypted': False
        }
    except Exception as e:
        return {
            'valid': False,
            'error': str(e),
            'encrypted': False
        }

def validate_certificate(cert_data: bytes) -> Dict[str, Any]:
    """Validate and get info from certificate"""
    try:
        cert = x509.load_pem_x509_certificate(cert_data, default_backend())
        
        # Get subject info
        subject_info = {}
        for attribute in cert.subject:
            subject_info[attribute.oid._name] = attribute.value
        
        # Get SAN if exists
        san_list = []
        try:
            san_ext = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
            san_list = [name.value for name in san_ext.value]
        except:
            pass
        
        return {
            'valid': True,
            'common_name': subject_info.get('commonName', 'N/A'),
            'subject': subject_info,
            'issuer': {attr.oid._name: attr.value for attr in cert.issuer},
            'not_before': cert.not_valid_before.isoformat(),
            'not_after': cert.not_valid_after.isoformat(),
            'serial_number': str(cert.serial_number),
            'signature_algorithm': cert.signature_algorithm_oid._name,
            'san': san_list,
            'is_expired': datetime.utcnow() > cert.not_valid_after,
            'days_until_expiry': (cert.not_valid_after - datetime.utcnow()).days
        }
    except Exception as e:
        return {
            'valid': False,
            'error': str(e)
        }

def validate_csr(csr_data: bytes) -> Dict[str, Any]:
    """Validate and get info from CSR"""
    try:
        csr = x509.load_pem_x509_csr(csr_data, default_backend())
        
        # Get subject info
        subject_info = {}
        for attribute in csr.subject:
            subject_info[attribute.oid._name] = attribute.value
        
        return {
            'valid': True,
            'common_name': subject_info.get('commonName', 'N/A'),
            'subject': subject_info,
            'signature_algorithm': csr.signature_algorithm_oid._name,
            'is_signature_valid': csr.is_signature_valid
        }
    except Exception as e:
        return {
            'valid': False,
            'error': str(e)
        }

def validate_pfx(pfx_data: bytes, password: str) -> Dict[str, Any]:
    """Validate and get info from PFX file"""
    try:
        # Use OpenSSL to extract info
        with tempfile.TemporaryDirectory() as temp_dir:
            pfx_file = os.path.join(temp_dir, "input.pfx")
            
            with open(pfx_file, 'wb') as f:
                f.write(pfx_data)
            
            # Extract certificate info
            cmd = [
                'openssl', 'pkcs12',
                '-in', pfx_file,
                '-nokeys',
                '-password', f'pass:{password}'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                return {
                    'valid': False,
                    'error': 'Invalid password or corrupted PFX file'
                }
            
            # Parse certificate from output
            cert_pem = result.stdout.encode()
            cert_info = validate_certificate(cert_pem)
            
            return {
                'valid': True,
                'certificate_info': cert_info,
                'has_private_key': True
            }
    except Exception as e:
        return {
            'valid': False,
            'error': str(e)
        }