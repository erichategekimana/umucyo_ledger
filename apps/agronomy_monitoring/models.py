"""
Agronomy & Veterinary Monitoring Domain Models.

Implements FR 7.0 / FR 7.1 / FR 7.2 (Agronomic & Veterinary Mapping, Anomaly Flagging,
and GIS Heatmap Data Structure).
"""
from django.conf import settings
from django.db import models
from common.models import TimeStampedUUIDModel
from apps.cooperatives.models import Cooperative


class AnomalyReport(TimeStampedUUIDModel):
    """
    Implements FR 7.x:
    Captures localized agronomic health markers, crop blights, or livestock disease
    indicators with exact GIS coordinates (`latitude`, `longitude`) to enable rapid
    veterinary intervention (< 48 hours response time per SRS hypothesis).
    """

    class Severity(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    cooperative = models.ForeignKey(
        Cooperative,
        on_delete=models.CASCADE,
        related_name="anomaly_reports",
        db_index=True,
        help_text="The cooperative where the agricultural anomaly was observed."
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="anomaly_reports",
        help_text="Collection Officer or Veterinarian who submitted the alert."
    )
    sector = models.CharField(
        max_length=120,
        db_index=True,
        help_text="Geographic sector of the affected agricultural zone."
    )
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text="GIS latitude coordinate for regional heatmapping (FR 7.2)."
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text="GIS longitude coordinate for regional heatmapping (FR 7.2)."
    )
    category = models.CharField(
        max_length=64,
        db_index=True,
        help_text="Classification of the anomaly (e.g., crop blight, pest outbreak, soil degradation)."
    )
    description = models.TextField(
        help_text="Detailed field observations regarding symptoms and spread."
    )
    severity = models.CharField(
        max_length=10,
        choices=Severity.choices,
        default=Severity.LOW,
        db_index=True,
        help_text="Impact severity classification."
    )
    resolved = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether veterinary teams have addressed and resolved the outbreak."
    )

    class Meta:
        verbose_name = "Agronomic Anomaly Report"
        verbose_name_plural = "Agronomic Anomaly Reports"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.category} @ {self.sector} [{self.severity}]"
