// Export Manager Module
// Handles all code export functionality including Arduino code generation

import * as DOM from './domElements.js';

// Export state
let currentProtocol = 'standard';
let currentFormat = 'monochrome';
let currentSubFormat = 'mono-2d';

// Initialize export functionality
export function initializeExportManager() {
  attachExportEventListeners();
  updateSubFormatOptions();
  updateExportContent();
}

// Update export content based on current canvas and settings
export function updateExportContent(canvasData = null) {
  if (!DOM.exportContent) return;
  
  if (!canvasData) {
    DOM.exportContent.textContent = 'Click SAVE button to generate code...';
    return;
  }
  
  const code = generateArduinoCode(canvasData);
  DOM.exportContent.textContent = code;
}

// Generate Arduino code based on canvas data and current settings
function generateArduinoCode(canvasData) {
  const { name, width, height, data } = canvasData;
  const safeName = sanitizeName(name);
  
  switch (currentFormat) {
    case 'monochrome':
      return generateMonochromeCode(safeName, width, height, data);
    case 'color':
      return generateColorCode(safeName, width, height, data);
    default:
      return '// Invalid format selected';
  }
}

// Generate monochrome Arduino code
function generateMonochromeCode(name, width, height, data) {
  switch (currentSubFormat) {
    case 'mono-2d':
      return generateMono2DArray(name, width, height, data);
    case 'mono-binary':
      return generateMonoBinary(name, width, height, data);
    case 'mono-hex':
      return generateMonoHex(name, width, height, data);
    case 'mono-xbm':
      return generateXBM(name, width, height, data);
    default:
      return '// Invalid monochrome format';
  }
}

// Generate color Arduino code
function generateColorCode(name, width, height, data) {
  switch (currentSubFormat) {
    case 'color-2d':
      return generateColor2DArray(name, width, height, data);
    case 'color-1d':
      return generateColor1D(name, width, height, data);
    case 'color-bmp':
      return generateBMPFormat(name, width, height, data);
    case 'color-palette':
      return generatePaletteFormat(name, width, height, data);
    default:
      return '// Invalid color format';
  }
}

// Monochrome 2D Array format
function generateMono2DArray(name, width, height, data) {
  const header = generateCodeHeader(name, width, height, 'Monochrome 2D Array');
  const arrayData = [];
  
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const pixel = data[y * width + x];
      row.push(isPixelOn(pixel) ? '1' : '0');
    }
    arrayData.push(`  {${row.join(', ')}}`);
  }
  
  return `${header}
const uint8_t ${name}[${height}][${width}] PROGMEM = {
${arrayData.join(',\n')}
};

${generateProtocolCode()}`;
}

// Monochrome binary packed format
function generateMonoBinary(name, width, height, data) {
  const header = generateCodeHeader(name, width, height, 'Monochrome Binary Packed');
  const binaryData = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x += 8) {
      let byte = 0;
      for (let bit = 0; bit < 8 && (x + bit) < width; bit++) {
        const pixel = data[y * width + (x + bit)];
        if (isPixelOn(pixel)) {
          byte |= (1 << (7 - bit));
        }
      }
      binaryData.push(`B${byte.toString(2).padStart(8, '0')}`);
    }
  }
  
  const bytesPerRow = Math.ceil(width / 8);
  const totalBytes = height * bytesPerRow;
  
  return `${header}
const uint8_t ${name}[${totalBytes}] PROGMEM = {
  ${binaryData.join(', ')}
};

${generateProtocolCode()}`;
}

// Monochrome hex packed format
function generateMonoHex(name, width, height, data) {
  const header = generateCodeHeader(name, width, height, 'Monochrome Hex Packed');
  const hexData = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x += 8) {
      let byte = 0;
      for (let bit = 0; bit < 8 && (x + bit) < width; bit++) {
        const pixel = data[y * width + (x + bit)];
        if (isPixelOn(pixel)) {
          byte |= (1 << (7 - bit));
        }
      }
      hexData.push(`0x${byte.toString(16).toUpperCase().padStart(2, '0')}`);
    }
  }
  
  const bytesPerRow = Math.ceil(width / 8);
  const totalBytes = height * bytesPerRow;
  
  return `${header}
const uint8_t ${name}[${totalBytes}] PROGMEM = {
  ${hexData.join(', ')}
};

${generateProtocolCode()}`;
}

