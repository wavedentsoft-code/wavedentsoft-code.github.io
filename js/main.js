// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const connectButton = document.getElementById('connect-button');
    const logElement = document.getElementById('log');

    let device = null;
    let transport;
    let esploader;
    const BAUD_RATE = 115200;

    const log = (message) => {
        logElement.textContent += message + '\n';
        logElement.scrollTop = logElement.scrollHeight;
    };
    
    const clearLogs = () => {
        logElement.textContent = '';
    }

    connectButton.addEventListener('click', async () => {
        if (!esploader) {
            clearLogs();
            log('Ожидание выбора COM-порта пользователем...');
            try {
                device = await navigator.serial.requestPort({});
                // Теперь ESPLoader и ESPTransport 100% будут доступны,
                // так как они создаются локальным файлом esptool.js
                transport = new ESPTransport(device);
                esploader = new ESPLoader(transport, BAUD_RATE, null, (msg) => log(msg));

                log('Подключение к устройству...');
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
                esploader = null;
                connectButton.textContent = 'Подключиться к устройству';
                connectButton.classList.replace('btn-danger', 'btn-primary');
            }
        }
    });
});