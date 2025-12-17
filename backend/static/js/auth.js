// auth.js - Валидация и обработка форм авторизации
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация форм
    initAuthForms();
    initPasswordToggle();
    initFormAnimations();
});

function initAuthForms() {
    const forms = document.querySelectorAll('.auth-box form');

    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
                return false;
            }

            // Показываем индикатор загрузки
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<span class="loading-spinner"></span> Обработка...';
                submitBtn.disabled = true;
            }

            return true;
        });

        // Валидация в реальном времени
        const inputs = form.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });

            input.addEventListener('input', function() {
                clearFieldError(this);
            });
        });
    });
}

function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('.form-control[required]');

    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });

    // Проверка паролей на странице регистрации
    const password1 = document.getElementById('id_password1');
    const password2 = document.getElementById('id_password2');

    if (password1 && password2) {
        if (password1.value !== password2.value) {
            showFieldError(password2, 'Пароли не совпадают');
            isValid = false;
        }

        if (password1.value.length < 8) {
            showFieldError(password1, 'Пароль должен быть не менее 8 символов');
            isValid = false;
        }

        // Проверка сложности пароля
        if (!/[A-Z]/.test(password1.value) || !/[0-9]/.test(password1.value)) {
            showFieldError(password1, 'Пароль должен содержать заглавные буквы и цифры');
            isValid = false;
        }
    }

    // Проверка имени пользователя
    const username = document.getElementById('id_username');
    if (username) {
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username.value)) {
            showFieldError(username, 'Можно использовать только буквы, цифры и символ _');
            isValid = false;
        }

        if (username.value.length < 3) {
            showFieldError(username, 'Имя пользователя должно быть не менее 3 символов');
            isValid = false;
        }
    }

    return isValid;
}

function validateField(input) {
    const value = input.value.trim();

    if (!value && input.required) {
        showFieldError(input, 'Это поле обязательно для заполнения');
        return false;
    }

    if (input.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(input, 'Введите корректный email адрес');
            return false;
        }
    }

    clearFieldError(input);
    return true;
}

function showFieldError(input, message) {
    clearFieldError(input);
    input.classList.add('error');

    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.cssText = `
        color: #f44336;
        font-size: 12px;
        margin-top: 5px;
        padding: 5px;
        background: #ffebee;
        border-radius: 4px;
        border: 1px solid #ffcdd2;
    `;
    errorDiv.textContent = message;

    input.parentNode.appendChild(errorDiv);
}

function clearFieldError(input) {
    input.classList.remove('error');
    const existingError = input.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

function initPasswordToggle() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    passwordInputs.forEach(input => {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';

        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.innerHTML = '👁';
        toggleBtn.style.cssText = `
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            font-size: 18px;
            color: #666;
            padding: 5px;
        `;

        toggleBtn.addEventListener('click', function() {
            if (input.type === 'password') {
                input.type = 'text';
                this.innerHTML = '👁‍🗨';
            } else {
                input.type = 'password';
                this.innerHTML = '👁';
            }
        });

        wrapper.appendChild(toggleBtn);
    });
}

function initFormAnimations() {
    const authBox = document.querySelector('.auth-box');
    if (authBox) {
        authBox.style.opacity = '0';
        authBox.style.transform = 'translateY(20px)';

        setTimeout(() => {
            authBox.style.transition = 'all 0.5s ease';
            authBox.style.opacity = '1';
            authBox.style.transform = 'translateY(0)';
        }, 100);
    }

    // Анимация появления полей формы
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach((group, index) => {
        group.style.opacity = '0';
        group.style.transform = 'translateX(-10px)';

        setTimeout(() => {
            group.style.transition = `all 0.3s ease ${index * 0.1}s`;
            group.style.opacity = '1';
            group.style.transform = 'translateX(0)';
        }, 200);
    });
}

// CSS для индикатора загрузки
const style = document.createElement('style');
style.textContent = `
    .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #4a6fa5;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 8px;
        vertical-align: middle;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

document.head.appendChild(style);

// Обработка состояния авторизации
function updateAuthState() {
    // Проверяем, авторизован ли пользователь
    const isAuthenticated = document.querySelector('.user-info') !== null;

    // Если пользователь авторизован, показываем дополнительные элементы
    if (isAuthenticated) {
        // Например, показываем историю только для авторизованных
        const historySection = document.querySelector('.history-section');
        if (historySection) {
            historySection.style.display = 'block';
        }

        // Обновляем текст приветствия с анимацией
        const welcome = document.querySelector('.welcome');
        if (welcome) {
            welcome.style.opacity = '0';
            setTimeout(() => {
                welcome.style.transition = 'opacity 0.5s';
                welcome.style.opacity = '1';
            }, 100);
        }
    } else {
        // Для неавторизованных можно скрыть историю
        const historySection = document.querySelector('.history-section');
        if (historySection) {
            historySection.style.display = 'none';
        }
    }
}

// Проверяем состояние при загрузке
document.addEventListener('DOMContentLoaded', function() {
    updateAuthState();

    // Добавляем обработчики для кнопок входа/выхода
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            if (!confirm('Вы уверены, что хотите выйти?')) {
                e.preventDefault();
            }
        });
    }

    // Анимация появления кнопок авторизации
    const authButtons = document.querySelectorAll('.auth-btn');
    authButtons.forEach((btn, index) => {
        btn.style.opacity = '0';
        btn.style.transform = 'translateY(10px)';

        setTimeout(() => {
            btn.style.transition = `all 0.5s ease ${index * 0.1}s`;
            btn.style.opacity = '1';
            btn.style.transform = 'translateY(0)';
        }, 300);
    });
});