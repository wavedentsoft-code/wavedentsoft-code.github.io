// Импортируем ESPLoader и Transport из библиотеки
import { ESPLoader, Transport } from "https://unpkg.com/esptool-js/bundle.js";

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
            // Создаем экземпляр Transport, как того требует библиотека
            transport = new Transport(device); 
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
        // Передаем объект transport и нашу функцию для логов
        esploader = new ESPLoader(transport, 115200, term);

        const firmwareFile = firmwareInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            const file_data = e.target.result;
            term.writeln('Файл прочитан. Начинаю прошивку...');
            
            // Адрес прошивки и данные
            const flashOptions = {
                fileArray: [{ data: file_data, address: 0x1000 }],
                flashSize: "keep",
                flashMode: "keep",
                flashFreq: "keep",
                eraseAll: false,
                compress: true,
            };
            
            // Вызываем функцию прошивки
            await esploader.write_flash(flashOptions);

            term.writeln('\nПрошивка успешно завершена!');
            await esploader.hard_reset();
        };
        
        // Читаем файл как ArrayBuffer, это более надежный способ
        reader.readAsArrayBuffer(firmwareFile);

    } catch (error) {
        term.writeln(`\nОшибка прошивки: ${error.message}`);
    }
});