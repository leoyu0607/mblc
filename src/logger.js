const fs = require("fs");

function formatTime(d = new Date()) {
    const pad = (n, w = 2) => String(n).padStart(w, "0");

    return (
        `${d.getFullYear()}-` +
        `${pad(d.getMonth() + 1)}-` +
        `${pad(d.getDate())} ` +
        `${pad(d.getHours())}:` +
        `${pad(d.getMinutes())}:` +
        `${pad(d.getSeconds())}.` +
        `${pad(d.getMilliseconds(), 3)}`
    );
}


function initLogger(logFilePath) {
    const stream = fs.createWriteStream(logFilePath, { flags: "a" });

    return {
        info: (...args) => {
            console.log(...args);
            stream.write(
                `${formatTime()} [INFO]  ${args.join(" ")}\n`
            );
        },
        error: (...args) => {
            console.log(...args);
            stream.write(
                `${formatTime()} [ERROR] ${args.join(" ")}\n`
            );
        },
        debug: (...args) => {
            console.log(...args);
            stream.write(
                `${formatTime()} [DEBUG] ${args.join(" ")}\n`
            );
        }
    };
}

module.exports = { initLogger };