
import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/Button';
import { 
  Box, 
  Image as ImageIcon, 
  Type, 
  Layers, 
  Layout, 
  Heart, 
  Triangle,
  Undo2,
  Redo2,
  Printer,
  HelpCircle,
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  ArrowLeft,
  Check
} from 'lucide-react';

type TabType = 'product' | 'images' | 'text' | 'layers' | 'templates' | 'cliparts' | 'shapes';

interface DesignerLabProps {
  onBack: () => void;
  onSave: (imageData: string, stateData: string) => void;
  initialColor: string;
  productType: string;
  initialState?: string;
}

export const DesignerLab: React.FC<DesignerLabProps> = ({ onBack, onSave, initialColor, productType, initialState }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('text');
  const [zoom, setZoom] = useState(100);
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);
  const [, setTick] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const forceUpdate = () => setTick(t => t + 1);

  const toHex = (color: any): string => {
    if (!color) return '#000000';
    try {
      const colorStr = typeof color === 'string' ? color : color.toString();
      const c = new fabric.Color(colorStr);
      const hex = c.toHex().toLowerCase();
      return hex.startsWith('#') ? hex : '#' + hex;
    } catch (e) {
      return '#000000';
    }
  };

  const textColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
  ];

  useEffect(() => {
    if (!canvasRef.current) return;
    let isMounted = true;

    // Dispose existing canvas if any (safety check for Strict Mode)
    if (fabricCanvas.current) {
      fabricCanvas.current.dispose();
      fabricCanvas.current = null;
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 800,
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
    });

    fabricCanvas.current = canvas;

    // Create clip path for the print area
    const clipRect = new fabric.Rect({
      left: 400,
      top: 380,
      width: 320,
      height: 440,
      originX: 'center',
      originY: 'center',
      absolutePositioned: true
    });

    // Apply clip path to all user-added objects
    const applyClipPath = (obj: fabric.Object) => {
      if (obj && (obj as any).id !== 'background-guide' && (obj as any).id !== 'print-area') {
        obj.set({
          clipPath: clipRect,
          objectCaching: false
        });
      }
    };

    const safeRender = () => {
      if (isMounted && fabricCanvas.current && fabricCanvas.current.getContext()) {
        fabricCanvas.current.renderAll();
      }
    };

    canvas.on('object:added', (e) => {
      if (e.target) applyClipPath(e.target);
      forceUpdate();
    });

    const initCanvas = async () => {
      let isDark = false;
      try {
        const colorSource = new fabric.Color(initialColor || '#ffffff').getSource();
        const brightness = (colorSource[0] * 299 + colorSource[1] * 587 + colorSource[2] * 114) / 1000;
        isDark = brightness < 128;
      } catch (e) {
        isDark = false;
      }
      
      if (initialState) {
        try {
          canvas.loadFromJSON(initialState, () => {
            if (!isMounted || !fabricCanvas.current || fabricCanvas.current !== canvas) return;
            
            // Update print area color to match current selection
            const objects = canvas.getObjects();
            const printArea = objects.find(obj => (obj as any).id === 'print-area');
            if (printArea) {
              printArea.set({
                fill: initialColor || '#ffffff',
                left: 400,
                top: 380
              });
            }

            // Re-apply clip path to all loaded objects
            objects.forEach(obj => {
              applyClipPath(obj);
            });
            
            safeRender();
          });
        } catch (err) {
          console.error("Error loading canvas state:", err);
        }
      } else {
        // Load T-shirt background (placeholder URL for simulation)
        fabric.Image.fromURL('https://picsum.photos/seed/tshirt/600/700', (img) => {
          if (!isMounted || !fabricCanvas.current || fabricCanvas.current !== canvas) return;
          
          img.set({
            selectable: false,
            evented: false,
            opacity: 0.1, 
            left: 400,
            top: 400,
            originX: 'center',
            originY: 'center',
          });
          (img as any).id = 'background-guide';
          canvas.add(img);
          canvas.sendToBack(img);
          
          // Add print area
          const printArea = new fabric.Rect({
            left: 400,
            top: 380,
            width: 320,
            height: 440,
            fill: initialColor || '#ffffff', // Use the color from OrderForm
            stroke: 'rgba(79, 70, 229, 0.2)',
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center',
            shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.1)', blur: 20 })
          });
          (printArea as any).id = 'print-area';
          canvas.add(printArea);
          printArea.sendToBack();
          safeRender();
        }, { crossOrigin: 'anonymous' });
      }
    };

    initCanvas();

    canvas.on('object:modified', () => forceUpdate());
    canvas.on('object:rotating', () => forceUpdate());
    canvas.on('object:scaling', () => forceUpdate());
    canvas.on('object:moving', () => forceUpdate());

    canvas.on('selection:created', (e) => setActiveObject(e.selected?.[0] || null));
    canvas.on('selection:updated', (e) => setActiveObject(e.selected?.[0] || null));
    canvas.on('selection:cleared', () => setActiveObject(null));

    return () => {
      isMounted = false;
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
    };
  }, [initialColor, initialState]);

  const handleZoom = (value: number) => {
    const newZoom = Math.max(50, Math.min(200, value));
    setZoom(newZoom);
    if (fabricCanvas.current) {
      fabricCanvas.current.setZoom(newZoom / 100);
    }
  };

  const addText = () => {
    if (!fabricCanvas.current) return;
    let isDark = false;
    try {
      const colorSource = new fabric.Color(initialColor || '#ffffff').getSource();
      const brightness = (colorSource[0] * 299 + colorSource[1] * 587 + colorSource[2] * 114) / 1000;
      isDark = brightness < 128;
    } catch (e) {
      isDark = false;
    }
    
    const text = new fabric.IText('Your Text', {
      left: 400,
      top: 380,
      fontFamily: 'Inter',
      fontSize: 40,
      fill: isDark ? '#FFFFFF' : '#000000',
      originX: 'center',
      originY: 'center',
    });
    fabricCanvas.current.add(text);
    fabricCanvas.current.setActiveObject(text);
    setActiveObject(text);
    forceUpdate();
  };

  const setTextColor = (color: string) => {
    const canvas = fabricCanvas.current;
    if (!canvas || !canvas.getContext()) return;
    
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    activeObj.set('fill', color);
    canvas.requestRenderAll();
    forceUpdate();
  };

  const rotateObject = (angle: number) => {
    const canvas = fabricCanvas.current;
    if (!canvas || !canvas.getContext()) return;
    
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    activeObj.rotate(angle);
    canvas.requestRenderAll();
    forceUpdate();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas.current) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result;
      if (typeof data !== 'string') return;

      fabric.Image.fromURL(data, (img) => {
        if (!fabricCanvas.current) return;
        
        // Scale down if too large
        const maxWidth = 300;
        const maxHeight = 300;
        if (img.width! > maxWidth || img.height! > maxHeight) {
          const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!);
          img.scale(scale);
        }

        img.set({
          left: 400,
          top: 380,
          originX: 'center',
          originY: 'center',
        });

        fabricCanvas.current.add(img);
        fabricCanvas.current.setActiveObject(img);
      });
    };
    reader.readAsDataURL(file);
  };

  const deleteObject = () => {
    if (!activeObject || !fabricCanvas.current || !fabricCanvas.current.getContext()) return;
    fabricCanvas.current.remove(activeObject);
    fabricCanvas.current.discardActiveObject();
    fabricCanvas.current.requestRenderAll();
    setActiveObject(null);
    forceUpdate();
  };

  const handleSave = () => {
    if (!fabricCanvas.current) return;
    
    // Save current zoom to restore later
    const currentZoom = fabricCanvas.current.getZoom();
    
    // Reset zoom for consistent export coordinates
    fabricCanvas.current.setZoom(1);
    
    // Find print area and background guide
    const objects = fabricCanvas.current.getObjects();
    const printArea = objects.find(obj => (obj as any).id === 'print-area');
    const backgroundGuide = objects.find(obj => (obj as any).id === 'background-guide');
    
    // Hide them for export
    if (printArea) printArea.set('visible', false);
    if (backgroundGuide) backgroundGuide.set('visible', false);
    
    // Export only the print area content
    // Print area: left: 400, top: 380, width: 320, height: 440, origin: center
    // Top-left: x = 400 - 160 = 240, y = 380 - 220 = 160
    const dataUrl = fabricCanvas.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2, // Higher resolution for printing
      left: 240,
      top: 160,
      width: 320,
      height: 440
    });
    
    // Restore visibility and zoom
    if (printArea) printArea.set('visible', true);
    if (backgroundGuide) backgroundGuide.set('visible', true);
    fabricCanvas.current.setZoom(currentZoom);
    if (fabricCanvas.current.getContext()) {
      fabricCanvas.current.renderAll();
    }
    
    const stateJson = JSON.stringify(fabricCanvas.current.toJSON(['id']));
    onSave(dataUrl, stateJson);
  };

  const SidebarIcon = ({ type, icon: Icon, label }: { type: TabType, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(type)}
      className={`w-full py-4 flex flex-col items-center gap-1 transition-all border-b border-gray-800/50 ${
        activeTab === type ? 'bg-[#3d4446] text-[#00cec9]' : 'text-gray-400 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-[#ebeced] flex flex-col font-sans overflow-hidden z-50">
      {/* Top Bar */}
      <div className="h-14 bg-[#2d3436] flex items-center justify-between px-4 text-white shrink-0 shadow-lg z-20">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00cec9] rounded-lg flex items-center justify-center">
              <Triangle className="text-white fill-white rotate-180" size={16} />
            </div>
            <span className="font-black tracking-tighter text-xl italic">LUMISE</span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-6 text-[11px] font-black uppercase tracking-widest text-gray-400">
            <button className="hover:text-white transition-colors">File</button>
            <button className="hover:text-white transition-colors">Designs</button>
            <button className="hover:text-white transition-colors">Print</button>
            <button className="hover:text-white transition-colors">Help</button>
            <div className="h-4 w-[1px] bg-gray-700 mx-1" />
            <button className="hover:text-white flex items-center gap-1.5 transition-colors"><Undo2 size={14} /> Undo</button>
            <button className="hover:text-white flex items-center gap-1.5 transition-colors"><Redo2 size={14} /> Redo</button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleSave}
            className="bg-[#00cec9] hover:bg-[#00b894] px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <Check size={16} /> Finish Design
          </button>
          <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-gray-600">
            <ArrowLeft size={14} /> Cancel
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Icons */}
        <div className="w-20 bg-[#2d3436] flex flex-col shrink-0 z-10">
          <SidebarIcon type="product" icon={Box} label="Product" />
          <SidebarIcon type="images" icon={ImageIcon} label="Images" />
          <SidebarIcon type="text" icon={Type} label="Text" />
          <SidebarIcon type="layers" icon={Layers} label="Layers" />
          <SidebarIcon type="templates" icon={Layout} label="Templates" />
          <SidebarIcon type="cliparts" icon={Heart} label="Cliparts" />
          <SidebarIcon type="shapes" icon={Triangle} label="Shapes" />
        </div>

        {/* Active Tab Panel */}
        <div className="w-72 bg-[#3d4446] text-white p-6 overflow-y-auto shrink-0 border-l border-gray-800 shadow-2xl z-10">
          {activeTab === 'text' && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
              <h2 className="text-base font-bold tracking-tight">Add Text</h2>
              <Button onClick={addText} variant="primary" fullWidth className="bg-[#00cec9] hover:bg-[#00b894] border-none text-[10px] font-black uppercase tracking-widest">
                Add New Text
              </Button>
              
              <div className="pt-6 border-t border-gray-700">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 block">Popular Fonts</label>
                <div className="space-y-2">
                  {['Inter', 'Playfair Display', 'Space Grotesk', 'JetBrains Mono'].map(font => (
                    <button 
                      key={font} 
                      onClick={() => {
                        if (activeObject && activeObject.type === 'i-text') {
                          (activeObject as fabric.IText).set('fontFamily', font);
                          fabricCanvas.current?.renderAll();
                          forceUpdate();
                        }
                      }}
                      className="w-full text-left p-3 rounded-xl bg-[#2d3436] hover:bg-gray-700 transition-colors text-sm" 
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
              <h2 className="text-base font-bold tracking-tight">Upload Images</h2>
              <p className="text-xs text-gray-400">Upload your own logo or design to place on the product.</p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="primary" 
                fullWidth 
                className="bg-[#00cec9] hover:bg-[#00b894] border-none text-[10px] font-black uppercase tracking-widest py-6 flex flex-col gap-2"
              >
                <ImageIcon size={24} />
                <span>Choose Image</span>
              </Button>

              <div className="pt-6 border-t border-gray-700">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Requirements</p>
                <ul className="text-[10px] text-gray-400 space-y-1 list-disc pl-4">
                  <li>High resolution PNG or JPG</li>
                  <li>Transparent background preferred</li>
                  <li>Max file size: 5MB</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'layers' && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
              <h2 className="text-base font-bold tracking-tight">Layers</h2>
              <div className="space-y-2">
                {fabricCanvas.current?.getObjects().filter(obj => (obj as any).id !== 'background-guide' && (obj as any).id !== 'print-area').reverse().map((obj, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      fabricCanvas.current?.setActiveObject(obj);
                      fabricCanvas.current?.renderAll();
                      setActiveObject(obj);
                    }}
                    className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                      activeObject === obj ? 'bg-[#00cec9] text-white' : 'bg-[#2d3436] hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs opacity-50">#{i + 1}</span>
                      <span className="text-xs font-bold uppercase tracking-widest">
                        {obj.type === 'i-text' ? 'Text' : obj.type === 'image' ? 'Image' : 'Object'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          obj.bringForward();
                          fabricCanvas.current?.renderAll();
                        }}
                        className="p-1 hover:bg-white/20 rounded"
                      >
                        ↑
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          obj.sendBackwards();
                          fabricCanvas.current?.renderAll();
                        }}
                        className="p-1 hover:bg-white/20 rounded"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
                {fabricCanvas.current?.getObjects().filter(obj => (obj as any).id !== 'background-guide' && (obj as any).id !== 'print-area').length > 0 && (
                  <Button 
                    onClick={() => {
                      if (!fabricCanvas.current) return;
                      fabricCanvas.current.getObjects().forEach(obj => {
                        if ((obj as any).id !== 'background-guide' && (obj as any).id !== 'print-area') {
                          fabricCanvas.current?.remove(obj);
                        }
                      });
                      fabricCanvas.current.renderAll();
                      setActiveObject(null);
                    }} 
                    variant="outline" 
                    fullWidth 
                    className="mt-4 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest"
                  >
                    Clear All Layers
                  </Button>
                )}
                {fabricCanvas.current?.getObjects().filter(obj => (obj as any).id !== 'background-guide' && (obj as any).id !== 'print-area').length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-8 italic">No layers yet. Add some text or images!</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
              <h2 className="text-base font-bold tracking-tight">Templates</h2>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div 
                    key={i} 
                    onClick={() => {
                      if (!fabricCanvas.current) return;
                      const url = `https://picsum.photos/seed/template${i}/400/400`;
                      fabric.Image.fromURL(url, (img) => {
                        if (!fabricCanvas.current) return;
                        img.scaleToWidth(200);
                        img.set({
                          left: 400,
                          top: 380,
                          originX: 'center',
                          originY: 'center',
                        });
                        fabricCanvas.current.add(img);
                        fabricCanvas.current.setActiveObject(img);
                        setActiveObject(img);
                        forceUpdate();
                      }, { crossOrigin: 'anonymous' });
                    }}
                    className="aspect-square bg-[#2d3436] rounded-xl border border-gray-700 hover:border-[#00cec9] transition-all cursor-pointer flex items-center justify-center group overflow-hidden"
                  >
                    <img 
                      src={`https://picsum.photos/seed/template${i}/200/200`} 
                      alt="Template" 
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 text-center italic">Click a template to add it to your design.</p>
            </div>
          )}

          {activeTab === 'cliparts' && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
              <h2 className="text-base font-bold tracking-tight">Cliparts</h2>
              <div className="grid grid-cols-3 gap-3">
                {['❤️', '⭐', '🔥', '🚀', '🌈', '⚡', '🍀', '💎', '🎨'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => {
                      if (!fabricCanvas.current) return;
                      const text = new fabric.IText(emoji, {
                        left: 400,
                        top: 380,
                        fontSize: 60,
                        originX: 'center',
                        originY: 'center',
                      });
                      fabricCanvas.current.add(text);
                      fabricCanvas.current.setActiveObject(text);
                      setActiveObject(text);
                      forceUpdate();
                    }}
                    className="aspect-square bg-[#2d3436] rounded-xl border border-gray-700 hover:border-[#00cec9] transition-all flex items-center justify-center text-2xl"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'shapes' && (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
              <h2 className="text-base font-bold tracking-tight">Shapes</h2>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => {
                    if (!fabricCanvas.current) return;
                    const rect = new fabric.Rect({
                      left: 400,
                      top: 380,
                      width: 100,
                      height: 100,
                      fill: '#00cec9',
                      originX: 'center',
                      originY: 'center',
                    });
                    fabricCanvas.current.add(rect);
                    fabricCanvas.current.setActiveObject(rect);
                    setActiveObject(rect);
                    forceUpdate();
                  }}
                  className="aspect-square bg-[#2d3436] rounded-xl border border-gray-700 hover:border-[#00cec9] transition-all flex items-center justify-center"
                >
                  <div className="w-8 h-8 bg-[#00cec9]" />
                </button>
                <button 
                  onClick={() => {
                    if (!fabricCanvas.current) return;
                    const circle = new fabric.Circle({
                      left: 400,
                      top: 380,
                      radius: 50,
                      fill: '#ff7675',
                      originX: 'center',
                      originY: 'center',
                    });
                    fabricCanvas.current.add(circle);
                    fabricCanvas.current.setActiveObject(circle);
                    setActiveObject(circle);
                    forceUpdate();
                  }}
                  className="aspect-square bg-[#2d3436] rounded-xl border border-gray-700 hover:border-[#00cec9] transition-all flex items-center justify-center"
                >
                  <div className="w-8 h-8 rounded-full bg-[#ff7675]" />
                </button>
                <button 
                  onClick={() => {
                    if (!fabricCanvas.current) return;
                    const triangle = new fabric.Triangle({
                      left: 400,
                      top: 380,
                      width: 100,
                      height: 100,
                      fill: '#fab1a0',
                      originX: 'center',
                      originY: 'center',
                    });
                    fabricCanvas.current.add(triangle);
                    fabricCanvas.current.setActiveObject(triangle);
                    setActiveObject(triangle);
                    forceUpdate();
                  }}
                  className="aspect-square bg-[#2d3436] rounded-xl border border-gray-700 hover:border-[#00cec9] transition-all flex items-center justify-center"
                >
                  <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[32px] border-b-[#fab1a0]" />
                </button>
              </div>
            </div>
          )}

          {/* Shared Properties Panel (Visible when any object is selected) */}
          {activeObject && (
            <div className="mt-auto pt-6 border-t border-gray-700 space-y-6 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#00cec9]">Object Properties</h3>
                <span className="text-[9px] bg-gray-700 px-2 py-0.5 rounded text-gray-400 uppercase">{activeObject.type}</span>
              </div>

              {(activeObject.type === 'i-text' || activeObject.type === 'rect' || activeObject.type === 'circle' || activeObject.type === 'triangle') && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Color</label>
                  <div className="flex items-center gap-3 bg-[#2d3436] p-3 rounded-xl border border-gray-700">
                    <div className="w-10 h-10 rounded border border-gray-600 overflow-hidden shrink-0 relative">
                      <input 
                        type="color" 
                        value={toHex(activeObject.fill)} 
                        onChange={(e) => setTextColor(e.target.value)}
                        className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                      />
                    </div>
                    <span className="text-xs font-mono uppercase flex-1">{toHex(activeObject.fill)}</span>
                  </div>
                  
                  {/* Preset Colors */}
                  <div className="flex flex-wrap gap-2">
                    {textColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setTextColor(color)}
                        className={`w-6 h-6 rounded-full border border-white/10 transition-transform hover:scale-110 active:scale-95 ${
                          toHex(activeObject.fill) === color.toLowerCase() ? 'ring-2 ring-[#00cec9] ring-offset-2 ring-offset-[#3d4446]' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block flex justify-between">
                  <span>Rotation</span>
                  <span className="text-[#00cec9]">{Math.round(activeObject.angle || 0)}°</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="360" 
                  value={Math.round(activeObject.angle || 0)} 
                  onChange={(e) => rotateObject(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-[#00cec9]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => {
                    activeObject.bringForward();
                    fabricCanvas.current?.renderAll();
                    forceUpdate();
                  }} 
                  variant="outline" 
                  className="text-[9px] font-black uppercase tracking-widest py-2"
                >
                  Bring Forward
                </Button>
                <Button 
                  onClick={() => {
                    activeObject.sendBackwards();
                    fabricCanvas.current?.renderAll();
                    forceUpdate();
                  }} 
                  variant="outline" 
                  className="text-[9px] font-black uppercase tracking-widest py-2"
                >
                  Send Backward
                </Button>
              </div>

              <Button onClick={deleteObject} variant="outline" fullWidth className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest">
                Delete Object
              </Button>
            </div>
          )}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative flex items-center justify-center p-10 overflow-hidden bg-[#ebeced]">
          {/* Status Message */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-white shadow-xl z-10">
            <div className="flex items-center gap-3 text-[11px] font-bold text-gray-600">
              <HelpCircle size={16} className="text-[#4f46e5]" />
              <span>Design mode active for: <span className="text-[#00cec9]">{productType}</span></span>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
              Editing Print Area
            </div>
          </div>

          {/* Fabric Canvas Container */}
          <div className="bg-white shadow-[0_40px_100px_rgba(0,0,0,0.15)] rounded-lg overflow-hidden relative z-0">
            <canvas ref={canvasRef} />
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-8 right-8 flex items-center gap-4 bg-[#2d3436] text-white px-5 py-3 rounded-2xl shadow-2xl z-10 border border-gray-700">
            <button onClick={() => handleZoom(zoom - 10)} className="hover:text-[#00cec9] transition-colors p-1"><Minus size={18} /></button>
            <div className="flex items-center gap-4">
              <div className="w-32 h-1.5 bg-gray-700 rounded-full relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-[#00cec9] transition-all duration-300" style={{ width: `${(zoom / 200) * 100}%` }} />
              </div>
              <span className="text-[11px] font-black w-10 text-center tracking-tighter">{zoom}%</span>
            </div>
            <button onClick={() => handleZoom(zoom + 10)} className="hover:text-[#00cec9] transition-colors p-1"><Plus size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};