// XBM format
function generateXBM(name, width, height, data) {
  const header = generateCodeHeader(name, width, height, 'XBM Format');
  const hexData = [];
  
  const bytesPerRow = Math.ceil(width / 8);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x += 8) {
      let byte = 0;
      for (let bit = 0; bit < 8 && (x + bit) < width; bit++) {
        const pixel = data[y * width + (x + bit)];
        if (isPixelOn(pixel)) {
          byte |= (1 << bit); // XBM uses LSB first
        }
      }
      hexData.push(`0x${byte.toString(16).toUpperCase().padStart(2, '0')}`);
    }
  }
  
  return `${header}
#define ${name}_width ${width}
#define ${name}_height ${height}
static unsigned char ${name}_bits[] = {
  ${hexData.join(', ')}
};

${generateProtocolCode()}`;
}

// Color 2D Array format
function generateColor2DArray(name, width, height, data) {
  const header = generateCodeHeader(name, width, height, 'Color 2D Array');
  const arrayData = [];
  
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const pixel = data[y * width + x];
      row.push(colorToHex(pixel));
    }
    arrayData.push(`  {${row.join(', ')}}`);
  }
  
  return `${header}
const uint16_t ${name}[${height}][${width}] PROGMEM = {
${arrayData.join(',\n')}
};

${generateProtocolCode()}`;
}

// Color 1D format
function generateColor1D(name, width, height, data) {
  const header = generateCodeHeader(name, width, height, 'Color 1D Array');
  const colorData = data.map(pixel => colorToHex(pixel));
  
  const totalPixels = width * height;
  
  return `${header}
const uint16_t ${name}[${totalPixels}] PROGMEM = {
  ${colorData.join(', ')}
};

${generateProtocolCode()}`;
}

// BMP format
function generateBMPFormat(name, width, height, data) {
  const header = generateCodeHeader(name, width, height, 'BMP Format');
  
  return `${header}
// BMP format requires external file handling
// Save this data as ${name}.bmp
// Width: ${width}, Height: ${height}

// Include in your Arduino project:
// #include "SD.h"
// File bmpFile = SD.open("${name}.bmp");

${generateProtocolCode()}`;
}

// Palette format
function generatePaletteFormat(name, width, height, data) {
  const header = generateCodeHeader(name, width, height, 'Palette-Based Color');
  
  // Extract unique colors
  const uniqueColors = [...new Set(data.map(pixel => colorToHex(pixel)))];
  const palette = uniqueColors.slice(0, 256); // Limit to 256 colors
  
  // Create index data
  const indexData = data.map(pixel => {
    const color = colorToHex(pixel);
    return palette.indexOf(color);
  });
  
  return `${header}
// Palette (${palette.length} colors)
const uint16_t ${name}_palette[${palette.length}] PROGMEM = {
  ${palette.join(', ')}
};

// Image data (palette indices)
const uint8_t ${name}_data[${width * height}] PROGMEM = {
  ${indexData.join(', ')}
};

${generateProtocolCode()}`;
}

// Generate code header
function generateCodeHeader(name, width, height, format) {
  const timestamp = new Date().toISOString();
  
  return `// Generated by SMOL UI
// Name: ${name}
// Dimensions: ${width} x ${height}
// Format: ${format}
// Protocol: ${currentProtocol.toUpperCase()}
// Generated: ${timestamp}`;
}

// Generate protocol-specific code
function generateProtocolCode() {
  switch (currentProtocol) {
    case 'standard':
      return `
// Standard GPIO Protocol
void display${sanitizeName('image')}() {
  // Add your standard display code here
  // Use digitalRead/digitalWrite functions
}`;
    
    case 'spi':
      return `
// SPI Protocol
#include <SPI.h>

void display${sanitizeName('image')}() {
  SPI.begin();
  // Add your SPI display code here
  // Use SPI.transfer() functions
}`;
    
    case 'i2c':
      return `
// I2C Protocol
#include <Wire.h>

void display${sanitizeName('image')}() {
  Wire.begin();
  // Add your I2C display code here
  // Use Wire.write() functions
}`;
    
    default:
      return '// Unknown protocol';
  }
}

