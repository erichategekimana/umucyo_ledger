import uuid
from django.db import models
from django.utils import timezone

class USSDLog(models.Model):
    """
    Logs every USSD interaction to provide an audit trail and debugging.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_id = models.CharField(max_length=100, db_index=True)
    phone_number = models.CharField(max_length=20, db_index=True)
    text = models.TextField(blank=True, default='')          # raw input from user
    response = models.TextField()                            # what we sent back
    menu_level = models.PositiveSmallIntegerField(default=0) # depth of menu (optional)
    is_final = models.BooleanField(default=False)            # True if response was END
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session_id', 'created_at']),
        ]

    def __str__(self):
        return f"{self.phone_number} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"