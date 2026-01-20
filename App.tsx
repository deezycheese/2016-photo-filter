
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CameraFilter, Photo, CameraMode } from './types';
import { FILTERS, VINTAGE_GRAIN_SVG } from './constants';
import { Icons } from './components/Icon';
import { enhancePhotoWithAI } from './services/geminiService';

const App: React.FC = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [activeFilter, setActiveFilter] = useState<CameraFilter>(FILTERS[0]);
  const [mode, setMode] = useState<CameraMode>(CameraMode.AUTO);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [exposure, setExposure] = useState(0.5);
  const [zoom, setZoom] = useState(1);
  const [flash, setFlash] = useState(false);
  
  // Editor State
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [selectedFilterId, setSelectedFilterId] = useState<string>('none');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    initCamera();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.filter = `${activeFilter.css} brightness(${1 + exposure * 0.2})`;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      context.globalCompositeOperation = 'screen';
      context.globalAlpha = 0.15;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1.0;
      
      const imageUrl = canvas.toDataURL('image/png');
      const newPhoto: Photo = {
        id: Date.now().toString(),
        url: imageUrl,
        timestamp: Date.now(),
        filterId: activeFilter.id,
        isAiEnhanced: false
      };
      
      setPhotos(prev => [newPhoto, ...prev]);
      setTimeout(() => setIsCapturing(false), 150);
    }
  }, [activeFilter, exposure]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const newPhoto: Photo = {
          id: Date.now().toString(),
          url: result,
          timestamp: Date.now(),
          filterId: 'none',
          isAiEnhanced: false
        };
        setPhotos(prev => [newPhoto, ...prev]);
        setEditingPhoto(newPhoto); // Open in editor immediately
        setSelectedFilterId('none');
        setShowGallery(true);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applyFilterToPhoto = (photo: Photo, filter: CameraFilter) => {
    if (!canvasRef.current) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = photo.url;
    img.onload = () => {
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      
      context.filter = filter.css;
      context.drawImage(img, 0, 0);
      
      const bakedUrl = canvas.toDataURL('image/png');
      const updatedPhoto = { ...photo, url: bakedUrl, filterId: filter.id };
      
      setPhotos(prev => prev.map(p => p.id === photo.id ? updatedPhoto : p));
      setEditingPhoto(updatedPhoto);
    };
  };

  const handleAiEnhance = async (photo: Photo) => {
    setIsEnhancing(true);
    const filter = FILTERS.find(f => f.id === selectedFilterId) || activeFilter;
    const enhancedUrl = await enhancePhotoWithAI(photo.url, filter.description);
    if (enhancedUrl) {
      const updatedPhoto = { ...photo, url: enhancedUrl, isAiEnhanced: true };
      setPhotos(prev => prev.map(p => p.id === photo.id ? updatedPhoto : p));
      setEditingPhoto(updatedPhoto);
    }
    setIsEnhancing(false);
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    if (editingPhoto?.id === id) setEditingPhoto(null);
  };

  const downloadPhoto = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `DIGI-PRO-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col md:flex-row">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

      {/* Viewfinder */}
      <div className="relative flex-1 bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
        <video 
          ref={videoRef} autoPlay playsInline muted
          className="w-full h-full object-cover transition-all duration-300"
          style={{ filter: `${activeFilter.css} brightness(${1 + exposure * 0.2})`, transform: `scale(${zoom})`, opacity: isCapturing ? 0.3 : 1 }}
        />
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 mix-blend-screen">
          <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-gradient-to-br from-orange-500/20 via-transparent to-purple-600/10 animate-pulse"></div>
        </div>
        <div className="absolute inset-0 pointer-events-none border-[12px] border-black/40">
          <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(VINTAGE_GRAIN_SVG)}")` }} />
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start mono text-[10px] tracking-widest text-white/80 uppercase">
            <div className="flex gap-4">
              <div className="flex flex-col"><span>ISO</span><span className="text-sm font-bold">400</span></div>
              <div className="flex flex-col"><span>D-RANGE</span><span className="text-sm font-bold text-orange-400">ACTIVE</span></div>
            </div>
            <div className="px-2 py-0.5 border border-white/40 rounded bg-white/5 uppercase">{activeFilter.name}</div>
          </div>
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end mono text-[10px] tracking-widest text-white/80">
            <span className="text-orange-400 font-bold">SENSOR READY</span>
            <div className="text-xs font-bold text-white">{new Date().toLocaleTimeString([], { hour12: false })}</div>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        {isCapturing && <div className="absolute inset-0 bg-white/90 z-50 animate-pulse" />}
      </div>

      {/* Control Panel */}
      <div className="w-full md:w-80 bg-[#0d0d0d] border-t md:border-t-0 md:border-l border-white/10 flex flex-col z-20 overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-[10px] mono text-white/40 uppercase mb-4 tracking-tighter">Film Simulations</h3>
          <div className="grid grid-cols-3 gap-3">
            {FILTERS.map(filter => (
              <button key={filter.id} onClick={() => setActiveFilter(filter)}
                className={`group relative flex flex-col items-center gap-2 ${activeFilter.id === filter.id ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
              >
                <div className={`w-full aspect-square rounded-full border-2 transition-all duration-300 ${activeFilter.id === filter.id ? 'border-orange-500 scale-110 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'border-white/5'}`}
                  style={{ background: `linear-gradient(135deg, #4c1d95, #fbbf24)`, filter: filter.css }}
                />
                <span className="text-[9px] font-bold tracking-tighter uppercase text-white/80">{filter.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-b border-white/10 space-y-6">
           <div className="space-y-3">
              <div className="flex justify-between items-center mono text-[10px] text-white/50"><span>ZOOM</span><span className="text-white">x{zoom.toFixed(1)}</span></div>
              <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none accent-orange-500" />
           </div>
           <div className="space-y-3">
              <div className="flex justify-between items-center mono text-[10px] text-white/50"><span>EXPOSURE</span><span className="text-white">+{exposure} EV</span></div>
              <input type="range" min="-1" max="2" step="0.1" value={exposure} onChange={(e) => setExposure(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none accent-orange-500" />
           </div>
        </div>

        <div className="mt-auto p-8 flex flex-col items-center gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => setShowGallery(true)} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center overflow-hidden">
              {photos.length > 0 ? <img src={photos[0].url} className="w-full h-full object-cover" /> : <Icons.ImageIcon className="w-5 h-5 opacity-40" />}
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center"><Icons.Upload className="w-5 h-5 opacity-40" /></button>
            <button onClick={capturePhoto} className="relative w-24 h-24 rounded-full border-[6px] border-white/10 flex items-center justify-center p-2 group active:scale-95 transition-transform">
              <div className="w-full h-full rounded-full bg-white group-hover:bg-orange-50 shadow-[0_0_30px_rgba(255,255,255,0.3)]"></div>
            </button>
            <button onClick={() => setFlash(!flash)} className={`w-12 h-12 rounded-full border flex items-center justify-center ${flash ? 'bg-orange-500/20 border-orange-500 text-orange-500' : 'border-white/10 text-white opacity-40'}`}><Icons.Zap className="w-5 h-5" /></button>
          </div>
          <div className="text-[9px] mono text-white/20 uppercase tracking-[0.3em] text-center leading-relaxed">PRO-LUME DIGITAL SENSOR<br/>VIBRANT OPTICS ENGINE</div>
        </div>
      </div>

      {/* Gallery Overlay */}
      {showGallery && (
        <div className="fixed inset-0 bg-black/98 z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-6 flex justify-between items-center border-b border-white/5 bg-[#0a0a0a]">
            <h2 className="text-xl font-bold tracking-tighter flex items-center gap-2 text-orange-500"><Icons.ImageIcon className="w-6 h-6" />SENSOR DATA ROLL</h2>
            <button onClick={() => setShowGallery(false)} className="p-2 hover:bg-white/5 rounded-full"><Icons.ChevronRight className="w-8 h-8" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0a]">
            {photos.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/20">
                <Icons.Camera className="w-16 h-16 mb-4 opacity-5" />
                <p className="mono uppercase tracking-[0.2em] text-xs">Waiting for first capture...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} onClick={() => { setEditingPhoto(photo); setSelectedFilterId(photo.filterId); }} className="group relative bg-[#141414] border border-white/5 rounded-lg overflow-hidden flex flex-col cursor-pointer transition-all hover:border-orange-500/50">
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={photo.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      {photo.isAiEnhanced && <div className="absolute top-2 left-2 bg-orange-600 text-white px-1.5 py-0.5 rounded text-[7px] font-bold tracking-widest"><Icons.Sparkles className="w-2 h-2 inline mr-1" />AI</div>}
                    </div>
                    <div className="p-3 flex justify-between items-center mono text-[8px] text-white/30">
                      <span>{FILTERS.find(f => f.id === photo.filterId)?.name || 'RAW'}</span>
                      <Icons.Maximize className="w-2 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Digital Darkroom (Editor) */}
      {editingPhoto && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col lg:flex-row animate-in fade-in duration-300">
           {/* Image Preview */}
           <div className="flex-1 relative bg-black flex items-center justify-center p-4 lg:p-12 overflow-hidden">
              <img 
                src={editingPhoto.url} 
                className="max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(0,0,0,1)] border border-white/5 rounded-sm"
              />
              <div className="absolute top-8 left-8 flex flex-col gap-1 mono text-[10px] text-white/40 uppercase tracking-widest">
                 <div className="flex items-center gap-2"><span className="w-2 h-2 bg-orange-500 rounded-full"></span> DEVELOPING MODE</div>
                 <div>REF: {editingPhoto.id.slice(-8)}</div>
              </div>
              <button onClick={() => setEditingPhoto(null)} className="absolute top-8 right-8 p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors">
                 <Icons.ChevronRight className="w-6 h-6" />
              </button>
           </div>

           {/* Editor Sidebar */}
           <div className="w-full lg:w-[400px] bg-[#0d0d0d] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col overflow-y-auto shadow-2xl">
              <div className="p-8 space-y-8">
                 <div className="space-y-4">
                    <h2 className="text-xs mono text-orange-500/70 font-bold uppercase tracking-[0.2em]">Select Film Stock</h2>
                    <div className="grid grid-cols-2 gap-3">
                       {FILTERS.map(f => (
                          <button 
                            key={f.id} 
                            onClick={() => { setSelectedFilterId(f.id); applyFilterToPhoto(editingPhoto, f); }}
                            className={`p-4 rounded-xl border text-left transition-all ${selectedFilterId === f.id ? 'bg-orange-500/10 border-orange-500 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                          >
                             <div className="text-[10px] font-black tracking-widest uppercase mb-1">{f.name}</div>
                             <div className="text-[8px] leading-relaxed opacity-60 line-clamp-2">{f.description}</div>
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-4 pt-4 border-t border-white/5">
                    <h2 className="text-xs mono text-white/30 uppercase tracking-[0.2em]">Post-Processing Engine</h2>
                    <button
                      disabled={isEnhancing}
                      onClick={() => handleAiEnhance(editingPhoto)}
                      className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 group"
                    >
                       {isEnhancing ? (
                         <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                       ) : (
                         <Icons.Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                       )}
                       {isEnhancing ? 'Developing...' : 'Gemini AI Develop'}
                    </button>
                 </div>

                 <div className="grid grid-cols-2 gap-4 pt-4">
                    <button onClick={() => downloadPhoto(editingPhoto.url)} className="flex items-center justify-center gap-2 py-4 rounded-xl bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200">
                       <Icons.Download className="w-4 h-4" /> EXPORT
                    </button>
                    <button onClick={() => deletePhoto(editingPhoto.id)} className="flex items-center justify-center gap-2 py-4 rounded-xl border border-red-500/30 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10">
                       <Icons.Trash2 className="w-4 h-4" /> PURGE
                    </button>
                 </div>
              </div>
              
              <div className="mt-auto p-8 border-t border-white/5 bg-black/20">
                 <div className="mono text-[8px] text-white/20 uppercase leading-loose">
                    Sensor: 12.2MP CMOS 1/1.7"<br/>
                    Processor: PRO-LUME Engine v4.0<br/>
                    Status: Metadata Synchronized
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Global AI Loading Overlay */}
      {isEnhancing && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-700">
           <div className="relative w-32 h-32 mb-10">
              <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-2 border-white/5 rounded-full animate-pulse"></div>
           </div>
           <p className="text-2xl font-black tracking-tighter text-white mb-2">PRO-GRADE AI DEVELOPMENT</p>
           <p className="text-indigo-400 text-[10px] mono uppercase tracking-[0.4em]">Simulating CCD Sensor Response...</p>
        </div>
      )}
    </div>
  );
};

export default App;
