"""
Test email backend that doesn't actually send emails but stores them for viewing
"""

import os
import json
from datetime import datetime
from django.conf import settings
from pathlib import Path

class TestEmailBackend:
    """
    A backend that doesn't actually send emails but writes them to files
    for development/testing purposes.
    """
    
    def __init__(self, *args, **kwargs):
        # Create the directory to store email files if it doesn't exist
        self.email_dir = Path(settings.BASE_DIR) / "test_emails"
        self.email_dir.mkdir(exist_ok=True)
    
    def send_email(self, from_email, to_emails, message, **kwargs):
        """
        Store the email content in a file instead of sending it
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        email_data = {
            "from": from_email,
            "to": to_emails,
            "cc": kwargs.get("cc", []),
            "bcc": kwargs.get("bcc", []),
            "subject": message["Subject"],
            "date": datetime.now().isoformat(),
            "content": message.get_payload()
        }
        
        # Create a uniquely named file for this email
        file_path = self.email_dir / f"email_{timestamp}.json"
        
        # Write the email data to the file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(email_data, f, ensure_ascii=False, indent=4)
        
        return True, f"Email saved to {file_path}"

# Helper function to list all test emails
def get_test_emails():
    """
    Get a list of all test emails that have been sent
    """
    email_dir = Path(settings.BASE_DIR) / "test_emails"
    if not email_dir.exists():
        return []
    
    emails = []
    for file_path in email_dir.glob("*.json"):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                email_data = json.load(f)
                email_data["file_path"] = str(file_path)
                emails.append(email_data)
        except Exception as e:
            # Skip corrupted files
            continue
    
    # Sort emails by date (newest first)
    emails.sort(key=lambda x: x.get("date", ""), reverse=True)
    return emails

# Helper function to get a specific test email
def get_test_email(email_id):
    """
    Get a specific test email by its file name
    """
    email_dir = Path(settings.BASE_DIR) / "test_emails"
    file_path = email_dir / f"{email_id}.json"
    
    if not file_path.exists():
        return None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return None
