import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ScanLine, X, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ;
console.log("VITE_GEMINI_API_KEY:", import.meta.env.VITE_GEMINI_API_KEY);

/**
 * ImageUploader Component with Gemini AI Integration
 * 
 * This component uses Google's Gemini AI (gemini-2.5-flash) to perform:
 * 1. OCR (Optical Character Recognition) - Extract text from images
 * 2. NLP (Natural Language Processing) - Understand and structure medical data
 * 
 * The AI analyzes medical documents and returns structured JSON data
 * specific to the document type (diagnosis, prescription, lab report).
 * 
 * @param onDataExtracted - Callback function that receives extracted structured data
 * @param acceptedFormats - File types accepted (default: common image formats)
 * @param label - Display label for the component
 * @param promptType - Type of medical document to analyze (affects AI prompt and output structure)
 */
interface ImageUploaderProps {
  onDataExtracted: (data: any, file?: File) => void;
  acceptedFormats?: string;
  label?: string;
  promptType?: 'diagnosis' | 'prescription' | 'lab-report' | 'surgery';
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onDataExtracted,
  acceptedFormats = "image/png, image/jpeg, image/jpg, image/webp, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  label = "AI-Powered Document Scanner",
  promptType = 'diagnosis'
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const getPromptForType = () => {
    switch(promptType) {
      case 'diagnosis':
        return `You are a medical AI assistant. Analyze this medical document and extract diagnosis information.
Extract the following fields and return ONLY a valid JSON object (no markdown, no code blocks, no explanations):
{
  "patientId": "patient ID or medical record number",
  "date": "date of diagnosis in YYYY-MM-DD format",
  "diagnosis": "primary diagnosis or condition",
  "details": "detailed clinical notes including symptoms, treatment plan, medications, observations",
  "severity": "mild|moderate|severe|critical"
}
If any field cannot be determined, use an empty string. Return ONLY the JSON object, nothing else.`;
      
      case 'prescription':
        return `You are a medical AI assistant. Analyze this prescription document and extract medication information.
Extract the following fields and return ONLY a valid JSON object (no markdown, no code blocks, no explanations):
{
  "patientId": "patient ID or medical record number",
  "startDate": "prescription start date in YYYY-MM-DD format",
  "expiryDate": "prescription expiry date in YYYY-MM-DD format",
  "remarks": "general prescription notes or instructions",
  "medications": [
    {
      "name": "medication name",
      "dosage": "dosage amount",
      "frequency": "how often to take",
      "duration": "duration of treatment",
      "instructions": "special instructions for this medication"
    }
  ]
}
If multiple medications are listed, include them all in the medications array. If any field cannot be determined, use an empty string. Return ONLY the JSON object, nothing else.`;
      
      case 'lab-report':
        return `You are a medical AI assistant. Analyze this lab report and extract test information.
Extract the following fields and return ONLY a valid JSON object (no markdown, no code blocks, no explanations):
{
  "patientId": "patient ID or medical record number",
  "date": "date of the test in YYYY-MM-DD format",
  "testType": "type or name of the test performed",
  "remarks": "test results, findings, observations, and any additional notes"
}
If any field cannot be determined, use an empty string. Return ONLY the JSON object, nothing else.`;
      
      case 'surgery':
        return `You are a medical AI assistant. Analyze this surgery document and extract surgical procedure information.
Extract the following fields and return ONLY a valid JSON object (no markdown, no code blocks, no explanations):
{
  "patientId": "patient ID or medical record number",
  "date": "date of surgery in YYYY-MM-DD format",
  "procedure": "name of the surgical procedure",
  "outcome": "outcome or result of surgery",
  "complications": "any complications that occurred",
  "icdPcsCode": "ICD-PCS code if available",
  "remarks": "additional notes, findings, or observations"
}
If any field cannot be determined, use an empty string. Return ONLY the JSON object, nothing else.`;
      
      default:
        return '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create preview URL (only for images, not PDFs)
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleProcessImage = async () => {
  if (!selectedImage) return;

  setProcessing(true);

  // Retry wrapper with exponential backoff
  const callWithRetry = async (fn: any, retries = 4, delay = 1200): Promise<any> => {
    try {
      return await fn();
    } catch (err: any) {
      console.error(`⚠️ Gemini call failed. Retries left: ${retries}`, err);

      if (retries === 0) throw err;

      if (err.message?.includes("overloaded") || err.message?.includes("503")) {
        console.warn(`⚠️ Model overloaded. Retrying in ${delay}ms`);
        await new Promise(res => setTimeout(res, delay));
        return callWithRetry(fn, retries - 1, delay * 1.8);
      }

      throw err;
    }
  };

  try {
    toast({
      title: "Analyzing Document",
      description: "Gemini AI is extracting data from your document...",
    });

    // Convert file → base64
    const base64Data = await fileToBase64(selectedImage);

    // Log file + base64 details
    console.log("📄 FILE INFO:", {
      name: selectedImage.name,
      type: selectedImage.type,
      size_MB: (selectedImage.size / 1024 / 1024).toFixed(2),
    });

    console.log("🧪 BASE64 DEBUG:", {
      base64_length: base64Data.length,
      approx_MB: (base64Data.length * 0.75 / 1_000_000).toFixed(2),
    });

    const prompt = getPromptForType();

    // API call block
    const callGemini = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 60000); // 60 seconds timeout

      console.log("🌐 Sending request to Gemini...");

      const fetchBody = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: selectedImage.type,
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        }
      };

      console.log("📤 REQUEST PAYLOAD SUMMARY:", {
        prompt_length: prompt.length,
        payload_mb: (JSON.stringify(fetchBody).length / 1_000_000).toFixed(2)
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fetchBody),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("❌ Gemini Error Response:", errData);
        throw new Error(
          errData.error?.message ||
          `Gemini request failed (${response.status})`
        );
      }

      return response.json();
    };