// Utility functions
function isPixelOn(pixel) {
  if (typeof pixel === 'string') {
    return pixel !== '#000000' && pixel !== '#000';
  }
  return pixel !== 0;
}

function colorToHex(pixel) {
  if (typeof pixel === 'string') {
    // Convert hex string to 16-bit color (RGB565)
    const hex = pixel.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) >> 3;
    const g = parseInt(hex.substr(2, 2), 16) >> 2;
    const b = parseInt(hex.substr(4, 2), 16) >> 3;
    const rgb565 = (r << 11) | (g << 5) | b;
    return `0x${rgb565.toString(16).toUpperCase().padStart(4, '0')}`;
  }
  return `0x${pixel.toString(16).toUpperCase().padStart(4, '0')}`;
}

function sanitizeName(name) {
  if (!name) return 'unnamed';
  return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&');
}

// Copy code to clipboard
export function copyCodeToClipboard() {
  const code = DOM.exportContent.textContent;
  
  if (!code || code === 'Click SAVE button to generate code...') {
    if (window.showAlert) window.showAlert('No code to copy. Generate code first.');
    return;
  }
  
  navigator.clipboard.writeText(code).then(() => {
    if (window.showAlert) window.showAlert('Arduino code copied to clipboard!');
  }).catch(() => {
    if (window.showAlert) window.showAlert('Failed to copy code. Please select and copy manually.');
  });
}

// Fallback copy function for older browsers
function fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    if (window.showAlert) window.showAlert('Arduino code copied to clipboard!');
  } catch (err) {
    if (window.showAlert) window.showAlert('Failed to copy code. Please select and copy manually.');
  }
  
  document.body.removeChild(textArea);
}

// Update sub-format options based on current format
function updateSubFormatOptions() {
  if (!DOM.subFormatSelector) return;
  
  if (currentFormat === 'monochrome') {
    DOM.subFormatSelector.style.display = 'block';
    DOM.monochromeFormatOptions.style.display = 'block';
    DOM.colorFormatOptions.style.display = 'none';
    
    // Set default monochrome sub-format
    const monoRadio = document.querySelector('input[name="subformat"][value="mono-2d"]');
    if (monoRadio) monoRadio.checked = true;
    currentSubFormat = 'mono-2d';
  } else if (currentFormat === 'color') {
    DOM.subFormatSelector.style.display = 'block';
    DOM.colorFormatOptions.style.display = 'block';
    DOM.monochromeFormatOptions.style.display = 'none';
    
    // Set default color sub-format
    const colorRadio = document.querySelector('input[name="subformat"][value="color-2d"]');
    if (colorRadio) colorRadio.checked = true;
    currentSubFormat = 'color-2d';
  } else {
    DOM.subFormatSelector.style.display = 'none';
  }
}

// Attach export event listeners
function attachExportEventListeners() {
  // Copy code button
  if (DOM.copyCodeBtn) {
    DOM.copyCodeBtn.addEventListener('click', copyCodeToClipboard);
  }
  
  // Protocol radio buttons
  DOM.protocolRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        currentProtocol = e.target.value;
        updateExportContent();
      }
    });
  });
  
  // Format radio buttons
  DOM.formatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        currentFormat = e.target.value;
        updateSubFormatOptions();
        updateExportContent();
      }
    });
  });
  
  // Sub-format radio buttons
  DOM.subFormatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        currentSubFormat = e.target.value;
        updateExportContent();
      }
    });
  });
}

// Get current export settings
export function getCurrentExportSettings() {
  return {
    protocol: currentProtocol,
    format: currentFormat,
    subFormat: currentSubFormat
  };
}

// Set export settings programmatically
export function setExportSettings(protocol, format, subFormat) {
  if (protocol) currentProtocol = protocol;
  if (format) currentFormat = format;
  if (subFormat) currentSubFormat = subFormat;
  
  updateSubFormatOptions();
  updateExportContent();
}

// Export canvas data for external use
export function exportCanvasData(canvasData) {
  const code = generateArduinoCode(canvasData);
  return {
    code,
    settings: getCurrentExportSettings(),
    timestamp: new Date().toISOString()
  };
}