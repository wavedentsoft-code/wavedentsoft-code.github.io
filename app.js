// Импортируем ESPLoader из библиотеки
import { ESPLoader } from "https://unpkg.com/esptool-js@0.3.0/bundle.js";

const connectButton = document.getElementById('connectButton');
const flashButton = document.getElementById('flashButton');
const firmwareInput = document.getElementById('firmwareInput');
const log = document.getElementById('log');

// В esptool-js 0.3.0 для подключения нужен объект Transport
let device, transport;

connectButton.addEventListener('click', async () => {
    try {
        device = await navigator.serial.requestPort({});
        transport = new ESPLoader.Transport(device);
        log.textContent += 'Устройство подключено.\n';
    } catch (error) {
        log.textContent += `Ошибка подключения: ${error.message}\n`;
    }
});

flashButton.addEventListener('click', async () => {
    if (!transport) {
        log.textContent += 'Сначала подключите устройство.\n';
        return;
    }

    if (firmwareInput.files.length === 0) {
        log.textContent += 'Выберите файл прошивки.\n';
        return;
    }
    
    // Функция для вывода логов
    const logProgress = (msg) => {
        log.textContent += msg + '\n';
        // Прокрутка вниз
        log.scrollTop = log.scrollHeight;
    };

    try {
        const esploader = new ESPLoader(transport, 115200, logProgress);
        
        // Чтение файла
        const firmwareFile = firmwareInput.files[0];
        const reader = new FileReader();
        reader.onload = async (e) => {
            const firmware = e.target.result;
            log.textContent += 'Файл прочитан. Начинаю прошивку...\n';
            
            // Прошивка
            await esploader.write_flash(
                [{ data: firmware, address: 0x1000 }],
                '0x1000',
                () => {}, // progress callback
                () => {}, // written callback
                false,   // no-stub
                (chip) => {
                    log.textContent += `Чип: ${chip}\n`;
                }
            );
            log.textContent += 'Прошивка успешно завершена.\n';
            await esploader.hard_reset();
        };
        reader.readAsArrayBuffer(firmwareFile);

    } catch (error) {
        log.textContent += `\nОшибка прошивки: ${error.message}\n`;
    }
});