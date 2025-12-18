from django.db import models
from django.contrib.auth.models import User

class SpeedTestResult(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    ping = models.FloatField(help_text="В миллисекундах")
    download = models.FloatField(help_text="В Мбит/с")
    upload = models.FloatField(help_text="В Мбит/с")
    server = models.CharField(max_length=200, default="local")
    provider = models.CharField(max_length=200, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.timestamp.strftime('%Y-%m-%d %H:%M')} - DL: {self.download:.2f} Mbps"