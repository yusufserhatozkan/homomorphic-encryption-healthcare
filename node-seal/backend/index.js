/**
 * Homomorphic Encryption Backend Server
 * 
 * This server provides a RESTful API for performing homomorphic encryption operations
 * using Microsoft SEAL library via node-seal. It supports both BFV and CKKS encryption
 * schemes for different types of computations on encrypted data.
 * 
 * Key Features:
 * - Encrypted arithmetic operations (addition, etc.)
 * - Dataset calculations on encrypted values (sum, average, min, max)
 * - Performance benchmarking for different value sizes and parameters
 * - Support for both BFV (integer) and CKKS (floating-point) schemes
 * 
 * @author Applied Cryptography Group 08
 * @version 1.0.0
 */

import express, { json } from "express";
import cors from "cors";
import SEAL from "node-seal";
import { log } from "./logger.js";

// Initialize Express application with necessary middleware
const app = express();

// Enable CORS for cross-origin requests from frontend
app.use(cors());

// Parse JSON payloads up to 50MB (large for encrypted data)
app.use(json({ limit: "50mb" }));

/**
 * Request logging middleware
 * Logs all incoming HTTP requests for debugging and monitoring
 */
app.use((req, res, next) => {
  log("Request", `${req.method} ${req.originalUrl}`);
  next();
});

// Global SEAL library instance and encryption contexts
let seal;                  // Main SEAL library instance
let bfvContext, ckksContext;   // Encryption contexts for BFV and CKKS schemes
let bfvEvaluator, ckksEvaluator; // Evaluators for homomorphic operations

/**
 * Initialize SEAL library and encryption schemes
 * 
 * Sets up both BFV and CKKS encryption contexts with optimal parameters:
 * - BFV: For exact integer arithmetic on encrypted data
 * - CKKS: For approximate floating-point arithmetic on encrypted data
 * 
 * Parameters chosen for balance between security and performance:
 * - Polynomial modulus degree: 4096 (provides good security/performance tradeoff)
 * - Coefficient modulus: Custom bit sizes for optimal noise management
 * - Security level: TC128 (128-bit security standard)
 */
(async () => {
  try {
    // Initialize the SEAL library
    seal = await SEAL();

    // ==================== BFV Scheme Setup ====================
    // BFV is used for exact integer computations on encrypted data
    const bfvSchemeType = seal.SchemeType.bfv;
    const bfvParms = seal.EncryptionParameters(bfvSchemeType);
    
    // Set polynomial modulus degree (higher = more security but slower)
    bfvParms.setPolyModulusDegree(4096);
    
    // Set coefficient modulus chain for noise management
    // Bit sizes: [36, 36, 37] provide good balance for 4096-degree polynomial
    bfvParms.setCoeffModulus(
      seal.CoeffModulus.Create(4096, Int32Array.from([36, 36, 37])),
    );
    
    // Set plaintext modulus for batching (enables SIMD operations)
    // Batching allows packing multiple values into single ciphertext
    bfvParms.setPlainModulus(seal.PlainModulus.Batching(4096, 20));
    
    // Create BFV context with parameter validation and 128-bit security
    bfvContext = seal.Context(bfvParms, true, seal.SecurityLevel.tc128);
    bfvEvaluator = seal.Evaluator(bfvContext);

    // ==================== CKKS Scheme Setup ====================
    // CKKS is used for approximate floating-point computations on encrypted data
    const ckksSchemeType = seal.SchemeType.ckks;
    const ckksParms = seal.EncryptionParameters(ckksSchemeType);
    
    // Same polynomial degree for consistency
    ckksParms.setPolyModulusDegree(4096);
    
    // CKKS uses same coefficient modulus structure as BFV
    ckksParms.setCoeffModulus(
      seal.CoeffModulus.Create(4096, Int32Array.from([36, 36, 37])),
    );
    
    // Create CKKS context (no plaintext modulus needed for CKKS)
    ckksContext = seal.Context(ckksParms, true, seal.SecurityLevel.tc128);
    ckksEvaluator = seal.Evaluator(ckksContext);

    log("Startup", "SEAL initialized on server with both BFV and CKKS schemes");
  } catch (err) {
    log("Error", `Failed to initialize SEAL: ${err.message}`);
    process.exit(1);
  }
})();

