const express = require('express');
const router = express.Router();
const multer = require('multer');
const tokenCheck = require('../middlewares/tokenCheck');
const adminCheck = require('../middlewares/adminCheck');
const appendLog = require('../utilities/log').appendLog;
const removeUnwantedFields = require('../utilities/removeFields').removeUnwantedFields;


// Configuração de armazenamento na memória com Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const sharp = require('sharp');  // Importe o pacote sharp no topo do seu arquivo

router.post('/imgupload', tokenCheck, adminCheck, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Image is required." });
        }

        const imageBuffer = req.file.buffer;

        // Obtenha as dimensões da imagem
        const metadata = await sharp(imageBuffer).metadata();        

        if (imageBuffer.length > 5 * 1024 * 1024) {
            return res.status(400).json({ message: "The image is very large. Please upload an image of maximum 5MB." });
        }

        if (req.file.mimetype !== 'image/jpeg' && req.file.mimetype !== 'image/png') {
            return res.status(400).json({ message: "The image must be in JPEG or PNG format." });
        }
        

        const client = await req.app.locals.dbEngenhariaTest;
        const db = client.db('frontConfig');
        const collection = db.collection('Logo');

        // Atualize ou insira o documento com a imagem
        await collection.updateOne(
            { _id: "companyLogo" },
            { $set: { image: imageBuffer } },
            { upsert: true }
        );

        // Resposta de sucesso
        res.status(201).json({ message: "Image uploaded successfully." });

        const login = req.login
        appendLog(login, "Changed the company logo");

    } catch (error) {
        console.error('Error during image upload:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});



router.get('/imgview', tokenCheck, async (req, res) => {
    try {
        // Usando a conexão já estabelecida de app.locals
        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const db = dbEngenharia.db('frontConfig');
        const collection = db.collection('Logo');
  
        const doc = await collection.findOne({});
  
        if (doc) {
            const modifiedDoc = removeUnwantedFields(doc);
            res.json(modifiedDoc);
        } else {
            res.status(404).json({ message: "Document not found" });
        }
  
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  });

module.exports = router;
