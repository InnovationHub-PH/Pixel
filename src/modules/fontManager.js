// Font Manager Module
// Handles all font-related functionality including creation, editing, storage, and display

import * as DOM from './domElements.js';

// Font storage key
const FONTS_STORAGE_KEY = 'smolui_fonts';

// Current state - use global currentEditingFont from saveManager
// let currentEditingFont = null; // Removed - use global one
let fonts = [];

// Initialize font functionality
export function initializeFontManager() {
  loadFontsFromStorage();
  updateFontsList();
  attachFontEventListeners();
}

// Load fonts from localStorage
export function loadFontsFromStorage() {
  console.log('loadFontsFromStorage: Starting to load fonts from storage');
  const storedFonts = localStorage.getItem(FONTS_STORAGE_KEY);
  console.log('loadFontsFromStorage: Raw stored fonts:', storedFonts);
  fonts = storedFonts ? JSON.parse(storedFonts) : [];
  console.log('loadFontsFromStorage: Parsed fonts:', fonts);
  console.log('loadFontsFromStorage: Fonts loaded successfully');
}

// Save fonts to localStorage
export function saveFontsToStorage() {
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
  console.log('updateFontsList: Starting to update fonts list display');
  const fontsList = DOM.fontsList;
  const fontsTitle = DOM.fontsTitle;
  
  console.log('updateFontsList: DOM elements found:', { fontsList, fontsTitle });
  
  // Update title with count
  fontsTitle.textContent = `🔤`;
  
  // Clear existing content
  fontsList.innerHTML = '';
  console.log('updateFontsList: Cleared existing content');
  
  if (fonts.length === 0) {
    fontsList.innerHTML = '<div class="saved-empty">No fonts created yet</div>';
    return;
  }
  
  fonts.forEach((font, index) => {
    console.log(`updateFontsList: Processing font "${font.name}" at index ${index}:`, font);
    
    const fontItem = document.createElement('div');
    fontItem.className = 'font-item';
    fontItem.id = `font-${index}`;
    
    // Check if this font is in edit mode
    const isInEditMode = window.currentEditingFont === font.name;
    if (isInEditMode) {
      fontItem.classList.add('font-edit-mode');
    }
    
    // Count characters with data for the expand button - handle both hex and rgb formats
    const charactersWithData = font.characters ? Object.keys(font.characters).filter(char => {
      const charData = font.characters[char];
      return charData && charData.some(row => row.some(pixel => 
        pixel !== '#000000' && pixel !== 'rgb(0, 0, 0)' && pixel !== '' && pixel !== 'transparent'
      ));
    }).length : 0;
    
    console.log(`updateFontsList: Font "${font.name}" has ${charactersWithData} characters with data`);
    
    fontItem.innerHTML = `
      <div class="font-item-header">
        <span class="font-item-name" data-font-index="${index}" data-font-name="${escapeHtml(font.name)}">${escapeHtml(font.name)}</span>
        <span class="font-char-count">(${charactersWithData} chars)</span>
        <div class="font-item-menu">
          ${isInEditMode ? 
            `<button class="font-menu-btn exit-btn" data-font-index="${index}">EXIT</button>` :
            `<button class="font-menu-btn" data-font-index="${index}" data-font-name="${escapeHtml(font.name)}">•••</button>
             <div class="font-menu-dropdown" style="display: none;">
               <button class="font-menu-option edit-option" data-font-index="${index}">EDIT</button>
               <button class="font-menu-option export-option" data-font-name="${escapeHtml(font.name)}">EXPORT</button>
               <button class="font-menu-option delete-option" data-font-index="${index}">DEL</button>
             </div>`
          }
        </div>
      </div>
      <div class="font-characters" style="display: none;"></div>
    `;
    
    fontsList.appendChild(fontItem);
    
    // Render characters for this font (but keep hidden initially)
    renderFontCharacters(index);
  });
  
  // Attach event listeners
  attachFontItemListeners();
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.font-item-menu')) {
      document.querySelectorAll('.font-menu-dropdown').forEach(dropdown => {
        dropdown.style.display = 'none';
      });
    }
  });
}

