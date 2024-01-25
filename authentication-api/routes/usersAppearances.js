
const express = require('express');
const router = express.Router();
const tokenCheck = require('../middlewares/tokenCheck');

router.get('/:user?', tokenCheck, async (req, res) => {
  try {
    const dbEngenharia = await req.app.locals.dbEngenhariaTest;
    const db = dbEngenharia.db('PreEngenharia');
    const collection = db.collection('usersAppearances');
    
    // Obter o nome de usuário da URL, se fornecido, e converter para maiúsculas
    const user = req.params.user ? req.params.user : null;

    if (user) {
      // Procurar no banco de dados pelo documento que contém o objeto 'userLogins'
      const doc = await collection.findOne({ "documentId": "userLoginsList" });
      
      if (doc && doc.userLogins && doc.userLogins[user]) {
          // Se o documento e o usuário existirem, retorne as aparições do usuário
          const responseObj = {
            [user]: doc.userLogins[user]
        };
          res.json(responseObj);
      } else {
          // Se não encontrar o usuário, retorne uma mensagem de erro
          res.status(404).json({ message: "User not found" });
      }
    } else {
      // Se nenhum usuário foi fornecido, retorne uma mensagem de erro
      res.status(400).json({ message: "No user specified" });
    }

  } catch (error) {
      console.error('Error fetching user logins:', error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
