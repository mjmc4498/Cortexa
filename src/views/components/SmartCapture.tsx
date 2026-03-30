import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Mic, Image as ImageIcon, FileText, Link as LinkIcon, Upload, Loader2, X, CheckCircle2 } from 'lucide-react';
import { processMultimodalCapture } from '../../controllers/services/aiService';
import { useNoteStore } from '../../models/store/useNoteStore';
import { motion, AnimatePresence } from 'motion/react';

export const SmartCapture: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const { addNote } = useNoteStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsProcessing(true);
    setStatus('processing');

    try {
      for (const file of acceptedFiles) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        await new Promise((resolve, reject) => {
          reader.onload = async () => {
            try {
              const base64Data = (reader.result as string).split(',')[1];
              const result = await processMultimodalCapture(base64Data, file.type);
              
              await addNote({
                title: result.title,
                content: result.content,
                tags: result.tags,
                category: 'Smart Capture'
              });
              resolve(null);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = reject;
        });
      }
      setStatus('success');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error in Smart Capture:", error);
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  }, [addNote, onClose]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    }
  });

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Captura Inteligente</h2>
              <p className="text-xs text-slate-500">Entrada Multimodal con IA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <div 
            {...getRootProps()} 
            className={`
              border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer
              ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}
              ${status === 'processing' ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <AnimatePresence mode="wait">
              {status === 'processing' ? (
                <motion.div 
                  key="processing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center"
                >
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                  <p className="text-slate-600 font-medium">Procesando con IA...</p>
                  <p className="text-xs text-slate-400 mt-1">Extrayendo contenido y generando etiquetas</p>
                </motion.div>
              ) : status === 'success' ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                  <p className="text-slate-600 font-medium">¡Captura completada!</p>
                  <p className="text-xs text-slate-400 mt-1">La nota ha sido añadida a tu biblioteca</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="flex gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <ImageIcon size={24} />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                      <Mic size={24} />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <FileText size={24} />
                    </div>
                  </div>
                  <p className="text-slate-600 font-medium text-center">
                    Arrastra imágenes, audios o documentos aquí
                  </p>
                  <p className="text-sm text-slate-400 mt-2">O haz clic para seleccionar archivos</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3">
              <Mic size={18} className="text-slate-400" />
              <span className="text-xs text-slate-600">Voz a Texto</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3">
              <ImageIcon size={18} className="text-slate-400" />
              <span className="text-xs text-slate-600">OCR de Imágenes</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3">
              <FileText size={18} className="text-slate-400" />
              <span className="text-xs text-slate-600">Documentos PDF/TXT</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3">
              <LinkIcon size={18} className="text-slate-400" />
              <span className="text-xs text-slate-600">Recorte Web (Próximamente)</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
