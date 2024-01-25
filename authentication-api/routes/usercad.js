const express = require('express');
const router = express.Router();
const generateSHA512 = require('../utilities/passwdHash').generateSHA512;
const tokenCheck = require('../middlewares/tokenCheck');
const adminCheck = require('../middlewares/adminCheck');
const { appendLog } = require('../utilities/log');

router.post('/', tokenCheck, adminCheck, async (req, res) => {
    try {
      const { login, name, passwd, email, role, timezone } = req.body;
  
      if (!login || !passwd || !email || !role || !name || !timezone) {
        return res.status(400).json({ message: "All fields (login, name, passwd, email, role, timezone) are required." });
      }
  
      const client = await req.app.locals.dbEngenhariaTest;
      const db = client.db('Users');
      const collection = db.collection('userCad');
  
      const existingUser = await collection.findOne({ login });
      if (existingUser) {
        return res.status(400).json({ message: "User with this login already exists." });
      }
  
      // Use a função de hash para gerar o hash da senha fornecida
      const hashedPassword = generateSHA512(passwd);
  
      // Crie o documento do usuário com o login, senha (hashed) e timezone
      await collection.insertOne({ login, name, role, email, passwd: hashedPassword, timezone });
  
      // Resposta de sucesso
      res.status(201).json({ message: "User registered successfully." });
      appendLog(req.login, `Registered new user: ${login}`);
    } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  

module.exports = router;
