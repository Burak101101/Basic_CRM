from django.db import models
from django.utils import timezone


class Company(models.Model):
    """
    Firma bilgilerinin tutulduğu model.
    """
    name = models.CharField(max_length=255, verbose_name="Firma Adı")
    tax_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="Vergi Numarası")
    industry = models.CharField(max_length=100, blank=True, null=True, verbose_name="Sektör")
    address = models.TextField(blank=True, null=True, verbose_name="Adres")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefon")
    email = models.EmailField(blank=True, null=True, verbose_name="E-posta")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")

    class Meta:
        verbose_name = "Firma"
        verbose_name_plural = "Firmalar"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Contact(models.Model):
    """
    Firma yetkililerinin bilgilerinin tutulduğu model.
    """
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="contacts", verbose_name="Firma")
    first_name = models.CharField(max_length=100, verbose_name="Ad")
    last_name = models.CharField(max_length=100, verbose_name="Soyad")
    position = models.CharField(max_length=100, blank=True, null=True, verbose_name="Pozisyon")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefon")
    email = models.EmailField(blank=True, null=True, verbose_name="E-posta")
    is_primary = models.BooleanField(default=False, verbose_name="Ana İrtibat Kişisi")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")

    class Meta:
        verbose_name = "İrtibat Kişisi"
        verbose_name_plural = "İrtibat Kişileri"
        ordering = ["-is_primary", "first_name", "last_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.company.name})"

    def save(self, *args, **kwargs):
        # Eğer bu kişi, ana irtibat kişisi olarak işaretlendiyse
        # şirketin diğer tüm kişilerini ana irtibat kişisi olmaktan çıkar
        if self.is_primary:
            Contact.objects.filter(company=self.company, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


class Note(models.Model):
    """
    Firma ve kişilere bağlı notlar için model.
    """
    title = models.CharField(max_length=255, verbose_name="Başlık")
    content = models.TextField(verbose_name="İçerik")
    company = models.ForeignKey(
        Company, 
        on_delete=models.CASCADE, 
        related_name="notes", 
        null=True, 
        blank=True, 
        verbose_name="İlişkili Firma"
    )
    contact = models.ForeignKey(
        Contact, 
        on_delete=models.CASCADE, 
        related_name="notes", 
        null=True, 
        blank=True, 
        verbose_name="İlişkili Kişi"
    )
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")
    
    class Meta:
        verbose_name = "Not"
        verbose_name_plural = "Notlar"
        ordering = ["-created_at"]
        
    def __str__(self):
        if self.company and self.contact:
            return f"{self.title} ({self.company.name} - {self.contact})"
        elif self.company:
            return f"{self.title} ({self.company.name})"
        elif self.contact:
            return f"{self.title} ({self.contact})"
        return self.title
        
    def clean(self):
        """
        Not ya bir firmaya ya bir kişiye ya da her ikisine bağlı olmalıdır.
        """
        from django.core.exceptions import ValidationError
        
        if not self.company and not self.contact:
            raise ValidationError("Not en az bir firma veya kişiye bağlı olmalıdır.")
