// js/main.js

// ИЗМЕНЕНИЕ 1: Мы импортируем не { отдельные, части }, а ОДИН объект `esptool` по умолчанию.
import esptool from './esptool.js';

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
};

connectButton.addEventListener('click', async () => {
    if (!esploader) {
        clearLogs();
        log('Ожидание выбора COM-порта пользователем...');
        try {
            device = await navigator.serial.requestPort({});
            
            // ИЗМЕНЕНИЕ 2: Используем esptool.ESPTransport
            transport = new esptool.ESPTransport(device);
            
            // ИЗМЕНЕНИЕ 3: Используем esptool.ESPLoader
            esploader = new esptool.ESPLoader(transport, BAUD_RATE, null, (msg) => log(msg));

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