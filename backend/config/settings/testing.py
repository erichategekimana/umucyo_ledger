"""
Umucyo Ledger - Testing Environment Settings.
Optimized for high speed test execution and isolated test databases.
"""
from .base import *

DEBUG = False

# Fast password hashing during automated test runs
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Ensure console logging doesn't flood during test execution
LOGGING["root"]["level"] = "ERROR"
