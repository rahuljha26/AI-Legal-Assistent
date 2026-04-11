from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def home(request):
    return JsonResponse({"status": "success", "message": "AI Legal Assistant API is running! Access the frontend at http://localhost:5173", "version": "1.0"})

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('api/v1/', include('AILegal.urls')),
]
