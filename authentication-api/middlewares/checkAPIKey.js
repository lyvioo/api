const apikey = process.env.APIKEY;
const fs = require('fs');
const { getCurrentDateTime } = require('../utilities/currentDateTime');
 // Supondo que você tenha movido a função `getCurrentDateTime` para um arquivo utilities.js

module.exports = (req, res, next) => {
  const apiKey = req.headers['api-key'];
  const clientIP = req.ip;
  
  if (apiKey !== apikey) {
    const errorMessage = `${getCurrentDateTime()} ip connection ${clientIP} refused, invalid api key\n`;
    fs.appendFileSync('./logs/log.txt', errorMessage, 'utf8');
    return res.status(401).json({ message: 'Invalid API Key' });
  }
  next();
};

