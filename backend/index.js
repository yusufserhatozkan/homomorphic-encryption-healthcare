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
let bfvContext, ckksContext;
let bfvEvaluator, ckksEvaluator;

(async () => {
  try {
    seal = await SEAL();

    // Initialize BFV scheme
    const bfvSchemeType = seal.SchemeType.bfv;
    const bfvParms = seal.EncryptionParameters(bfvSchemeType);
    bfvParms.setPolyModulusDegree(4096);
    bfvParms.setCoeffModulus(seal.CoeffModulus.Create(4096, Int32Array.from([36, 36, 37])));
    bfvParms.setPlainModulus(seal.PlainModulus.Batching(4096, 20));
    bfvContext = seal.Context(bfvParms, true, seal.SecurityLevel.tc128);
    bfvEvaluator = seal.Evaluator(bfvContext);

    // Initialize CKKS scheme
    const ckksSchemeType = seal.SchemeType.ckks;
    const ckksParms = seal.EncryptionParameters(ckksSchemeType);
    ckksParms.setPolyModulusDegree(4096);
    ckksParms.setCoeffModulus(seal.CoeffModulus.Create(4096, Int32Array.from([36, 36, 37])));
    ckksContext = seal.Context(ckksParms, true, seal.SecurityLevel.tc128);
    ckksEvaluator = seal.Evaluator(ckksContext);

    log("Startup", "SEAL initialized on server with both BFV and CKKS schemes");
  } catch (err) {
    log("Error", `Failed to initialize SEAL: ${err.message}`);
    process.exit(1);
  }
})();

app.post("/api/add", (req, res) => {
  const start = Date.now();
  log("Add", "Received encrypted addition request");

  try {
    const { cipher1Base64, cipher2Base64, publicKeyBase64, schemeType } = req.body;

    if (!schemeType || (schemeType !== 'bfv' && schemeType !== 'ckks')) {
      throw new Error(`Invalid scheme type: ${schemeType}`);
    }

    // Select context and evaluator based on scheme
    const context = schemeType === 'bfv' ? bfvContext : ckksContext;
    const evaluator = schemeType === 'bfv' ? bfvEvaluator : ckksEvaluator;

    if (!context || !evaluator) {
      throw new Error(`Context or evaluator not initialized for scheme: ${schemeType}`);
    }

    // Load the client's public key
    const publicKey = seal.PublicKey();
    publicKey.load(context, publicKeyBase64);

    // Create encryptor with client's public key
    const encryptor = seal.Encryptor(context, publicKey);

    const cipher1 = seal.CipherText();
    const cipher2 = seal.CipherText();

    try {
      cipher1.load(context, cipher1Base64);
      cipher2.load(context, cipher2Base64);
    } catch (err) {
      throw new Error(`Failed to load ciphertexts: ${err.message}`);
    }

    log("Add", `Ciphertexts loaded successfully for ${schemeType} scheme`);

    const result = seal.CipherText();
    evaluator.add(cipher1, cipher2, result);
    log("Add", "Homomorphic addition performed");

    const duration = Date.now() - start;
    log("Add", `Homomorphic addition completed in ${duration}ms`);

    res.json({ encryptedResult: result.save() });
  } catch (err) {
    log("Error", `Homomorphic addition failed: ${err.message}`);
    res.status(500).json({ error: err.message || "Homomorphic addition failed" });
  }
});

