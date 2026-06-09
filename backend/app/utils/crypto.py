import os
import secrets
import string
import subprocess
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, ec
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.x509.oid import NameOID, ExtensionOID
from cryptography.hazmat.backends import default_backend
from datetime import datetime
import tempfile
from typing import Dict, Any, Optional, Tuple


def generate_password(length: int = 25) -> str:
    """Generate a cryptographically secure password with uppercase, lowercase and numbers."""
    chars = string.ascii_uppercase + string.ascii_lowercase + string.digits
    while True:
        password = [secrets.choice(chars) for _ in range(length)]
        pwd = ''.join(password)
        # Ensure at least one character of each required type
        if (any(c in string.ascii_uppercase for c in pwd)
                and any(c in string.ascii_lowercase for c in pwd)
                and any(c in string.digits for c in pwd)):
            return pwd


def generate_private_key(key_type: str = "RSA", key_size: int = 2048) -> bytes:
    """Generate RSA or EC private key.

    For RSA: key_size can be 2048, 3072, or 4096.
    For EC:  key_size selects the curve — 256 = P-256, 384 = P-384.
    """
    if key_type.upper() == "EC":
        curve = ec.SECP384R1() if key_size == 384 else ec.SECP256R1()
        private_key = ec.generate_private_key(curve, default_backend())
    else:
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


def generate_csr(private_key_pem: bytes, csr_data: Dict[str, Any]) -> bytes:
    """Generate Certificate Signing Request with SAN support."""
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

    if csr_data.get('email'):
        subject_attributes.append(x509.NameAttribute(NameOID.EMAIL_ADDRESS, csr_data['email']))

    subject = x509.Name(subject_attributes)

    builder = x509.CertificateSigningRequestBuilder()
    builder = builder.subject_name(subject)

    # Key Usage extension
    builder = builder.add_extension(
        x509.KeyUsage(
            digital_signature=False,
            content_commitment=False,
            key_encipherment=True,
            data_encipherment=True,
            key_agreement=False,
            key_cert_sign=False,
            crl_sign=False,
            encipher_only=False,
            decipher_only=False,
        ),
        critical=False,
    )

    # Extended Key Usage extension
    builder = builder.add_extension(
        x509.ExtendedKeyUsage([x509.oid.ExtendedKeyUsageOID.SERVER_AUTH]),
        critical=False,
    )

    # SAN extension
    san_domains = csr_data.get('san_domains', []) or []

    # If no SAN domains provided, use the common name
    if not san_domains and csr_data.get('common_name'):
        san_domains = [csr_data['common_name']]
        if csr_data['common_name'].startswith('*.'):
            base_domain = csr_data['common_name'][2:]
            if base_domain not in san_domains:
                san_domains.append(base_domain)

    if san_domains:
        builder = builder.add_extension(
            x509.SubjectAlternativeName([x509.DNSName(d) for d in san_domains]),
            critical=False,
        )

    csr = builder.sign(private_key, hashes.SHA256(), backend=default_backend())
    return csr.public_bytes(serialization.Encoding.PEM)


