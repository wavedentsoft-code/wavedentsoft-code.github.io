import { ESPLoader, Transport } from "https://unpkg.com/esptool-js/bundle.js";

const connectButton = document.getElementById('connectButton');
const flashButton = document.getElementById('flashButton');
const firmwareInput = document.getElementById('firmwareInput');
const log = document.getElementById('log');

let device = null;
let transport;
let chip = null;
let esploader;

// --- ОБЪЕКТ ТЕРМИНАЛА С ПРАВИЛЬНЫМ ИМЕНЕМ МЕТОДА ---
const term = {
    clean: () => {
        log.textContent = '';
    },
    write: (data) => {
        log.textContent += data;
        log.scrollTop = log.scrollHeight;
    },
    // *** ИСПРАВЛЕНИЕ ЗДЕСЬ: writeln -> writeLine ***
    writeLine: (data) => term.write(data + '\n'),
    hr: () => term.writeLine('--------------------'),
};

connectButton.addEventListener('click', async () => {
    try {
        if (device === null) {
            device = await navigator.serial.requestPort({});
            transport = new Transport(device);
            term.writeLine("Устройство подключено.");
        }
    } catch (err) {
        term.writeLine(`Ошибка подключения: ${err}`);
    }
});

flashButton.addEventListener('click', async () => {
    if (firmwareInput.files.length === 0) {
        term.writeLine("Ошибка: Сначала выберите файл прошивки.");
        return;
    }
    if (!transport) {
        term.writeLine("Ошибка: Сначала подключите устройство.");
        return;
    }

    term.clean();
    term.writeLine("Подготовка к прошивке...");

    try {
        esploader = new ESPLoader({
            transport,
            baudrate: 115200,
            terminal: term,
        });

        const chipType = await esploader.main_fn();
        chip = esploader.chip.CHIP_NAME;
        term.writeLine(`Чип определен: ${chip} (${chipType})`);

        const file = firmwareInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            const fileData = e.target.result;
            term.writeLine(`Файл ${file.name} прочитан (размер: ${fileData.byteLength} байт).`);

            try {
                await esploader.write_flash(
                    [{ data: fileData, address: 0x1000 }],
                    '0x0', 
                    undefined,
                    undefined,
                    false,
                    true,
                    (fileIndex, written, total) => {
                        const progress = Math.round((written / total) * 100);
                        // Вы можете использовать это для обновления progress bar в HTML
                    }
                );
                term.writeLine("\nПрошивка успешно завершена!");
                term.writeLine("Перезагрузка устройства...");
                await esploader.hard_reset();
            } catch (err) {
                term.writeLine(`\nОшибка во время прошивки: ${err}`);
            }
        };

        reader.readAsArrayBuffer(file);

    } catch (err) {
        term.writeLine(`Ошибка: ${err}`);
    }
});