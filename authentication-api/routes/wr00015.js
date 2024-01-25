const express = require('express');
const router = express.Router();
const removeUnwantedFields = require('../utilities/removeFields').removeUnwantedFields;


const tokenCheck = require('../middlewares/tokenCheck');

router.get('/', tokenCheck, async (req, res) => {
  try {
    const dbEngenharia = await req.app.locals.dbEngenhariaTest;
    const db = dbEngenharia.db('PreEngenharia');
    const collection = db.collection('WR00015');

    // Projeção para retornar apenas countLoggedUsers e totalUsers
    const projection = { countLoggedUsers: 1, totalUsers: 1, _id: 0 };
    const doc = await collection.findOne({}, { projection });

    if (doc) {
        res.json(doc);
    } else {
        res.status(404).json({ message: "Document not found" });
    }

  } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get('/loggedUsers', tokenCheck, async (req, res) => {
  try {
    const dbEngenharia = await req.app.locals.dbEngenhariaTest;
    const db = dbEngenharia.db('PreEngenharia');
    const collection = db.collection('WR00015');

    // Projeção para retornar apenas countLoggedUsers e totalUsers
    const projection = { loggedUsers: 1, _id: 0 };
    const doc = await collection.findOne({}, { projection });

    if (doc) {
        res.json(doc);
    } else {
        res.status(404).json({ message: "Document not found" });
    }

  } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get('/loggedUsers/:user', tokenCheck, async (req, res) => {
  try {
    const dbEngenharia = await req.app.locals.dbEngenhariaTest;
    const db = dbEngenharia.db('PreEngenharia');
    const collection = db.collection('WR00015');
    
    // Obter o nome de usuário da URL, se fornecido
    const userNameParam = req.params.user;

    if (userNameParam) {
      // Procurar no banco de dados pelo documento que contém o objeto 'usersHostnames'
      const doc = await collection.findOne({ "usersHostnames": { $exists: true } });

      if (doc && doc.usersHostnames && doc.usersHostnames[userNameParam]) {
        // Se o documento e o usuário existirem, retorne os dados do usuário
        const userLoginInfo = doc.usersHostnames[userNameParam];
        res.json({ [userNameParam]: userLoginInfo });
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


router.get('/loggedUsers/info/all', tokenCheck, async (req, res) => {
  try {
    const dbEngenharia = await req.app.locals.dbEngenhariaTest;
    const db = dbEngenharia.db('PreEngenharia');
    const collection = db.collection('WR00015');
    
    // Procurar no banco de dados pelo documento que contém o objeto 'usersHostnames'
    const doc = await collection.findOne({});

    if (doc && doc.usersHostnames) {
      const loggedUsers = {
        activeUsers:[doc.usersHostnames]
    }

      res.json(loggedUsers);
    } else {
      // Se não encontrar o documento ou o objeto 'usersHostnames', retorne uma mensagem de erro
      res.status(404).json({ message: "Document not found" });
    }
  } catch (error) {
    console.error('Error fetching user login information:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



module.exports = router;
