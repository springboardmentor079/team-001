"""Populate the database with demo users and realistic sample data.

Usage (from the backend folder):
    python seed_demo.py            # adds demo data if it is not there yet
    python seed_demo.py --reset    # wipes the database first

Every demo account uses the password:  Demo@1234
"""
import sys

from app.seed import main

if __name__ == "__main__":
    main(reset="--reset" in sys.argv)
