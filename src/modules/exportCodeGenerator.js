// Export Code Generator Module
// Handles all code generation functions for different protocols and formats

import * as DOM from './domElements.js';
import { getCanvasData, getCanvasDimensions } from './canvasManager.js';

// Initialize export code generator
export function initializeExportCodeGenerator() {
    setupExportEventListeners();
}

// Setup export-related event listeners
function setupExportEventListeners() {
    // Copy code button
    DOM.copyCodeBtn.addEventListener('click', copyArduinoCode);

    // Protocol change
    DOM.protocolRadios.forEach(radio => {
        radio.addEventListener('change', updateExportCode);
    });

    // Format change
    DOM.formatRadios.forEach(radio => {
        radio.addEventListener('change', updateExportCode);
    });

    // Format change to show/hide sub-format options
    DOM.formatRadios.forEach(radio => {
        radio.addEventListener('change', updateSubFormatOptions);
    });

    // Sub-format change
    DOM.subFormatRadios.forEach(radio => {
        radio.addEventListener('change', updateExportCode);
    });
}

// Update sub-format options visibility
export function updateSubFormatOptions() {
    const format = document.querySelector('input[name="format"]:checked').value;
    
    if (format === 'color') {
        DOM.subFormatSelector.style.display = 'block';
        DOM.colorFormatOptions.style.display = 'block';
        DOM.monochromeFormatOptions.style.display = 'none';
    } else if (format === 'monochrome') {
        DOM.subFormatSelector.style.display = 'block';
        DOM.colorFormatOptions.style.display = 'none';
        DOM.monochromeFormatOptions.style.display = 'block';
    } else {
        DOM.subFormatSelector.style.display = 'none';
    }
}

// Update export code
export function updateExportCode() {
    const protocol = document.querySelector('input[name="protocol"]:checked').value;
    const format = document.querySelector('input[name="format"]:checked').value;
    const subFormat = document.querySelector('input[name="subformat"]:checked')?.value;
    const pixelData = getCanvasData();
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    
    let code = '';
    
    if (protocol === 'standard') {
        code = generateStandardCode(pixelData, format, subFormat, canvasWidth, canvasHeight);
    } else if (protocol === 'spi') {
        code = generateSPICode(pixelData, format, subFormat, canvasWidth, canvasHeight);
    } else if (protocol === 'i2c') {
        code = generateI2CCode(pixelData, format, subFormat, canvasWidth, canvasHeight);
    }
    
    DOM.exportContent.textContent = code;
}

// Generate standard protocol code
function generateStandardCode(pixelData, format, subFormat, canvasWidth, canvasHeight) {
    if (format === 'monochrome') {
        return generateMonochromeCode(pixelData, subFormat, 'Standard', canvasWidth, canvasHeight);
    } else {
        return generateColorCode(pixelData, subFormat, 'Standard', canvasWidth, canvasHeight);
    }
}

// Generate SPI protocol code
function generateSPICode(pixelData, format, subFormat, canvasWidth, canvasHeight) {
    if (format === 'monochrome') {
        return generateMonochromeCode(pixelData, subFormat, 'SPI', canvasWidth, canvasHeight);
    } else {
        return generateColorCode(pixelData, subFormat, 'SPI', canvasWidth, canvasHeight);
    }
}

// Generate I2C protocol code
function generateI2CCode(pixelData, format, subFormat, canvasWidth, canvasHeight) {
    if (format === 'monochrome') {
        return generateMonochromeCode(pixelData, subFormat, 'I2C', canvasWidth, canvasHeight);
    } else {
        return generateColorCode(pixelData, subFormat, 'I2C', canvasWidth, canvasHeight);
    }
}

// Generate monochrome code
function generateMonochromeCode(pixelData, subFormat, protocol, canvasWidth, canvasHeight) {
    switch (subFormat) {
        case 'mono-2d':
            return generateMono2DArray(pixelData, protocol, canvasWidth, canvasHeight);
        case 'mono-binary':
            return generateMonoBinaryPacked(pixelData, protocol, canvasWidth, canvasHeight);
        case 'mono-hex':
            return generateMonoHexPacked(pixelData, protocol, canvasWidth, canvasHeight);
        case 'mono-xbm':
            return generateMonoXBM(pixelData, protocol, canvasWidth, canvasHeight);
        default:
            return generateMono2DArray(pixelData, protocol, canvasWidth, canvasHeight);
    }
}

