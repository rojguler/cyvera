import sys
import os

# Add backend directory to sys.path so app imports work seamlessly
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Ensure Vercel environment flag is set if not already
if "VERCEL" not in os.environ:
    os.environ["VERCEL"] = "1"

from app.main import app
