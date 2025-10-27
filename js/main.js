// js/main.js

// ИЗМЕНЕНИЕ: Мы используем правильную ссылку на МОДУЛЬНУЮ версию библиотеки
import { ESPLoader, ESPTransport } from 'https://cdn.jsdelivr.net/npm/esptool-js@0.2.0/dist/bundle.module.js';

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