// Импортируем ESPLoader из библиотеки
import { ESPLoader } from "https://unpkg.com/esptool-js/bundle.js";

const connectButton = document.getElementById('connectButton');
const flashButton = document.getElementById('flashButton');
const firmwareInput = document.getElementById('firmwareInput');
const log = document.getElementById('log');

let device;
let transport;
let esploader;

// Функция для вывода логов в текстовое поле на странице
const term = {
    write: (msg) => {
        log.textContent += msg;
        log.scrollTop = log.scrollHeight; // Автопрокрутка
    },
    writeln: (msg) => term.write(msg + '\n'),
};

connectButton.addEventListener('click', async () => {
    try {
        if (!device) {
            device = await navigator.serial.requestPort({});
            transport = {
                device: device,
                // Свойство slip_reader_enabled должно быть true для правильной работы
                slip_reader_enabled: true 
            };
            term.writeln('Устройство подключено.');
        }
    } catch (error) {
        term.writeln(`Ошибка подключения: ${error.message}`);
    }
});

flashButton.addEventListener('click', async () => {
    if (!transport) {
        term.writeln('Сначала подключите устройство.');
        return;
    }

    if (firmwareInput.files.length === 0) {
        term.writeln('Выберите файл прошивки.');
        return;
    }

    try {
        esploader = new ESPLoader({
            transport: transport,
            baudrate: 115200,
            romBaudrate: 115200,
            log: term.writeln, // Используем нашу функцию для логов
        });

        const firmwareFile = firmwareInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            const file_data = e.target.result;
            term.writeln('Файл прочитан. Начинаю прошивку...');
            
            await esploader.main_fn('write_flash', {
                '0x1000': file_data,
            });

            term.writeln('\nПрошивка успешно завершена!');
            await esploader.hard_reset();
        };
        
        reader.readAsBinaryString(firmwareFile);

    } catch (error) {
        term.writeln(`\nОшибка прошивки: ${error.message}`);
    }
});