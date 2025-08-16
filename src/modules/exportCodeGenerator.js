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
    console.log('updateExportCode: Content updated with code length:', code.length);
    
    // Update copy button state after updating export content
    if (window.updateCopyButtonState) {
        console.log('updateExportCode: Calling updateCopyButtonState');
        window.updateCopyButtonState();
    } else {
        console.log('updateExportCode: updateCopyButtonState not available');
    }
}

// Update export code with font export
export function updateExportCodeWithFont(fontName) {
    const headerCode = generateAdafruitGFXFont(fontName);
    DOM.exportContent.textContent = headerCode;
    
    // Update copy button state after updating export content
    if (window.updateCopyButtonState) {
        window.updateCopyButtonState();
    }
}

// Update export code with character export
export function updateExportCodeWithCharacter(fontName, character) {
    const headerCode = generateAdafruitGFXCharacter(fontName, character);
    DOM.exportContent.textContent = headerCode;
    
    // Update copy button state after updating export content
    if (window.updateCopyButtonState) {
        window.updateCopyButtonState();
    }
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

// Generate Adafruit_GFX font header file
export function generateAdafruitGFXFont(fontName) {
    const fonts = JSON.parse(localStorage.getItem('smolui_fonts') || '[]');
    const font = fonts.find(f => f.name === fontName);
    
    if (!font || !font.characters) {
        return '// Font not found or has no characters';
    }
    
    // Define character set (standard ASCII printable characters)
    const characters = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
    
    // Debug: Show what characters actually exist in the font
    console.log(`Font "${fontName}" has characters:`, Object.keys(font.characters));
    console.log(`Looking for characters in range: 0x20 (space) to 0x7E (tilde)`);
    
    // Build glyph data and bitmap data
    const glyphs = [];
    const bitmapData = [];
    let currentBitmapOffset = 0;
    
    // Process each character in ASCII order
    for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        const charCode = char.charCodeAt(0);
        
        if (font.characters[char]) {
            // Character exists in font
            const charData = font.characters[char];
            const charWidth = charData[0].length;
            const charHeight = charData.length;
            
            // Debug: Show first character's data structure
            if (char === 'A') {
                console.log(`Character 'A' data:`, charData);
                console.log(`First row:`, charData[0]);
                console.log(`Sample pixels:`, charData[0].slice(0, 8));
                
                // Count different colors in the character
                const colorCounts = {};
                for (let y = 0; y < charHeight; y++) {
                    for (let x = 0; x < charWidth; x++) {
                        const color = charData[y][x];
                        colorCounts[color] = (colorCounts[color] || 0) + 1;
                    }
                }
                console.log(`Color distribution:`, colorCounts);
                
                // Show visual representation of first few rows
                console.log(`Visual representation (first 4 rows):`);
                for (let y = 0; y < Math.min(4, charHeight); y++) {
                    let visualRow = '';
                    for (let x = 0; x < Math.min(8, charWidth); x++) {
                        const pixel = charData[y][x];
                        if (pixel !== '#000000' && pixel !== '' && pixel !== 'rgb(0, 0, 0)') {
                            visualRow += '█'; // Filled pixel
                        } else {
                            visualRow += '·'; // Empty pixel
                        }
                    }
                    console.log(`Row ${y}: ${visualRow}`);
                }
            }
            
            // Calculate bytes needed for this character (8 pixels per byte, MSB first)
            const bytesPerRow = Math.ceil(charWidth / 8);
            const totalBytes = bytesPerRow * charHeight;
            
            // Create glyph structure
            const glyph = {
                bitmapOffset: currentBitmapOffset,
                width: charWidth,
                height: charHeight,
                xAdvance: charWidth + 1, // Add 1 pixel spacing
                xOffset: 0,
                yOffset: 0
            };
            
            glyphs.push(glyph);
            
            // Convert pixel data to bitmap bytes
            for (let y = 0; y < charHeight; y++) {
                const row = charData[y];
                for (let x = 0; x < charWidth; x += 8) {
                    let byte = 0;
                    for (let bit = 0; bit < 8; bit++) {
                        if (x + bit < charWidth) {
                            const pixel = row[x + bit];
                            // Debug: Log first few pixels to see what we're getting
                            if (y === 0 && x < 16) {
                                console.log(`Pixel at (${x + bit}, ${y}): "${pixel}"`);
                            }
                            // Convert color to binary (filled pixel = 1, empty/background = 0)
                            // For 1-bit fonts: 1 = ink pixel, 0 = background pixel
                            if (pixel !== '#000000' && pixel !== '' && pixel !== 'rgb(0, 0, 0)') {
                                // This is a filled pixel (ink) - set bit to 1
                                byte |= (1 << (7 - bit));
                            }
                            // Empty/background pixels (black/transparent) remain 0
                        }
                    }
                    bitmapData.push(byte);
                }
            }
            
            // Update bitmap offset for next character
            currentBitmapOffset += totalBytes;
            
            // Debug: Show bitmap conversion for first character
            if (char === 'A') {
                console.log(`Character 'A' bitmap conversion:`);
                console.log(`- Size: ${charWidth}x${charHeight}`);
                console.log(`- Bytes per row: ${Math.ceil(charWidth / 8)}`);
                console.log(`- Total bytes: ${totalBytes}`);
                console.log(`- Bitmap offset: ${glyph.bitmapOffset}`);
                
                // Show first few bytes of bitmap data
                const startIndex = bitmapData.length - totalBytes;
                const firstBytes = bitmapData.slice(startIndex, startIndex + 4);
                console.log(`- First 4 bytes:`, firstBytes.map(b => `0x${b.toString(16).padStart(2, '0')}`));
            }
            
            console.log(`Character '${char}' (0x${charCode.toString(16)}): ${charWidth}x${charHeight}, ${totalBytes} bytes, offset ${glyph.bitmapOffset}`);
            
        } else {
            // Character doesn't exist in font - create empty glyph
            glyphs.push({
                bitmapOffset: currentBitmapOffset,
                width: 0,
                height: 0,
                xAdvance: 8, // Standard space width
                xOffset: 0,
                yOffset: 0
            });
            // No bitmap data added for empty characters
            console.log(`Character '${char}' (0x${charCode.toString(16)}): empty, offset ${currentBitmapOffset}`);
        }
    }
    
    // Debug summary
    console.log(`Font "${fontName}" generated:`);
    console.log(`- Total glyphs: ${glyphs.length}`);
    console.log(`- Total bitmap bytes: ${bitmapData.length}`);
    console.log(`- Bitmap data:`, bitmapData);
    
    let headerCode = `// Adafruit_GFX Font Header for "${fontName}"
// Generated by SMOL UI

#ifndef ${fontName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_FONT_H
#define ${fontName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_FONT_H

#include <Adafruit_GFX.h>

// Font dimensions
#define ${fontName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_FONT_WIDTH 16
#define ${fontName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_FONT_HEIGHT 16

// Font reference line positions (for alignment)
${font.referenceLines && font.referenceLines.baseline !== undefined && font.referenceLines.vertical !== undefined ? 
`#define ${fontName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_BASELINE_Y ${font.referenceLines.baseline}
#define ${fontName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_VERTICAL_X ${font.referenceLines.vertical}` : 
`// Reference line positions not set for this font`}

