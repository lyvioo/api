const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const generateSHA512 = require("../utilities/passwdHash").generateSHA512;
const { authenticateAD } = require("../middlewares/adCheck");
const appendLog = require("../utilities/log").appendLog;
const SECRET_KEY = process.env.TOKEN;

router.use(cookieParser());

const allowedOrigins = [
  "guwaro.domain",
  "172.16.10.244",
  "http://172.16.10.244:3010",
  "https://172.16.10.244:3010",
  "http://172.16.10.244",
  "https://172.16.10.244",
];

router.post("/", async (req, res) => {
  const { login, passwd, useAd } = req.body;

  // Identificar o domínio da solicitação
  const requestDomain = req.hostname;
  let cookieDomain;
  if (requestDomain === "localhost" || requestDomain === "localhost") {
    cookieDomain = requestDomain;
  } else {
    // Definir um domínio padrão ou tratar como erro
    cookieDomain = "localhost"; // Ou tratar como erro
  }

  if (useAd) {
    try {
      const authResult = await authenticateAD(login, passwd);
      const jwtPayload = {
        login: login,
        isAdUser: true,
      };
      const userData = {
        name: authResult.displayName,
        role: "admin",
      };
      const token = jwt.sign(jwtPayload, SECRET_KEY, { expiresIn: "3h" });

      res.cookie("accessToken", token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        domain: cookieDomain,
      });
      res.cookie("userData", JSON.stringify(userData), {
        secure: true,
        sameSite: "None",
        domain: cookieDomain,
      });

      res.status(authResult.status).json({ message: authResult.message });
      appendLog(login, `Successful login via AD`);
    } catch (error) {
      console.error("AD authentication error:", error);
      res.status(500).json({ message: "Internal Server Error" });
      appendLog(login, "Failed login, internal error");
    }
  } else {
    try {
      const dbEngenharia = await req.app.locals.dbEngenhariaTest;
      const db = dbEngenharia.db("Users");
      const collection = db.collection("userCad");
      const userDoc = await collection.findOne({ login: login });

      if (userDoc) {
        const hashedPassword = generateSHA512(passwd);
        if (hashedPassword === userDoc.passwd) {
          const jwtPayload = {
            login: userDoc.login,
            isAdUser: false,
          };
          const userData = {
            name: userDoc.name,
            role: userDoc.role,
            email: userDoc.email,
            timezone: userDoc.timezone,
            isAdUser: false,
          };
          const token = jwt.sign(jwtPayload, SECRET_KEY, { expiresIn: "3h" });

          res.cookie("accessToken", token, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            domain: cookieDomain,
          });
          res.cookie("userData", JSON.stringify(userData), {
            secure: true,
            sameSite: "None",
            domain: cookieDomain,
          });

          res.status(200).json({ message: "Authentication successful" });
          appendLog(login, "Successful login");
        } else {
          res.status(401).json({ message: "Invalid login or password" });
          appendLog(login, "Failed login, reason: Incorrect password");
        }
      } else {
        res.status(403).json({ message: "User not found" });
        appendLog(login, "Failed login, reason: User not found");
      }
    } catch (error) {
      console.error("Error during authentication:", error);
      res.status(500).json({ message: "Internal Server Error" });
      appendLog(login, "Failed login, internal error");
    }
  }
});

module.exports = router;
