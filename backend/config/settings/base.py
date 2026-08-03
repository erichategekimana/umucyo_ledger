"""
Umucyo Ledger - Base Django Settings.

Implements core industrial standards, modular domain applications, and strict
PostgreSQL 16 connection setup per SRS Section 2.4.
"""
import os
from datetime import timedelta
from pathlib import Path
from decouple import config, Csv
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"


def load_env_file():
    """Load project-level .env values so Django uses the repository config instead of shell exports."""
    if not ENV_FILE.exists():
        return

    for raw_line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ[key.strip()] = value.strip().strip('"').strip("'")


load_env_file()

SECRET_KEY = config("DJANGO_SECRET_KEY")

DEBUG = config("DJANGO_DEBUG", default=False, cast=bool)

ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="*", cast=Csv())

CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
    default="http://localhost:8000,http://127.0.0.1:8000",
    cast=Csv()
)

# Application definition - Multi-App Domain Architecture
INSTALLED_APPS = [
    # Django core apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party packages
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",

    # Umucyo Ledger Domain Apps (Clean DDD modular structure)
    "common",
    "apps.accounts",
    "apps.cooperatives",
    "apps.harvest_ledger",
    "apps.sales_distribution",
    "apps.agronomy_monitoring",
    "apps.notifications",
    "apps.ussd_gateway",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # Audit Log Middleware (NFR 4 - Un-Alterable Action Ledgers tracking IP & User)
    "common.middleware.AuditLogMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# Database Configuration (Exclusive PostgreSQL 16 - SRS Section 2.4)
DATABASE_URL = config("DATABASE_URL", default=None)
if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=config("DB_CONN_MAX_AGE", default=600, cast=int),
            conn_health_checks=True,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": config("DB_ENGINE", default="django.db.backends.postgresql"),
            "NAME": config("DB_NAME", default="umucyo_ledger"),
            "USER": config("DB_USER", default="seric"),
            "PASSWORD": config("DB_PASSWORD", default="seric123"),
            "HOST": config("DB_HOST", default="localhost"),
            "PORT": config("DB_PORT", default="5432"),
            "CONN_MAX_AGE": config("DB_CONN_MAX_AGE", default=600, cast=int),
        }
    }

# Custom User Model (Accounts Domain - NFR 1 Role-Based Access Separation)
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization (NFR 5 - Bilingual Kinyarwanda & English support)
LANGUAGE_CODE = "en"
LANGUAGES = [
    ("en", "English"),
    ("rw", "Kinyarwanda"),
]
TIME_ZONE = "Africa/Kigali"
USE_I18N = True
USE_TZ = True

# Static files (Environment variable driven, served via WhiteNoise in production)
STATIC_URL = config("STATIC_URL", default="/static/")
_raw_static_root = config("STATIC_ROOT", default="staticfiles")
STATIC_ROOT = BASE_DIR / _raw_static_root if not Path(_raw_static_root).is_absolute() else Path(_raw_static_root)

# Media files (File uploads for registrations, attachments, etc.)
MEDIA_URL = config("MEDIA_URL", default="/media/")
_raw_media_root = config("MEDIA_ROOT", default="media")
MEDIA_ROOT = BASE_DIR / _raw_media_root if not Path(_raw_media_root).is_absolute() else Path(_raw_media_root)

# Storage configuration for Django static & media storage
STORAGES = {
    "default": {
        "BACKEND": config("DEFAULT_FILE_STORAGE", default="django.core.files.storage.FileSystemStorage"),
    },
    "staticfiles": {
        "BACKEND": config("STATICFILES_STORAGE", default="whitenoise.storage.CompressedManifestStaticFilesStorage"),
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Django REST Framework & JWT Configuration
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

CORS_ALLOW_ALL_ORIGINS = config("CORS_ALLOW_ALL_ORIGINS", default=DEBUG, cast=bool)
CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", default="http://localhost:3000,http://127.0.0.1:3000", cast=Csv())

# Professional Logging Configuration
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} [{name}:{lineno}] {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}
