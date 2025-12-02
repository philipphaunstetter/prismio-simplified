# QR Code Scanner - Simplified

A privacy-first, browser-based QR code scanner built with Next.js. This is a simplified extraction of the QR scanning functionality from Prismio.

## Features

- **100% Privacy-First**: All QR code processing happens entirely in your browser - no data is sent to any server
- **Advanced Image Processing**: Multiple preprocessing strategies (7 different methods) to detect QR codes even in poor lighting conditions
- **Smart Content Detection**: Automatically detects and formats various QR code types:
  - URLs
  - Email addresses
  - Phone numbers
  - vCards (contact information)
  - WiFi credentials
  - GPS locations
  - SMS messages
  - Plain text

- **User-Friendly Interface**: 
  - Drag-and-drop file upload
  - Real-time progress tracking
  - Responsive design
  - Accessible (ARIA labels, keyboard navigation)

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **jsQR** - QR code detection library
- **Lucide React** - Icons
- **Headless UI** - Accessible UI components

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build

```bash
npm run build
npm start
```

## How It Works

1. **Upload**: Users upload a QR code image (PNG, JPG, GIF, up to 10MB)
2. **Processing**: The image goes through 7 different preprocessing strategies:
   - Direct Detection
   - Enhanced Contrast
   - Adaptive Histogram
   - Binary Threshold
   - Sharpening
   - Color Inversion
   - Morphological Operations

3. **Detection**: Each strategy attempts to detect the QR code using jsQR
4. **Parsing**: Once detected, the content is intelligently parsed based on type
5. **Display**: Results are shown with appropriate formatting and copy functionality

## Project Structure

```
prismio-simplified/
├── app/
│   ├── layout.tsx
│   └── page.tsx              # Main scanner page
├── components/
│   ├── catalyst/
│   │   └── switch.tsx        # Toggle switch component
│   └── scanner/
│       ├── scan-scanner.tsx  # Main scanner component
│       ├── scan-progress.tsx # Progress indicator
│       └── scan-result-display.tsx # Results display
├── lib/
│   ├── scan-preprocessing.ts # Image processing utilities
│   └── scan-content-utils.ts # Content parsing utilities
└── public/
```

## Key Components

### ScanScanner
Main component handling file upload, state management, and orchestrating the scanning process.

### ScanProgress
Visual feedback during the scanning process showing current strategy and progress percentage.

### ScanResultDisplay
Intelligently displays QR code content based on type, with copy-to-clipboard functionality and special formatting for vCards.

## License

MIT

## Credits

Extracted from the Prismio project.
