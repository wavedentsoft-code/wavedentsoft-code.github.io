import { ESPLoader, Transport } from "https://unpkg.com/esptool-js/bundle.js";

const connectButton = document.getElementById('connectButton');
const flashButton = document.getElementById('flashButton');
const firmwareInput = document.getElementById('firmwareInput');
const log = document.getElementById('log');

// --- Элементы управления для прошивки ---
// (можно добавить их в HTML, если нужно)
// const baudrateSelect = document.getElementById('baudrate');
// const eraseButton = document.getElementById('eraseButton');

let device = null;
let transport;
let chip = null;
let esploader;

// --- ПОЛНОЦЕННЫЙ ОБЪЕКТ ТЕРМИНАЛА ---
// Он включает все методы, которые ожидает библиотека
const term = {
    clean: () => {
        log.textContent = '';
    },
    write: (data) => {
        log.textContent += data;
        log.scrollTop = log.scrollHeight;
    },
    writeln: (data) => term.write(data + '\n'),
    hr: () => term.writeln('--------------------'),
};

connectButton.addEventListener('click', async () => {
    try {
        if (device === null) {
            device = await navigator.serial.requestPort({});
            transport = new Transport(device);
            term.writeln("Устройство подключено.");
        }
    } catch (err) {
        term.writeln(`Ошибка подключения: ${err}`);
    }
});

flashButton.addEventListener('click', async () => {
    if (firmwareInput.files.length === 0) {
        term.writeln("Ошибка: Сначала выберите файл прошивки.");
        return;
    }
    if (!transport) {
        term.writeln("Ошибка: Сначала подключите устройство.");
        return;
    }

    // Очищаем лог перед новой прошивкой
    term.clean();
    term.writeln("Подготовка к прошивке...");

    try {
        esploader = new ESPLoader({
            transport,
            baudrate: 115200, // или parseInt(baudrateSelect.value),
            terminal: term,
        });

        // Этот вызов важен для синхронизации с чипом
        const chipType = await esploader.main_fn();
        chip = esploader.chip.CHIP_NAME;
        term.writeln(`Чип определен: ${chip} (${chipType})`);

        const file = firmwareInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            const fileData = e.target.result;
            term.writeln(`Файл ${file.name} прочитан (размер: ${fileData.byteLength} байт).`);

            try {
                await esploader.write_flash(
                    [{ data: fileData, address: 0x1000 }],
                    '0x0', // flash size offset
                    undefined, // flash mode
                    undefined, // flash freq
                    false, // erase all
                    true, // compress
                    (fileIndex, written, total) => {
                        // Эта функция будет обновлять прогресс, если вы захотите добавить progress bar
                        const progress = Math.round((written / total) * 100);
                        // console.log(`Прошивка файла ${fileIndex}: ${progress}%`);
                    }
                );
                term.writeln("\nПрошивка успешно завершена!");
                term.writeln("Перезагрузка устройства...");
                await esploader.hard_reset();
            } catch (err) {
                term.writeln(`\nОшибка во время прошивки: ${err}`);
            }
        };

        reader.readAsArrayBuffer(file);

    } catch (err) {
        term.writeln(`Ошибка: ${err}`);
    }
});