// Generate color code
function generateColorCode(pixelData, subFormat, protocol, canvasWidth, canvasHeight) {
    switch (subFormat) {
        case 'color-2d':
            return generateColor2DArray(pixelData, protocol, canvasWidth, canvasHeight);
        case 'color-1d':
            return generateColor1DArray(pixelData, protocol, canvasWidth, canvasHeight);
        case 'color-bmp':
            return generateColorBMP(pixelData, protocol, canvasWidth, canvasHeight);
        case 'color-palette':
            return generateColorPalette(pixelData, protocol, canvasWidth, canvasHeight);
        default:
            return generateColor2DArray(pixelData, protocol, canvasWidth, canvasHeight);
    }
}

// Generate 2D array monochrome code
function generateMono2DArray(pixelData, protocol, canvasWidth, canvasHeight) {
    const rows = [];
    for (let y = 0; y < canvasHeight; y++) {
        const row = [];
        for (let x = 0; x < canvasWidth; x++) {
            const index = y * canvasWidth + x;
            const color = pixelData[index];
            const isOn = color !== '#000000' && color !== '' && color !== 'rgb(0, 0, 0)';
            row.push(isOn ? 1 : 0);
        }
        rows.push(`  {${row.join(', ')}}`);
    }
    
    return `// ${canvasWidth}x${canvasHeight} Pixel Art - ${protocol} Protocol (2D Array Monochrome)
// Generated by 16x16 Pixel Art Editor

#define CANVAS_WIDTH ${canvasWidth}
#define CANVAS_HEIGHT ${canvasHeight}

const uint8_t pixelData[CANVAS_HEIGHT][CANVAS_WIDTH] PROGMEM = {
${rows.join(',\n')}
};

void setup() {
  // Initialize your display here
}

void loop() {
  // Display the pixel art
  displayPixelArt();
}

void displayPixelArt() {
  for (int y = 0; y < CANVAS_HEIGHT; y++) {
    for (int x = 0; x < CANVAS_WIDTH; x++) {
      bool isOn = pgm_read_byte(&pixelData[y][x]);
      
      if (isOn) {
        // Turn on pixel at (x, y)
        setPixel(x, y, true);
      } else {
        // Turn off pixel at (x, y)
        setPixel(x, y, false);
      }
    }
  }
}

void setPixel(int x, int y, bool state) {
  // Implement your pixel setting logic here
  // This depends on your specific hardware
}`;
}

// Generate binary packed monochrome code
function generateMonoBinaryPacked(pixelData, protocol, canvasWidth, canvasHeight) {
    const bytesArray = convertToBytes(pixelData);
    const binaryStrings = bytesArray.map(byte => {
        return `0b${byte.toString(2).padStart(8, '0')}`;
    });
    
    return `// ${canvasWidth}x${canvasHeight} Pixel Art - ${protocol} Protocol (Binary Packed Monochrome)
// Generated by 16x16 Pixel Art Editor

#define CANVAS_WIDTH ${canvasWidth}
#define CANVAS_HEIGHT ${canvasHeight}

const uint8_t pixelData[${bytesArray.length}] PROGMEM = {
${binaryStrings.map(bin => `  ${bin}`).join(',\n')}
};

void setup() {
  // Initialize your display here
}

void loop() {
  displayPixelArt();
}

void displayPixelArt() {
  for (int y = 0; y < CANVAS_HEIGHT; y++) {
    for (int x = 0; x < CANVAS_WIDTH; x++) {
      int pixelIndex = y * CANVAS_WIDTH + x;
      int byteIndex = pixelIndex / 8;
      int bitIndex = pixelIndex % 8;
      
      uint8_t pixelByte = pgm_read_byte(&pixelData[byteIndex]);
      bool isOn = (pixelByte >> (7 - bitIndex)) & 1;
      
      setPixel(x, y, isOn);
    }
  }
}

void setPixel(int x, int y, bool state) {
  // Implement your pixel setting logic here
}`;
}