/**
 * POST /api/demo/addition
 * 
 * Performs homomorphic addition on two encrypted values.
 * This endpoint demonstrates the core capability of homomorphic encryption:
 * computing on encrypted data without decrypting it first.
 * 
 * @param {Object} req.body - Request payload
 * @param {string} req.body.cipher1Base64 - First encrypted value (base64 encoded)
 * @param {string} req.body.cipher2Base64 - Second encrypted value (base64 encoded)  
 * @param {string} req.body.publicKeyBase64 - Client's public key (base64 encoded)
 * @param {string} req.body.schemeType - Encryption scheme ("bfv" or "ckks")
 * 
 * @returns {Object} JSON response with encrypted result and timing information
 * @returns {string} encryptedResult - Base64 encoded encrypted sum
 * @returns {Object} timings - Performance metrics for the operation
 */
app.post("/api/demo/addition", (req, res) => {
  const start = Date.now();
  log("Add", "Received encrypted addition request");

  try {
    // Extract request parameters
    const { cipher1Base64, cipher2Base64, publicKeyBase64, schemeType } =
      req.body;
    
    // Initialize timing tracking
    const timings = {
      serverReceive: Date.now() - start,
      serverProcessing: 0,
      serverResponse: 0,
    };

    // Validate encryption scheme parameter
    if (!schemeType || (schemeType !== "bfv" && schemeType !== "ckks")) {
      throw new Error(`Invalid scheme type: ${schemeType}`);
    }

    // Select appropriate context and evaluator based on scheme
    const context = schemeType === "bfv" ? bfvContext : ckksContext;
    const evaluator = schemeType === "bfv" ? bfvEvaluator : ckksEvaluator;

    // Ensure the selected scheme is properly initialized
    if (!context || !evaluator) {
      throw new Error(
        `Context or evaluator not initialized for scheme: ${schemeType}`,
      );
    }

    // Load the client's public key from base64 encoding
    // This allows the server to work with client-encrypted data
    const publicKey = seal.PublicKey();
    publicKey.load(context, publicKeyBase64);

    // Create encryptor with client's public key (though not used in this operation)
    const encryptor = seal.Encryptor(context, publicKey);

    // Create ciphertext objects to hold the encrypted operands
    const cipher1 = seal.CipherText();
    const cipher2 = seal.CipherText();

    try {
      // Load the encrypted values from base64-encoded strings
      cipher1.load(context, cipher1Base64);
      cipher2.load(context, cipher2Base64);
    } catch (err) {
      throw new Error(`Failed to load ciphertexts: ${err.message}`);
    }

    log("Add", `Ciphertexts loaded successfully for ${schemeType} scheme`);

    // Perform the homomorphic addition
    const result = seal.CipherText();
    const computeStart = Date.now();
    
    // This is the key operation: adding encrypted values without decryption!
    evaluator.add(cipher1, cipher2, result);
    
    timings.serverProcessing = Date.now() - computeStart;
    log("Add", "Homomorphic addition performed");

    // Prepare response with encrypted result and timing data
    const responseStart = Date.now();
    const response = {
      encryptedResult: result.save(), // Serialize result to base64
      timings: {
        ...timings,
        serverResponse: Date.now() - responseStart,
        totalServerTime: Date.now() - start,
      },
    };
    res.json(response);
  } catch (err) {
    log("Error", `Homomorphic addition failed: ${err.message}`);
    res
      .status(500)
      .json({ error: err.message || "Homomorphic addition failed" });
  }
});

/**
 * POST /api/demo/dataset
 * 
 * Performs statistical calculations on a dataset of encrypted values.
 * This endpoint demonstrates homomorphic encryption's ability to compute
 * aggregate statistics (sum, average, min, max) on encrypted datasets
 * without revealing individual data points.
 * 
 * Use cases:
 * - Privacy-preserving analytics on healthcare data
 * - Secure financial calculations
 * - Confidential business intelligence
 * 
 * @param {Object} req.body - Request payload
 * @param {string[]} req.body.encryptedValues - Array of encrypted values (base64 encoded)
 * @param {string} req.body.calculationType - Type of calculation ("sum", "average", "min", "max")
 * @param {string} req.body.publicKeyBase64 - Client's public key (base64 encoded)
 * @param {string} req.body.schemeType - Encryption scheme ("bfv" or "ckks")
 * 
 * @returns {Object} JSON response with encrypted result and timing information
 * @returns {string} encryptedResult - Base64 encoded encrypted calculation result
 * @returns {Object} timings - Performance metrics for the operation
 */
