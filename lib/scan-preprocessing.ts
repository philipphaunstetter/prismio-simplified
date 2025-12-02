import jsQR from 'jsqr';

export interface ProcessingStrategy {
  name: string;
  progress: number;
  fn: (imageData: ImageData) => ImageData;
}

export interface QRResult {
  data: string;
  location: {
    topLeftCorner: { x: number; y: number };
    topRightCorner: { x: number; y: number };
    bottomLeftCorner: { x: number; y: number };
    bottomRightCorner: { x: number; y: number };
  };
}

export const preprocessingStrategies: Record<string, (imageData: ImageData) => ImageData> = {
  enhancedContrast: (imageData: ImageData): ImageData => {
    const data = new Uint8ClampedArray(imageData.data);
    const contrast = 1.5;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
    }

    return new ImageData(data, imageData.width, imageData.height);
  },

  adaptiveHistogram: (imageData: ImageData): ImageData => {
    const data = new Uint8ClampedArray(imageData.data);
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    return new ImageData(data, imageData.width, imageData.height);
  },

  binaryThreshold: (imageData: ImageData): ImageData => {
    const data = new Uint8ClampedArray(imageData.data);
    const pixels = data.length / 4;
    let sum = 0;

    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      sum += gray;
    }

    const threshold = sum / pixels;

    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      const binary = gray > threshold ? 255 : 0;
      data[i] = binary;
      data[i + 1] = binary;
      data[i + 2] = binary;
    }

    return new ImageData(data, imageData.width, imageData.height);
  },

  sharpening: (imageData: ImageData): ImageData => {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;
    const kernel = [-1, -1, -1, -1, 9, -1, -1, -1, -1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0, g = 0, b = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const weight = kernel[(ky + 1) * 3 + (kx + 1)];
            r += data[idx] * weight;
            g += data[idx + 1] * weight;
            b += data[idx + 2] * weight;
          }
        }

        const idx = (y * width + x) * 4;
        data[idx] = Math.min(255, Math.max(0, r));
        data[idx + 1] = Math.min(255, Math.max(0, g));
        data[idx + 2] = Math.min(255, Math.max(0, b));
      }
    }

    return new ImageData(data, imageData.width, imageData.height);
  },

  colorInversion: (imageData: ImageData): ImageData => {
    const data = new Uint8ClampedArray(imageData.data);
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }

    return new ImageData(data, imageData.width, imageData.height);
  },

  morphological: (imageData: ImageData): ImageData => {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;
    const temp = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let minVal = 255;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            const gray = Math.round(0.299 * temp[idx] + 0.587 * temp[idx + 1] + 0.114 * temp[idx + 2]);
            minVal = Math.min(minVal, gray);
          }
        }

        const idx = (y * width + x) * 4;
        data[idx] = minVal;
        data[idx + 1] = minVal;
        data[idx + 2] = minVal;
      }
    }

    return new ImageData(data, imageData.width, imageData.height);
  }
};

export const processingStrategies: ProcessingStrategy[] = [
  { name: "Direct Detection", progress: 65, fn: (data) => data },
  { name: "Enhanced Contrast", progress: 70, fn: preprocessingStrategies.enhancedContrast },
  { name: "Adaptive Histogram", progress: 75, fn: preprocessingStrategies.adaptiveHistogram },
  { name: "Binary Threshold", progress: 80, fn: preprocessingStrategies.binaryThreshold },
  { name: "Sharpening", progress: 85, fn: preprocessingStrategies.sharpening },
  { name: "Color Inversion", progress: 90, fn: preprocessingStrategies.colorInversion },
  { name: "Morphological", progress: 95, fn: preprocessingStrategies.morphological },
];

export async function processImage(
  canvas: HTMLCanvasElement,
  imageData: ImageData,
  onProgress: (progress: number, strategy: string) => void
): Promise<QRResult | null> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  for (const strategy of processingStrategies) {
    try {
      onProgress(strategy.progress, strategy.name);
      
      const processedData = strategy.fn(imageData);
      const result = jsQR(processedData.data, processedData.width, processedData.height);
      
      if (result) {
        return {
          data: result.data,
          location: result.location
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.warn(`Strategy ${strategy.name} failed:`, error);
      continue;
    }
  }

  return null;
}

export function createCanvasFromFile(file: File): Promise<{ canvas: HTMLCanvasElement; imageData: ImageData }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        resolve({ canvas, imageData });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export function validateFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please use PNG, JPG, or GIF images.'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Please use images smaller than 10MB.'
    };
  }

  return { isValid: true };
}
