"use client"

import { Info, Shield, Database, Calculator, Lock, Server, ArrowRight } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface AboutSectionProps {
  activeTab: string
}

export default function AboutSection({ activeTab }: AboutSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          {activeTab === "addition" ? "About Homomorphic Addition" : "About Homomorphic Dataset Analysis"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTab === "addition" ? <AdditionAboutContent /> : <DatasetAboutContent />}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground border-t pt-4">
        Information Security - Homomorphic Encryption Demo
      </CardFooter>
    </Card>
  )
}

function AdditionAboutContent() {
  return (
    <>
      <p className="text-muted-foreground">
        Homomorphic addition allows you to add two encrypted numbers without decrypting them first. The server performs
        the addition on the encrypted values and returns the encrypted result, which can then be decrypted by the
        client.
      </p>

      <Separator />

      <div className="grid md:grid-cols-3 gap-4 pt-2">
        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Client-Side Encryption
          </h3>
          <p className="text-sm text-muted-foreground">
            Your numbers are encrypted locally in your browser before being sent to the server.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2">
            <Server className="w-4 h-4" />
            Server-Side Computation
          </h3>
          <p className="text-sm text-muted-foreground">
            The server adds the encrypted numbers without ever seeing the actual values.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            Process Flow
          </h3>
          <p className="text-sm text-muted-foreground">
            Encrypt → Send → Compute → Return → Decrypt, all while preserving data privacy.
          </p>
        </div>
      </div>
    </>
  )
}

function DatasetAboutContent() {
  return (
    <>
      <p className="text-muted-foreground">
        Homomorphic encryption enables secure analysis of sensitive healthcare data. You can perform calculations on
        encrypted dataset rows without exposing the underlying patient information to the server.
      </p>

      <Separator />

      <div className="grid md:grid-cols-3 gap-4 pt-2">
        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2">
            <Database className="w-4 h-4" />
            Healthcare Data Privacy
          </h3>
          <p className="text-sm text-muted-foreground">
            Patient data remains encrypted throughout the entire analysis process, ensuring HIPAA compliance.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Statistical Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            Perform sum, average, median, and other statistical operations on encrypted healthcare metrics.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Secure Collaboration
          </h3>
          <p className="text-sm text-muted-foreground">
            Enable multiple healthcare providers to analyze combined datasets without revealing patient details.
          </p>
        </div>
      </div>
    </>
  )
}
