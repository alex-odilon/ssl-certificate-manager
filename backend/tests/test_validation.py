import pytest
from unittest.mock import patch, MagicMock
from app.utils.crypto import validate_pfx
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
import datetime

def generate_test_cert_bytes() -> bytes:
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, "test.example.com"),
    ])
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        private_key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.datetime.utcnow() - datetime.timedelta(seconds=1)
    ).not_valid_after(
        datetime.datetime.utcnow() + datetime.timedelta(days=1)
    ).sign(private_key, hashes.SHA256())
    
    return cert.public_bytes(serialization.Encoding.PEM)

@patch("app.utils.crypto.subprocess.run")
def test_validate_pfx_success(mock_run):
    cert_bytes = generate_test_cert_bytes()
    
    # Mock subprocess.run return value
    mock_process = MagicMock()
    mock_process.returncode = 0
    mock_process.stdout = cert_bytes
    mock_run.return_value = mock_process
    
    result = validate_pfx(b"fake_pfx_content", "fake_password")
    
    assert result["valid"] is True
    assert result["has_private_key"] is True
    assert result["certificate_info"]["valid"] is True
    assert result["certificate_info"]["common_name"] == "test.example.com"
    
    # Verify subprocess.run was called correctly with password bytes
    mock_run.assert_called_once()
    called_kwargs = mock_run.call_args[1]
    assert called_kwargs["input"] == b"fake_password"

@patch("app.utils.crypto.subprocess.run")
def test_validate_pfx_failure(mock_run):
    # Mock subprocess.run return value for failure
    mock_process = MagicMock()
    mock_process.returncode = 1
    mock_run.return_value = mock_process
    
    result = validate_pfx(b"fake_pfx_content", "wrong_password")
    
    assert result["valid"] is False
    assert "Invalid password" in result["error"]