// Character bitmap data
const uint8_t ${fontName.replace(/[^A-Z0-9]/g, '_')}_font_bitmaps[] PROGMEM = {
  ${bitmapData.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(', ')}
};

// Character glyph data
const GFXglyph ${fontName.replace(/[^A-Z0-9]/g, '_')}_font_glyphs[] PROGMEM = {
`;

    // Add glyph structures
    for (let i = 0; i < glyphs.length; i++) {
        const glyph = glyphs[i];
        const char = characters[i];
        headerCode += `  { ${glyph.bitmapOffset}, ${glyph.width}, ${glyph.height}, ${glyph.xAdvance}, ${glyph.xOffset}, ${glyph.yOffset} }, // 0x${char.charCodeAt(0).toString(16).padStart(2, '0')} '${char}'\n`;
    }
    
    headerCode += `};

// Font structure for Adafruit_GFX
const GFXfont ${fontName.replace(/[^A-Z0-9]/g, '_')}_font PROGMEM = {
  ${fontName.replace(/[^A-Z0-9]/g, '_')}_font_bitmaps,
  ${fontName.replace(/[^A-Z0-9]/g, '_')}_font_glyphs,
  0x20, // First character (space)
  0x7E, // Last character (tilde)
  24 // yAdvance (baseline height)
};

#endif // ${fontName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_FONT_H
`;
    
    return headerCode;
}

