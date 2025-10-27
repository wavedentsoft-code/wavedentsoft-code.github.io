const connectButton = document.getElementById('connectButton');
const flashButton = document.getElementById('flashButton');
const firmwareInput = document.getElementById('firmwareInput');
const log = document.getElementById('log');

let device;

connectButton.addEventListener('click', async () => {
    try {
        device = await navigator.serial.requestPort();
        await device.open({ baudRate: 115200 });
        log.textContent += 'Устройство подключено.\n';
    } catch (error) {
        log.textContent += `Ошибка подключения: ${error.message}\n`;
    }
});

flashButton.addEventListener('click', async () => {
    if (!device) {
        log.textContent += 'Сначала подключите устройство.\n';
        return;
    }

    if (firmwareInput.files.length === 0) {
        log.textContent += 'Выберите файл прошивки.\n';
        return;
    }

    const firmwareFile = firmwareInput.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
        const firmware = e.target.result;
        const esptool = new ESPLoader({
            transport: {
                device: device,
            },
            baudrate: 115200,
            romBaudrate: 115200,
        });

        try {
            await esptool.main_fn('write_flash', {
                '0x1000': firmware,
            });
            log.textContent += 'Прошивка успешно завершена.\n';
        } catch (error) {
            log.textContent += `Ошибка прошивки: ${error.message}\n`;
        }
    };
    reader.readAsBinaryString(firmwareFile);
});