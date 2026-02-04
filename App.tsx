import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ImageViewer } from './components/ImageViewer';
import { RightPanel } from './components/RightPanel';
import { ImageState, AnalysisResult, ChatMessage, SensitivityLevel, ResearchResult } from './types';
import { analyzeMedicalImage, chatWithRadiologist, performMedicalResearch } from './services/geminiService';

const App: React.FC = () => {
  const [imageState, setImageState] = useState<ImageState>({
    file: null,
    previewUrl: null,
    brightness: 100,
    contrast: 100,
    zoom: 1,
    pan: { x: 0, y: 0 }
  });

  const [sensitivity, setSensitivity] = useState<SensitivityLevel>('standard');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove Data URL prefix to get raw base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      
      setImageState({
        file,
        previewUrl,
        brightness: 100,
        contrast: 100,
        zoom: 1,
        pan: { x: 0, y: 0 }
      });
      
      // Reset state
      setAnalysis(null);
      setResearchResult(null);
      setChatHistory([]);
      
      // Trigger Analysis
      setIsAnalyzing(true);
      try {
        const base64 = await fileToBase64(file);
        const result = await analyzeMedicalImage(base64, file.type, sensitivity);
        setAnalysis(result);
      } catch (error) {
        console.error("Analysis Error", error);
        alert("Failed to analyze scan. Ensure API Key is valid and file format is supported.");
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleReanalyze = async (newSensitivity: SensitivityLevel) => {
     setSensitivity(newSensitivity);
     if (imageState.file) {
        setIsAnalyzing(true);
        try {
          const base64 = await fileToBase64(imageState.file);
          const result = await analyzeMedicalImage(base64, imageState.file.type, newSensitivity);
          setAnalysis(result);
        } catch (error) {
          console.error("Re-analysis Error", error);
        } finally {
          setIsAnalyzing(false);
        }
     }
  };

  const handlePerformResearch = async (query: string) => {
    setIsSearching(true);
    try {
      const result = await performMedicalResearch(query);
      setResearchResult(result);
    } catch (error) {
      console.error("Research Error", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChatMessage = async (msg: string) => {
    if (!imageState.file) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: msg,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, newMsg]);
    setIsChatLoading(true);

    try {
      const base64 = await fileToBase64(imageState.file);
      const simpleHistory = chatHistory.map(m => ({ role: m.role, text: m.text }));
      
      const { text, newFindings } = await chatWithRadiologist(
        simpleHistory, 
        msg, 
        base64, 
        imageState.file.type
      );

      const responseMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text || "I couldn't generate a text response, but I may have updated the findings.",
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, responseMsg]);

      // If Chat detected new objects, add them to the analysis findings
      if (newFindings && newFindings.length > 0 && analysis) {
        setAnalysis(prev => prev ? ({
          ...prev,
          findings: [...prev.findings, ...newFindings]
        }) : null);
      }

    } catch (error) {
      console.error("Chat Error", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I encountered an error processing your request.",
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-black text-zinc-100 overflow-hidden">
      <Sidebar />
      <ImageViewer 
        imageState={imageState} 
        setImageState={setImageState}
        findings={analysis?.findings || []}
        isAnalyzing={isAnalyzing}
        onImageUpload={handleImageUpload}
        sensitivity={sensitivity}
        onSensitivityChange={handleReanalyze}
      />
      <RightPanel 
        analysis={analysis}
        researchResult={researchResult}
        chatHistory={chatHistory}
        onSendMessage={handleChatMessage}
        onResearch={handlePerformResearch}
        isChatLoading={isChatLoading}
        isSearching={isSearching}
      />
    </div>
  );
};

export default App;