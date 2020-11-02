"""
Configuration file for flask sample application
"""
import os

CANVAS_API_KEY = os.environ.get('CANVAS_API_KEY')

# enable CSRF
WTF_CSRF_ENABLED = True

# secret key for authentication
SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "you-will-never-guess")

SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = True