// Render font characters
function renderFontCharacters(fontIndex) {
    const font = fonts[fontIndex];
    if (!font) return;
    
    const fontContainer = document.getElementById(`font-${fontIndex}`);
    if (!fontContainer) return;
    
    // Check if this font is in edit mode
    const isInEditMode = window.currentEditingFont === font.name;
    
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
        
        // Check if character has saved data - handle both hex and rgb formats
        const hasData = font.characters && font.characters[char] && 
                       font.characters[char].some(row => 
                           row.some(pixel => 
                               pixel !== '#000000' && pixel !== 'rgb(0, 0, 0)' && pixel !== '' && pixel !== 'transparent'
                           )
                       );
        
        // Debug: Log character data for this specific character
        if (font.characters && font.characters[char]) {
            console.log(`renderFontCharacters: Character "${char}" data:`, font.characters[char]);
            console.log(`renderFontCharacters: Character "${char}" hasData:`, hasData);
        }
        
        if (hasData) {
            charButton.classList.add('has-data');
            console.log(`renderFontCharacters: Added has-data class to character "${char}"`);
        }
        
        charButton.addEventListener('click', () => editFontCharacter(fontIndex, char));
        charactersContainer.appendChild(charButton);
    }
}

// Attach event listeners to font items
function attachFontItemListeners() {
  // Menu button click to toggle dropdown (only for non-exit buttons)
  document.querySelectorAll('.font-menu-btn:not(.exit-btn)').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menuContainer = btn.closest('.font-item-menu');
      const dropdown = menuContainer.querySelector('.font-menu-dropdown');
      
      // Close all other dropdowns first
      document.querySelectorAll('.font-menu-dropdown').forEach(d => {
        if (d !== dropdown) {
          d.style.display = 'none';
        }
      });
      
      // Toggle current dropdown
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });
  });
  
  // Exit button click to exit edit mode
  document.querySelectorAll('.font-menu-btn.exit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fontIndex = parseInt(btn.dataset.fontIndex);
      
      console.log('Exit button clicked for font index:', fontIndex);
      
      // Exit edit mode
      toggleFontEdit(fontIndex);
    });
  });
  
  // Edit option
  document.querySelectorAll('.edit-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fontIndex = parseInt(btn.dataset.fontIndex);
      
      console.log('Edit option clicked for font index:', fontIndex);
      
      // Enter edit mode first
      toggleFontEdit(fontIndex);
      
      // After entering edit mode, expand the font to show characters
      setTimeout(() => {
        const fontItem = document.getElementById(`font-${fontIndex}`);
        console.log('Font item found after edit mode:', fontItem);
        
        if (fontItem) {
          const charactersContainer = fontItem.querySelector('.font-characters');
          console.log('Characters container found after edit mode:', charactersContainer);
          
          if (charactersContainer) {
            console.log('Setting characters container to display block');
            charactersContainer.style.display = 'block';
            fontItem.classList.add('expanded');
            console.log('Added expanded class to font item');
          } else {
            console.error('Characters container not found after edit mode');
          }
        } else {
          console.error('Font item not found after edit mode for index:', fontIndex);
        }
      }, 100); // Small delay to ensure DOM is updated
      
      // Close dropdown after action
      const dropdown = btn.closest('.font-menu-dropdown');
      dropdown.style.display = 'none';
    });
  });
  
  // Delete option
  document.querySelectorAll('.delete-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fontIndex = parseInt(btn.dataset.fontIndex);
      deleteFont(fontIndex);
      
      // Close dropdown after action
      const dropdown = btn.closest('.font-menu-dropdown');
      dropdown.style.display = 'none';
    });
  });
  
  // Export option
  document.querySelectorAll('.export-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fontName = btn.dataset.fontName;
      exportFontAsAdafruitGFX(fontName);
      
      // Close dropdown after action
      const dropdown = btn.closest('.font-menu-dropdown');
      dropdown.style.display = 'none';
    });
  });

  // Font name clicks - expand font and show export code
  document.querySelectorAll('.font-item-name').forEach(nameSpan => {
    nameSpan.addEventListener('click', (e) => {
      e.stopPropagation();
      const fontIndex = parseInt(nameSpan.dataset.fontIndex);
      const fontName = nameSpan.dataset.fontName;
      
      // Expand the font to show characters
      expandFontAndShowExport(fontIndex, fontName);
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

// Expand/collapse font and show export code
function expandFontAndShowExport(fontIndex, fontName) {
  const fontItem = document.getElementById(`font-${fontIndex}`);
  if (!fontItem) return;
  
  const charactersContainer = fontItem.querySelector('.font-characters');
  const isExpanded = fontItem.classList.contains('expanded');
  
  if (isExpanded) {
    // Collapse the font
    charactersContainer.style.display = 'none';
    fontItem.classList.remove('expanded');
  } else {
    // Expand the font to show characters
    charactersContainer.style.display = 'block';
    fontItem.classList.add('expanded');
    
    // Generate and display the export code for this font
    if (window.generateAdafruitGFXFont) {
      try {
        const exportCode = window.generateAdafruitGFXFont(fontName);
        console.log('Generated export code for font:', fontName, exportCode);
        
        if (window.updateExportCodeWithFont) {
          window.updateExportCodeWithFont(fontName);
          console.log('Updated export code with font');
          
          // Update copy button state after showing font code
          if (window.updateCopyButtonState) {
            setTimeout(() => window.updateCopyButtonState(), 100);
          }
        } else {
          console.error('updateExportCodeWithFont function not available');
        }
      } catch (error) {
        console.error('Error generating export code:', error);
      }
    } else {
      console.error('generateAdafruitGFXFont function not available');
    }
  }
}

// Toggle font edit mode
function toggleFontEdit(fontIndex) {
    const font = fonts[fontIndex];
    if (!font) return;
    
    if (window.currentEditingFont === font.name) {
        // Exit edit mode
        window.currentEditingFont = null;
        if (window.exitFontEditMode) {
            window.exitFontEditMode();
        }
        // Clear canvas name
        if (DOM.canvasName) {
            DOM.canvasName.value = '';
        }
    } else {
        // Enter edit mode
        window.currentEditingFont = font.name;
        // Also set the global variable in saveManager
        if (window.enterFontEditMode) {
            // Enter edit mode with a default character (e.g., 'A')
            window.enterFontEditMode(font.name, 'A');
        }
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
    
    // Always enter font edit mode when clicking on a character
    if (window.enterFontEditMode) {
        window.enterFontEditMode(font.name, char);
    }
    
    if (hasData) {
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
        // Clear canvas for new design
        if (window.clearCanvas) {
            window.clearCanvas();
        }
    }
    
    // Show edit notification
    showFontEditNotification(font.name, char);
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
  
  // Update font dimensions based on new logic:
  // - Width: Individual per character
  // - Height: Universal across all characters in the font
  if (window.getCanvasDimensions) {
    const { width, height } = window.getCanvasDimensions();
    
    // Update this character's width individually
    updateCharacterWidth(font.name, char, width);
    
    // Update height universally for all characters in the font
    // Use default bottom anchor since we don't have resize context here
    updateFontCharactersHeight(font.name, height, 'bottom');
  }
  
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

// Get fonts array
export function getFontsArray() {
  return fonts;
}

// Get font character data
export function getFontCharacterData(fontName, char) {
  const font = getFontByName(fontName);
  return font ? font.characters[char] : null;
}

// Update all characters in a font with new canvas dimensions
export function updateFontCharactersDimensions(fontName, newWidth, newHeight, resizeAnchor = 'bottom') {
  const font = getFontByName(fontName);
  if (!font || !font.characters) return;
  
  console.log(`Updating font "${fontName}" characters: width to ${newWidth}, height to ${newHeight} with anchor: ${resizeAnchor}`);
  
  // Get all characters in the font
  const characterKeys = Object.keys(font.characters);
  
  characterKeys.forEach(char => {
    const characterData = font.characters[char];
    if (characterData && Array.isArray(characterData)) {
      // Resize the character data to match new dimensions with proper anchor
      const resizedData = resizeCharacterData(characterData, newWidth, newHeight, resizeAnchor);
      font.characters[char] = resizedData;
      console.log(`Resized character "${char}" to ${newWidth}x${newHeight} with anchor: ${resizeAnchor}`);
    }
  });
  
  // Save the updated font to storage
  saveFontsToStorage();
  console.log(`All characters in font "${fontName}" updated: width=${newWidth}, height=${newHeight} with anchor: ${resizeAnchor}`);
}

// Update only the height of all characters in a font (universal height)
export function updateFontCharactersHeight(fontName, newHeight, resizeAnchor = 'bottom') {
  const font = getFontByName(fontName);
  if (!font || !font.characters) return;
  
  console.log(`=== updateFontCharactersHeight DEBUG START ===`);
  console.log(`Font name: "${fontName}"`);
  console.log(`New height: ${newHeight}`);
  console.log(`Resize anchor parameter: "${resizeAnchor}"`);
  console.log(`Resize anchor type: ${typeof resizeAnchor}`);
  console.log(`Number of characters to update: ${Object.keys(font.characters).length}`);
  
  // Get all characters in the font
  const characterKeys = Object.keys(font.characters);
  
  characterKeys.forEach((char, index) => {
    const characterData = font.characters[char];
    if (characterData && Array.isArray(characterData)) {
      // Get current width of this character
      const currentWidth = characterData[0] ? characterData[0].length : 14;
      console.log(`Updating character "${char}" (${index + 1}/${characterKeys.length}):`);
      console.log(`  Current dimensions: ${currentWidth}x${characterData.length}`);
      console.log(`  New height: ${newHeight}`);
      console.log(`  Resize anchor: "${resizeAnchor}"`);
      
      // Resize the character data to match new height while preserving width and respecting anchor
      const resizedData = resizeCharacterData(characterData, currentWidth, newHeight, resizeAnchor);
      font.characters[char] = resizedData;
      console.log(`  Updated character "${char}" height to ${newHeight} (width remains ${currentWidth}) with anchor: ${resizeAnchor}`);
    }
  });
  
  // Don't save to storage here - let the main save function handle it
  console.log(`All characters in font "${fontName}" height updated to ${newHeight} with anchor: ${resizeAnchor} (not saved to storage yet)`);
  console.log(`=== updateFontCharactersHeight DEBUG END ===`);
}

// Update only the width of a specific character (individual width)
export function updateCharacterWidth(fontName, character, newWidth) {
  const font = getFontByName(fontName);
  if (!font || !font.characters || !font.characters[character]) return;
  
  console.log(`Updating character "${character}" width to ${newWidth} in font "${fontName}"`);
  
  const characterData = font.characters[character];
  if (characterData && Array.isArray(characterData)) {
    // Get current height of this character
    const currentHeight = characterData.length;
    // Resize the character data to match new width while preserving height
    const resizedData = resizeCharacterData(characterData, newWidth, currentHeight);
    font.characters[character] = resizedData;
    console.log(`Updated character "${character}" width to ${newWidth} (height remains ${currentHeight})`);
    
    // Don't save to storage here - let the main save function handle it
    console.log(`Character "${character}" width updated to ${newWidth} (not saved to storage yet)`);
  }
}

// Helper function to resize character data
function resizeCharacterData(characterData, newWidth, newHeight, resizeAnchor = 'bottom') {
  const oldHeight = characterData.length;
  const oldWidth = oldHeight > 0 ? characterData[0].length : 0;
  
  console.log(`resizeCharacterData: Resizing from ${oldWidth}x${oldHeight} to ${newWidth}x${newHeight} with anchor: ${resizeAnchor}`);
  console.log(`resizeCharacterData: Anchor type check:`);
  console.log(`  Is top anchor: ${resizeAnchor === 'top' || resizeAnchor === 'top-left' || resizeAnchor === 'top-right'}`);
  console.log(`  Is bottom anchor: ${resizeAnchor === 'bottom' || resizeAnchor === 'bottom-left' || resizeAnchor === 'bottom-right'}`);
  console.log(`  Full anchor value: "${resizeAnchor}"`);
  
  // Create new resized data array
  const resizedData = [];
  
  for (let y = 0; y < newHeight; y++) {
    const row = [];
    for (let x = 0; x < newWidth; x++) {
      let pixelColor = '#000000'; // Default to black
      
      if (y < oldHeight && x < oldWidth) {
        // Calculate source position based on resize anchor
        let sourceY = y;
        
        if (resizeAnchor === 'top' || resizeAnchor === 'top-left' || resizeAnchor === 'top-right') {
          // When resizing from top, pixels move down
          // For expanding: new pixels added at top, existing content moves down
          // For shrinking: pixels removed from top, existing content moves up
          if (newHeight > oldHeight) {
            // Expanding - existing content moves down
            sourceY = y - (newHeight - oldHeight);
            console.log(`Top anchor expanding: y=${y}, sourceY=${sourceY}, offset=${newHeight - oldHeight}`);
          } else {
            // Shrinking - existing content moves up
            sourceY = y + (oldHeight - newHeight);
            console.log(`Top anchor shrinking: y=${y}, sourceY=${sourceY}, offset=${oldHeight - newHeight}`);
          }
        } else if (resizeAnchor === 'bottom' || resizeAnchor === 'bottom-left' || resizeAnchor === 'bottom-right') {
          // When resizing from bottom, pixels stay in place
          // For expanding: new pixels added at bottom
          // For shrinking: pixels removed from bottom
          sourceY = y;
          console.log(`Bottom anchor: y=${y}, sourceY=${sourceY}`);
        }
        
        // Check if source position is valid
        if (sourceY >= 0 && sourceY < oldHeight) {
          pixelColor = characterData[sourceY][x] || '#000000';
        }
      }
      
      row.push(pixelColor);
    }
    resizedData.push(row);
  }
  
  console.log(`resizeCharacterData: Resize completed with anchor: ${resizeAnchor}`);
  return resizedData;
}

// Attach font event listeners
function attachFontEventListeners() {
    // Create font button
    if (DOM.createFontBtn) {
        DOM.createFontBtn.addEventListener('click', createFont);
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

// Export font as Adafruit_GFX header file
function exportFontAsAdafruitGFX(fontName) {
    if (window.generateAdafruitGFXFont) {
        const headerCode = window.generateAdafruitGFXFont(fontName);
        
        // Update export code area to show the generated code
        if (window.updateExportCodeWithFont) {
            window.updateExportCodeWithFont(fontName);
        }
        
        // Create a download link
        const blob = new Blob([headerCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fontName.replace(/[^A-Z0-9]/gi, '_')}_font.h`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (window.showAlert) {
            window.showAlert(`Font "${fontName}" exported as Adafruit_GFX header file!`);
        }
    } else {
        if (window.showAlert) {
            window.showAlert('Font export functionality not available. Please check if the app is fully loaded.');
        }
    }
}

// Export character as Adafruit_GFX character file
function exportCharacterAsAdafruitGFX(fontName, char) {
    const font = getFontByName(fontName);
    if (!font) {
        if (window.showAlert) window.showAlert('Font not found.');
        return;
    }

    const characterData = font.characters[char];
    if (!characterData) {
        if (window.showAlert) window.showAlert(`Character '${char}' not found in font '${fontName}'.`);
        return;
    }

    const headerCode = window.generateAdafruitGFXCharacter(fontName, char);

    // Update export code area to show the generated code
    if (window.updateExportCodeWithCharacter) {
        window.updateExportCodeWithCharacter(fontName, char);
    }
    
    // Create a download link
    const blob = new Blob([headerCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fontName.replace(/[^A-Z0-9]/gi, '_')}_${char}.h`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.showAlert) {
        window.showAlert(`Character '${char}' from font '${fontName}' exported as Adafruit_GFX character file!`);
    }
}

// Show font export preview
function showFontExportPreview(fontName) {
    if (window.updateExportCodeWithFont) {
        window.updateExportCodeWithFont(fontName);
        if (window.showAlert) {
            window.showAlert(`Showing Adafruit_GFX export code for font "${fontName}". Click the EXPORT button to download the header file.`);
        }
    } else {
        if (window.showAlert) {
            window.showAlert('Font export preview not available. Please check if the app is fully loaded.');
        }
    }
}
