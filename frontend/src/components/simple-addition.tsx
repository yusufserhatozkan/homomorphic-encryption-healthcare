"use client"

import { useState } from "react"
import { Calculator, Unlock, ArrowRight } from "lucide-react"
import { useSeal } from "@/lib/homomorphic-service"
import { API_BASE_URL } from "@/config/api"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SimpleAdditionProps {
  setError: (error: string | null) => void
}

interface ProcessTimings {
  clientEncryption: number;
  networkRequest: number;
  serverProcessing: number;
  clientDecryption: number;
  totalTime: number;
}

export default function SimpleAddition({ setError }: SimpleAdditionProps) {
  const [numberA, setNumberA] = useState<string>("0")
  const [numberB, setNumberB] = useState<string>("0")
  const [homDecryptedResult, setHomDecryptedResult] = useState<number | null>(null)
  const [timings, setTimings] = useState<ProcessTimings | null>(null)
  const { loading, encryptNumber, decryptToNumber, publicKey, schemeType, setSchemeType } = useSeal()

  const handleCalculate = async () => {
    setError(null)
    setTimings(null)

    try {
      if (loading || !publicKey) return

      const parsedA = Number(numberA)
      const parsedB = Number(numberB)

      if (isNaN(parsedA) || isNaN(parsedB)) {
        setError("Please enter valid numbers")
        return
      }

      const startTime = performance.now()

      // Encrypt numbers on client side
      const encryptStart = performance.now()
      const encrypted1 = encryptNumber(parsedA)
      const encrypted2 = encryptNumber(parsedB)
      const clientEncryptionTime = performance.now() - encryptStart

      if (!encrypted1 || !encrypted2) {
        setError("Encryption failed")
        return
      }

      // Send encrypted numbers and public key to server for homomorphic addition
      const requestStart = performance.now()
      const res = await fetch(`${API_BASE_URL}/addition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cipher1Base64: encrypted1,
          cipher2Base64: encrypted2,
          publicKeyBase64: publicKey,
          schemeType
        }),
      })
      const data = await res.json()
      const networkTime = performance.now() - requestStart

      if (!res.ok) {
        throw new Error("Server error during homomorphic addition")
      }

      // Decrypt the result on client side
      const decryptStart = performance.now()
      const decryptedResult = decryptToNumber(data.encryptedResult)
      const clientDecryptionTime = performance.now() - decryptStart

      if (decryptedResult === null) {
        setError("Decryption failed")
        return
      }

      setHomDecryptedResult(decryptedResult)
      setTimings({
        clientEncryption: clientEncryptionTime,
        networkRequest: networkTime,
        serverProcessing: data.timings.serverProcessing,
        clientDecryption: clientDecryptionTime,
        totalTime: performance.now() - startTime
      })
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Unknown error")
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Homomorphic Addition
            </CardTitle>
            <CardDescription>Enter two numbers to add them securely while they remain encrypted</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numberA">First Number</Label>
                <Input
                  id="numberA"
                  type="number"
                  value={numberA}
                  onChange={(e) => setNumberA(e.target.value)}
                  placeholder="Enter first number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberB">Second Number</Label>
                <Input
                  id="numberB"
                  type="number"
                  value={numberB}
                  onChange={(e) => setNumberB(e.target.value)}
                  placeholder="Enter second number"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-row gap-4">
            <div className="flex">
              <Label htmlFor="scheme" className="sr-only">Encryption Scheme</Label>
              <Select value={schemeType} onValueChange={(value: 'bfv' | 'ckks') => setSchemeType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scheme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bfv">BFV</SelectItem>
                  <SelectItem value="ckks">CKKS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCalculate} disabled={loading || !publicKey} className="flex-1">
              {loading ? "Processing..." : "Add Encrypted Numbers"}
            </Button>
          </CardFooter>
        </Card>

        <ResultCard result={homDecryptedResult} />
      </div>

      {timings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5" />
              Process Flow
            </CardTitle>
            <CardDescription>Timing information for each step of the homomorphic addition process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Client Encryption</div>
                <div className="text-2xl font-mono">{timings.clientEncryption.toFixed(2)}ms</div>
                <div className="text-xs text-muted-foreground">Encrypting input numbers</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Network Request</div>
                <div className="text-2xl font-mono">{timings.networkRequest.toFixed(2)}ms</div>
                <div className="text-xs text-muted-foreground">Sending to server</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Server Processing</div>
                <div className="text-2xl font-mono">{timings.serverProcessing.toFixed(2)}ms</div>
                <div className="text-xs text-muted-foreground">Homomorphic addition</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Client Decryption</div>
                <div className="text-2xl font-mono">{timings.clientDecryption.toFixed(2)}ms</div>
                <div className="text-xs text-muted-foreground">Decrypting result</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Total Time</div>
                <div className="text-2xl font-mono">{timings.totalTime.toFixed(2)}ms</div>
                <div className="text-xs text-muted-foreground">Complete operation</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ResultCard({ result }: { result: number | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Results</CardTitle>
        <CardDescription>The decrypted result of the homomorphic operation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Unlock className="w-4 h-4" />
              Decrypted Sum
            </Label>
            <Badge variant="outline">Plain Text Result</Badge>
          </div>
          <div className="p-4 bg-muted rounded-md font-mono text-lg flex items-center justify-center h-16">
            {result !== null ? result : "-"}
          </div>
          <p className="text-xs text-muted-foreground">
            The result is decrypted on the client side after server-side homomorphic computation
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
