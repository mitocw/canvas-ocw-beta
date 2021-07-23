"""
Configuration file for flask sample application
"""
import os

# Enable CSRF
WTF_CSRF_ENABLED = True

# Secret key for authentication
SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "you-will-never-guess")

# Google authentication
GOOGLE_AUTH_REDIRECT_URI = os.environ.get('GOOGLE_AUTH_REDIRECT_URI')
GOOGLE_BASE_URI = os.environ.get('GOOGLE_BASE_URI')
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')

SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = True
