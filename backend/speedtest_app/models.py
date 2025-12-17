from django.db import models


class SpeedTestResult(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    ping = models.FloatField(help_text="В миллисекундах")
    download = models.FloatField(help_text="В Мбит/с")
    upload = models.FloatField(help_text="В Мбит/с")
    server = models.CharField(max_length=200, default="local")

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.timestamp.strftime('%Y-%m-%d %H:%M')} - DL: {self.download:.2f} Mbps"