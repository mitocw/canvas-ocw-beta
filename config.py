"""
Configuration file for flask sample application
"""
import os

# Contenful
CONTENTFUL_SPACE_ID=os.environ.get('CONTENTFUL_SPACE_ID')
CONTENTFUL_CDA_TOKEN=os.environ.get('CONTENTFUL_CDA_TOKEN')
CONTENTFUL_CPA_TOKEN=os.environ.get('CONTENTFUL_CPA_TOKEN')

# enable CSRF
WTF_CSRF_ENABLED = True

# secret key for authentication
SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "you-will-never-guess")

SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = True
