import requests
import json


def get_ip_info(client_ip=None):
    """Получение информации о местоположении по IP"""
    try:
        # Если передан IP, используем его. Если нет — автоопределение
        if client_ip:
            # Используем ipapi.co с переданным IP
            url = f'https://ipapi.co/{client_ip}/json/'
        else:
            # Автоопределение (вернет IP сервера PythonAnywhere)
            url = 'https://ipapi.co/json/'

        # Отправляем запрос
        response = requests.get(url, timeout=5)

        if response.status_code == 200:
            data = response.json()

            # Форматируем ответ
            return {
                'ip': data.get('ip', client_ip if client_ip else 'Не определен'),
                'country': data.get('country_name', 'Не определен'),
                'city': data.get('city', 'Не определен'),
                'isp': data.get('org', data.get('isp', 'Не определен')),
                'provider': data.get('org', data.get('isp', 'Не определен')),
                'lat': data.get('latitude', 0),
                'lon': data.get('longitude', 0)
            }
        else:
            raise Exception(f"API вернул статус {response.status_code}")

    except Exception as e:
        print(f"Ошибка получения информации о IP: {e}")

        # Fallback данные
        return {
            'ip': client_ip if client_ip else 'Не определен',
            'country': 'Не определен',
            'city': 'Не определен',
            'isp': 'Не определен',
            'provider': 'Не определен',
            'lat': 0,
            'lon': 0
        }