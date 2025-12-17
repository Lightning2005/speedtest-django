from django.urls import path
from . import views

urlpatterns = [
    path('ping/', views.ping_test, name='ping'),
    path('download/', views.download_test, name='download'),
    path('upload/', views.upload_test, name='upload'),
    path('save/', views.save_result, name='save'),
    path('history/', views.get_history, name='history'),
]