def create_pfx(
    cert_pem: bytes,
    key_pem: bytes,
    password: str,
    ca_bundle_pem: Optional[bytes] = None,
) -> bytes:
    """Create PFX/P12 file using OpenSSL.

    ca_bundle_pem is optional — when omitted the PFX contains only the leaf
    certificate and the private key, which is valid for app-to-app mTLS setups.

    The password is passed via stdin to prevent it from appearing in the
    process list.
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        cert_file = os.path.join(temp_dir, "cert.pem")
        key_file = os.path.join(temp_dir, "key.pem")
        pfx_file = os.path.join(temp_dir, "output.pfx")

        with open(cert_file, 'wb') as f:
            f.write(cert_pem)
        with open(key_file, 'wb') as f:
            f.write(key_pem)

        cmd = [
            'openssl', 'pkcs12', '-export',
            '-out', pfx_file,
            '-inkey', key_file,
            '-in', cert_file,
            '-passout', 'stdin',
        ]

        if ca_bundle_pem:
            ca_file = os.path.join(temp_dir, "ca.pem")
            with open(ca_file, 'wb') as f:
                f.write(ca_bundle_pem)
            cmd += ['-certfile', ca_file]

        result = subprocess.run(cmd, input=password.encode(), capture_output=True)
        if result.returncode != 0:
            raise Exception(f"OpenSSL error: {result.stderr.decode()}")

        with open(pfx_file, 'rb') as f:
            return f.read()


def generate_self_signed_certificate(
    common_name: str,
    validity_days: int = 365,
    key_type: str = "RSA",
    key_size: int = 2048,
    organization: str = "",
    organizational_unit: str = "",
    country: str = "BR",
    state: str = "",
    locality: str = "",
    email: Optional[str] = None,
    san_domains: Optional[list] = None,
) -> Tuple[bytes, bytes]:
    """Generate a self-signed X.509 certificate and its private key.

    Returns:
        (certificate_pem, private_key_pem)

    The certificate is suitable for use in mTLS / server-to-server authentication.
    """
    # Generate key pair
    private_key_pem = generate_private_key(key_type=key_type, key_size=key_size)
    private_key = serialization.load_pem_private_key(
        private_key_pem, password=None, backend=default_backend()
    )

    # Build subject
    subject_attrs = []
    if country:
        subject_attrs.append(x509.NameAttribute(NameOID.COUNTRY_NAME, country[:2].upper()))
    if state:
        subject_attrs.append(x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, state))
    if locality:
        subject_attrs.append(x509.NameAttribute(NameOID.LOCALITY_NAME, locality))
    if organization:
        subject_attrs.append(x509.NameAttribute(NameOID.ORGANIZATION_NAME, organization))
    if organizational_unit:
        subject_attrs.append(x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, organizational_unit))
    subject_attrs.append(x509.NameAttribute(NameOID.COMMON_NAME, common_name))
    if email:
        subject_attrs.append(x509.NameAttribute(NameOID.EMAIL_ADDRESS, email))

    subject = x509.Name(subject_attrs)
    now = datetime.utcnow()

    builder = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(subject)              # self-signed: issuer == subject
        .public_key(private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now)
        .not_valid_after(now + __import__('datetime').timedelta(days=validity_days))
        .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
        .add_extension(
            x509.KeyUsage(
                digital_signature=True,
                content_commitment=False,
                key_encipherment=True,
                data_encipherment=False,
                key_agreement=False,
                key_cert_sign=False,
                crl_sign=False,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        )
        .add_extension(
            x509.ExtendedKeyUsage([
                x509.oid.ExtendedKeyUsageOID.SERVER_AUTH,
                x509.oid.ExtendedKeyUsageOID.CLIENT_AUTH,
            ]),
            critical=False,
        )
    )

    # SAN extension
    dns_names = list(san_domains) if san_domains else []
    if common_name not in dns_names:
        dns_names.insert(0, common_name)
    if dns_names:
        builder = builder.add_extension(
            x509.SubjectAlternativeName([x509.DNSName(d) for d in dns_names]),
            critical=False,
        )

    cert = builder.sign(private_key, hashes.SHA256(), backend=default_backend())
    cert_pem = cert.public_bytes(serialization.Encoding.PEM)

    return cert_pem, private_key_pem


def check_cert_key_match(cert_data: bytes, key_data: bytes) -> bool:
    """Return True if the certificate's public key matches the private key (RSA and EC)."""
    try:
        cert = x509.load_pem_x509_certificate(cert_data, default_backend())
        private_key = serialization.load_pem_private_key(key_data, password=None, backend=default_backend())
        cert_pub_bytes = cert.public_key().public_bytes(
            serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
        )
        key_pub_bytes = private_key.public_key().public_bytes(
            serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
        )
        return cert_pub_bytes == key_pub_bytes
    except Exception:
        return False


def validate_private_key(key_data: bytes) -> Dict[str, Any]:
    """Validate and get info from private key."""
    try:
        private_key = serialization.load_pem_private_key(
            key_data,
            password=None,
            backend=default_backend()
        )

        if isinstance(private_key, rsa.RSAPrivateKey):
            public_numbers = private_key.public_key().public_numbers()
            return {
                'valid': True,
                'key_type': 'RSA',
                'key_size': private_key.key_size,
                'modulus': str(public_numbers.n)[:50] + '...',
                'public_exponent': public_numbers.e,
                'encrypted': False
            }
        elif isinstance(private_key, ec.EllipticCurvePrivateKey):
            curve = private_key.curve
            return {
                'valid': True,
                'key_type': 'EC',
                'key_size': curve.key_size,
                'curve': curve.name,
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
    """Validate and get info from certificate."""
    try:
        cert = x509.load_pem_x509_certificate(cert_data, default_backend())

        subject_info = {attr.oid._name: attr.value for attr in cert.subject}

        san_list = []
        try:
            san_ext = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
            san_list = [name.value for name in san_ext.value]
        except Exception:
            pass

        now = datetime.utcnow()
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
            'is_expired': now > cert.not_valid_after,
            'days_until_expiry': (cert.not_valid_after - now).days
        }
    except Exception as e:
        return {'valid': False, 'error': str(e)}


