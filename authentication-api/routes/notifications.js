const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Configurações de conexão
const dbURI = "mongodb://172.16.10.244:27018/Warnings?authMechanism=DEFAULT&authSource=admin";
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  user: 'devs',
  pass: 'qwert12345'
};

const removeUnwantedFields = (doc) => {
  const transformedDoc = doc.toObject(); // Transforma o documento Mongoose em um objeto JavaScript simples
  delete transformedDoc._id;
  return transformedDoc;
};

router.get('/', async (req, res) => {
  try {
    // Criar uma nova conexão
    const conn = await mongoose.createConnection(dbURI, options);

    // Definir um modelo simples para a coleção
    const Notification = conn.model('Notification', new mongoose.Schema({}, { strict: false }), 'notifications');

    // Buscar documentos
    const docs = await Notification.find({});

    // Remove o campo _id dos documentos
    const transformedDocs = docs.map(removeUnwantedFields);

    res.json(transformedDocs);

    // Fechar a conexão após o uso
    conn.close();
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