app.post("/api/demo/dataset", (req, res) => {
  const start = Date.now();
  log("Dataset", "Received dataset calculation request");

  try {
    // Extract request parameters
    const { encryptedValues, calculationType, publicKeyBase64, schemeType } =
      req.body;

    // Validate encryption scheme
    if (!schemeType || (schemeType !== "bfv" && schemeType !== "ckks")) {
      throw new Error(`Invalid scheme type: ${schemeType}`);
    }

    // Select appropriate context and evaluator
    const context = schemeType === "bfv" ? bfvContext : ckksContext;
    const evaluator = schemeType === "bfv" ? bfvEvaluator : ckksEvaluator;

    if (!context || !evaluator) {
      throw new Error(
        `Context or evaluator not initialized for scheme: ${schemeType}`,
      );
    }

    // Load the client's public key
    const publicKey = seal.PublicKey();
    publicKey.load(context, publicKeyBase64);

    // Create encryptor with client's public key
    const encryptor = seal.Encryptor(context, publicKey);

    // Load all encrypted values from the dataset
    // Each value is deserialized from base64 into a SEAL ciphertext object
    const ciphertexts = encryptedValues.map((base64) => {
      const cipher = seal.CipherText();
      cipher.load(context, base64);
      return cipher;
    });

    log(
      "Dataset",
      `Loaded ${ciphertexts.length} ciphertexts for ${schemeType} scheme`,
    );

    // Perform the requested calculation on encrypted data
    let result;
    switch (calculationType) {
      case "sum":
        // Sum all encrypted values using homomorphic addition
        // Note: reduce() performs sequential additions on encrypted data
        result = ciphertexts.reduce((acc, cipher) => {
          const temp = seal.CipherText();
          evaluator.add(acc, cipher, temp);
          return temp;
        });
        break;

      case "average":
        // For average calculation, we compute the sum first
        // The frontend will handle division by count (or use scalar multiplication)
        // Note: Division by plaintext is more efficient than division by ciphertext
        result = ciphertexts.reduce((acc, cipher) => {
          const temp = seal.CipherText();
          evaluator.add(acc, cipher, temp);
          return temp;
        });
        break;

      case "min":
        // Find minimum value using homomorphic comparison
        // Note: This requires comparison operations which may not be directly available
        // Implementation depends on specific SEAL version and scheme capabilities
        result = ciphertexts.reduce((acc, cipher) => {
          const temp = seal.CipherText();
          evaluator.min(acc, cipher, temp);
          return temp;
        });
        break;

      case "max":
        // Find maximum value using homomorphic comparison
        result = ciphertexts.reduce((acc, cipher) => {
          const temp = seal.CipherText();
          evaluator.max(acc, cipher, temp);
          return temp;
        });
        break;

      default:
        throw new Error(`Unsupported calculation type: ${calculationType}`);
    }

    // Calculate operation duration and log performance metrics
    const duration = Date.now() - start;
    log("Dataset", `${calculationType} calculation completed in ${duration}ms`);

    // Return encrypted result with timing information
    res.json({ 
      encryptedResult: result.save(), // Serialize to base64 for transmission
      timings: {
        serverProcessing: duration
      }
    });
  } catch (err) {
    log("Error", `Dataset calculation failed: ${err.message}`);
    res
      .status(500)
      .json({ error: err.message || "Dataset calculation failed" });
  }
});

/**
 * GET /api/benchmark/value-size
 * 
 * Performs comprehensive benchmarking of homomorphic addition operations
 * across different value sizes for both BFV and CKKS schemes.
 * 
 * This endpoint is crucial for understanding:
 * - Performance characteristics of different encryption schemes
 * - Accuracy trade-offs (especially for CKKS approximate arithmetic)
 * - Optimal value ranges for different use cases
 * - Encryption/computation/decryption time breakdowns
 * 
 * The benchmark tests addition operations (a + a) for values from 0 to maxNumber
 * with specified step sizes, measuring:
 * - Encryption time
 * - Homomorphic addition time  
 * - Decryption time
 * - Total operation time
 * - Accuracy of results
 * - Error rates
 * 
 * @param {number} req.query.max - Maximum value to test (default: 500000)
 * @param {number} req.query.step - Step size between test values (default: 500)
 * 
 * @returns {Object} Comprehensive benchmark results for both schemes
 * @returns {Object} results - Detailed results for each test case
 * @returns {Object} summaries - Aggregate statistics and performance metrics
 */
