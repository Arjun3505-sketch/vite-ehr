import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ScanLine, X, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCqNjWgxoGVaiLQDDq9j3FapzUPiHoh-wc";

/**
 * ImageUploader Component with Gemini AI Integration
 * 
 * This component uses Google's Gemini AI (gemini-1.5-flash) to perform:
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
  promptType?: 'diagnosis' | 'prescription' | 'lab-report';
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
Extract the following fields and return ONLY a valid JSON object (no markdown, no code blocks):
{
  "diagnosis": "primary diagnosis or condition",
  "details": "detailed clinical notes including symptoms, treatment plan, medications, observations",
  "severity": "mild|moderate|severe|critical"
}
If any field cannot be determined, use an empty string.`;
      
      case 'prescription':
        return `You are a medical AI assistant. Analyze this prescription document and extract medication information.
Extract the following fields and return ONLY a valid JSON object (no markdown, no code blocks):
{
  "medication": "medication name",
  "dosage": "dosage amount",
  "frequency": "how often to take",
  "duration": "duration of treatment",
  "instructions": "special instructions or notes"
}
If any field cannot be determined, use an empty string.`;
      
      case 'lab-report':
        return `You are a medical AI assistant. Analyze this lab report and extract test information.
Extract the following fields and return ONLY a valid JSON object (no markdown, no code blocks):
{
  "testName": "name of the test",
  "result": "test result value",
  "units": "measurement units",
  "referenceRange": "normal reference range",
  "notes": "any additional notes or observations"
}
If any field cannot be determined, use an empty string.`;
      
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

    try {
      toast({
        title: "Analyzing Document",
        description: "Gemini AI is extracting data from your document...",
      });

      // Continue with AI analysis (no upload yet)
      const base64Data = await fileToBase64(selectedImage);
      const prompt = getPromptForType();

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
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
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      if (text && text.trim().length > 0) {
        // Extract JSON from response - handle markdown code blocks
        let jsonString = text.trim();
        
        // Remove markdown code blocks if present
        jsonString = jsonString.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
        
        // Extract JSON object
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extractedData = JSON.parse(jsonMatch[0]);
            
            // Send the extracted data AND the file object to the parent component
            onDataExtracted(extractedData, selectedImage);
            
            toast({
              title: "Success",
              description: "Document analyzed. Form fields auto-filled. Click Submit to upload.",
            });
          } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            throw new Error("Could not parse AI response. Please try again.");
          }
        } else {
          throw new Error("Could not parse AI response");
        }
      } else {
        toast({
          title: "No Data Found",
          description: "Could not extract information from the document.",
          variant: "destructive",
        });
      }

    } catch (err: any) {
      console.error("Process Error:", err);
      toast({
        title: "Process Failed",
        description: err.message || "Failed to upload or process the document.",
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