app.post("/api/dataset", (req, res) => {
  const start = Date.now();
  log("Dataset", "Received dataset calculation request");

  try {
    const { encryptedValues, calculationType, publicKeyBase64, schemeType } = req.body;

    if (!schemeType || (schemeType !== 'bfv' && schemeType !== 'ckks')) {
      throw new Error(`Invalid scheme type: ${schemeType}`);
    }

    // Select context and evaluator based on scheme
    const context = schemeType === 'bfv' ? bfvContext : ckksContext;
    const evaluator = schemeType === 'bfv' ? bfvEvaluator : ckksEvaluator;

    if (!context || !evaluator) {
      throw new Error(`Context or evaluator not initialized for scheme: ${schemeType}`);
    }

    // Load the client's public key
    const publicKey = seal.PublicKey();
    publicKey.load(context, publicKeyBase64);

    // Create encryptor with client's public key
    const encryptor = seal.Encryptor(context, publicKey);

    // Load all ciphertexts
    const ciphertexts = encryptedValues.map(base64 => {
      const cipher = seal.CipherText();
      cipher.load(context, base64);
      return cipher;
    });

    log("Dataset", `Loaded ${ciphertexts.length} ciphertexts for ${schemeType} scheme`);

    // Perform the calculation based on type
    let result;
    switch (calculationType) {
      case 'sum':
        result = ciphertexts.reduce((acc, cipher) => {
          const temp = seal.CipherText();
          evaluator.add(acc, cipher, temp);
          return temp;
        });
        break;

      case 'average':
        // First sum all values
        const sum = ciphertexts.reduce((acc, cipher) => {
          const temp = seal.CipherText();
          evaluator.add(acc, cipher, temp);
          return temp;
        });
        // Then divide by count (using plaintext division)
        const count = ciphertexts.length;
        const plainCount = seal.PlainText();
        if (schemeType === 'bfv') {
          const encoder = seal.BatchEncoder(context);
          const vector = new Int32Array(encoder.slotCount).fill(0);
          vector[0] = count;
          encoder.encode(vector, plainCount);
        } else {
          const encoder = seal.CKKSEncoder(context);
          const vector = new Float64Array(encoder.slotCount).fill(0);
          vector[0] = count;
          encoder.encode(vector, 1 << 20, plainCount);
        }
        result = seal.CipherText();
        evaluator.dividePlain(sum, plainCount, result);
        break;

      case 'min':
        result = ciphertexts.reduce((acc, cipher) => {
          const temp = seal.CipherText();
          evaluator.min(acc, cipher, temp);
          return temp;
        });
        break;

      case 'max':
        result = ciphertexts.reduce((acc, cipher) => {
          const temp = seal.CipherText();
          evaluator.max(acc, cipher, temp);
          return temp;
        });
        break;

      default:
        throw new Error(`Unsupported calculation type: ${calculationType}`);
    }

    const duration = Date.now() - start;
    log("Dataset", `${calculationType} calculation completed in ${duration}ms`);

    res.json({ encryptedResult: result.save() });
  } catch (err) {
    log("Error", `Dataset calculation failed: ${err.message}`);
    res.status(500).json({ error: err.message || "Dataset calculation failed" });
  }
});