// Generate hex packed monochrome code
function generateMonoHexPacked(pixelData, protocol, canvasWidth, canvasHeight) {
    const bytesArray = convertToBytes(pixelData);
    
    return `// ${canvasWidth}x${canvasHeight} Pixel Art - ${protocol} Protocol (Hex Packed Monochrome)
// Generated by 16x16 Pixel Art Editor

#define CANVAS_WIDTH ${canvasWidth}
#define CANVAS_HEIGHT ${canvasHeight}

const uint8_t pixelData[${bytesArray.length}] PROGMEM = {
${bytesArray.map(byte => `  0x${byte.toString(16).padStart(2, '0').toUpperCase()}`).join(',\n')}
};

void setup() {
  // Initialize your display here
}

void loop() {
  displayPixelArt();
}

void displayPixelArt() {
  for (int y = 0; y < CANVAS_HEIGHT; y++) {
    for (int x = 0; x < CANVAS_WIDTH; x++) {
      int pixelIndex = y * CANVAS_WIDTH + x;
      int byteIndex = pixelIndex / 8;
      int bitIndex = pixelIndex % 8;
      
      uint8_t pixelByte = pgm_read_byte(&pixelData[byteIndex]);
      bool isOn = (pixelByte >> (7 - bitIndex)) & 1;
      
      setPixel(x, y, isOn);
    }
  }
}

void setPixel(int x, int y, bool state) {
  // Implement your pixel setting logic here
}`;
}

// Generate XBM format monochrome code
function generateMonoXBM(pixelData, protocol, canvasWidth, canvasHeight) {
    const bytesArray = convertToBytes(pixelData);
    
    return `// ${canvasWidth}x${canvasHeight} Pixel Art - ${protocol} Protocol (XBM Format)
// Generated by 16x16 Pixel Art Editor

#define canvas_width ${canvasWidth}
#define canvas_height ${canvasHeight}

static unsigned char canvas_bits[] = {
${bytesArray.map((byte, index) => {
    const hex = `0x${byte.toString(16).padStart(2, '0')}`;
    return index % 12 === 0 ? `\n  ${hex}` : ` ${hex}`;
}).join(',').trim()}
};

void setup() {
  // Initialize your display here
}

void loop() {
  displayPixelArt();
}

void displayPixelArt() {
  for (int y = 0; y < canvas_height; y++) {
    for (int x = 0; x < canvas_width; x++) {
      int pixelIndex = y * canvas_width + x;
      int byteIndex = pixelIndex / 8;
      int bitIndex = pixelIndex % 8;
      
      bool isOn = (canvas_bits[byteIndex] >> bitIndex) & 1;
      setPixel(x, y, isOn);
    }
  }
}

void setPixel(int x, int y, bool state) {
  // Implement your pixel setting logic here
}`;
}

// Generate 2D array color code
function generateColor2DArray(pixelData, protocol, canvasWidth, canvasHeight) {
    const rows = [];
    for (let y = 0; y < canvasHeight; y++) {
        const row = [];
        for (let x = 0; x < canvasWidth; x++) {
            const index = y * canvasWidth + x;
            const color = convertColorToHex(pixelData[index]);
            row.push(`0x${color}`);
        }
        rows.push(`  {${row.join(', ')}}`);
    }
    
    return `// ${canvasWidth}x${canvasHeight} Pixel Art - ${protocol} Protocol (2D Array Color)
// Generated by 16x16 Pixel Art Editor

#define CANVAS_WIDTH ${canvasWidth}
#define CANVAS_HEIGHT ${canvasHeight}

const uint32_t pixelData[CANVAS_HEIGHT][CANVAS_WIDTH] PROGMEM = {
${rows.join(',\n')}
};

void setup() {
  // Initialize your display here
}

void loop() {
  // Display the pixel art
  displayPixelArt();
}

void displayPixelArt() {
  for (int y = 0; y < CANVAS_HEIGHT; y++) {
    for (int x = 0; x < CANVAS_WIDTH; x++) {
      uint32_t color = pgm_read_dword(&pixelData[y][x]);
      
      // Extract RGB components
      uint8_t r = (color >> 16) & 0xFF;
      uint8_t g = (color >> 8) & 0xFF;
      uint8_t b = color & 0xFF;
      
      // Set pixel color
      setPixelColor(x, y, r, g, b);
    }
  }
}

void setPixelColor(int x, int y, uint8_t r, uint8_t g, uint8_t b) {
  // Implement your color pixel setting logic here
  // This depends on your specific hardware
}`;
}

