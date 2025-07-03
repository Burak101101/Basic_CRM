import os
import subprocess
import sys
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Start Celery worker and beat scheduler'

    def add_arguments(self, parser):
        parser.add_argument(
            '--worker-only',
            action='store_true',
            help='Start only the Celery worker (no beat scheduler)',
        )
        parser.add_argument(
            '--beat-only',
            action='store_true',
            help='Start only the Celery beat scheduler (no worker)',
        )
        parser.add_argument(
            '--concurrency',
            type=int,
            default=4,
            help='Number of concurrent worker processes (default: 4)',
        )
        parser.add_argument(
            '--loglevel',
            default='info',
            help='Logging level (default: info)',
        )

    def handle(self, *args, **options):
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_project.settings')
        
        worker_only = options['worker_only']
        beat_only = options['beat_only']
        concurrency = options['concurrency']
        loglevel = options['loglevel']

        if beat_only:
            self.start_beat(loglevel)
        elif worker_only:
            self.start_worker(concurrency, loglevel)
        else:
            self.stdout.write(
                self.style.SUCCESS('Starting both Celery worker and beat scheduler...')
            )
            self.stdout.write(
                self.style.WARNING('Note: In production, run worker and beat in separate processes!')
            )
            
            # Start worker in background
            worker_process = self.start_worker_background(concurrency, loglevel)
            
            # Start beat in foreground
            try:
                self.start_beat(loglevel)
            except KeyboardInterrupt:
                self.stdout.write(self.style.WARNING('\nShutting down...'))
                worker_process.terminate()
                worker_process.wait()

    def start_worker(self, concurrency, loglevel):
        """Start Celery worker"""
        self.stdout.write(
            self.style.SUCCESS(f'Starting Celery worker with {concurrency} processes...')
        )
        
        cmd = [
            'celery',
            '-A', 'crm_project',
            'worker',
            '--loglevel', loglevel,
            '--concurrency', str(concurrency),
        ]
        
        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to start Celery worker: {e}')
            )
            sys.exit(1)
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('\nCelery worker stopped.'))

    def start_worker_background(self, concurrency, loglevel):
        """Start Celery worker in background"""
        cmd = [
            'celery',
            '-A', 'crm_project',
            'worker',
            '--loglevel', loglevel,
            '--concurrency', str(concurrency),
        ]
        
        return subprocess.Popen(cmd)

    def start_beat(self, loglevel):
        """Start Celery beat scheduler"""
        self.stdout.write(
            self.style.SUCCESS('Starting Celery beat scheduler...')
        )
        
        cmd = [
            'celery',
            '-A', 'crm_project',
            'beat',
            '--loglevel', loglevel,
            '--scheduler', 'django_celery_beat.schedulers:DatabaseScheduler',
        ]
        
        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to start Celery beat: {e}')
            )
            sys.exit(1)
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('\nCelery beat stopped.'))