// Generate Adafruit_GFX font header for a specific character
export function generateAdafruitGFXCharacter(fontName, character) {
    const fonts = JSON.parse(localStorage.getItem('smolui_fonts') || '[]');
    const font = fonts.find(f => f.name === fontName);
    
    if (!font || !font.characters || !font.characters[character]) {
        return '// Character not found';
    }
    
    const charData = font.characters[character];
    const charWidth = charData[0].length;
    const charHeight = charData.length;
    
    // Convert 2D pixel data to bitmap bytes (8 pixels per byte, MSB first)
    const bitmapData = [];
    for (let y = 0; y < charHeight; y++) {
        const row = charData[y];
        for (let x = 0; x < charWidth; x += 8) {
            let byte = 0;
            for (let bit = 0; bit < 8; bit++) {
                if (x + bit < charWidth) {
                    const pixel = row[x + bit];
                    // Convert color to binary (filled pixel = 1, empty/background = 0)
                    // For 1-bit fonts: 1 = ink pixel, 0 = background pixel
                    if (pixel !== '#000000' && pixel !== '' && pixel !== 'rgb(0, 0, 0)') {
                        // This is a filled pixel (ink) - set bit to 1
                        byte |= (1 << (7 - bit));
                    }
                    // Empty/background pixels (black/transparent) remain 0
                }
            }
            bitmapData.push(byte);
        }
    }
    
    let headerCode = `// Adafruit_GFX Character Header for "${character}" from font "${fontName}"
// Generated by SMOL UI

#ifndef ${fontName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${character.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_CHAR_H
#define ${fontName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${character.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_CHAR_H

#include <Adafruit_GFX.h>

// Character dimensions
#define ${fontName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${character.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_WIDTH ${charWidth}
#define ${fontName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${character.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_HEIGHT ${charHeight}

// Font reference line positions (for alignment)
${font.referenceLines && font.referenceLines.baseline !== undefined && font.referenceLines.vertical !== undefined ? 
`#define ${fontName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_BASELINE_Y ${font.referenceLines.baseline}
#define ${fontName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_VERTICAL_X ${font.referenceLines.vertical}` : 
`// Reference line positions not set for this font`}

// Character bitmap data
const uint8_t ${fontName.replace(/[^A-Z0-9]/g, '_')}_${character.replace(/[^A-Z0-9]/g, '_')}_bitmaps[] PROGMEM = {
  ${bitmapData.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(', ')}
};

// Character glyph structure for Adafruit_GFX
const GFXglyph ${fontName.replace(/[^A-Z0-9]/g, '_')}_${character.replace(/[^A-Z0-9]/g, '_')}_glyph PROGMEM = {
  0, // Bitmap offset (always 0 for single character)
  ${charWidth}, // Width
  ${charHeight}, // Height
  ${charWidth + 1}, // X advance (width + 1 pixel spacing)
  0, // X offset
  0  // Y offset
};

// Font structure for Adafruit_GFX (single character font)
const GFXfont ${fontName.replace(/[^A-Z0-9]/g, '_')}_${character.replace(/[^A-Z0-9]/g, '_')}_font PROGMEM = {
  ${fontName.replace(/[^A-Z0-9]/g, '_')}_${character.replace(/[^A-Z0-9]/g, '_')}_bitmaps,
  &${fontName.replace(/[^A-Z0-9]/g, '_')}_${character.replace(/[^A-Z0-9]/g, '_')}_glyph,
  ${character.charCodeAt(0)}, // First character
  ${character.charCodeAt(0)}, // Last character (same as first for single character)
  24 // yAdvance (baseline height)
};

#endif // ${fontName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${character.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_CHAR_H
`;
    
    return headerCode;
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
    
    // Get reference line positions if available (for font editing)
    let referenceLineInfo = '';
    if (window.getReferenceLinePositions) {
        const refPositions = window.getReferenceLinePositions();
        if (refPositions.baseline !== undefined && refPositions.vertical !== undefined) {
            referenceLineInfo = `
// Reference Line Positions (for font alignment)
#define BASELINE_Y ${refPositions.baseline}
#define VERTICAL_X ${refPositions.vertical}`;
        }
    }
    
    // If in font edit mode, also try to get font-level reference line positions
    if (window.getSaveState && window.getSaveState().isFontEditMode) {
        const saveState = window.getSaveState();
        if (saveState.currentEditingFont) {
            const fonts = JSON.parse(localStorage.getItem('smolui_fonts') || '[]');
            const font = fonts.find(f => f.name === saveState.currentEditingFont);
            if (font && font.referenceLines) {
                referenceLineInfo = `
// Font Reference Line Positions (shared across all characters)
#define FONT_BASELINE_Y ${font.referenceLines.baseline}
#define FONT_VERTICAL_X ${font.referenceLines.vertical}`;
            }
        }
    }
    
    return `// ${canvasWidth}x${canvasHeight} Pixel Art - ${protocol} Protocol (2D Array Monochrome)
// Generated by 14x14 Pixel Art Editor

#define CANVAS_WIDTH ${canvasWidth}
#define CANVAS_HEIGHT ${canvasHeight}${referenceLineInfo}

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
// Generated by 14x14 Pixel Art Editor

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
// Generated by 14x14 Pixel Art Editor

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