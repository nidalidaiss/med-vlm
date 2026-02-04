import React, { useRef, useState } from 'react';
import { Upload, ZoomIn, ZoomOut, Sun, Maximize, ScanEye, Code2, Film, Settings2, RotateCcw } from 'lucide-react';
import { Finding, ImageState, SensitivityLevel } from '../types';
import { PYTHON_AGENT_SCRIPT } from '../constants';

interface ImageViewerProps {
  imageState: ImageState;
  setImageState: React.Dispatch<React.SetStateAction<ImageState>>;
  findings: Finding[];
  isAnalyzing: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sensitivity: SensitivityLevel;
  onSensitivityChange: (level: SensitivityLevel) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ 
  imageState, 
  setImageState, 
  findings, 
  isAnalyzing,
  onImageUpload,
  sensitivity,
  onSensitivityChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showCode, setShowCode] = useState(false);
  const [showSegmentation, setShowSegmentation] = useState(true);

  // Helper to get color based on severity
  const getBoxColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#EF4444'; // Red
      case 'moderate': return '#EAB308'; // Yellow
      case 'fluid': return '#3B82F6'; // Blue
      default: return '#FFFFFF';
    }
  };

  const handleZoom = (delta: number) => {
    setImageState(prev => ({
      ...prev,
      zoom: Math.max(0.5, Math.min(5, prev.zoom + delta))
    }));
  };

  const handleManualZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setImageState(prev => ({ ...prev, zoom: val }));
  };

  const handleLeveling = (e: React.ChangeEvent<HTMLInputElement>, type: 'brightness' | 'contrast') => {
    setImageState(prev => ({ ...prev, [type]: parseInt(e.target.value) }));
  };

  const handleResetView = () => {
    setImageState(prev => ({
        ...prev,
        zoom: 1,
        pan: { x: 0, y: 0 },
        brightness: 100,
        contrast: 100
    }));
  };
  
  const isVideo = imageState.file?.type.startsWith('video/');

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 relative overflow-hidden">
      
      {/* Top Toolbar */}
      <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/80 backdrop-blur-sm z-10">
        <div className="flex items-center space-x-4">
          <label className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded cursor-pointer transition-colors shadow-sm">
            <Upload size={16} className="mr-2" />
            Upload Scan
            <input type="file" className="hidden" onChange={onImageUpload} accept="image/*,video/*" />
          </label>
          
          <div className="h-6 w-px bg-zinc-800 mx-2"></div>
          
          {/* AI Controls Group */}
          <div className="flex items-center space-x-2 bg-zinc-900/50 p-1 rounded-md border border-zinc-800">
             <Settings2 size={14} className="text-zinc-500 ml-1" />
             <div className="flex bg-zinc-900 rounded p-0.5">
               {(['low', 'standard', 'high'] as SensitivityLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => onSensitivityChange(level)}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-sm capitalize transition-all ${
                      sensitivity === level 
                        ? 'bg-zinc-700 text-white shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {level}
                  </button>
               ))}
            </div>
             <div className="w-px h-4 bg-zinc-700 mx-1"></div>
             {/* SEGMENTATION TOGGLE */}
             <button 
                onClick={() => setShowSegmentation(!showSegmentation)}
                className={`flex items-center space-x-1.5 px-2 py-0.5 rounded transition-colors text-[10px] font-medium border ${showSegmentation ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-transparent text-zinc-500 border-transparent hover:bg-zinc-800'}`}
                title="Toggle AI Segmentation Overlay"
              >
                <ScanEye size={12} />
                <span>SEGMENTATION</span>
                <span className={`w-1.5 h-1.5 rounded-full ${showSegmentation ? 'bg-blue-400 shadow-[0_0_4px_rgba(96,165,250,0.8)]' : 'bg-zinc-600'}`}></span>
              </button>
          </div>
          
          <div className="h-6 w-px bg-zinc-800 mx-2"></div>

          <div className="flex items-center space-x-2 text-zinc-400">
            <Sun size={16} />
            <input 
              type="range" 
              min="50" max="150" 
              value={imageState.brightness} 
              onChange={(e) => handleLeveling(e, 'brightness')}
              className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              title="Brightness"
            />
          </div>
          
           <div className="flex items-center space-x-2 text-zinc-400">
            <div className="w-4 h-4 rounded-full border border-zinc-500 bg-transparent" title="Contrast"></div>
            <input 
              type="range" 
              min="50" max="150" 
              value={imageState.contrast} 
              onChange={(e) => handleLeveling(e, 'contrast')}
              className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              title="Contrast"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowCode(!showCode)}
            className={`p-2 rounded hover:bg-zinc-800 transition-colors ${showCode ? 'text-blue-400 bg-zinc-900' : 'text-zinc-400'}`}
            title="View Agent Script"
          >
            <Code2 size={18} />
          </button>
          
          <div className="h-6 w-px bg-zinc-800"></div>

          {/* ZOOM CONTROLS */}
          <div className="flex items-center space-x-2 bg-zinc-900/50 p-1 rounded border border-zinc-800">
            <button onClick={() => handleZoom(-0.2)} className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors" title="Zoom Out"><ZoomOut size={14} /></button>
            <input 
                type="range" 
                min="0.5" 
                max="5" 
                step="0.1" 
                value={imageState.zoom} 
                onChange={handleManualZoom}
                className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                title="Zoom Level"
            />
            <button onClick={() => handleZoom(0.2)} className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors" title="Zoom In"><ZoomIn size={14} /></button>
            <button onClick={handleResetView} className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded transition-colors ml-1 border-l border-zinc-700 pl-2" title="Reset View"><RotateCcw size={12} /></button>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      <div 
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center bg-[#050505] overflow-hidden"
      >
        {imageState.previewUrl ? (
          <div 
            className="relative transition-transform duration-200 ease-out flex items-center justify-center"
            style={{ 
              transform: `scale(${imageState.zoom})`,
              filter: `brightness(${imageState.brightness}%) contrast(${imageState.contrast}%)`
            }}
          >
             {/* Media Content */}
            {isVideo ? (
               <div className="relative">
                 <div className="absolute top-2 left-2 z-20 flex gap-2">
                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center animate-pulse">
                        <Film size={10} className="mr-1"/> VOLUMETRIC SEQUENCE
                    </span>
                 </div>
                 <video 
                   src={imageState.previewUrl} 
                   controls 
                   loop 
                   muted
                   className="max-h-[80vh] max-w-[90%] shadow-2xl rounded-sm"
                 />
               </div>
            ) : (
                <img 
                  src={imageState.previewUrl} 
                  alt="Medical Scan" 
                  className="max-h-[80vh] max-w-[90%] object-contain shadow-2xl"
                />
            )}
            
            {/* SVG Overlay for Segmentation & Bounding Boxes */}
            {showSegmentation && (
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
              >
                {findings.map((finding, idx) => {
                  const color = getBoxColor(finding.severity);
                  return (
                    <g key={idx} className="group">
                      {/* Render Polygon if available (True Segmentation) */}
                      {finding.polygon && finding.polygon.length > 0 ? (
                         <polygon 
                           points={finding.polygon.map(p => `${p.x},${p.y}`).join(' ')}
                           fill={color}
                           fillOpacity="0.2"
                           stroke={color}
                           strokeWidth="2"
                           className="transition-all duration-300 hover:fill-opacity-40 hover:stroke-[4]"
                         />
                      ) : (
                        /* Fallback to Box if no polygon */
                        <rect
                          x={finding.coordinates.xmin}
                          y={finding.coordinates.ymin}
                          width={finding.coordinates.xmax - finding.coordinates.xmin}
                          height={finding.coordinates.ymax - finding.coordinates.ymin}
                          fill={color}
                          fillOpacity="0.1"
                          stroke={color}
                          strokeWidth="2"
                          className="transition-all duration-300 hover:fill-opacity-20 hover:stroke-[4]"
                        />
                      )}
                      
                      {/* Label Label */}
                      <text
                         x={finding.coordinates.xmin}
                         y={Math.max(0, finding.coordinates.ymin - 10)}
                         fill="white"
                         fontSize="24" // Scaled for 1000x1000 viewbox
                         fontWeight="bold"
                         className="opacity-0 group-hover:opacity-100 transition-opacity"
                         style={{ textShadow: '0px 0px 4px black' }}
                      >
                        {finding.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        ) : (
          <div className="text-center text-zinc-600">
            <Maximize size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">Select a patient or upload a scan (Image or Video)</p>
          </div>
        )}

        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
             <div className="flex space-x-2 mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
             </div>
             <p className="text-blue-400 font-mono text-sm tracking-wider">VLM AGENT ANALYZING STRUCTURES...</p>
             <p className="text-zinc-400 text-xs mt-2 font-mono">Sensitivity: {sensitivity.toUpperCase()}</p>
          </div>
        )}

        {/* Python Script Viewer Modal */}
        {showCode && (
          <div className="absolute inset-0 bg-black/95 z-40 p-8 overflow-auto font-mono text-sm animate-in fade-in duration-200">
             <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800">
                <h3 className="text-green-400 font-bold flex items-center gap-2">
                   <Code2 size={16}/> agent_vision_logic.py
                </h3>
                <button onClick={() => setShowCode(false)} className="text-zinc-500 hover:text-white">Close</button>
             </div>
             <pre className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
               {PYTHON_AGENT_SCRIPT}
             </pre>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="h-8 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between px-4 text-[10px] text-zinc-500 font-mono">
        <span>MODE: DIAGNOSTIC_V3</span>
        <span>ENGINE: GEMINI_3_FLASH</span>
        <span>SENSITIVITY: {sensitivity.toUpperCase()}</span>
      </div>
    </div>
  );
};