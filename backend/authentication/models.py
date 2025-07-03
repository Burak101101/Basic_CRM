from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token


class UserProfile(models.Model):
    """
    Kullanıcı profil bilgileri ve SMTP e-posta ayarları
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    company_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Şirket Adı")
    company_industry = models.CharField(max_length=255, blank=True, null=True, verbose_name="Sektör")
    company_position = models.CharField(max_length=255, blank=True, null=True, verbose_name="Pozisyon")
    company_size = models.CharField(max_length=50, blank=True, null=True, verbose_name="Şirket Büyüklüğü")
    company_website = models.URLField(blank=True, null=True, verbose_name="Web Sitesi")
    company_linkedin_url = models.URLField(blank=True, null=True, verbose_name="LinkedIn")
    company_location = models.CharField(max_length=255, blank=True, null=True, verbose_name="Lokasyon")
    company_description = models.TextField(blank=True, null=True, verbose_name="Şirket Hakkında")

    # SMTP Ayarları
    smtp_server = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="SMTP Sunucusu",
        help_text="Örn: smtp.gmail.com"
    )
    smtp_port = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="SMTP Port",
        help_text="Örn: 587"
    )
    smtp_username = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="SMTP Kullanıcı Adı",
        help_text="Genellikle e-posta adresiniz"
    )
    smtp_password = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="SMTP Şifre",
        help_text="Gmail için App Password kullanın"
    )
    use_tls = models.BooleanField(
        default=True,
        verbose_name="TLS Kullan",
        help_text="Güvenli bağlantı için önerilir"
    )

    # IMAP Ayarları (E-posta alma için)
    imap_server = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="IMAP Sunucusu",
        help_text="Örn: imap.gmail.com"
    )
    imap_port = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="IMAP Port",
        help_text="Genellikle 993 (SSL) veya 143"
    )
    imap_username = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="IMAP Kullanıcı Adı",
        help_text="Genellikle e-posta adresiniz"
    )
    imap_password = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="IMAP Şifre",
        help_text="Gmail için App Password kullanın"
    )
    use_imap_ssl = models.BooleanField(
        default=True,
        verbose_name="IMAP SSL Kullan",
        help_text="Güvenli bağlantı için önerilir"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Kullanıcı Profili"
        verbose_name_plural = "Kullanıcı Profilleri"

    def __str__(self):
        return f"{self.user.username} - Profile"


# Create Auth Token for every new user
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)


# Create UserProfile for every new user
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance=None, created=False, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
