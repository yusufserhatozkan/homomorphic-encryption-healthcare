import { useState } from "react";
import { Unlock, Calculator } from "lucide-react";
import { useSeal } from "./lib/homomorphic-service";

const API_BASE_URL = 'http://localhost:18080/api/add'

export default function Home() {
  const [numberA, setNumberA] = useState<number>(0);
  const [numberB, setNumberB] = useState<number>(0);
  const [homDecryptedResult, setHomDecryptedResult] = useState<number | null>(null);
  const { loading, encryptNumber } = useSeal();
  const [error, setError] = useState<string | null>(null);


  const handleCalculate = async () => {
    setError(null);

    try {
      if (loading) return;

      const encrypted1 = encryptNumber(numberA);
      const encrypted2 = encryptNumber(numberB);

      if (!encrypted1 || !encrypted2) {
        setError("Encryption failed");
        return;
      }

      // encrypted1 is already a base64 string, no need to call save()
      const encrypted1Base64 = encrypted1;
      const encrypted2Base64 = encrypted2;
      console.log(JSON.stringify({ cipher1Base64: encrypted1Base64, cipher2Base64: encrypted2Base64 }));

      const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cipher1Base64: encrypted1Base64, cipher2Base64: encrypted2Base64 }),
      });

      if (!res.ok) {
        throw new Error("Server error during homomorphic addition");
      }

      const data = await res.json();

      setHomDecryptedResult(data.decryptedResult);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    }
  };


  return (
    <main className="min-h-screen flex justify-center items-center p-6 bg-background">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Homomorphic Encryption</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Secure number processing with encryption
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Homomorphic Addition</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Enter two numbers to add them securely</p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="numberA" className="block text-sm font-medium">
                  First Number
                </label>
                <input
                  id="numberA"
                  type="number"
                  value={numberA}
                  onChange={(e) => setNumberA(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter first number"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="numberB" className="block text-sm font-medium">
                  Second Number
                </label>
                <input
                  id="numberB"
                  type="number"
                  value={numberB}
                  onChange={(e) => setNumberB(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter second number"
                />
              </div>
            </div>
            <button
              onClick={handleCalculate}
              disabled={loading}
              className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Add Encrypted Numbers'}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Unlock className="w-4 h-4" />
                Sum
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md font-mono text-sm">
                {homDecryptedResult !== null ? homDecryptedResult : '-'}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">About Homomorphic Encryption</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Homomorphic encryption is a form of encryption that allows computations to be performed on encrypted data.
            The result, when decrypted, matches the result of the same operations performed on the original data.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            Information Security - Homomorphic Encryption Demo
          </p>
        </div>
      </div>
    </main>
  );
}
