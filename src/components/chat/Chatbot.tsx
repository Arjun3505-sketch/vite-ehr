import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FLASK_API_URL = "http://localhost:5000";

interface Message {
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  onClose: () => void;
}

export const Chatbot = ({ onClose }: ChatbotProps) => {
  const [patientId, setPatientId] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "Hello! I'm your Medical Data Assistant powered by Gemini AI. Please enter a patient ID to get started.",
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !patientId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both a patient ID and your question.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Step 1: Fetch patient data from Flask backend
      const fetchRes = await axios.post(`${FLASK_API_URL}/fetch`, {
        patient_id: patientId,
      });

      if (!fetchRes.data.success) {
        throw new Error("Failed to fetch patient data");
      }

      const { diagnoses, prescriptions, lab_reports } = fetchRes.data;

      // Show fetching status
      const fetchingMessage: Message = {
        role: "bot",
        content: `📊 Found ${diagnoses.length} diagnoses, ${prescriptions.length} prescriptions, and ${lab_reports.length} lab reports. Analyzing...`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fetchingMessage]);

      // Step 2: Send data + question to AI chatbot
      const chatRes = await axios.post(`${FLASK_API_URL}/chat_with_data`, {
        patient_id: patientId,
        message: userMessage.content,
        diagnoses: diagnoses,
        prescriptions: prescriptions,
        lab_reports: lab_reports,
      });

      if (!chatRes.data.success) {
        throw new Error("Failed to get AI response");
      }

      // Add AI response to messages
      const botMessage: Message = {
        role: "bot",
        content: chatRes.data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      
      toast({
        title: "Response Ready",
        description: "AI has analyzed the patient data.",
      });

    } catch (error: any) {
      console.error("Chatbot error:", error);
      
      let errorMessage = "Sorry, I encountered an error. ";
      
      if (error.response?.status === 404) {
        errorMessage += "Could not connect to the Flask server. Make sure it's running on port 5000.";
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else {
        errorMessage += error.message || "Please try again.";
      }

      const errorMsg: Message = {
        role: "bot",
        content: errorMessage,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMsg]);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      handleSend();
    }
  };

  return (
    <Card className="shadow-2xl border-2 h-[600px] flex flex-col">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <CardTitle className="text-lg">Medical AI Assistant</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-primary-foreground/20 text-primary-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-primary-foreground/80 mt-1">
          Powered by Gemini AI
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {/* Patient ID Input */}
        <div className="space-y-2">
          <Label htmlFor="patient-id" className="text-sm font-medium">
            Patient ID
          </Label>
          <Input
            id="patient-id"
            placeholder="Enter patient ID..."
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "bot" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                
                {msg.role === "user" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-5 h-5 text-secondary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            placeholder="Ask about patient data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim() || !patientId.trim()}
            size="icon"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
