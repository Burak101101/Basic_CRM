from django.core.management.base import BaseCommand
from ai_assistant.models import AIConfiguration


class Command(BaseCommand):
    help = 'AI konfigürasyonu oluştur'

    def add_arguments(self, parser):
        parser.add_argument(
            '--api-key',
            type=str,
            help='OpenRouter API anahtarı',
            required=True
        )
        parser.add_argument(
            '--name',
            type=str,
            default='DeepSeek R1 Default',
            help='Konfigürasyon adı'
        )

    def handle(self, *args, **options):
        api_key = options['api_key'] # python manage.py setup_ai_config --api-key "YOUR_API_KEY" ile tanımlıyorsun
        name = options['name']

        # Mevcut varsayılan konfigürasyonu kaldır
        AIConfiguration.objects.filter(is_default=True).update(is_default=False)

        # Yeni konfigürasyon oluştur
        config = AIConfiguration.objects.create(
            name=name,
            provider='openrouter',
            model_name='deepseek/deepseek-r1',
            api_key=api_key,
            api_url='https://openrouter.ai/api/v1/chat/completions',
            max_tokens=4000,
            temperature=0.7,
            is_active=True,
            is_default=True
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'AI konfigürasyonu başarıyla oluşturuldu: {config.name}'
            )
        )
