'use client';

import { Loader2, CircleX, CircleCheck, Info } from 'lucide-react';

interface ScanProgressProps {
  progress: number;
  currentStrategy: string;
  isComplete: boolean;
  error?: string;
}

export default function ScanProgress({ 
  progress, 
  currentStrategy, 
  isComplete, 
  error 
}: ScanProgressProps) {
  if (error) {
    return (
      <div className="mt-6" role="alert" aria-live="assertive">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CircleX strokeWidth={1.25} className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Scanning Failed
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                <p className="mt-1 text-xs">
                  Try using a higher quality image with better lighting and contrast.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="mt-6" role="alert" aria-live="polite">
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CircleCheck strokeWidth={1.25} className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                QR Code Detected Successfully!
              </h3>
              <p className="mt-1 text-sm text-green-700">
                Content has been extracted and is ready to view.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6" role="status" aria-live="polite">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Scanning QR Code...
          </h3>
          <span className="text-sm font-medium text-gray-600">
            {progress}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div 
            className="bg-dark-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        
        {/* Current Strategy */}
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            <Loader2 strokeWidth={1.25} className="animate-spin h-4 w-4 text-dark-blue-600" />
          </div>
          <p className="text-sm text-gray-600">
            Processing with <span className="font-medium text-gray-900">{currentStrategy}</span>
          </p>
        </div>
        
        {/* Processing Stages */}
        <div className="mt-4 space-y-2">
          <div className="text-xs text-gray-500">
            Processing Stages:
          </div>
          <div className="flex flex-wrap gap-1">
            {[
              { name: 'Direct', threshold: 65 },
              { name: 'Contrast', threshold: 70 },
              { name: 'Histogram', threshold: 75 },
              { name: 'Binary', threshold: 80 },
              { name: 'Sharpen', threshold: 85 },
              { name: 'Invert', threshold: 90 },
              { name: 'Morph', threshold: 95 }
            ].map(stage => (
              <span
                key={stage.name}
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                  progress >= stage.threshold
                    ? 'bg-green-100 text-green-800'
                    : progress >= stage.threshold - 5
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {progress >= stage.threshold && (
                  <CircleCheck strokeWidth={1.25} className="mr-1 h-2.5 w-2.5" />
                )}
                {stage.name}
              </span>
            ))}
          </div>
        </div>
        
        {/* Tips */}
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info strokeWidth={1.25} className="h-4 w-4 text-blue-400" />
            </div>
            <div className="ml-2">
              <p className="text-xs text-blue-700">
                Using advanced image processing to detect QR codes even in poor lighting conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}