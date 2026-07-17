"""
Umucyo Ledger - Dynamic Settings Loader (`split-settings` industrial architecture).

Loads base configuration and merges environment-specific overrides based on the
`DJANGO_ENV` environment variable (defaulting to 'development').
"""
import os
from decouple import config

env = config("DJANGO_ENV", default="development").lower()

if env == "production":
    from .production import *
elif env == "testing":
    from .testing import *
else:
    from .development import *
