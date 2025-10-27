// js/main.js

// ИЗМЕНЕНИЕ ЗДЕСЬ: Импортируем нужные классы из библиотеки по URL
import { ESPLoader, ESPTransport } from 'https://cdn.jsdelivr.net/npm/esptool-js@0.2.0/bundle.js';

// Код внутри DOMContentLoaded теперь не нужен, так как модули по умолчанию
// исполняются после загрузки страницы (аналогично defer).

// Получаем доступ к элементам на странице
const connectButton = document.getElementById('connect-button');
const logElement = document.getElementById('log');

// Глобальные переменные для хранения состояния
let device = null;
let transport;
let esploader;
const BAUD_RATE = 115200; // Ваша скорость, заданная жестко

// Функция для вывода сообщений в поле логов
const log = (message) => {
    logElement.textContent += message + '\n';
    logElement.scrollTop = logElement.scrollHeight; // Автопрокрутка вниз
};

// Очистка логов
const clearLogs = () => {
    logElement.textContent = '';
}

// Логика подключения/отключения
connectButton.addEventListener('click', async () => {
    // Если устройство не подключено, начинаем подключение
    if (!esploader) {
        clearLogs();
        log('Ожидание выбора COM-порта пользователем...');
        try {
            device = await navigator.serial.requestPort({});
            // Теперь ESPTransport будет определен, так как мы его импортировали
            transport = new ESPTransport(device); 

            log(`Подключаемся со скоростью ${BAUD_RATE}...`);
            esploader = new ESPLoader(transport, BAUD_RATE, null, (msg) => log(msg));

            await esploader.main_fn();

            log('Подключение успешно установлено!');
            log(`Чип: ${esploader.chip.name}`);
            log(`MAC-адрес: ${esploader.chip.mac}`);

            connectButton.textContent = 'Отключиться';
            connectButton.classList.replace('btn-primary', 'btn-danger');

        } catch (e) {
            log(`[ОШИБКА] ${e.message}`);
            if (transport) {
                await transport.disconnect();
            }
            device = null;
            transport = null;
            esploader = null;
        }
    } else {
        // Если устройство уже было подключено, отключаемся
        log('Отключение...');
        try {
            await transport.disconnect();
            log('Устройство отключено.');
        } catch (e) {
            log(`[ОШИБКА ПРИ ОТКЛЮЧЕНИИ] ${e.message}`);
        } finally {
            device = null;
            transport = null;
            esploader = null;
            connectButton.textContent = 'Подключиться к устройству';
            connectButton.classList.replace('btn-danger', 'btn-primary');
        }
    }
});