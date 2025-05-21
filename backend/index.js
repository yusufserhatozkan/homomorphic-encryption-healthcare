import express, { json } from "express";
import cors from "cors";
import SEAL from "node-seal";
import { log } from "./logger.js"; // Adjust path as needed

const app = express();
app.use(cors());
app.use(json({ limit: "50mb" }));

// Middleware logger
app.use((req, res, next) => {
  log("Request", `${req.method} ${req.originalUrl}`);
  next();
});

let seal;
let context, evaluator, encryptor, decryptor, encoder;
let publicKeyBase64, secretKeyBase64, parmsBase64;

(async () => {
  seal = await SEAL();

  const schemeType = seal.SchemeType.bfv;
  const parms = seal.EncryptionParameters(schemeType);
  parms.setPolyModulusDegree(4096);
  parms.setCoeffModulus(seal.CoeffModulus.Create(4096, Int32Array.from([36, 36, 37])));
  parms.setPlainModulus(seal.PlainModulus.Batching(4096, 20));

  context = seal.Context(parms, true, seal.SecurityLevel.tc128);
  evaluator = seal.Evaluator(context);
  encoder = seal.BatchEncoder(context);

  const keyGenerator = seal.KeyGenerator(context);
  const secretKey = keyGenerator.secretKey();
  const publicKey = keyGenerator.createPublicKey();

  encryptor = seal.Encryptor(context, publicKey);
  decryptor = seal.Decryptor(context, secretKey);

  parmsBase64 = parms.save();
  publicKeyBase64 = publicKey.save();
  secretKeyBase64 = secretKey.save(); // Keep secret!

  log("Startup", "SEAL initialized on server");
})();

app.get("/api/seal-params", (req, res) => {
  if (!seal) {
    return res.status(503).json({ error: "SEAL not initialized yet" });
  }

  log("Params", "Sending encryption parameters and public key");
  res.json({ parms: parmsBase64, publicKey: publicKeyBase64 });
});

app.post("/api/add", (req, res) => {
  const start = Date.now();
  log("Add", "Received encrypted addition request");

  try {
    const { cipher1Base64, cipher2Base64 } = req.body;

    const cipher1 = seal.CipherText();
    const cipher2 = seal.CipherText();

    cipher1.load(context, cipher1Base64);
    cipher2.load(context, cipher2Base64);

    log("Add", "Ciphertexts loaded successfully");

    const result = seal.CipherText();
    evaluator.add(cipher1, cipher2, result);
    log("Add", "Homomorphic addition performed");

    const plaintext = seal.PlainText();
    decryptor.decrypt(result, plaintext);
    const decoded = encoder.decode(plaintext);
    const plainResult = decoded[0];

    const duration = Date.now() - start;
    log("Add", `Decrypted result: ${plainResult} (Completed in ${duration}ms)`);

    res.json({ decryptedResult: plainResult });
  } catch (err) {
    log("Error", `Homomorphic addition failed: ${err.message}`);
    res.status(500).json({ error: "Homomorphic addition failed" });
  }
});

const PORT = process.env.PORT || 18080;
app.listen(PORT, () => {
  log("Startup", `Server listening on http://localhost:${PORT}`);
});
