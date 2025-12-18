import requests
import json


def get_ip_info():
    """Получение информации о местоположении по IP"""
    try:
        # Пробуем несколько API
        apis = [
            'https://ipapi.co/json/',
            'http://ip-api.com/json/',
            'https://api.ipify.org?format=json'
        ]

        for api_url in apis:
            try:
                response = requests.get(api_url, timeout=3)
                if response.status_code == 200:
                    data = response.json()

                    # Обработка разных форматов ответов
                    if 'ip' in data:
                        return {
                            'ip': data.get('ip', ''),
                            'country': data.get('country', data.get('country_name', 'Unknown')),
                            'city': data.get('city', 'Unknown'),
                            'isp': data.get('org', data.get('isp', 'Unknown')),
                            'provider': data.get('org', data.get('isp', 'Unknown')),
                            'lat': data.get('latitude', data.get('lat', 0)),
                            'lon': data.get('longitude', data.get('lon', 0))
                        }
                    elif 'query' in data:
                        return {
                            'ip': data.get('query', ''),
                            'country': data.get('country', 'Unknown'),
                            'city': data.get('city', 'Unknown'),
                            'isp': data.get('isp', 'Unknown'),
                            'provider': data.get('isp', 'Unknown'),
                            'lat': data.get('lat', 0),
                            'lon': data.get('lon', 0)
                        }
            except:
                continue  # Пробуем следующий API

    except Exception as e:
        print(f"Все API не сработали: {e}")

    # Fallback данные
    return {
        'ip': 'Не определен',
        'country': 'Не определен',
        'city': 'Не определен',
        'isp': 'Не определен',
        'provider': 'Не определен',
        'lat': 0,
        'lon': 0
    }