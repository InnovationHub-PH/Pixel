// Font Manager Module
// Handles all font-related functionality including creation, editing, storage, and display

import * as DOM from './domElements.js';

// Font storage key
const FONTS_STORAGE_KEY = 'smolui_fonts';

// Current state
let currentEditingFont = null;
let fonts = [];

// Initialize font functionality
export function initializeFontManager() {
  loadFontsFromStorage();
  updateFontsList();
  attachFontEventListeners();
}

// Load fonts from localStorage
export function loadFontsFromStorage() {
  const storedFonts = localStorage.getItem(FONTS_STORAGE_KEY);
  fonts = storedFonts ? JSON.parse(storedFonts) : [];
}

// Save fonts to localStorage
function saveFontsToStorage() {
  localStorage.setItem(FONTS_STORAGE_KEY, JSON.stringify(fonts));
}

// Create a new font
export function createFont() {
  const fontName = DOM.fontNameInput.value.trim();
  
  if (!fontName) {
    if (window.showAlert) window.showAlert('Please enter a font name');
    return;
  }
  
  // Check if font already exists
  if (fonts.find(font => font.name === fontName)) {
    if (window.showAlert) window.showAlert('A font with this name already exists');
    return;
  }
  
  // Create new font with empty character data
  const newFont = {
    name: fontName,
    characters: {},
    createdAt: new Date().toISOString()
  };
  
  fonts.push(newFont);
  saveFontsToStorage();
  updateFontsList();
  updateFontSelector();
  
  // Clear input
  DOM.fontNameInput.value = '';
  
  if (window.showAlert) window.showAlert(`Font "${fontName}" created successfully!`);
}

// Update fonts list display
export function updateFontsList() {
  const fontsList = DOM.fontsList;
  const fontsTitle = DOM.fontsTitle;
  
  // Update title with count
  fontsTitle.textContent = `FONTS (${fonts.length})`;
  
  // Clear existing content
  fontsList.innerHTML = '';
  
  if (fonts.length === 0) {
    fontsList.innerHTML = '<div class="saved-empty">No fonts created yet</div>';
    return;
  }
  
  fonts.forEach((font, index) => {
    const fontItem = document.createElement('div');
    fontItem.className = 'font-item';
    fontItem.id = `font-${index}`;
    
    // Check if this font is in edit mode
    const isInEditMode = currentEditingFont === index;
    if (isInEditMode) {
      fontItem.classList.add('font-edit-mode');
    }
    
    fontItem.innerHTML = `
      <div class="font-item-header">
        <span class="font-item-name">${escapeHtml(font.name)}</span>
        <div class="font-item-buttons">
          <button class="font-item-edit" data-font-index="${index}">${isInEditMode ? 'EXIT' : 'EDIT'}</button>
          <button class="font-item-delete" data-font-index="${index}">DEL</button>
        </div>
      </div>
      <div class="font-characters"></div>
    `;
    
    fontsList.appendChild(fontItem);
    
    // Render characters for this font
    renderFontCharacters(index);
  });
  
  // Attach event listeners
  attachFontItemListeners();
}

// Render font characters
function renderFontCharacters(fontIndex) {
    const font = fonts[fontIndex];
    if (!font) return;
    
    const fontContainer = document.getElementById(`font-${fontIndex}`);
    if (!fontContainer) return;
    
    // Check if this font is in edit mode
    const isInEditMode = currentEditingFont === fontIndex;
    
    // Add or remove font-edit-mode class
    if (isInEditMode) {
        fontContainer.classList.add('font-edit-mode');
    } else {
        fontContainer.classList.remove('font-edit-mode');
    }
    
    const charactersContainer = fontContainer.querySelector('.font-characters');
    if (!charactersContainer) return;
    
    charactersContainer.innerHTML = '';
    
    // Define character set
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;\':",./<>?';
    
    // Create character buttons
    for (const char of characters) {
        const charButton = document.createElement('div');
        charButton.className = 'font-character';
        charButton.textContent = char;
        
        // Check if character has saved data
        const hasData = font.characters && font.characters[char] && 
                       font.characters[char].some(row => 
                           row.some(pixel => pixel !== '#000000')
                       );
        
        if (hasData) {
            charButton.classList.add('has-data');
        }
        
        charButton.addEventListener('click', () => editFontCharacter(fontIndex, char));
        charactersContainer.appendChild(charButton);
    }
}

