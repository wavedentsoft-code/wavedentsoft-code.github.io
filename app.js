// Импортируем ESPLoader и Transport из библиотеки
import { ESPLoader, Transport } from "https://unpkg.com/esptool-js/bundle.js";

const connectButton = document.getElementById('connectButton');
const flashButton = document.getElementById('flashButton');
const firmwareInput = document.getElementById('firmwareInput');
const log = document.getElementById('log');

let device;
let transport;
let esploader;

// Объект терминала для вывода логов
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
        // *** ГЛАВНОЕ ИСПРАВЛЕНИЕ ЗДЕСЬ ***
        // Все параметры передаются внутри одного объекта
        esploader = new ESPLoader({
            transport: transport,
            baudrate: 115200,
            terminal: term // Свойство должно называться 'terminal'
        });

        // Подключаемся к чипу (этот шаг был пропущен)
        await esploader.main_fn();
        await esploader.flash_id();

        const firmwareFile = firmwareInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            const file_data = e.target.result;
            term.writeln('Файл прочитан. Начинаю прошивку...');
            
            const flashOptions = {
                fileArray: [{ data: file_data, address: 0x1000 }],
                flashSize: "keep",
                flashMode: "keep",
                flashFreq: "keep",
                eraseAll: false,
                compress: true,
            };
            
            await esploader.write_flash(flashOptions);

            term.writeln('\nПрошивка успешно завершена!');
            await esploader.hard_reset();
        };
        
        reader.readAsArrayBuffer(firmwareFile);

    } catch (error) {
        term.writeln(`\nОшибка прошивки: ${error.message}`);
    }
});