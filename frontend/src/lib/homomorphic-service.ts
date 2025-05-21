import { useEffect, useState } from "react";

export const useSeal = () => {
  const [seal, setSeal] = useState<any>(null);
  const [context, setContext] = useState<any>(null);
  const [encoder, setEncoder] = useState<any>(null);
  const [encryptor, setEncryptor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeSeal = async () => {
      try {
        const SEAL = await import("node-seal");
        const seal = await SEAL.default();
        setSeal(seal);

        // Fetch params and public key from backend
        const res = await fetch("http://localhost:18080/api/seal-params");
        const { parms: parmsBase64, publicKey: publicKeyBase64 } = await res.json();

        // Recreate parms
        const parms = seal.EncryptionParameters();
        parms.load(parmsBase64);

        // Create context
        const context = seal.Context(parms, true, seal.SecurityLevel.tc128);

        // Create encoder, encryptor with public key
        const encoder = seal.BatchEncoder(context);
        const publicKey = seal.PublicKey();
        publicKey.load(context, publicKeyBase64);
        const encryptor = seal.Encryptor(context, publicKey);

        setContext(context);
        setEncoder(encoder);
        setEncryptor(encryptor);

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

  // We don't have secret key or decryptor on frontend, so decryptToNumber is not possible here
  const decryptToNumber = (ciphertextBase64: string) => {
    console.warn("Frontend cannot decrypt without secret key");
    return null;
  };

  return {
    loading,
    encryptNumber,
    decryptToNumber,
  };
};
