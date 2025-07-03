import logging
from django.core.management.base import BaseCommand
from notifications.models import Notification
from crm_project.supabase_helpers import SupabaseService

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Sync all notifications to Supabase'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=1000,
            help='Limit the number of notifications to sync',
        )
        parser.add_argument(
            '--unread-only',
            action='store_true',
            help='Sync only unread notifications',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Sync notifications from the last N days',
        )

    def handle(self, *args, **options):
        from django.utils import timezone
        from datetime import timedelta

        limit = options['limit']
        unread_only = options['unread_only']
        days = options['days']

        self.stdout.write(self.style.SUCCESS(f'Syncing notifications to Supabase...'))

        # Check if Supabase client is available
        supabase = SupabaseService.get_client()
        if not supabase:
            self.stderr.write(self.style.ERROR('Supabase connection not available. Check environment variables.'))
            return

        # Get notifications to sync
        query = Notification.objects.all()
        
        if unread_only:
            query = query.filter(is_read=False)
        
        if days:
            since_date = timezone.now() - timedelta(days=days)
            query = query.filter(created_at__gte=since_date)
        
        query = query.order_by('-created_at')[:limit]
        
        count = 0
        for notification in query:
            try:
                # Directly use the model's sync method which now has the fixed table name
                notification.sync_to_supabase()
                count += 1
                if count % 100 == 0:
                    self.stdout.write(f'Synced {count} notifications...')
            except Exception as e:
                logger.error(f'Error syncing notification {notification.id}: {e}')
                self.stderr.write(self.style.ERROR(f'Error syncing notification {notification.id}: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'Successfully synced {count} notifications to Supabase'))
