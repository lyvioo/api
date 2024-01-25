const crypto = require('crypto');

function generateSHA512(password) {
    const hash = crypto.createHash('sha512');
    hash.update(password);
    return hash.digest('hex');
}

module.exports = {
    generateSHA512
};