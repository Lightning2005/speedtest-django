from django.urls import path
from django.contrib.auth import views as auth_views
from .views import register_view
from . import views


urlpatterns = [
    path('ping/', views.ping_test, name='ping'),
    path('download/', views.download_test, name='download'),
    path('upload/', views.upload_test, name='upload'),
    path('save/', views.save_result, name='save'),
    path('history/', views.get_history, name='history'),
    path('register/', register_view, name='register'),
    path('login/', auth_views.LoginView.as_view(template_name='registration/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='/'), name='logout')
]