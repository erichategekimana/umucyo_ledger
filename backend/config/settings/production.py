"""
Umucyo Ledger - Production Environment Settings.
Hardened for industrial production deployment with PostgreSQL 16 connection pooling.
"""
from .base import *
from decouple import config, Csv

DEBUG = config("DJANGO_DEBUG", default=False, cast=bool)

ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="127.0.0.1,localhost,umucyo-ledger.onrender.com,.onrender.com", cast=Csv())
CSRF_TRUSTED_ORIGINS = config("CSRF_TRUSTED_ORIGINS", default="https://umucyo-ledger.onrender.com", cast=Csv())

# Hardened Security Headers (TLS 1.3 compliance / HSTS per SRS Section 3.4)
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = config("SECURE_HSTS_SECONDS", default=31536000, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = config("SECURE_HSTS_INCLUDE_SUBDOMAINS", default=True, cast=bool)
SECURE_HSTS_PRELOAD = config("SECURE_HSTS_PRELOAD", default=True, cast=bool)
SESSION_COOKIE_SECURE = config("SESSION_COOKIE_SECURE", default=True, cast=bool)
CSRF_COOKIE_SECURE = config("CSRF_COOKIE_SECURE", default=True, cast=bool)

# PostgreSQL 16 Connection Pooling
DATABASES["default"]["CONN_MAX_AGE"] = config("DB_CONN_MAX_AGE", default=600, cast=int)

# Strict CORS whitelisting in production
CORS_ALLOW_ALL_ORIGINS = config("CORS_ALLOW_ALL_ORIGINS", default=False, cast=bool)
CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", default="https://umucyo-ledger.onrender.com,http://localhost:3000", cast=Csv())

# Production Logging (INFO level)
LOGGING["root"]["level"] = "INFO"
LOGGING["handlers"]["console"]["level"] = "INFO"
