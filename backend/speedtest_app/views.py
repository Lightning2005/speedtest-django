from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from .models import SpeedTestResult
from django.contrib.auth import login, logout
from django.shortcuts import render, redirect
from .ip_service import get_ip_info
from .forms import RegisterForm
import time
import random
import json

def register_view(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('/')
    else:
        form = RegisterForm()
    return render(request, 'registration/register.html', {'form': form})

def home_view(request):
    context = {
        'user': request.user,
    }
    return render(request, 'index.html', context)

def ping_test(request):
    """Тест ping"""
    return JsonResponse({
        'timestamp': time.time(),
        'status': 'ok'
    })


def download_test(request):
    """Генерация тестовых данных для скачивания"""
    # Используем фиксированный размер для стабильности
    size = 2 * 1024 * 1024  # 2 MB

    # Генерируем случайные данные
    data = bytes([random.randint(0, 255) for _ in range(size)])

    response = HttpResponse(data, content_type='application/octet-stream')
    response['Content-Length'] = str(size)
    response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response['Pragma'] = 'no-cache'

    return response


@csrf_exempt
def upload_test(request):
    if request.method == 'POST':
        # Получаем время начала от клиента
        start_time = float(request.GET.get('start_time', time.time()))

        # Читаем данные
        data = request.body
        content_length = len(data)

        # Возвращаем только факт получения
        return JsonResponse({
            'status': 'ok',
            'bytes_received': content_length,
            'server_time': time.time(),
            'client_start': start_time
        })

    return JsonResponse({'error': 'POST method required'}, status=400)


@csrf_exempt
def save_result(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))

            # Получаем информацию о местоположении
            ip_info = get_ip_info()

            ping = max(0, min(float(data.get('ping', 0)), 1000))
            download = max(0, min(float(data.get('download', 0)), 2000))
            upload = max(0, min(float(data.get('upload', 0)), 2000))

            # Сохраняем только для авторизованных
            if request.user.is_authenticated:
                result = SpeedTestResult(
                    user=request.user,
                    ip_address=ip_info['ip'],
                    ping=ping,
                    download=download,
                    upload=upload,
                    server='local',
                    provider=ip_info['isp'],
                    city=ip_info['city'],
                    country=ip_info['country'],
                    latitude=ip_info['lat'],
                    longitude=ip_info['lon']
                )
                result.save()

                return JsonResponse({
                    'status': 'success',
                    'id': result.id,
                    'timestamp': result.timestamp.isoformat(),
                    'location': f"{ip_info['city']}, {ip_info['country']}"
                })
            else:
                return JsonResponse({
                    'status': 'success',
                    'message': 'Результаты не сохранены (требуется авторизация)'
                })

        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

    return JsonResponse({'status': 'error', 'message': 'POST required'}, status=400)


def get_history(request):
    limit = int(request.GET.get('limit', 10))

    # Берем результаты ТОЛЬКО для авторизованного пользователя
    if request.user.is_authenticated:
        results = SpeedTestResult.objects.filter(user=request.user).order_by('-timestamp')[:limit]
    else:
        # Для неавторизованных - пустой список
        results = []

    history = []
    for result in results:
        history.append({
            'id': result.id,
            'timestamp': result.timestamp.isoformat(),
            'ping': float(result.ping),
            'download': float(result.download),
            'upload': float(result.upload),
            'server': result.server
        })

    return JsonResponse({'history': history})


def get_ip_info_view(request):
    try:
        # Получаем IP клиента
        client_ip = request.META.get('REMOTE_ADDR')

        # Если localhost, возвращаем тестовые данные
        if client_ip in ['127.0.0.1', '::1']:
            return JsonResponse({
                'ip': '127.0.0.1 (localhost)',
                'provider': 'Локальная сеть',
                'city': 'Локальный сервер',
                'country': 'Россия'
            })

        # Иначе используем наш сервис
        from .ip_service import get_ip_info
        ip_data = get_ip_info()
        return JsonResponse(ip_data)

    except Exception as e:
        return JsonResponse({
            'ip': 'Не определен',
            'provider': 'Не определен',
            'city': 'Не определен',
            'country': 'Не определен'
        })