// Attach event listeners to font items
function attachFontItemListeners() {
  // Edit buttons
  document.querySelectorAll('.font-item-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fontIndex = parseInt(btn.dataset.fontIndex);
      toggleFontEdit(fontIndex);
    });
  });
  
  // Delete buttons
  document.querySelectorAll('.font-item-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fontIndex = parseInt(btn.dataset.fontIndex);
      deleteFont(fontIndex);
    });
  });
  
  // Character clicks
  document.querySelectorAll('.font-character').forEach(char => {
    char.addEventListener('click', (e) => {
      const fontIndex = parseInt(char.dataset.fontIndex);
      const charValue = char.dataset.char;
      editFontCharacter(fontIndex, charValue);
    });
  });
}

// Toggle font edit mode
function toggleFontEdit(fontIndex) {
    if (currentEditingFont === fontIndex) {
        // Exit edit mode
        currentEditingFont = null;
        if (window.exitFontEditMode) {
            window.exitFontEditMode();
        }
        // Clear canvas name
        if (DOM.canvasName) {
            DOM.canvasName.value = '';
        }
    } else {
        // Enter edit mode
        currentEditingFont = fontIndex;
    }
    updateFontsList();
}

// Edit font character
function editFontCharacter(fontIndex, char) {
    const font = fonts[fontIndex];
    if (!font) return;
    
    // Check if character has saved data
    const hasData = font.characters && font.characters[char] && 
                   font.characters[char].some(row => 
                       row.some(pixel => pixel !== '#000000')
                   );
    
    console.log('editFontCharacter:', { fontIndex, char, hasData, font });
    
    if (currentEditingFont === fontIndex) {
        // In edit mode
        if (hasData) {
            // Enter font edit mode FIRST (before loading data)
            if (window.enterFontEditMode) {
                window.enterFontEditMode(font.name, char);
            }
            
            // Get character data dimensions
            const characterData = font.characters[char];
            const height = characterData.length;
            const width = characterData[0] ? characterData[0].length : 16;
            
            console.log('Loading character data:', { characterData, width, height });
            
            // Convert 2D array to 1D array for loadDataToCanvas
            const pixelData = [];
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    pixelData.push(characterData[y][x] || '#000000');
                }
            }
            
            console.log('Converted pixel data:', pixelData);
            
            // Load data to canvas with proper dimensions
            if (window.loadDataToCanvas) {
                window.loadDataToCanvas(pixelData, width, height);
            }
        } else {
            // Enter font edit mode FIRST
            if (window.enterFontEditMode) {
                window.enterFontEditMode(font.name, char);
            }
            
            // Clear canvas for new design
            if (window.clearCanvas) {
                window.clearCanvas();
            }
        }
        
        // Show edit notification
        showFontEditNotification(font.name, char);
    } else {
        // Not in edit mode - activate type tool for characters with data
        if (hasData) {
            activateTypeToolForCharacter(font.name, char);
        } else {
            // No data - show message
            if (window.showAlert) {
                window.showAlert(`Character "${char}" has no saved design. Enter edit mode to create one.`);
            }
        }
    }
}

// Activate type tool for character
function activateTypeToolForCharacter(fontName, char) {
    // Switch to type tool
    if (window.setActiveTool) {
        window.setActiveTool('type');
    }
    
    // Select the font in the font selector
    if (DOM.fontSelector) {
        // Find the font option and select it
        const fontOptions = Array.from(DOM.fontSelector.options);
        const fontOption = fontOptions.find(option => option.value === fontName);
        if (fontOption) {
            DOM.fontSelector.value = fontName;
            // Trigger change event
            DOM.fontSelector.dispatchEvent(new Event('change'));
        }
    }
    
    // Set the character in the type text input
    if (DOM.typeTextInput) {
        DOM.typeTextInput.value = char;
    }
    
    // Update type status
    if (DOM.typeStatus) {
        DOM.typeStatus.textContent = `READY TO TYPE: ${fontName} - CHARACTER: ${char}`;
    }
    
    if (window.showAlert) {
        window.showAlert(`Type tool activated for character "${char}" from font "${fontName}"`);
    }
}

// Select font character for typing
export function selectFontCharacter(fontIndex, char) {
  const font = fonts[fontIndex];
  if (!font) return;
  
  // Load character data to canvas if it exists
  if (font.characters[char]) {
    if (window.loadCanvasFromData) {
      window.loadCanvasFromData(font.characters[char]);
    }
  }
  
  // Set canvas name
  if (DOM.canvasName) {
    DOM.canvasName.value = `${font.name}_${char}`;
  }
}

