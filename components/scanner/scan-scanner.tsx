'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, CircleCheck, Trash2 } from 'lucide-react';
import { validateFile, createCanvasFromFile, processImage, QRResult } from '@/lib/scan-preprocessing';
import { parseContent, ParsedContent } from '@/lib/scan-content-utils';
import ScanProgress from './scan-progress';
import ScanResultDisplay from './scan-result-display';

interface ScannerState {
  stage: 'upload' | 'loaded' | 'scanning' | 'result' | 'error';
  progress: number;
  currentStrategy: string;
  result: ParsedContent | null;
  error: string | null;
  loadedFile: File | null;
  imagePreview: string | null;
}

export default function ScanScanner() {
  const [state, setState] = useState<ScannerState>({
    stage: 'upload',
    progress: 0,
    currentStrategy: '',
    result: null,
    error: null,
    loadedFile: null,
    imagePreview: null
  });
  
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setState({
      stage: 'upload',
      progress: 0,
      currentStrategy: '',
      result: null,
      error: null,
      loadedFile: null,
      imagePreview: null
    });
    setIsDragOver(false);
  }, []);

  const loadFile = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, error: null }));

    const validation = validateFile(file);
    if (!validation.isValid) {
      setState(prev => ({ ...prev, stage: 'error', error: validation.error! }));
      return;
    }

    // Create image preview
    const imageUrl = URL.createObjectURL(file);
    
    setState(prev => ({ 
      ...prev, 
      stage: 'loaded',
      loadedFile: file,
      imagePreview: imageUrl
    }));
  }, []);

  const startScanning = useCallback(async () => {
    if (!state.loadedFile) return;

    setState(prev => ({ 
      ...prev, 
      stage: 'scanning',
      progress: 10, 
      currentStrategy: 'Loading image...' 
    }));

    try {
      const { canvas, imageData } = await createCanvasFromFile(state.loadedFile);
      
      setState(prev => ({ 
        ...prev, 
        progress: 20, 
        currentStrategy: 'Preparing image processing...' 
      }));

      const onProgress = (progress: number, strategy: string) => {
        setState(prev => ({ 
          ...prev, 
          progress: Math.min(progress, 95), 
          currentStrategy: strategy 
        }));
      };

      const qrResult: QRResult | null = await processImage(canvas, imageData, onProgress);

      if (qrResult) {
        setState(prev => ({ 
          ...prev, 
          progress: 100, 
          currentStrategy: 'Processing content...' 
        }));

        const parsedContent = parseContent(qrResult.data);
        
        setState(prev => ({ 
          ...prev, 
          stage: 'result',
          result: parsedContent,
          progress: 100,
          currentStrategy: 'Complete'
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          stage: 'error',
          error: 'No QR code found in the image. Please try a different image with better lighting and contrast.'
        }));
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setState(prev => ({ 
        ...prev, 
        stage: 'error',
        error: 'Failed to process the image. Please try again with a different file.'
      }));
    }
  }, [state.loadedFile]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    loadFile(file);
  }, [loadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (state.stage === 'upload') {
      setIsDragOver(true);
    }
  }, [state.stage]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (state.stage !== 'upload') return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [state.stage, handleFileSelect]);

  const handleClick = useCallback(() => {
    if (state.stage !== 'upload') return;
    fileInputRef.current?.click();
  }, [state.stage]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Show result if we have one
  if (state.stage === 'result' && state.result) {
    return <ScanResultDisplay result={state.result} onReset={resetState} />;
  }

  // Show scanning progress
  if (state.stage === 'scanning') {
    return (
      <div className="w-full max-w-lg mx-auto">
        <ScanProgress 
          progress={state.progress}
          currentStrategy={state.currentStrategy}
          isComplete={false}
          error={undefined}
        />
      </div>
    );
  }

  // Show loaded state with image preview
  if (state.stage === 'loaded' && state.loadedFile && state.imagePreview) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-start space-x-4">
            {/* Image Preview */}
            <div className="flex-shrink-0">
              <img 
                src={state.imagePreview}
                alt="QR Code preview"
                className="w-32 h-32 object-cover rounded-lg border border-gray-200"
              />
            </div>
            
            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <CircleCheck strokeWidth={1.25} className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Image Ready for Processing
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {state.loadedFile.name} • {formatFileSize(state.loadedFile.size)}
              </p>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={startScanning}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 transition-colors cursor-pointer"
                >
                  <Upload strokeWidth={1.25} className="h-4 w-4 mr-2" />
                  Scan QR Code
                </button>
                
                <button
                  onClick={resetState}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 transition-colors cursor-pointer"
                >
                  <Trash2 strokeWidth={1.25} className="h-4 w-4 mr-2" />
                  Choose Different Image
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (state.stage === 'error' && state.error) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <ScanProgress 
          progress={0}
          currentStrategy=""
          isComplete={false}
          error={state.error}
        />
        
        <div className="mt-4 flex justify-center">
          <button
            onClick={resetState}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Default upload state
  return (
    <div className="w-full max-w-lg mx-auto">
      {/* File Dropzone */}
      <div
        className={`relative block w-full rounded-lg border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label="Upload QR code image for scanning"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept="image/png,image/jpeg,image/jpg,image/gif"
          onChange={handleFileInputChange}
          aria-describedby="file-upload-description"
        />

        <span className="block text-lg font-semibold text-gray-900">
          Upload QR Code Image
        </span>
        
        <span className="mt-2 block text-sm text-gray-500" id="file-upload-description">
          Click to browse or drag and drop your image here
        </span>

        <Upload
          aria-hidden="true"
          className="mx-auto mt-4 size-12 text-gray-400"
        />

        {/* File Type Badges */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-700/10">
            PNG, JPG, GIF
          </span>
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset bg-green-50 text-green-700 ring-green-600/20">
            Max. 10 MB
          </span>
        </div>

        {/* Privacy Notice */}
        <div className="mt-4 p-2 bg-blue-50 rounded-md">
          <div className="flex items-center justify-center space-x-2">
            <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span className="text-xs text-blue-700">
              100% private - all processing happens in your browser
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