    // WRAPPED CALL WITH RETRY
    const data = await callWithRetry(callGemini);

    console.log("🔥 RAW GEMINI RESPONSE:", data);
    console.log("🔥 FULL TEXT OUTPUT:", data?.candidates?.[0]?.content?.parts?.[0]?.text);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (text.trim()) {
      let jsonString = text.trim();
      jsonString = jsonString.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

      console.log("📝 CLEANED AI TEXT:", jsonString);

      const match = jsonString.match(/\{[\s\S]*\}/);

      if (match) {
        try {
          const extracted = JSON.parse(match[0]);
          console.log("✅ PARSED JSON:", extracted);

          onDataExtracted(extracted, selectedImage);

          toast({
            title: "Success",
            description: "Document analyzed. Form fields auto-filled.",
          });
        } catch (parseError) {
          console.error("❌ JSON Parse Error:", parseError);
          throw new Error("Could not parse JSON in AI response.");
        }
      } else {
        throw new Error("AI response did not contain a JSON object.");
      }
    } else {
      toast({
        title: "No Data Found",
        description: "Could not extract info from the document.",
        variant: "destructive",
      });
    }

  } catch (err: any) {
    console.error("❌ FINAL ERROR:", err);

    toast({
      title: "Gemini Failed",
      description: err.message || "An unexpected error occurred.",
      variant: "destructive",
    });
  } finally {
    setProcessing(false);
  }
};


  return (
    <div className="space-y-4 p-4 border-2 border-dashed border-primary/25 rounded-lg bg-primary/5">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">{label}</h3>
        <div className="ml-auto">
          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">Gemini AI</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="ocr-upload" className="text-sm text-muted-foreground mb-2 block">
            Upload any document (Image, PDF, DOC, DOCX) to automatically extract and fill form fields
          </Label>
          <Input
            id="ocr-upload"
            type="file"
            accept={acceptedFormats}
            onChange={handleFileChange}
            disabled={processing}
            className="cursor-pointer"
          />
        </div>

        {selectedImage && (
          <div className="relative">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-h-48 rounded-md border object-contain w-full bg-muted"
              />
            ) : (
              <div className="p-4 bg-muted rounded-md flex items-center gap-3">
                <ScanLine className="w-8 h-8 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedImage.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemoveImage}
              disabled={processing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Button 
          type="button"
          onClick={handleProcessImage} 
          disabled={!selectedImage || processing}
          className="w-full"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <Sparkles className="mr-2 h-4 w-4" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <ScanLine className="mr-2 h-4 w-4" />
              <Sparkles className="mr-2 h-4 w-4" />
              Scan and Auto-Fill with AI
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