def validate_csr(csr_data: bytes) -> Dict[str, Any]:
    """Validate and get info from CSR."""
    try:
        csr = x509.load_pem_x509_csr(csr_data, default_backend())

        subject_info = {attr.oid._name: attr.value for attr in csr.subject}

        extensions_info: Dict[str, Any] = {}
        san_list = []

        try:
            for ext in csr.extensions:
                if isinstance(ext.value, x509.SubjectAlternativeName):
                    san_list = [name.value for name in ext.value]
                    extensions_info['Subject Alternative Name'] = san_list
                elif isinstance(ext.value, x509.KeyUsage):
                    key_usage = []
                    if ext.value.digital_signature:
                        key_usage.append('Digital Signature')
                    if ext.value.key_encipherment:
                        key_usage.append('Key Encipherment')
                    if ext.value.data_encipherment:
                        key_usage.append('Data Encipherment')
                    if ext.value.key_agreement:
                        key_usage.append('Key Agreement')
                    if ext.value.key_cert_sign:
                        key_usage.append('Key Cert Sign')
                    if ext.value.crl_sign:
                        key_usage.append('CRL Sign')
                    extensions_info['Key Usage'] = key_usage
                elif isinstance(ext.value, x509.ExtendedKeyUsage):
                    extended_key_usage = []
                    for usage in ext.value:
                        if usage == x509.oid.ExtendedKeyUsageOID.SERVER_AUTH:
                            extended_key_usage.append('TLS Web Server Authentication')
                        elif usage == x509.oid.ExtendedKeyUsageOID.CLIENT_AUTH:
                            extended_key_usage.append('TLS Web Client Authentication')
                        else:
                            extended_key_usage.append(usage._name)
                    extensions_info['Extended Key Usage'] = extended_key_usage
        except Exception:
            pass

        return {
            'valid': True,
            'common_name': subject_info.get('commonName', 'N/A'),
            'subject': subject_info,
            'san': san_list,
            'extensions': extensions_info,
            'signature_algorithm': csr.signature_algorithm_oid._name,
            'is_signature_valid': csr.is_signature_valid
        }
    except Exception as e:
        return {'valid': False, 'error': str(e)}


def generate_ssh_keypair(
    key_type: str = "Ed25519",
    key_size: int = 4096,
    passphrase: Optional[str] = None,
    comment: str = "",
) -> Tuple[bytes, str]:
    """Generate an SSH key pair.

    Supported types:
      - Ed25519  : modern, fast, highly secure (no key_size needed)
      - RSA      : 2048 / 3072 / 4096 bits
      - ECDSA    : 256 (P-256) or 384 (P-384) bits

    The private key is serialised in OpenSSH PEM format.
    If a passphrase is supplied, the key is encrypted using the
    OpenSSH bcrypt-KDF (the strongest format available in the library).
    The passphrase is NEVER stored — callers must handle it themselves.

    Returns:
        (private_key_bytes, public_key_authorized_keys_line)
    """
    kt = key_type.upper()

    if kt == "ED25519":
        private_key = Ed25519PrivateKey.generate()
    elif kt == "ECDSA":
        curve = ec.SECP384R1() if key_size == 384 else ec.SECP256R1()
        private_key = ec.generate_private_key(curve, default_backend())
    else:  # RSA (default)
        valid_rsa_sizes = {2048, 3072, 4096}
        if key_size not in valid_rsa_sizes:
            key_size = 4096
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=key_size,
            backend=default_backend(),
        )

    # Choose encryption for the private key
    if passphrase:
        encryption: serialization.KeySerializationEncryption = (
            serialization.BestAvailableEncryption(passphrase.encode("utf-8"))
        )
    else:
        encryption = serialization.NoEncryption()

    # Serialise private key in OpenSSH format
    private_key_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.OpenSSH,
        encryption_algorithm=encryption,
    )

    # Serialise public key in OpenSSH authorized_keys format
    pub_bytes = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.OpenSSH,
        format=serialization.PublicFormat.OpenSSH,
    )
    public_key_line = pub_bytes.decode("utf-8").strip()
    if comment:
        public_key_line = f"{public_key_line} {comment}"

    return private_key_bytes, public_key_line


def validate_pfx(pfx_data: bytes, password: str) -> Dict[str, Any]:
    """Validate and get info from PFX file.

    The password is passed via stdin to prevent it from appearing in the process list.
    """
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            pfx_file = os.path.join(temp_dir, "input.pfx")

            with open(pfx_file, 'wb') as f:
                f.write(pfx_data)

            cmd = [
                'openssl', 'pkcs12',
                '-in', pfx_file,
                '-nokeys',
                '-passin', 'stdin',
            ]

            result = subprocess.run(
                cmd,
                input=password.encode(),
                capture_output=True,
            )
            if result.returncode != 0:
                return {
                    'valid': False,
                    'error': 'Invalid password or corrupted PFX file'
                }

            cert_pem = result.stdout
            cert_info = validate_certificate(cert_pem)

            return {
                'valid': True,
                'certificate_info': cert_info,
                'has_private_key': True
            }
    except Exception as e:
        return {'valid': False, 'error': str(e)}