// Generate 1D array color code
function generateColor1DArray(pixelData, protocol, canvasWidth, canvasHeight) {
    const colorArray = convertToColorArray(pixelData);
    
    return `// ${canvasWidth}x${canvasHeight} Pixel Art - ${protocol} Protocol (1D Array Color)
// Generated by 16x16 Pixel Art Editor

#define CANVAS_WIDTH ${canvasWidth}
#define CANVAS_HEIGHT ${canvasHeight}

const uint32_t pixelData[${pixelData.length}] PROGMEM = {
${colorArray.map(color => `  0x${color}`).join(',\n')}
};

void setup() {
  // Initialize your display here
}

void loop() {
  displayPixelArt();
}

void displayPixelArt() {
  for (int i = 0; i < ${pixelData.length}; i++) {
    uint32_t color = pgm_read_dword(&pixelData[i]);
    
    // Calculate x, y from index
    int x = i % CANVAS_WIDTH;
    int y = i / CANVAS_WIDTH;
    
    // Extract RGB components
    uint8_t r = (color >> 16) & 0xFF;
    uint8_t g = (color >> 8) & 0xFF;
    uint8_t b = color & 0xFF;
    
    setPixelColor(x, y, r, g, b);
  }
}

void setPixelColor(int x, int y, uint8_t r, uint8_t g, uint8_t b) {
  // Implement your color pixel setting logic here
}`;
}

// Generate BMP format color code
function generateColorBMP(pixelData, protocol, canvasWidth, canvasHeight) {
    return `// ${canvasWidth}x${canvasHeight} Pixel Art - ${protocol} Protocol (BMP Format)
// Generated by 16x16 Pixel Art Editor
// Note: This is a simplified BMP-style format

#define CANVAS_WIDTH ${canvasWidth}
#define CANVAS_HEIGHT ${canvasHeight}

// BMP-style header (simplified)
const uint8_t bmpHeader[] PROGMEM = {
  // Add your BMP header bytes here
};

const uint32_t pixelData[${pixelData.length}] PROGMEM = {
${convertToColorArray(pixelData).map(color => `  0x${color}`).join(',\n')}
};

void setup() {
  // Initialize your display here
}

void loop() {
  displayPixelArt();
}

void displayPixelArt() {
  // Display BMP-style data
  for (int i = 0; i < ${pixelData.length}; i++) {
    uint32_t color = pgm_read_dword(&pixelData[i]);
    
    int x = i % CANVAS_WIDTH;
    int y = i / CANVAS_WIDTH;
    
    uint8_t r = (color >> 16) & 0xFF;
    uint8_t g = (color >> 8) & 0xFF;
    uint8_t b = color & 0xFF;
    
    setPixelColor(x, y, r, g, b);
  }
}

void setPixelColor(int x, int y, uint8_t r, uint8_t g, uint8_t b) {
  // Implement your color pixel setting logic here
}`;
}

