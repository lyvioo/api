const express = require('express');
const router = express.Router();
const fs = require('fs');

const removeIdField = (doc) => {
    delete doc._id;
    return doc;
};

// Certifique-se de que todos os middlewares específicos para este roteador estejam aqui, se houver.
const checkAPIKey = require('../middlewares/checkAPIKey');
const checkUserAgent = require('../middlewares/checkUserAgent');

// Use seus middlewares
router.use(checkAPIKey);
router.use(checkUserAgent);

router.get('/', async (req, res) => {
    const result = {};
    const errorLog = [];
  
    const collections = req.osType === 'Linux' ?
      {
        inventoryModule: 'LinuxInventoryModule',
        productivityModule: 'LinuxProductivityModule',
        securityModule: 'LinuxSecurityModule'
      } :
      req.osType === 'Windows' ?
        {
          inventoryModule: 'InventoryModule',
          productivityModule: 'ProductivityModule',
          securityModule: 'SecurityModule'
        } :
        {};
  
    // Usando a conexão armazenada em app.locals.dbQuerys
    const client = await req.app.locals.dbQuerys;  // Obtenha o cliente
    const db = client.db('querys_test');  // Especifique o banco de dados aqui

    for (const [key, value] of Object.entries(collections)) {
      try {
        const dataModule = await db.collection(value).find().toArray();
        if (dataModule.length > 0) {
          result[key] = dataModule.map(removeIdField);
        }
      } catch (err) {
        console.error(`Error fetching ${key}:`, err);
        errorLog.push(`${err.message}`);
      }
    }
  
    if (errorLog.length > 0) {
      const logMessage = errorLog.join('\n');
      fs.appendFileSync('./logs/log.txt', `${new Date().toISOString()} ${logMessage}\n`, 'utf8');
    }

    // Obtendo o IP e o hostname da requisição
    const clientIp = req.ip;
    const clientHostname = req.headers['client-hostname']; 

    // Criando um objeto com os dados que você quer salvar
    const requestData = {
        ip: clientIp,
        hostname: clientHostname,
        timestamp: new Date().toISOString() 
    };

    // Lendo o arquivo JSON existente
    fs.readFile('./logs/requests.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            return;
        }

        // Convertendo o conteúdo do arquivo para um objeto JavaScript
        const requests = JSON.parse(data || '[]');

        // Verificando se o hostname já existe no array
        const existingRequest = requests.find(req => req.hostname === clientHostname);

        if (existingRequest) {
            // Se o hostname já existir, atualize o IP e o timestamp
            existingRequest.ip = clientIp;
            existingRequest.timestamp = new Date().toISOString();
        } else {
            // Se o hostname não existir, adicione os novos dados ao array
            requests.push(requestData);
        }

        // Convertendo o objeto de volta para uma string JSON e salvando no arquivo
        fs.writeFile('./logs/requests.json', JSON.stringify(requests, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Error writing file:', err);
            }
        });
    });
  
    return res.json(result);
});

module.exports = router;
