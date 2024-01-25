const fs = require('fs');
const path = require('path');

function appendLog(user, message) {
    const logDirectory = path.join(__dirname, '../logs');
    const logFilePath = path.join(logDirectory, 'frontLog.json');
    
    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp: timestamp,
        user: user,
        message: message
    };

    const logMessage = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFilePath, logMessage, 'utf8');
}

module.exports = {
    appendLog
}