// Generate palette color code
function generateColorPalette(pixelData, protocol, canvasWidth, canvasHeight) {
    // Extract unique colors and create palette
    const uniqueColors = [...new Set(pixelData)];
    const palette = uniqueColors.map(color => convertColorToHex(color));
    
    // Create index array
    const indexArray = pixelData.map(color => uniqueColors.indexOf(color));
    
    return `// ${canvasWidth}x${canvasHeight} Pixel Art - ${protocol} Protocol (Palette Mode)
// Generated by 16x16 Pixel Art Editor

#define CANVAS_WIDTH ${canvasWidth}
#define CANVAS_HEIGHT ${canvasHeight}
#define PALETTE_SIZE ${palette.length}

// Color palette
const uint32_t palette[PALETTE_SIZE] PROGMEM = {
${palette.map(color => `  0x${color}`).join(',\n')}
};

// Pixel indices into palette
const uint8_t pixelIndices[${indexArray.length}] PROGMEM = {
${indexArray.map(index => `  ${index}`).join(',\n')}
};

void setup() {
  // Initialize your display here
}

void loop() {
  displayPixelArt();
}

void displayPixelArt() {
  for (int i = 0; i < ${indexArray.length}; i++) {
    uint8_t paletteIndex = pgm_read_byte(&pixelIndices[i]);
    uint32_t color = pgm_read_dword(&palette[paletteIndex]);
    
    int x = i % CANVAS_WIDTH;
    int y = i / CANVAS_WIDTH;
    
    uint8_t r = (color >> 16) & 0xFF;
    uint8_t g = (color >> 8) & 0xFF;
    uint8_t b = color & 0xFF;
    
    setPixelColor(x, y, r, g, b);
  }
}

void setPixelColor(int x, int y, uint8_t r, uint8_t g, uint8_t b) {
  // Implement your color pixel setting logic here
}`;
}

// Convert color to hex
function convertColorToHex(color) {
    if (!color || color === '' || color === '#000000' || color === 'rgb(0, 0, 0)') {
        return '000000';
    }
    
    if (color.startsWith('#')) {
        return color.slice(1).padStart(6, '0').toUpperCase();
    }
    
    if (color.startsWith('rgb(')) {
        const matches = color.match(/\d+/g);
        if (matches && matches.length >= 3) {
            const r = parseInt(matches[0]);
            const g = parseInt(matches[1]);
            const b = parseInt(matches[2]);
            return ((r << 16) + (g << 8) + b).toString(16).padStart(6, '0').toUpperCase();
        }
    }
    
    return '000000';
}

// Convert to bytes for monochrome
function convertToBytes(pixelData) {
    const bytes = [];
    
    for (let i = 0; i < pixelData.length; i += 8) {
        let byte = 0;
        
        for (let bit = 0; bit < 8; bit++) {
            const pixelIndex = i + bit;
            if (pixelIndex < pixelData.length) {
                const color = pixelData[pixelIndex];
                const isOn = color !== '#000000' && color !== '' && color !== 'rgb(0, 0, 0)';
                if (isOn) {
                    byte |= (1 << (7 - bit));
                }
            }
        }
        
        bytes.push(byte);
    }
    
    return bytes;
}

// Convert to color array
function convertToColorArray(pixelData) {
    return pixelData.map(color => {
        // Convert hex color to RGB components
        let hex = color;
        
        // Handle different color formats
        if (color.startsWith('rgb(')) {
            // Convert rgb(r,g,b) to hex
            const matches = color.match(/\d+/g);
            if (matches && matches.length >= 3) {
                const r = parseInt(matches[0]);
                const g = parseInt(matches[1]);
                const b = parseInt(matches[2]);
                hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            } else {
                hex = '#000000';
            }
        } else if (!color || color === '') {
            hex = '#000000';
        }
        
        // Remove # and convert to number
        const colorValue = parseInt(hex.replace('#', ''), 16);
        return colorValue.toString(16).padStart(6, '0').toUpperCase();
    });
}

// Copy Arduino code to clipboard
export function copyArduinoCode() {
    const code = DOM.exportContent.textContent;
    
    if (!code || code === 'Click EXPORT button to generate code...') {
        showAlert('No code to copy. Generate code first.');
        return;
    }
    
    navigator.clipboard.writeText(code).then(() => {
        showAlert('Arduino code copied to clipboard!');
    }).catch(() => {
        showAlert('Failed to copy code. Please select and copy manually.');
    });
}

// Placeholder for modal functions
function showAlert(message) {
    if (window.showAlert) window.showAlert(message);
} 