// Endpoint for backend-side homomorphic addition benchmark
app.get("/api/addition-benchmark", async (req, res) => {
  log("Benchmark", "Starting backend addition benchmark for BFV and CKKS");
  try {
    // Generate deterministic test cases
    const testCases = [];
    // Integers: -1_000_000_000 to 1_000_000_000 step 100_000_000
    for (let a = -1_000_000_000; a <= 1_000_000_000; a += 100_000_000) {
      for (let b = -1_000_000_000; b <= 1_000_000_000; b += 100_000_000) {
        testCases.push({ a, b });
      }
    }
    // Floating points: -1_000_000_000.0 to 1_000_000_000.0 step 100_000_000.0
    for (let a = -1_000_000_000.0; a <= 1_000_000_000.0; a += 100_000_000.0) {
      for (let b = -1_000_000_000.0; b <= 1_000_000_000.0; b += 100_000_000.0) {
        testCases.push({ a: parseFloat(a.toFixed(3)), b: parseFloat(b.toFixed(3)) });
      }
    }
    // Edge floating points
    const floatEdges = [1e-6, -1e-6, 1e6, -1e6, 3.14159, 2.71828, -3.14159, -2.71828];
    for (const a of floatEdges) {
      for (const b of floatEdges) {
        testCases.push({ a, b });
      }
    }
    const schemes = ["bfv", "ckks"];
    const results = {};
    const summaries = {};

    for (const schemeType of schemes) {
      const context = schemeType === "bfv" ? bfvContext : ckksContext;
      const evaluator = schemeType === "bfv" ? bfvEvaluator : ckksEvaluator;
      const sealEncoder = schemeType === "bfv" ? seal.BatchEncoder(context) : seal.CKKSEncoder(context);
      const keyGenerator = seal.KeyGenerator(context);
      const secretKey = keyGenerator.secretKey();
      const publicKey = keyGenerator.createPublicKey();
      const encryptor = seal.Encryptor(context, publicKey);
      const decryptor = seal.Decryptor(context, secretKey);
      const encode = (num) => {
        let plaintext;
        if (schemeType === "bfv") {
          const vector = new Int32Array(sealEncoder.slotCount).fill(0);
          vector[0] = Math.round(num);
          plaintext = seal.PlainText();
          sealEncoder.encode(vector, plaintext);
        } else {
          const vector = new Float64Array(sealEncoder.slotCount).fill(0);
          vector[0] = num;
          plaintext = seal.PlainText();
          sealEncoder.encode(vector, 1 << 20, plaintext);
        }
        return plaintext;
      };
      const decode = (plaintext) => {
        const decoded = sealEncoder.decode(plaintext);
        return decoded[0];
      };
      const caseResults = [];
      let accurateCount = 0;
      let totalError = 0;
      let totalEncryption = 0;
      let totalAddition = 0;
      let totalDecryption = 0;
      let totalTotal = 0;
      for (const { a, b } of testCases) {
        // Encrypt
        const t0 = Date.now();
        const plainA = encode(a);
        const plainB = encode(b);
        const cipherA = seal.CipherText();
        const cipherB = seal.CipherText();
        encryptor.encrypt(plainA, cipherA);
        encryptor.encrypt(plainB, cipherB);
        const t1 = Date.now();
        // Homomorphic addition
        const cipherResult = seal.CipherText();
        const t2 = Date.now();
        evaluator.add(cipherA, cipherB, cipherResult);
        const t3 = Date.now();
        // Decrypt
        const plainResult = seal.PlainText();
        decryptor.decrypt(cipherResult, plainResult);
        const t4 = Date.now();
        // Decode
        const result = decode(plainResult);
        const expected = a + b;
        const accurate = schemeType === "ckks" ? Math.abs(result - expected) < 0.001 : result === Math.round(expected);
        if (accurate) accurateCount++;
        const error = Math.abs(result - expected);
        totalError += error;
        totalEncryption += t1 - t0;
        totalAddition += t3 - t2;
        totalDecryption += t4 - t3;
        totalTotal += t4 - t0;
        caseResults.push({
          a, b, expected, result,
          accurate,
          encryptionMs: t1 - t0,
          additionMs: t3 - t2,
          decryptionMs: t4 - t3,
          totalMs: t4 - t0,
          error
        });
      }
      results[schemeType] = caseResults;
      const n = caseResults.length;
      summaries[schemeType] = {
        totalCases: n,
        accuracyRatio: accurateCount / n,
        averageError: totalError / n,
        averageEncryptionMs: totalEncryption / n,
        averageAdditionMs: totalAddition / n,
        averageDecryptionMs: totalDecryption / n,
        averageTotalMs: totalTotal / n
      };
    }
    res.json({ ok: true, results, summaries });
  } catch (err) {
    log("Error", `Benchmark failed: ${err.message}`);
    res.status(500).json({ error: err.message || "Benchmark failed" });
  }
});

const PORT = process.env.PORT || 18080;
app.listen(PORT, () => {
  log("Startup", `Server listening on http://localhost:${PORT}`);
});
