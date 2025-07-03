#!/usr/bin/env python
"""
Celery setup and management script for CRM system
"""
import os
import sys
import subprocess
import time
from pathlib import Path

def check_redis():
    """Check if Redis is running"""
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, db=0)
        r.ping()
        print("✅ Redis is running")
        return True
    except Exception as e:
        print(f"❌ Redis is not running: {e}")
        print("Please start Redis server:")
        print("  - Windows: Download and run Redis from https://github.com/microsoftarchive/redis/releases")
        print("  - macOS: brew install redis && brew services start redis")
        print("  - Linux: sudo systemctl start redis")
        return False


def create_periodic_tasks():
    """Create periodic tasks in database"""
    print("⏰ Setting up periodic tasks...")
    try:
        # This will be handled by Celery Beat automatically
        # when it starts with the schedule defined in celery.py
        print("✅ Periodic tasks will be created automatically by Celery Beat")
        return True
    except Exception as e:
        print(f"❌ Failed to create periodic tasks: {e}")
        return False

def start_celery_worker():
    """Start Celery worker"""
    print("🚀 Starting Celery worker...")
    cmd = [
        'celery',
        '-A', 'crm_project',
        'worker',
        '--loglevel=info',
        '--pool=solo'  # ekle bunu!
    ]
    
    try:
        return subprocess.Popen(cmd)
    except Exception as e:
        print(f"❌ Failed to start Celery worker: {e}")
        return None

def start_celery_beat():
    """Start Celery beat scheduler"""
    print("📅 Starting Celery beat scheduler...")
    cmd = [
        'celery',
        '-A', 'crm_project',
        'beat',
        '--loglevel=info',
        '--scheduler=django_celery_beat.schedulers:DatabaseScheduler'
    ]
    
    try:
        return subprocess.Popen(cmd)
    except Exception as e:
        print(f"❌ Failed to start Celery beat: {e}")
        return None

def main():
    """Main setup function"""
    print("🎯 CRM Celery Setup Script")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not Path('manage.py').exists():
        print("❌ Please run this script from the Django project root directory")
        sys.exit(1)
    
    # Step 1: Check Redis
    if not check_redis():
        sys.exit(1)

    
    # Step 4: Create periodic tasks
    if not create_periodic_tasks():
        sys.exit(1)
    
    print("\n🎉 Setup completed successfully!")
    print("\nTo start the Celery services:")
    print("1. Start Celery worker:")
    print("   python manage.py start_celery --worker-only")
    print("\n2. Start Celery beat (in another terminal):")
    print("   python manage.py start_celery --beat-only")
    print("\n3. Or start both together:")
    print("   python manage.py start_celery")
    
    # Ask if user wants to start services now
    response = input("\nDo you want to start Celery services now? (y/n): ").lower().strip()
    
    if response == 'y':
        print("\n🚀 Starting Celery services...")
        
        # Start worker
        worker_process = start_celery_worker()
        if not worker_process:
            sys.exit(1)
        
        # Wait a bit for worker to start
        time.sleep(2)
        
        # Start beat
        beat_process = start_celery_beat()
        if not beat_process:
            worker_process.terminate()
            sys.exit(1)
        
        print("\n✅ Celery services started successfully!")
        print("📊 Monitor tasks at: http://localhost:8000/admin/django_celery_beat/")
        print("🔍 Check logs for task execution details")
        print("\nPress Ctrl+C to stop all services...")
        
        try:
            # Wait for processes
            worker_process.wait()
            beat_process.wait()
        except KeyboardInterrupt:
            print("\n🛑 Stopping Celery services...")
            worker_process.terminate()
            beat_process.terminate()
            
            # Wait for graceful shutdown
            worker_process.wait(timeout=10)
            beat_process.wait(timeout=10)
            
            print("✅ Celery services stopped")

if __name__ == '__main__':
    main()
