"""
Umucyo Ledger - Production Environment Settings.
Hardened for industrial production deployment with PostgreSQL 16 connection pooling.
"""
from .base import *
from decouple import config, Csv

DEBUG = False

ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

# Hardened Security Headers (TLS 1.3 compliance / HSTS per SRS Section 3.4)
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# PostgreSQL 16 Connection Pooling
DATABASES["default"]["CONN_MAX_AGE"] = 600

# Strict CORS whitelisting in production
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", default="https://umucyo.rw", cast=Csv())

# Production Logging (INFO level)
LOGGING["root"]["level"] = "INFO"
LOGGING["handlers"]["console"]["level"] = "INFO"