// Endpoint for backend-side homomorphic addition benchmark
app.get("/api/benchmark/value-size", async (req, res) => {
  log("Benchmark", "Starting backend addition benchmark for BFV and CKKS");
  try {
    // Parse query parameters with sensible defaults
    const maxNumber = parseInt(req.query.max) || 500000;
    const stepSize = parseInt(req.query.step) || 500;

    // Generate deterministic test cases for reproducible benchmarks
    const testCases = [];
    // Test values from 0 to maxNumber with specified step size
    // We test a + a to ensure we're measuring addition performance
    for (let a = 0; a <= maxNumber; a += stepSize) {
      testCases.push({ a, b: a }); // test a + a for consistent results
    }

    // Test both encryption schemes for comparison
    const schemes = ["bfv", "ckks"];
    const results = {};      // Detailed results for each test case
    const summaries = {};    // Aggregate performance statistics

    // Benchmark each scheme separately
    for (const schemeType of schemes) {
      // Select appropriate context and evaluator for the scheme
      const context = schemeType === "bfv" ? bfvContext : ckksContext;
      const evaluator = schemeType === "bfv" ? bfvEvaluator : ckksEvaluator;
      
      // Create encoder for converting between plaintext and ciphertext formats
      const sealEncoder =
        schemeType === "bfv"
          ? seal.BatchEncoder(context)    // Batch encoder for integer arrays
          : seal.CKKSEncoder(context);    // CKKS encoder for floating-point arrays
      
      // Generate fresh key pair for this benchmark run
      const keyGenerator = seal.KeyGenerator(context);
      const secretKey = keyGenerator.secretKey();
      const publicKey = keyGenerator.createPublicKey();
      const encryptor = seal.Encryptor(context, publicKey);
      const decryptor = seal.Decryptor(context, secretKey);
      
      // Note: Healthcare data file path (currently unused in this benchmark)
      const dataPath = "./healtchcare_data.csv"; // Path to healthcare data file
      
      /**
       * Encode a number for the current encryption scheme
       * @param {number} num - Number to encode
       * @returns {PlainText} Encoded plaintext ready for encryption
       */
      const encode = (num) => {
        let plaintext;
        if (schemeType === "bfv") {
          // BFV: Create integer array and place value in first slot
          const vector = new Int32Array(sealEncoder.slotCount).fill(0);
          vector[0] = Math.round(num); // Ensure integer for BFV
          plaintext = seal.PlainText();
          sealEncoder.encode(vector, plaintext);
        } else {
          // CKKS: Create floating-point array and place value in first slot
          const vector = new Float64Array(sealEncoder.slotCount).fill(0);
          vector[0] = num;
          plaintext = seal.PlainText();
          // Scale factor of 2^20 provides good precision for CKKS
          sealEncoder.encode(vector, 1 << 20, plaintext);
        }
        return plaintext;
      };
      
      /**
       * Decode a plaintext back to a number
       * @param {PlainText} plaintext - Plaintext to decode
       * @returns {number} Decoded number from first slot
       */
      const decode = (plaintext) => {
        const decoded = sealEncoder.decode(plaintext);
        return decoded[0]; // Return value from first slot
      };
      
      // Initialize tracking variables for this scheme
      const caseResults = [];     // Results for individual test cases
      let accurateCount = 0;      // Count of accurate results
      let totalError = 0;         // Sum of all errors
      let totalEncryption = 0;    // Total encryption time
      let totalAddition = 0;      // Total homomorphic addition time
      let totalDecryption = 0;    // Total decryption time
      let totalTotal = 0;         // Total end-to-end time
      
      // Execute benchmark for each test case
      for (const { a, b } of testCases) {
        // ==================== Encryption Phase ====================
        const t0 = Date.now();
        const plainA = encode(a);
        const plainB = encode(b);
        const cipherA = seal.CipherText();
        const cipherB = seal.CipherText();
        encryptor.encrypt(plainA, cipherA);
        encryptor.encrypt(plainB, cipherB);
        const t1 = Date.now();
        
        // ==================== Homomorphic Addition Phase ====================
        const cipherResult = seal.CipherText();
        const t2 = Date.now();
        // This is the core homomorphic operation: addition on encrypted data
        evaluator.add(cipherA, cipherB, cipherResult);
        const t3 = Date.now();
        
        // ==================== Decryption Phase ====================
        const plainResult = seal.PlainText();
        decryptor.decrypt(cipherResult, plainResult);
        const t4 = Date.now();
        
        // ==================== Result Analysis ====================
        // Decode the result and compare with expected value
        const result = decode(plainResult);
        const expected = a + b;
        
        // Check accuracy (different thresholds for BFV vs CKKS)
        const accurate =
          schemeType === "ckks"
            ? Math.abs(result - expected) < 0.001  // CKKS: approximate arithmetic
            : result === Math.round(expected);     // BFV: exact arithmetic
        
        if (accurate) accurateCount++;
        
        // Calculate error and update running totals
        const error = Math.abs(result - expected);
        totalError += error;
        totalEncryption += t1 - t0;
        totalAddition += t3 - t2;
        totalDecryption += t4 - t3;
        totalTotal += t4 - t0;
        
        // Store detailed results for this test case
        caseResults.push({
          a,
          b,
          expected,
          result,
          accurate,
          encryptionMs: t1 - t0,
          additionMs: t3 - t2,
          decryptionMs: t4 - t3,
          totalMs: t4 - t0,
          error,
        });
      }
      
      // Store detailed results for this scheme
      results[schemeType] = caseResults;
      
      // Calculate and store summary statistics
      const n = caseResults.length;
      summaries[schemeType] = {
        totalCases: n,
        accuracyRatio: accurateCount / n,           // Percentage of accurate results
        averageError: totalError / n,               // Average absolute error
        averageEncryptionMs: totalEncryption / n,   // Average encryption time
        averageAdditionMs: totalAddition / n,       // Average homomorphic addition time
        averageDecryptionMs: totalDecryption / n,   // Average decryption time
        averageTotalMs: totalTotal / n,             // Average total time
      };
    }
    
    // Return comprehensive benchmark results
    res.json({ ok: true, results, summaries });
  } catch (err) {
    log("Error", `Benchmark failed: ${err.message}`);
    res.status(500).json({ error: err.message || "Benchmark failed" });
  }
});

