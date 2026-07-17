"""
Umucyo Ledger - Development Environment Settings.
"""
from .base import *

DEBUG = True

# Verbose console logging during development
LOGGING["root"]["level"] = "DEBUG"
LOGGING["handlers"]["console"]["level"] = "DEBUG"

# CORS open during development for API consumers
CORS_ALLOW_ALL_ORIGINS = True
