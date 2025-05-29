"use client";

import { useEffect, useState } from "react";

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

  const encryptNumber = (num: number) => {
    if (!encryptor || !encoder) return null;

    const vector = new Int32Array(encoder.slotCount).fill(0);
    vector[0] = num;

    const plaintext = seal.PlainText();
    encoder.encode(vector, plaintext);

    const ciphertext = seal.CipherText();
    encryptor.encrypt(plaintext, ciphertext);

    return ciphertext.save(); // return base64 string of ciphertext
  };

  const decryptToNumber = (ciphertextBase64: string) => {
    if (!decryptor || !encoder) return null;

    const ciphertext = seal.CipherText();
    ciphertext.load(context, ciphertextBase64);

    const plaintext = seal.PlainText();
    decryptor.decrypt(ciphertext, plaintext);

    const decoded = encoder.decode(plaintext);
    return decoded[0];
  };

  return {
    loading,
    encryptNumber,
    decryptToNumber,
    publicKey,
  };
};
