"use client";

import { useEffect, useState, useCallback } from "react";
import performanceMetrics from "@/lib/performance-metrics";

const API_BASE_URL = "http://localhost:18080/api/add";

export const useSeal = () => {
  const [seal, setSeal] = useState<any>(null);
  const [context, setContext] = useState<any>(null);
  const [encoder, setEncoder] = useState<any>(null);
  const [encryptor, setEncryptor] = useState<any>(null);
  const [decryptor, setDecryptor] = useState<any>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const initializeSeal = async () => {
      try {
        const SEAL = await import("node-seal");
        const seal = await SEAL.default();
        setSeal(seal);

        // Initialize SEAL with the same parameters as the server
        const schemeType = seal.SchemeType.bfv;
        const parms = seal.EncryptionParameters(schemeType);
        parms.setPolyModulusDegree(4096);
        parms.setCoeffModulus(seal.CoeffModulus.Create(4096, Int32Array.from([36, 36, 37])));
        parms.setPlainModulus(seal.PlainModulus.Batching(4096, 20));

        // Create context
        const context = seal.Context(parms, true, seal.SecurityLevel.tc128);

        // Create encoder
        const encoder = seal.BatchEncoder(context);

        // Generate keys
        const keyGenerator = seal.KeyGenerator(context);
        const secretKey = keyGenerator.secretKey();
        const publicKey = keyGenerator.createPublicKey();

        // Store public key for requests
        setPublicKey(publicKey.save());

        // Create encryptor and decryptor
        const encryptor = seal.Encryptor(context, publicKey);
        const decryptor = seal.Decryptor(context, secretKey);

        setContext(context);
        setEncoder(encoder);
        setEncryptor(encryptor);
        setDecryptor(decryptor);

        setLoading(false);
      } catch (err) {
        console.error("Failed to initialize SEAL in frontend:", err);
        setLoading(false);
      }
    };

    initializeSeal();
  }, []);

  const encryptNumber = useCallback((num: number) => {
    if (!encryptor || !encoder) return null;

    const operationId = performanceMetrics.startOperation(
        'encrypt_number',
        'encryption',
        { inputValue: num },
        String(num).length
    );

    try {
      const vector = new Int32Array(encoder.slotCount).fill(0);
      vector[0] = num;

      const plaintext = seal.PlainText();
      encoder.encode(vector, plaintext);

      const ciphertext = seal.CipherText();
      encryptor.encrypt(plaintext, ciphertext);

      const result = ciphertext.save();
      performanceMetrics.endOperation(operationId, true, undefined, result.length);
      return result;
    } catch (error) {
      performanceMetrics.endOperation(operationId, false, error as Error);
      return null;
    }
  }, [seal, encoder, encryptor]);

  const decryptToNumber = useCallback((ciphertextBase64: string) => {
    if (!decryptor || !encoder) return null;

    const operationId = performanceMetrics.startOperation(
        'decrypt_number',
        'decryption',
        { ciphertextSize: ciphertextBase64.length },
        ciphertextBase64.length
    );

    try {
      const ciphertext = seal.CipherText();
      ciphertext.load(context, ciphertextBase64);

      const plaintext = seal.PlainText();
      decryptor.decrypt(ciphertext, plaintext);

      const decoded = encoder.decode(plaintext);
      const result = decoded[0];

      performanceMetrics.endOperation(operationId, true, undefined, String(result).length);
      return result;
    } catch (error) {
      performanceMetrics.endOperation(operationId, false, error as Error);
      return null;
    }
  }, [seal, encoder, decryptor, context]);

  const runAdditionBenchmark = useCallback(async (iterations = 10) => {
    const testValues = Array.from({ length: 5 }, (_, i) => i * 10);
    const testPairs = testValues.flatMap(a =>
        testValues.map(b => ({ a, b }))
    );

    return performanceMetrics.runBenchmark(
        'addition',
        async ({ a, b }) => {
          // Homomorphic addition flow
          const cipher1 = encryptNumber(a);
          const cipher2 = encryptNumber(b);
          // Call the API
          const response = await fetch(API_BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cipher1Base64: cipher1,
              cipher2Base64: cipher2,
              publicKeyBase64: publicKey
            }),
          });
          const data = await response.json();
          return decryptToNumber(data.encryptedResult);
        },
        ({ a, b }) => a + b, // Plaintext addition
        testPairs,
        iterations
    );
  }, [encryptNumber, decryptToNumber, publicKey]);

  return {
    loading,
    encryptNumber,
    decryptToNumber,
    publicKey,
    runAdditionBenchmark,
  };
};