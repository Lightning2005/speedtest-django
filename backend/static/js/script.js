// Класс для управления тестом скорости
class SpeedTest {
    constructor() {
        this.testBtn = document.getElementById('startTest');
        this.refreshBtn = document.getElementById('refreshHistory');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.statusMessage = document.getElementById('statusMessage');

        this.pingValue = document.getElementById('pingValue');
        this.downloadValue = document.getElementById('downloadValue');
        this.uploadValue = document.getElementById('uploadValue');

        this.pingCard = this.pingValue.closest('.result-card');
        this.downloadCard = this.downloadValue.closest('.result-card');
        this.uploadCard = this.uploadValue.closest('.result-card');

        this.chart = null;

        this.init();
    }

    init() {
        this.testBtn.addEventListener('click', () => this.runTest());
        this.refreshBtn.addEventListener('click', () => this.loadHistory());

        // Загружаем историю при старте
        this.loadHistory();

        // Добавляем анимацию при загрузке
        this.animateCards();
    }

    animateCards() {
        const cards = document.querySelectorAll('.result-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';

            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    async runTest() {
        this.setTestingState(true);
        this.clearResults();
        this.showStatus('Начинаем тест скорости...', 'info');

        try {
            // 1. Ping тест
            await this.updateProgress(10, 'Измеряем ping...');
            const ping = await this.testPing();
            this.updateResult(this.pingValue, this.pingCard, ping, 'мс', 50, 200);

            // 2. Download тест
            await this.updateProgress(40, 'Измеряем скорость скачивания...');
            const download = await this.testDownload();
            this.updateResult(this.downloadValue, this.downloadCard, download, 'Мбит/с', 10, 100);

            // 3. Upload тест
            await this.updateProgress(70, 'Измеряем скорость загрузки...');
            const upload = await this.testUpload();
            this.updateResult(this.uploadValue, this.uploadCard, upload, 'Мбит/с', 5, 50);

            // 4. Сохраняем результаты
            await this.updateProgress(90, 'Сохраняем результаты...');
            await this.saveResults(ping, download, upload);

            await this.updateProgress(100, 'Тест завершен!');
            this.showStatus('✅ Тест успешно завершен! Результаты сохранены.', 'success');

            // Обновляем историю
            setTimeout(() => this.loadHistory(), 1000);

        } catch (error) {
            console.error('Test error:', error);
            this.showStatus(`❌ Ошибка: ${error.message}`, 'error');
        } finally {
            this.setTestingState(false);
        }
    }

    async testPing() {
        let totalPing = 0;
        const measurements = 5;

        for (let i = 0; i < measurements; i++) {
            const start = performance.now();
            await fetch('/api/ping/');
            const end = performance.now();
            totalPing += (end - start);

            // Небольшая пауза между измерениями
            if (i < measurements - 1) {
                await this.sleep(100);
            }
        }

        return totalPing / measurements;
    }

    async testDownload() {
        const size = 2 * 1024 * 1024; // 2 MB
        const start = performance.now();

        try {
            const response = await fetch(`/api/download/?size=${size}`);

            // Читаем данные потоком для точного измерения
            const reader = response.body.getReader();
            let received = 0;

            while (true) {
                const {done, value} = await reader.read();
                if (done) break;
                received += value.length;
            }

            const end = performance.now();
            const duration = (end - start) / 1000; // секунды

            // Расчет: (байты * 8) / (секунды * 1000000)
            const speed = (size * 8) / (duration * 1000000);

            // Ограничиваем разумными значениями
            return Math.min(speed, 1000);

        } catch (error) {
            console.error('Download test failed:', error);
            return 0;
        }
    }

    async testUpload() {
        const size = 1 * 1024 * 1024; // 1 MB (меньше для стабильности)

        // Генерируем тестовые данные
        const data = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            data[i] = Math.floor(Math.random() * 256);
        }

        const start = performance.now();

        try {
            await fetch(`/api/upload/?start_time=${start}`, {
                method: 'POST',
                body: data,
                headers: {
                    'Content-Type': 'application/octet-stream'
                }
            });

            const end = performance.now();
            const duration = (end - start) / 1000;

            // Расчет скорости
            const speed = (size * 8) / (duration * 1000000);

            // Ограничиваем разумными значениями
            return Math.min(speed, 1000);

        } catch (error) {
            console.error('Upload test failed:', error);
            return 0;
        }
    }

    async saveResults(ping, download, upload) {
        const data = {
            ping: ping,
            download: download,
            upload: upload,
            server: 'local'
        };

        const response = await fetch('/api/save/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.status !== 'success') {
            throw new Error(result.message || 'Ошибка сохранения');
        }

        return result;
    }

    async loadHistory() {
        try {
            this.refreshBtn.disabled = true;
            this.refreshBtn.innerHTML = '<span class="loading"></span> Загрузка...';

            const response = await fetch('/api/history/?limit=10');
            const data = await response.json();

            this.updateHistoryTable(data.history);
            this.updateChart(data.history);

        } catch (error) {
            console.error('Error loading history:', error);
            this.showStatus('Ошибка загрузки истории', 'error');
        } finally {
            this.refreshBtn.disabled = false;
            this.refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Обновить историю';
        }
    }

    updateHistoryTable(history) {
        const tableBody = document.querySelector('#historyTable tbody');
        tableBody.innerHTML = '';

        if (history.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
                    История тестов пуста. Проведите первый тест!
                </td>
            `;
            tableBody.appendChild(row);
            return;
        }

        history.forEach(item => {
            const row = document.createElement('tr');

            const date = new Date(item.timestamp);
            const formattedDate = `
                ${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}
                ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}
            `;

            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${item.ping.toFixed(2)}</td>
                <td>${item.download.toFixed(2)}</td>
                <td>${item.upload.toFixed(2)}</td>
            `;

            tableBody.appendChild(row);
        });
    }

    updateChart(history) {
        const ctx = document.getElementById('speedChart').getContext('2d');

        // Сортируем по времени (старые -> новые)
        const sortedHistory = [...history].reverse();

        if (sortedHistory.length === 0) {
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }

            // Показываем сообщение, если нет данных
            const canvasContainer = document.querySelector('.chart-container');
            canvasContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">
                    <i class="fas fa-chart-line" style="font-size: 48px; margin-right: 15px;"></i>
                    <div>
                        <h3>Нет данных для графика</h3>
                        <p>Проведите тесты, чтобы увидеть историю</p>
                    </div>
                </div>
            `;
            return;
        }

        const labels = sortedHistory.map((item, index) => {
            const date = new Date(item.timestamp);
            return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        });

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Download (Мбит/с)',
                        data: sortedHistory.map(item => item.download),
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2
                    },
                    {
                        label: 'Upload (Мбит/с)',
                        data: sortedHistory.map(item => item.upload),
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Скорость (Мбит/с)',
                            color: '#666'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                }
            }
        });
    }

    updateResult(element, card, value, unit, goodThreshold, averageThreshold) {
        // Анимация счетчика
        this.animateCounter(element, value, 1000);

        // Обновляем класс карточки в зависимости от результата
        card.classList.remove('good', 'average', 'poor');

        if (value >= goodThreshold) {
            card.classList.add('good');
        } else if (value >= averageThreshold) {
            card.classList.add('average');
        } else {
            card.classList.add('poor');
        }

        // Добавляем анимацию
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = 'pulse 0.5s ease';
        }, 10);
    }

    animateCounter(element, targetValue, duration) {
        const startValue = parseFloat(element.textContent) || 0;
        const startTime = performance.now();

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Используем easing функцию для плавности
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (targetValue - startValue) * easeOutQuart;

            element.textContent = currentValue.toFixed(2);

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = targetValue.toFixed(2);
            }
        };

        requestAnimationFrame(updateCounter);
    }

    setTestingState(testing) {
        this.testBtn.disabled = testing;
        this.testBtn.innerHTML = testing
            ? '<span class="loading"></span> Тестирование...'
            : '<i class="fas fa-play"></i> Начать тест скорости';
    }

    async updateProgress(percent, text) {
        this.progressFill.style.width = `${percent}%`;
        this.progressText.textContent = text;

        // Плавная анимация
        this.progressFill.style.transition = 'width 0.5s ease';

        await this.sleep(300);
    }

    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = 'status-message';
        this.statusMessage.classList.add(`status-${type}`);
        this.statusMessage.style.display = 'block';

        // Автоматическое скрытие
        if (type === 'success') {
            setTimeout(() => {
                this.statusMessage.style.opacity = '0';
                this.statusMessage.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    this.statusMessage.style.display = 'none';
                    this.statusMessage.style.opacity = '1';
                }, 500);
            }, 5000);
        }
    }

    clearResults() {
        this.pingValue.textContent = '-';
        this.downloadValue.textContent = '-';
        this.uploadValue.textContent = '-';

        this.pingCard.classList.remove('good', 'average', 'poor');
        this.downloadCard.classList.remove('good', 'average', 'poor');
        this.uploadCard.classList.remove('good', 'average', 'poor');

        this.progressFill.style.width = '0%';
        this.progressFill.style.transition = 'none';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Добавляем стиль для анимации pulse
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    // Создаем экземпляр приложения
    window.speedTest = new SpeedTest();

    // Добавляем информацию о разработчике в консоль
    console.log('%c🚀 SpeedTest Pro', 'font-size: 20px; font-weight: bold; color: #4a6fa5;');
    console.log('%cКурсовая работа по разработке ПО', 'color: #666;');
    console.log('%chttps://github.com', 'color: #4a6fa5;');
});