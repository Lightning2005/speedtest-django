from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from .models import SpeedTestResult
import time
import random
import json


def ping_test(request):
    """Тест ping"""
    # Просто быстрый ответ
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
    """Тест upload - просто принимаем данные"""
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
    """Сохранение результатов теста в БД"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))

            # Проверяем и ограничиваем значения
            ping = max(0, min(float(data.get('ping', 0)), 1000))  # 0-1000 мс
            download = max(0, min(float(data.get('download', 0)), 2000))  # 0-2000 Мбит/с
            upload = max(0, min(float(data.get('upload', 0)), 2000))  # 0-2000 Мбит/с

            result = SpeedTestResult(
                ip_address=request.META.get('REMOTE_ADDR'),
                ping=ping,
                download=download,
                upload=upload,
                server=data.get('server', 'local')
            )
            result.save()

            return JsonResponse({
                'status': 'success',
                'id': result.id,
                'timestamp': result.timestamp.isoformat()
            })

        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

    return JsonResponse({'status': 'error', 'message': 'POST required'}, status=400)


def get_history(request):
    """Получение истории тестов"""
    limit = int(request.GET.get('limit', 10))
    results = SpeedTestResult.objects.all().order_by('-timestamp')[:limit]

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