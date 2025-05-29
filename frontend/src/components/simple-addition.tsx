"use client"

import { useState } from "react"
import { Calculator, Unlock, ArrowRight } from "lucide-react"
import { useSeal } from "@/lib/homomorphic-service"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

const API_BASE_URL = "http://localhost:18080/api/add"

interface SimpleAdditionProps {
  setError: (error: string | null) => void
}

export default function SimpleAddition({ setError }: SimpleAdditionProps) {
  const [numberA, setNumberA] = useState<string>("0")
  const [numberB, setNumberB] = useState<string>("0")
  const [homDecryptedResult, setHomDecryptedResult] = useState<number | null>(null)
  const { loading, encryptNumber, decryptToNumber, publicKey } = useSeal()

  const handleCalculate = async () => {
    setError(null)

    try {
      if (loading || !publicKey) return

      const parsedA = Number(numberA)
      const parsedB = Number(numberB)

      if (isNaN(parsedA) || isNaN(parsedB)) {
        setError("Please enter valid numbers")
        return
      }

      // Encrypt numbers on client side
      const encrypted1 = encryptNumber(parsedA)
      const encrypted2 = encryptNumber(parsedB)

      if (!encrypted1 || !encrypted2) {
        setError("Encryption failed")
        return
      }

      // Send encrypted numbers and public key to server for homomorphic addition
      const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          cipher1Base64: encrypted1, 
          cipher2Base64: encrypted2,
          publicKeyBase64: publicKey 
        }),
      })

      if (!res.ok) {
        throw new Error("Server error during homomorphic addition")
      }

      const data = await res.json()
      
      // Decrypt the result on client side
      const decryptedResult = decryptToNumber(data.encryptedResult)
      if (decryptedResult === null) {
        setError("Decryption failed")
        return
      }

      setHomDecryptedResult(decryptedResult)
    } catch (err: any) {
      setError(err.message || "Unknown error")
    }
  }

  return (
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
        </CardContent>
        <CardFooter>
          <Button onClick={handleCalculate} disabled={loading || !publicKey} className="w-full">
            {loading ? "Processing..." : "Add Encrypted Numbers"}
          </Button>
        </CardFooter>
      </Card>

      <ResultCard result={homDecryptedResult} />
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
      <CardContent className="space-y-6">
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

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm font-medium">Process Flow</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 border rounded-md">
              <div className="font-medium mb-1">Encrypt</div>
              <div className="text-muted-foreground">Client-side</div>
            </div>
            <div className="p-2 border rounded-md">
              <div className="font-medium mb-1">Compute</div>
              <div className="text-muted-foreground">Server-side</div>
            </div>
            <div className="p-2 border rounded-md">
              <div className="font-medium mb-1">Decrypt</div>
              <div className="text-muted-foreground">Client-side</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
