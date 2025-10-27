// js/main.js

// ИЗМЕНЕНИЕ: Мы полностью убрали строку 'import'

document.addEventListener('DOMContentLoaded', () => {
    // Получаем доступ к элементам на странице
    const connectButton = document.getElementById('connect-button');
    const logElement = document.getElementById('log');

    // Глобальные переменные для хранения состояния
    let device = null;
    let transport;
    let esploader;
    const BAUD_RATE = 115200;

    // Функция для вывода сообщений в поле логов
    const log = (message) => {
        logElement.textContent += message + '\n';
        logElement.scrollTop = logElement.scrollHeight;
    };
    
    const clearLogs = () => {
        logElement.textContent = '';
    }

    // Логика подключения/отключения
    connectButton.addEventListener('click', async () => {
        if (!esploader) {
            clearLogs();
            log('Ожидание выбора COM-порта пользователем...');
            try {
                device = await navigator.serial.requestPort({});
                // Теперь ESPTransport и ESPLoader доступны как глобальные переменные
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
});