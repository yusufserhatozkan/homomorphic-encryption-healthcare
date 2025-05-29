import express, { json } from "express";
import cors from "cors";
import SEAL from "node-seal";
import { log } from "./logger.js";

const app = express();
app.use(cors());
app.use(json({ limit: "50mb" }));

// Middleware logger
app.use((req, res, next) => {
  log("Request", `${req.method} ${req.originalUrl}`);
  next();
});

let seal;
let context, evaluator;

(async () => {
  seal = await SEAL();

  const schemeType = seal.SchemeType.bfv;
  const parms = seal.EncryptionParameters(schemeType);
  parms.setPolyModulusDegree(4096);
  parms.setCoeffModulus(seal.CoeffModulus.Create(4096, Int32Array.from([36, 36, 37])));
  parms.setPlainModulus(seal.PlainModulus.Batching(4096, 20));

  context = seal.Context(parms, true, seal.SecurityLevel.tc128);
  evaluator = seal.Evaluator(context);

  log("Startup", "SEAL initialized on server");
})();

app.post("/api/add", (req, res) => {
  const start = Date.now();
  log("Add", "Received encrypted addition request");

  try {
    const { cipher1Base64, cipher2Base64, publicKeyBase64 } = req.body;

    // Load the client's public key
    const publicKey = seal.PublicKey();
    publicKey.load(context, publicKeyBase64);

    // Create encryptor with client's public key
    const encryptor = seal.Encryptor(context, publicKey);

    const cipher1 = seal.CipherText();
    const cipher2 = seal.CipherText();

    cipher1.load(context, cipher1Base64);
    cipher2.load(context, cipher2Base64);

    log("Add", "Ciphertexts loaded successfully");

    const result = seal.CipherText();
    evaluator.add(cipher1, cipher2, result);
    log("Add", "Homomorphic addition performed");

    const duration = Date.now() - start;
    log("Add", `Homomorphic addition completed in ${duration}ms`);

    res.json({ encryptedResult: result.save() });
  } catch (err) {
    log("Error", `Homomorphic addition failed: ${err.message}`);
    res.status(500).json({ error: "Homomorphic addition failed" });
  }
});

const PORT = process.env.PORT || 18080;
app.listen(PORT, () => {
  log("Startup", `Server listening on http://localhost:${PORT}`);
});