// Save font character
export function saveFontCharacter(fontIndex, char, characterData) {
  const font = fonts[fontIndex];
  if (!font) return;
  
  font.characters[char] = characterData;
  saveFontsToStorage();
  updateFontsList();
  
  if (window.showAlert) window.showAlert(`Character "${char}" saved to font "${font.name}"!`);
}

// Delete font
function deleteFont(fontIndex) {
  const font = fonts[fontIndex];
  if (!font) return;
  
  if (window.showConfirm) {
    window.showConfirm(`Delete font "${font.name}"?`, () => {
      fonts.splice(fontIndex, 1);
      saveFontsToStorage();
      updateFontsList();
      updateFontSelector();
      
      if (window.showAlert) window.showAlert('Font deleted successfully');
    });
  }
}

// Clear all fonts
export function clearAllFonts() {
  if (window.showConfirm) {
    window.showConfirm('Clear all fonts?', () => {
      fonts = [];
      saveFontsToStorage();
      updateFontsList();
      updateFontSelector();
      
      if (window.showAlert) window.showAlert('All fonts cleared');
    });
  }
}

// Update font selector dropdown
export function updateFontSelector() {
  if (!DOM.fontSelector) return;
  
  // Clear existing options
  DOM.fontSelector.innerHTML = '<option value="">SELECT FONT</option>';
  
  // Add font options
  fonts.forEach((font, index) => {
    const option = document.createElement('option');
    option.value = font.name; // Use font name instead of index
    option.textContent = font.name.toUpperCase();
    DOM.fontSelector.appendChild(option);
  });
}

// Get font by name
export function getFontByName(fontName) {
  return fonts.find(font => font.name === fontName);
}

// Get all fonts
export function getAllFonts() {
  return fonts;
}

// Get font character data
export function getFontCharacterData(fontName, char) {
  const font = getFontByName(fontName);
  return font ? font.characters[char] : null;
}

// Attach font event listeners
function attachFontEventListeners() {
    // Create font button
    if (DOM.createFontBtn) {
        DOM.createFontBtn.addEventListener('click', createFont);
    }
    
    // Clear fonts button
    if (DOM.clearFontsBtn) {
        DOM.clearFontsBtn.addEventListener('click', clearAllFonts);
    }
    
    // Font selector change
    if (DOM.fontSelector) {
        DOM.fontSelector.addEventListener('change', (e) => {
            const fontName = e.target.value;
            if (fontName) {
                const font = getFontByName(fontName);
                if (font) {
                    // Handle font selection for typing
                    console.log('Font selected:', font.name);
                }
            }
        });
    }
    
    // Font edit notification close button
    if (DOM.fontEditNotificationClose) {
        DOM.fontEditNotificationClose.addEventListener('click', () => {
            hideFontEditNotification();
            if (window.exitFontEditMode) {
                window.exitFontEditMode();
            }
        });
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Get current editing character info
export function getCurrentEditingCharacterInfo() {
  if (currentEditingFont === null) return null;
  
  const font = fonts[currentEditingFont];
  if (!font) return null;
  
  // This would need to be enhanced to track which character is being edited
  return {
    fontName: font.name,
    char: 'A', // This should be tracked separately
    fontIndex: currentEditingFont
  };
}

// Get current editing font
export function getCurrentEditingFont() {
  return currentEditingFont !== null ? fonts[currentEditingFont] : null;
}

// Handle character save
export function handleCharacterSave(characterData) {
  if (currentEditingFont === null) {
    if (window.showAlert) window.showAlert('No font is currently being edited');
    return;
  }
  
  const font = fonts[currentEditingFont];
  if (!font) return;
  
  // This would need to be enhanced to know which character is being saved
  const char = 'A'; // This should be tracked separately
  
  saveFontCharacter(currentEditingFont, char, characterData);
}

// Show font edit notification
function showFontEditNotification(fontName, character) {
  if (DOM.fontEditNotification && DOM.fontEditNotificationText) {
    DOM.fontEditNotificationText.textContent = `Editing ${character} in ${fontName}`;
    DOM.fontEditNotification.style.display = 'block';
  }
}

// Hide font edit notification
export function hideFontEditNotification() {
  if (DOM.fontEditNotification) {
    DOM.fontEditNotification.style.display = 'none';
  }
}