/**
 * POST /api/benchmark/parameters
 * 
 * Benchmarks homomorphic encryption performance with custom parameters.
 * This endpoint allows testing different encryption parameter combinations
 * to find optimal settings for specific use cases.
 * 
 * Parameters tested:
 * - Polynomial modulus degree (affects security and performance)
 * - Plain modulus (affects message space for BFV)
 * - Security level (128, 192, or 256 bits)
 * - Input value (to test different value ranges)
 * 
 * @param {Object} req.body - Request payload
 * @param {string} req.body.scheme - Encryption scheme ("bfv" or "ckks")
 * @param {number} req.body.polyModulusDegree - Polynomial modulus degree
 * @param {number} req.body.plainModulus - Plain modulus (BFV only)
 * @param {number} req.body.securityLevel - Security level (128, 192, or 256)
 * @param {number} req.body.value - Test value for computation
 * 
 * @returns {Object} Benchmark results with timing and accuracy metrics
 */
app.post("/api/benchmark/parameters", async (req, res) => {
  const { scheme, polyModulusDegree, plainModulus, securityLevel, value } =
    req.body;

  try {
    let result;
    if (scheme === "bfv") {
      result = await benchmarkBFVWithParams(
        value,
        polyModulusDegree,
        plainModulus,
        securityLevel,
      );
    } else if (scheme === "ckks") {
      result = await benchmarkCKKSWithParams(
        value,
        polyModulusDegree,
        plainModulus,
        securityLevel,
      );
    } else {
      return res.status(400).json({ error: "Invalid scheme" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error in parameter benchmark:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Benchmark BFV scheme with custom parameters
 * 
 * BFV (Brakerski-Fan-Vercauteren) is designed for exact integer arithmetic.
 * It supports batching operations and is ideal for scenarios requiring
 * precise integer computations on encrypted data.
 * 
 * @param {number} value - Test value for the benchmark
 * @param {number} polyModulusDegree - Polynomial modulus degree
 * @param {number} plainModulus - Plain modulus for the message space
 * @param {number} securityLevel - Security level (128, 192, or 256 bits)
 * @returns {Object} Benchmark results with timing and accuracy data
 */
async function benchmarkBFVWithParams(
  value,
  polyModulusDegree,
  plainModulus,
  securityLevel,
) {
  // Create BFV encryption parameters
  const parms = seal.EncryptionParameters(seal.SchemeType.bfv);
  parms.setPolyModulusDegree(polyModulusDegree);

  // Convert security level parameter to SEAL enum
  let sealSecurityLevel;
  switch (securityLevel) {
    case 128:
      sealSecurityLevel = seal.SecurityLevel.tc128;
      break;
    case 192:
      sealSecurityLevel = seal.SecurityLevel.tc192;
      break;
    case 256:
      sealSecurityLevel = seal.SecurityLevel.tc256;
      break;
    default:
      throw new Error("Invalid security level");
  }

  // Set coefficient modulus based on security level and polynomial degree
  parms.setCoeffModulus(
    seal.CoeffModulus.BFVDefault(polyModulusDegree, sealSecurityLevel),
  );

  // Create plain modulus for batching operations
  // Higher bit count allows larger integer values but may affect performance
  const plainModulusValue = seal.PlainModulus.Batching(polyModulusDegree, 20);
  parms.setPlainModulus(plainModulusValue);

  // Create context and validate parameters
  const context = seal.Context(parms, true, sealSecurityLevel);
  if (!context.parametersSet()) {
    throw new Error("Invalid parameters");
  }

  // Generate cryptographic keys
  const keyGenerator = seal.KeyGenerator(context);
  const secretKey = keyGenerator.secretKey();
  const publicKey = keyGenerator.createPublicKey();
  const encryptor = seal.Encryptor(context, publicKey);
  const evaluator = seal.Evaluator(context);
  const decryptor = seal.Decryptor(context, secretKey);

  // Create batch encoder for SIMD operations
  const encoder = seal.BatchEncoder(context);
  const slotCount = encoder.slotCount();

  // Create test data: fill all slots with the same value for testing
  const input = new Int32Array(slotCount);
  for (let i = 0; i < slotCount; i++) {
    input[i] = value;
  }

  // ==================== Encryption Benchmark ====================
  const encryptStart = performance.now();
  const encrypted = encryptor.encrypt(encoder.encode(input));
  const encryptEnd = performance.now();

  // ==================== Computation Benchmark ====================
  // Test squaring operation (multiplication with itself)
  const computeStart = performance.now();
  const result = evaluator.square(encrypted);
  const computeEnd = performance.now();

  // ==================== Decryption Benchmark ====================
  const decryptStart = performance.now();
  const decrypted = encoder.decode(decryptor.decrypt(result));
  const decryptEnd = performance.now();

  // ==================== Accuracy Analysis ====================
  // Calculate expected results
  const expected = new Int32Array(slotCount);
  for (let i = 0; i < slotCount; i++) {
    expected[i] = value * value;
  }

  // Calculate total error across all slots
  let totalError = 0;
  for (let i = 0; i < slotCount; i++) {
    totalError += Math.abs(decrypted[i] - expected[i]);
  }
  const averageError = totalError / slotCount;

  return {
    encryptionTime: (encryptEnd - encryptStart).toFixed(2),
    computationTime: (computeEnd - computeStart).toFixed(2),
    decryptionTime: (decryptEnd - decryptStart).toFixed(2),
    totalTime: (decryptEnd - encryptStart).toFixed(2),
    error: averageError,
    parameters: {
      polyModulusDegree,
      plainModulus: plainModulusValue.value(),
      securityLevel,
    },
  };
}

/**
 * Benchmark CKKS scheme with custom parameters
 * 
 * CKKS (Cheon-Kim-Kim-Song) is designed for approximate floating-point arithmetic.
 * It's ideal for machine learning applications, statistical computations,
 * and scenarios where small errors are acceptable for better performance.
 * 
 * @param {number} value - Test value for the benchmark
 * @param {number} polyModulusDegree - Polynomial modulus degree
 * @param {number} plainModulus - Not used in CKKS (included for API consistency)
 * @param {number} securityLevel - Security level (128, 192, or 256 bits)
 * @returns {Object} Benchmark results with timing and accuracy data
 */
async function benchmarkCKKSWithParams(
  value,
  polyModulusDegree,
  plainModulus,
  securityLevel,
) {
  // Create CKKS encryption parameters
  const parms = seal.EncryptionParameters(seal.SchemeType.ckks);
  parms.setPolyModulusDegree(polyModulusDegree);

  // Convert security level parameter to SEAL enum
  let sealSecurityLevel;
  switch (securityLevel) {
    case 128:
      sealSecurityLevel = seal.SecurityLevel.tc128;
      break;
    case 192:
      sealSecurityLevel = seal.SecurityLevel.tc192;
      break;
    case 256:
      sealSecurityLevel = seal.SecurityLevel.tc256;
      break;
    default:
      throw new Error("Invalid security level");
  }

  // Set coefficient modulus for CKKS
  // CKKS requires careful selection of coefficient modulus for precision
  parms.setCoeffModulus(
    seal.CoeffModulus.Create(
      polyModulusDegree,
      Int32Array.from([60, 40, 40, 60]), // Optimized for precision and performance
    ),
  );

  // Create context and validate parameters
  const context = seal.Context(parms, true, sealSecurityLevel);
  if (!context.parametersSet()) {
    throw new Error("Invalid parameters");
  }

  // Generate cryptographic keys
  const keyGenerator = seal.KeyGenerator(context);
  const secretKey = keyGenerator.secretKey();
  const publicKey = keyGenerator.createPublicKey();
  const encryptor = seal.Encryptor(context, publicKey);
  const evaluator = seal.Evaluator(context);
  const decryptor = seal.Decryptor(context, secretKey);

  // Create CKKS encoder for floating-point operations
  const encoder = seal.CKKSEncoder(context);
  const slotCount = encoder.slotCount();

  // Create test data: fill all slots with the same floating-point value
  const input = new Float64Array(slotCount);
  for (let i = 0; i < slotCount; i++) {
    input[i] = value;
  }

  // ==================== Encryption Benchmark ====================
  const encryptStart = performance.now();
  const encrypted = encryptor.encrypt(encoder.encode(input));
  const encryptEnd = performance.now();

  // ==================== Computation Benchmark ====================
  // Test squaring operation on floating-point encrypted data
  const computeStart = performance.now();
  const result = evaluator.square(encrypted);
  const computeEnd = performance.now();

  // ==================== Decryption Benchmark ====================
  const decryptStart = performance.now();
  const decrypted = encoder.decode(decryptor.decrypt(result));
  const decryptEnd = performance.now();

  // ==================== Accuracy Analysis ====================
  // Calculate expected results
  const expected = new Float64Array(slotCount);
  for (let i = 0; i < slotCount; i++) {
    expected[i] = value * value;
  }

  // Calculate total error across all slots
  // CKKS is approximate, so we expect some error due to noise
  let totalError = 0;
  for (let i = 0; i < slotCount; i++) {
    totalError += Math.abs(decrypted[i] - expected[i]);
  }
  const averageError = totalError / slotCount;

  return {
    encryptionTime: (encryptEnd - encryptStart).toFixed(2),
    computationTime: (computeEnd - computeStart).toFixed(2),
    decryptionTime: (decryptEnd - decryptStart).toFixed(2),
    totalTime: (decryptEnd - encryptStart).toFixed(2),
    error: averageError,
    parameters: {
      polyModulusDegree,
      plainModulus: 0, // Not used in CKKS
      securityLevel,
    },
  };
}

/**
 * Start the HTTP server
 * 
 * The server listens on the specified port (default: 18080) and provides
 * homomorphic encryption services via RESTful API endpoints.
 * 
 * Available endpoints:
 * - POST /api/demo/addition - Homomorphic addition of encrypted values
 * - POST /api/demo/dataset - Statistical calculations on encrypted datasets  
 * - GET /api/benchmark/value-size - Performance benchmarking across value ranges
 * - POST /api/benchmark/parameters - Custom parameter benchmarking
 * 
 * The server supports both BFV and CKKS encryption schemes for different
 * use cases and performance requirements.
 */
const PORT = process.env.PORT || 18080;
app.listen(PORT, () => {
  log("Startup", `Server listening on http://localhost:${PORT}`);
});
