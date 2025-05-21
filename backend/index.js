import express, { json } from "express";
import cors from "cors";
import SEAL from "node-seal";

const app = express();
app.use(cors());
app.use(json({ limit: "50mb" }));

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

  // Serialize keys and parms to Base64 strings for sending to frontend
  parmsBase64 = parms.save();
  publicKeyBase64 = publicKey.save();
  secretKeyBase64 = secretKey.save(); // Keep secret, don't send to frontend!

  console.log("SEAL initialized on server");
})();

// New endpoint to expose encryption parameters + public key
app.get("/api/seal-params", (req, res) => {
  if (!seal) {
    return res.status(503).json({ error: "SEAL not initialized yet" });
  }
  res.json({
    parms: parmsBase64,
    publicKey: publicKeyBase64,
    // optionally send slotCount, polyModulusDegree, etc if frontend needs
  });
});

// Homomorphic addition endpoint, unchanged except decryptor/encryptor usage with context
app.post("/api/add", (req, res) => {
  try {
    const { cipher1Base64, cipher2Base64 } = req.body;

    const cipher1 = seal.CipherText();
    const cipher2 = seal.CipherText();

    cipher1.load(context, cipher1Base64);
    cipher2.load(context, cipher2Base64);

    const result = seal.CipherText();
    evaluator.add(cipher1, cipher2, result);

    // Decrypt result immediately
    const plaintext = seal.PlainText();
    decryptor.decrypt(result, plaintext);
    const decoded = encoder.decode(plaintext);
    const plainResult = decoded[0];

    res.json({ decryptedResult: plainResult }); // Only send plaintext result
  } catch (err) {
    console.error("Error during homomorphic addition:", err);
    res.status(500).json({ error: "Homomorphic addition failed" });
  }
});

const PORT = process.env.PORT || 18080;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
