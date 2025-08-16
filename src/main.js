// Main Application Entry Point
// Orchestrates all modules and handles global initialization

// Import DOM elements
import * as DOM from './modules/domElements.js';

// Import existing modules
import { 
  initializeFontManager, 
  updateFontsList, 
  updateFontSelector,
  selectFontCharacter,
  getFontByName,
  getFontCharacterData,
  getAllFonts,
  getCurrentEditingFont,
  handleCharacterSave,
  loadFontsFromStorage
} from './modules/fontManager.js';

import {
  initializeExportManager,
  updateExportContent,
  copyCodeToClipboard,
  getCurrentExportSettings,
  setExportSettings,
  exportCanvasData,
  updateCopyButtonState
} from './modules/exportManager.js';

// Import new modules
import { 
  initializeCanvas, 
  createGrid, 
  updateDimensions, 
  applyDimensions,
  clearCanvas,
  loadCanvasFromData,
  loadDataToCanvas,
  saveCanvasState,
  restoreCanvasState,
  undo,
  redo,
  getCanvasData,
  getCanvasDimensions,
  setBrushProperties as setCanvasBrushProperties,
  showReferenceLines,
  hideReferenceLines,
  setBaselinePosition,
  setVerticalPosition,
  getReferenceLinePositions,
  debugReferenceLines,
  clearBrushPreview,
  hideGhostPixelAtPosition,
  getCurrentResizeAnchor
} from './modules/canvasManager.js';

console.log('canvasManager imported:', { initializeCanvas, createGrid, saveCanvasState });

// import {
//   initializeToolManager,
//   setActiveTool as setToolActiveTool,
//   deselectAllTools,
//   updateToolControls,
//   updateColorControlsVisibility,
//   updateColorDisplay,
//   getCurrentTool,
//   getBrushProperties,
//   setBrushProperties as setToolBrushProperties
// } from './modules/toolManager.js';

// console.log('toolManager imported:', { initializeToolManager, getCurrentTool });

import {
  initializeComponentManager,
  loadComponents,
  placeComponent,
  deleteComponent,

  showComponentPreview,
  clearComponentPreview,
  handleComponentClick,
  updateCounts,
  retryCanvasSetup,
  enableComponentBrush,
  exitBrushMode,
  cleanupComponentStates,
  resetCanvasAndComponents
} from './modules/componentManager.js';

console.log('componentManager imported:', { initializeComponentManager, loadComponents });

import {
  initializeModalManager,
  showConfirm,
  showAlert,
  confirmAction
} from './modules/modalManager.js';

console.log('modalManager imported:', { initializeModalManager, showConfirm, showAlert });

import {
  initializeTypeManager,
  handleTypeClick,
  showTextPreview,
  clearTypingPreview,
  exitTypingMode
} from './modules/typeManager.js';

console.log('typeManager imported:', { initializeTypeManager, handleTypeClick });

import {
  initializeExportCodeGenerator,
  updateExportCode,
  generateAdafruitGFXFont,
  generateAdafruitGFXCharacter,
  updateExportCodeWithFont,
  updateExportCodeWithCharacter,
  updateSubFormatOptions
} from './modules/exportCodeGenerator.js';

console.log('exportCodeGenerator imported:', { initializeExportCodeGenerator, updateExportCode });

import {
  initializeSaveManager,
  enterFontEditMode,
  exitFontEditMode,
  getSaveState,
  saveFontReferenceLinePositions,
  updateSaveButtonState,
  clearGhostPreview
} from './modules/saveManager.js';

console.log('saveManager imported:', { initializeSaveManager, enterFontEditMode, exitFontEditMode });

// Application state
let fonts = JSON.parse(localStorage.getItem('smolui_fonts')) || [];
let components = JSON.parse(localStorage.getItem('components')) || {};
let compositions = JSON.parse(localStorage.getItem('compositions')) || {};

// Global functions for cross-module communication
window.currentTool = 'draw';
window.placingComponent = null;
window.updateExportCode = updateExportCode;
window.saveCanvasState = saveCanvasState;
window.clearCanvas = clearCanvas;
// window.getCurrentTool = getCurrentTool; // Disabled since toolManager not initialized
// window.deselectAllTools = deselectAllTools; // Disabled since toolManager not initialized
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.handleTypeClick = handleTypeClick;
window.showTextPreview = showTextPreview;
window.clearTypingPreview = clearTypingPreview;
window.exitTypingMode = exitTypingMode;
window.showComponentPreview = showComponentPreview;
window.clearComponentPreview = clearComponentPreview;
window.handleComponentClick = handleComponentClick;
window.enableComponentBrush = enableComponentBrush;
window.exitBrushMode = exitBrushMode;
window.cleanupComponentStates = cleanupComponentStates;
window.resetCanvasAndComponents = resetCanvasAndComponents;
window.setCanvasBrushProperties = setCanvasBrushProperties;
window.enterFontEditMode = enterFontEditMode;
window.exitFontEditMode = exitFontEditMode;
window.showReferenceLines = showReferenceLines;
window.hideReferenceLines = hideReferenceLines;
window.setBaselinePosition = setBaselinePosition;
window.setVerticalPosition = setVerticalPosition;
window.getReferenceLinePositions = getReferenceLinePositions;
window.getCanvasDimensions = getCanvasDimensions;
window.debugReferenceLines = debugReferenceLines;
window.clearBrushPreview = clearBrushPreview;
window.clearGhostPreview = clearGhostPreview;
window.hideGhostPixelAtPosition = hideGhostPixelAtPosition;
window.getCurrentResizeAnchor = getCurrentResizeAnchor;



window.getSaveState = getSaveState;
window.loadComponents = loadComponents;
window.updateCounts = updateCounts;
window.updateFontsList = updateFontsList;
window.loadCanvasFromData = loadCanvasFromData;
window.loadDataToCanvas = loadDataToCanvas;
window.loadFontsFromStorage = loadFontsFromStorage;
window.setActiveTool = setActiveTool;
window.applyDimensions = applyDimensions;

// Get current editing character info
function getCurrentEditingCharacterInfo() {
  // This function should return info about the currently editing character
  // For now, return null to prevent errors
  return null;
}

// Set active tool
function setActiveTool(tool) {
    window.currentTool = tool;
    // setToolActiveTool(tool); // Disabled since toolManager not initialized
    
    // Initialize default color
    let currentColor = '#ffffff'; // Default color
    
    // Immediately update brush properties for the new tool
    if (window.toolBrushProperties && window.toolBrushProperties[tool]) {
        const props = window.toolBrushProperties[tool];
        
        // Get the current color from the appropriate color picker
        if (tool === 'draw') {
            const drawColorPicker = document.getElementById('drawColorPicker');
            currentColor = drawColorPicker ? drawColorPicker.value : '#ffffff';
        } else if (tool === 'fill') {
            const fillColorPicker = document.getElementById('fillColorPicker');
            currentColor = fillColorPicker ? fillColorPicker.value : '#00ff00';
        }
        
        if (window.setCanvasBrushProperties) {
            window.setCanvasBrushProperties(currentColor, props.size, props.shape);
        }
    }
    
    // Expose currentColor globally so other modules can access it
    window.currentColor = currentColor;
    
    console.log('Active tool set to:', tool, 'with color:', currentColor);
}

// Edit font function
function editFont(fontId) {
    // Implementation for editing fonts
    console.log('Edit font:', fontId);
}

// Delete font function
function deleteFont(fontId) {
    showConfirm(`Delete font "${fonts[fontId]?.name}"?`, () => {
        delete fonts[fontId];
        localStorage.setItem('fonts', JSON.stringify(fonts));
        updateFontsList();
        showAlert('Font deleted successfully');
    });
}

// Update UI function
function updateUI() {
  // Update save button text based on current editing state
  const editingInfo = getCurrentEditingCharacterInfo();
  if (editingInfo) {
    DOM.saveBtn.textContent = `SAVE ${editingInfo.char} TO ${editingInfo.fontName}`;
  } else {
    DOM.saveBtn.textContent = 'SAVE AS';
  }

  // Update font-related UI
  updateFontsList();
  updateFontSelector();
  
  // Update export content
  updateExportContent();
}

// Initialize the application
function initializeApp() {
  console.log('Starting app initialization...');
  
  try {
    // Test module imports
    console.log('Testing module imports...');
    console.log('canvasManager functions:', { initializeCanvas, createGrid, saveCanvasState });
    // console.log('toolManager functions:', { initializeToolManager, getCurrentTool });
    console.log('componentManager functions:', { initializeComponentManager, loadComponents });
    console.log('modalManager functions:', { initializeModalManager, showConfirm, showAlert });
    console.log('typeManager functions:', { initializeTypeManager, handleTypeClick });
    console.log('exportCodeGenerator functions:', { initializeExportCodeGenerator, updateExportCode });
    console.log('saveManager functions:', { initializeSaveManager, enterFontEditMode, exitFontEditMode });
    
    // Check if DOM elements exist
    console.log('Checking DOM elements...');
    if (!DOM.pixelGrid) {
      console.error('pixelGrid element not found');
      return;
    }
    if (!DOM.fontsList) {
      console.error('fontsList element not found');
        return;
    }
    if (!DOM.exportContent) {
      console.error('exportContent element not found');
        return;
    }
    if (!DOM.saveBtn) {
      console.error('saveBtn element not found');
        return;
    }
    if (!DOM.saveOptions) {
      console.error('saveOptions element not found');
        return;
    }
    if (!DOM.saveAsComponent) {
      console.error('saveAsComponent element not found');
        return;
    }
    if (!DOM.saveAsComposition) {
      console.error('saveAsComposition element not found');
            return;
        }
        
    console.log('All required DOM elements found successfully');
    
    // Initialize all modules
    console.log('Initializing fontManager...');
    initializeFontManager();
    
    console.log('Initializing exportManager...');
    initializeExportManager();
    
    console.log('Initializing canvas...');
    initializeCanvas();
    
    console.log('Initializing toolManager...');
    // Temporarily disable toolManager initialization to avoid DOM element errors
    // The new brush controls are handled in setupBrushControls()
    // initializeToolManager();
    
    console.log('Initializing componentManager...');
    initializeComponentManager();
    
    // Retry canvas setup for component manager after canvas is ready
    retryCanvasSetup();
    
    console.log('Initializing modalManager...');
    initializeModalManager();
    
    console.log('Initializing typeManager...');
    initializeTypeManager();
    
    console.log('Initializing exportCodeGenerator...');
    initializeExportCodeGenerator();
    
    console.log('Initializing saveManager...');
    initializeSaveManager();
    
    // Setup global event listeners
    console.log('Setting up global event listeners...');
    setupGlobalEventListeners();
    
    // Initialize UI
    console.log('Initializing UI...');
    updateFontSelector();
    updateFontsList();
    updateExportContent();
    updateSubFormatOptions();
    
    // Load saved compositions
    console.log('Loading saved compositions...');
    loadCompositions();
    
    // Initialize copy button state
    if (window.updateCopyButtonState) {
      console.log('Main: Calling updateCopyButtonState on init');
      // Add a small delay to ensure DOM is fully ready
      setTimeout(() => {
        window.updateCopyButtonState();
      }, 100);
    } else {
      console.log('Main: updateCopyButtonState not available on init');
    }
    
    // Save initial state
    console.log('Saving initial state...');
    saveCanvasState();
    
    console.log('App initialization complete!');
  } catch (error) {
    console.error('Error during app initialization:', error);
    console.error('Error stack:', error.stack);
  }
}

// Setup global event listeners
function setupGlobalEventListeners() {
  // Dimension controls
  DOM.applyDimensionsBtn.addEventListener('click', applyDimensions);

  // Setup expand/collapse functionality for sidebar sections
  setupSidebarExpansion();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Check for Ctrl (Windows/Linux) or Cmd (Mac)
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    
    if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if (isCtrlOrCmd && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  });
}

// Setup sidebar expansion functionality
function setupSidebarExpansion() {
  // Allow clicking on headers to expand/collapse
  const sectionHeaders = document.querySelectorAll('.saved-header');
  sectionHeaders.forEach(header => {
    header.addEventListener('click', (e) => {
      // Don't trigger if clicking on buttons
      if (e.target.tagName === 'BUTTON') {
        return;
      }
      toggleSection(header);
    });
  });
}

// Setup tool sections expansion functionality
function setupToolSections() {
  // Map tools to their corresponding sections
  const toolSections = {
    'draw': 'drawSection',
    'erase': 'eraseSection',
    'fill': 'fillSection', // Fill tool now has its own section
    'type': 'typeSection',
    'move': null // No specific section for move tool
  };

  // Add click listeners to tool buttons
  const toolButtons = document.querySelectorAll('.tool-icon-btn[data-tool]');
  console.log('Found tool buttons:', toolButtons.length);
  toolButtons.forEach(button => {
    console.log('Setting up listener for button:', button.getAttribute('data-tool'));
    button.addEventListener('click', (e) => {
      console.log('Tool button clicked:', button.getAttribute('data-tool'));
      const tool = button.getAttribute('data-tool');
      const sectionId = toolSections[tool];
      console.log('Tool:', tool, 'maps to section:', sectionId);
      
      // Exit type mode if switching from type tool to another tool
      if (window.currentTool === 'type' && tool !== 'type') {
        console.log('Exiting type mode - switching from type tool to:', tool);
        if (window.exitTypingMode) {
          window.exitTypingMode();
        }
        // Reset Type tool UI state
        if (window.resetTypeToolUI) {
          window.resetTypeToolUI();
        }
      }
      
      // Set the active tool
      setActiveTool(tool);
      
      // Update active button state
      document.querySelectorAll('.tool-icon-btn').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      if (sectionId) {
        toggleToolSection(sectionId);
      } else {
        console.log('No section found for tool:', tool);
      }
    });
  });

  // Color picker handling - now separate for Draw and Fill tools
  const drawColorPicker = document.getElementById('drawColorPicker');
  const drawColorDisplay = document.getElementById('drawColorDisplay');
  const fillColorPicker = document.getElementById('fillColorPicker');
  const fillColorDisplay = document.getElementById('fillColorDisplay');
  
  if (drawColorPicker && drawColorDisplay) {
    // Handle color change
    drawColorPicker.addEventListener('change', (e) => {
      const color = e.target.value;
      drawColorDisplay.textContent = color.toUpperCase();
      
      // Update the current drawing color when draw tool is active
      if (window.currentTool === 'draw') {
        // Update canvas brush color
        if (window.setCanvasBrushProperties) {
          const currentProps = window.toolBrushProperties?.draw || { size: 1, shape: 'square' };
          window.setCanvasBrushProperties(color, currentProps.size, currentProps.shape);
        }
        // Update global currentColor
        window.currentColor = color;
      }
      
      console.log('Draw color changed to:', color);
    });
    
    // Handle input event for typing/pasting hex codes
    drawColorPicker.addEventListener('input', (e) => {
      const color = e.target.value;
      drawColorDisplay.textContent = color.toUpperCase();
      
      // Update the current drawing color when draw tool is active
      if (window.currentTool === 'draw') {
        // Update canvas brush color
        if (window.setCanvasBrushProperties) {
          const currentProps = window.toolBrushProperties?.draw || { size: 1, shape: 'square' };
          window.setCanvasBrushProperties(color, currentProps.size, currentProps.shape);
        }
        // Update global currentColor
        window.currentColor = color;
      }
      
      console.log('Draw color input to:', color);
    });
    
    // Handle blur event to ensure color is updated immediately
    drawColorPicker.addEventListener('blur', (e) => {
      const color = e.target.value;
      drawColorDisplay.textContent = color.toUpperCase();
      
      // Update the current drawing color when draw tool is active
      if (window.currentTool === 'draw') {
        // Update canvas brush color
        if (window.setCanvasBrushProperties) {
          const currentProps = window.toolBrushProperties?.draw || { size: 1, shape: 'square' };
          window.setCanvasBrushProperties(color, currentProps.size, currentProps.shape);
        }
        // Update global currentColor
        window.currentColor = color;
      }
      
      console.log('Draw color updated on blur:', color);
    });
  }
  
  if (fillColorPicker && fillColorDisplay) {
    // Handle color change
    fillColorPicker.addEventListener('change', (e) => {
      const color = e.target.value;
      fillColorDisplay.textContent = color.toUpperCase();
      
      // Update the current fill color when fill tool is active
      if (window.currentTool === 'fill') {
        // Update canvas brush color for fill tool
        if (window.setCanvasBrushProperties) {
          const currentProps = window.toolBrushProperties?.fill || { size: 1, shape: 'square' };
          window.setCanvasBrushProperties(color, currentProps.size, currentProps.shape);
        }
        // Update global currentColor
        window.currentColor = color;
      }
      
      console.log('Fill color changed to:', color);
    });
    
    // Handle input event for typing/pasting hex codes
    fillColorPicker.addEventListener('input', (e) => {
      const color = e.target.value;
      fillColorDisplay.textContent = color.toUpperCase();
      
      // Update the current fill color when fill tool is active
      if (window.currentTool === 'fill') {
        // Update canvas brush color for fill tool
        if (window.setCanvasBrushProperties) {
          const currentProps = window.toolBrushProperties?.fill || { size: 1, shape: 'square' };
          window.setCanvasBrushProperties(color, currentProps.size, currentProps.shape);
        }
        // Update global currentColor
        window.currentColor = color;
      }
      
      console.log('Fill color input to:', color);
    });
    
    // Handle blur event to ensure color is updated immediately
    fillColorPicker.addEventListener('blur', (e) => {
      const color = e.target.value;
      fillColorDisplay.textContent = color.toUpperCase();
      
      // Update the current fill color when fill tool is active
      if (window.currentTool === 'fill') {
        // Update canvas brush color for fill tool
        if (window.setCanvasBrushProperties) {
          const currentProps = window.toolBrushProperties?.fill || { size: 1, shape: 'square' };
          window.setCanvasBrushProperties(color, currentProps.size, currentProps.shape);
        }
        // Update global currentColor
        window.currentColor = color;
      }
      
      console.log('Fill color updated on blur:', color);
    });
  }

  // Setup brush controls for independent tool settings
  setupBrushControls();
  
  // Setup Type tool controls
  setupTypeToolControls();
  
  // Setup Clear button
  setupClearButton();
}

// Reset all tool sections to hidden state
function resetAllToolSections() {
  const allToolSections = document.querySelectorAll('.tool-section');
  allToolSections.forEach(section => {
    section.classList.remove('active');
    console.log('Reset section:', section.id, 'to hidden');
  });
}

// Toggle tool section expansion
function toggleToolSection(sectionId) {
  console.log('toggleToolSection called with:', sectionId);
  
  // Reset all tool sections first
  resetAllToolSections();
  
  // If sectionId is null (like for move tool), just hide all and return
  if (!sectionId) {
    console.log('No section to show, all sections hidden');
    return;
  }
  
  // Show the specific section
  const section = document.getElementById(sectionId);
  if (!section) {
    console.log('Section not found:', sectionId);
    return;
  }
  
  section.classList.add('active');
  console.log('Added active to:', sectionId);
}

// Setup brush controls for independent tool settings
function setupBrushControls() {
  // Draw tool brush controls
  const drawBrushSize = document.getElementById('drawBrushSize');
  const drawBrushSizeValue = document.getElementById('drawBrushSizeValue');
  
  if (drawBrushSize && drawBrushSizeValue) {
    drawBrushSize.addEventListener('input', (e) => {
      const size = e.target.value;
      drawBrushSizeValue.textContent = size;
      // Update draw tool brush size
      updateToolBrushProperty('draw', 'size', parseInt(size));
    });
  }

  // Erase tool brush controls
  const eraseBrushSize = document.getElementById('eraseBrushSize');
  const eraseBrushSizeValue = document.getElementById('eraseBrushSizeValue');
  
  if (eraseBrushSize && eraseBrushSizeValue) {
    eraseBrushSize.addEventListener('input', (e) => {
      const size = e.target.value;
      eraseBrushSizeValue.textContent = size;
      // Update erase tool brush size
      updateToolBrushProperty('erase', 'size', parseInt(size));
    });
  }

  // Shape button controls
  const shapeButtons = document.querySelectorAll('.shape-btn');
  shapeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const shape = button.getAttribute('data-shape');
      const tool = button.getAttribute('data-tool');
      
      // Update active state for the specific tool's shape group
      const toolShapeGroup = document.getElementById(`${tool}ShapeGroup`);
      if (toolShapeGroup) {
        const allShapeButtons = toolShapeGroup.querySelectorAll('.shape-btn');
        allShapeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
      }
      
      // Update brush shape
      updateToolBrushProperty(tool, 'shape', shape);
    });
  });
}

// Setup Type tool controls
function setupTypeToolControls() {
  // Font selector
  const fontSelector = document.getElementById('fontSelector');
  const typeStatus = document.getElementById('typeStatus');
  const typeTextInput = document.getElementById('typeTextInput');
  const typeSpacingSlider = document.getElementById('typeSpacingSlider');
  const typeSpacingValue = document.getElementById('typeSpacingValue');
  
  if (fontSelector) {
    fontSelector.addEventListener('change', (e) => {
      const selectedFont = e.target.value;
      if (selectedFont) {
        typeStatus.textContent = `FONT: ${selectedFont}`;
        typeTextInput.disabled = false;
        typeTextInput.focus();
      } else {
        typeStatus.textContent = 'SELECT FONT TO START TYPING';
        typeTextInput.disabled = true;
      }
    });
  }
  
  if (typeSpacingSlider && typeSpacingValue) {
    typeSpacingSlider.addEventListener('input', (e) => {
      const spacing = e.target.value;
      typeSpacingValue.textContent = spacing;
    });
  }
  
  if (typeTextInput) {
    typeTextInput.addEventListener('input', (e) => {
      const text = e.target.value;
      // Update typing preview if needed
      if (window.showTextPreview) {
        window.showTextPreview(text);
      }
    });
  }
  
  // Function to reset Type tool UI state
  window.resetTypeToolUI = function() {
    if (fontSelector) fontSelector.value = '';
    if (typeStatus) typeStatus.textContent = 'SELECT FONT TO START TYPING';
    if (typeTextInput) {
      typeTextInput.value = '';
      typeTextInput.disabled = true;
    }
    if (typeSpacingSlider) typeSpacingSlider.value = 0;
    if (typeSpacingValue) typeSpacingValue.textContent = '0';
    console.log('Type tool UI reset');
  };
}

// Setup Clear button functionality
function setupClearButton() {
  const clearBtn = document.getElementById('clearBtn');
  
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      console.log('Clear button clicked');
      
      // Show confirmation dialog
      if (window.showConfirm) {
        window.showConfirm('Clear the entire canvas?', () => {
          console.log('Canvas clear confirmed');
          
          // Save current state before clearing
          if (window.saveCanvasState) {
            window.saveCanvasState();
          }
          
          // Clear the canvas
          if (window.clearCanvas) {
            window.clearCanvas();
          }
          
          console.log('Canvas cleared successfully');
        });
      } else {
        console.error('showConfirm function not available');
      }
    });
    
    console.log('Clear button event listener attached');
  } else {
    console.error('Clear button not found');
  }
}

// Update brush properties for specific tools
function updateToolBrushProperty(tool, property, value) {
  console.log(`Updating ${tool} tool ${property} to:`, value);
  
  // Store tool-specific brush properties
  if (!window.toolBrushProperties) {
    window.toolBrushProperties = {};
  }
  
  if (!window.toolBrushProperties[tool]) {
    window.toolBrushProperties[tool] = { size: 1, shape: 'square' };
  }
  
  window.toolBrushProperties[tool][property] = value;
  
  // Update the current tool if it matches
  if (window.currentTool === tool) {
    // Update canvas manager brush properties
    if (window.setCanvasBrushProperties) {
      const currentProps = window.toolBrushProperties[tool];
      // Get the current color from the appropriate color picker
      let currentColor = '#ffffff';
      if (tool === 'draw') {
        const drawColorPicker = document.getElementById('drawColorPicker');
        currentColor = drawColorPicker ? drawColorPicker.value : '#ffffff';
      } else if (tool === 'fill') {
        const fillColorPicker = document.getElementById('fillColorPicker');
        currentColor = fillColorPicker ? fillColorPicker.value : '#00ff00';
      }
      window.setCanvasBrushProperties(currentColor, currentProps.size, currentProps.shape);
    }
  }
  
  console.log('Updated tool brush properties:', window.toolBrushProperties);
}

// Track expanded sections for proper positioning
let expandedSections = [];

// Toggle section expansion
function toggleSection(header) {
  // Get the section type from the data-section attribute
  const sectionType = header.getAttribute('data-section');
  if (!sectionType) return;
  
  // Find the corresponding content section
  const content = document.getElementById(sectionType + 'Content');
  if (!content) return;
  
  const isExpanded = content.classList.contains('expanded');
  
  if (isExpanded) {
    // Collapse section
    content.classList.remove('expanded');
    header.classList.remove('expanded');
    
    // Remove from expanded sections array
    const index = expandedSections.indexOf(content);
    if (index > -1) {
      expandedSections.splice(index, 1);
    }
  } else {
    // Expand section
    content.classList.add('expanded');
    header.classList.add('expanded');
    
    // Add to expanded sections array
    expandedSections.push(content);
  }
  
  // Update content column size based on expanded sections
  updateContentColumnSize();
}

// Update content column size based on expanded sections
function updateContentColumnSize() {
  const sidebarContent = document.querySelector('.sidebar-content');
  const savedItems = document.querySelector('.saved-items');
  const exportWindow = document.querySelector('.export-window');
  if (!sidebarContent || !savedItems || !exportWindow) return;
  
  if (expandedSections.length > 0) {
    // Expand content column when sections are expanded
    sidebarContent.style.width = '300px';
    sidebarContent.style.minWidth = '300px';
    sidebarContent.style.flex = '0 0 300px';
    
    // Expand main container to accommodate content column
    savedItems.style.width = '360px'; // 60px (icons) + 300px (content)
    savedItems.style.minWidth = '360px';
    
    // Expand export window to match content
    exportWindow.style.width = '360px';
    exportWindow.style.minWidth = '360px';
    exportWindow.style.height = 'auto';
    exportWindow.style.minHeight = 'auto';
  } else {
    // Collapse content column when no sections are expanded
    sidebarContent.style.width = '0';
    sidebarContent.style.minWidth = '0';
    sidebarContent.style.flex = '0 0 auto';
    
    // Collapse main container to just icons column width
    savedItems.style.width = '60px';
    savedItems.style.minWidth = '60px';
    
    // Collapse export window to just icons width
    exportWindow.style.width = '60px';
    exportWindow.style.minWidth = '60px';
    exportWindow.style.height = 'auto';
    exportWindow.style.minHeight = 'auto';
  }
}



// Composition management
function loadCompositions() {
    console.log('loadCompositions called');
    const compositions = JSON.parse(localStorage.getItem('pixelCompositions') || '[]');
    console.log('Found compositions in localStorage:', compositions);
    console.log('DOM.compositionsList:', DOM.compositionsList);
    renderCompositionsList(compositions);
}

// Load a specific composition
function loadComposition(index) {
    const compositions = JSON.parse(localStorage.getItem('pixelCompositions') || '[]');
    if (compositions[index]) {
        const composition = compositions[index];
        // Load the composition data to the canvas
        if (window.loadCompositionToCanvas) {
            window.loadCompositionToCanvas(composition);
        }
        console.log('Loading composition:', composition.name);
    }
}

// Delete a specific composition
function deleteComposition(index) {
    const compositions = JSON.parse(localStorage.getItem('pixelCompositions') || '[]');
    if (compositions[index]) {
        compositions.splice(index, 1);
        localStorage.setItem('pixelCompositions', JSON.stringify(compositions));
        loadCompositions(); // Refresh the list
        console.log('Deleted composition at index:', index);
    }
}

function renderCompositionsList(compositions) {
  console.log('renderCompositionsList called with:', compositions);
  console.log('DOM.compositionsList element:', DOM.compositionsList);
  
  if (!DOM.compositionsList) {
    console.error('compositionsList element not found!');
    return;
  }
  
  DOM.compositionsList.innerHTML = '';
    
    if (compositions.length === 0) {
    console.log('No compositions to render, showing empty message');
    DOM.compositionsList.innerHTML = '<div class="saved-empty">No compositions saved yet</div>';
        return;
    }
    
  console.log(`Rendering ${compositions.length} compositions`);
  
  // Render each composition
  compositions.forEach((composition, index) => {
    const compositionDiv = document.createElement('div');
    compositionDiv.className = 'saved-item';
    compositionDiv.innerHTML = `
      <div class="saved-item-info">
        <span class="saved-item-name">${composition.name || 'Unnamed Composition'}</span>
        <span class="saved-item-size">${composition.width} × ${composition.height}</span>
      </div>
      <div class="saved-item-actions">
        <button class="saved-item-btn" onclick="loadComposition(${index})" title="Load">📂</button>
        <button class="saved-item-btn" onclick="deleteComposition(${index})" title="Delete">🗑️</button>
      </div>
    `;
    DOM.compositionsList.appendChild(compositionDiv);
    console.log(`Added composition ${index}:`, composition.name);
  });
  
  console.log('Finished rendering compositions list');
}



// Simple test function to verify JavaScript is working
function testJavaScript() {
    console.log('JavaScript is working!');
    
    // Test DOM elements
    const testElements = [
        'pixelGrid',
        'saveBtn', 
        'saveOptions',
        'fontsList',
        'exportContent'
    ];
    
    testElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}: ${element ? 'FOUND' : 'NOT FOUND'}`);
    });
    
    // Test if modules are loaded
    console.log('Module test:', {
        canvasManager: typeof initializeCanvas !== 'undefined',
        toolManager: typeof initializeToolManager !== 'undefined',
        componentManager: typeof initializeComponentManager !== 'undefined',
        modalManager: typeof initializeModalManager !== 'undefined',
        typeManager: typeof initializeTypeManager !== 'undefined',
        exportCodeGenerator: typeof initializeExportCodeGenerator !== 'undefined',
        saveManager: typeof initializeSaveManager !== 'undefined'
    });
}

// Call test function when DOM is loaded
document.addEventListener('DOMContentLoaded', testJavaScript);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Starting initialization...');
  console.log('Document ready state:', document.readyState);
  console.log('DOM elements available:', {
    pixelGrid: !!document.getElementById('pixelGrid'),
    saveBtn: !!document.getElementById('saveBtn'),
    saveOptions: !!document.getElementById('saveOptions')
  });
  initializeApp();
  
  // Setup tool sections after app initialization
  setTimeout(() => {
    if (typeof setupToolSections === 'function') {
      console.log('Setting up tool sections...');
      setupToolSections();
      
      // Ensure no tool sections are active by default
      const allToolSections = document.querySelectorAll('.tool-section');
      allToolSections.forEach(section => {
        section.classList.remove('active');
      });
      console.log('All tool sections hidden by default');
      
      // Initialize tool brush properties
      if (!window.toolBrushProperties) {
        window.toolBrushProperties = {
          'draw': { size: 1, shape: 'square' },
          'erase': { size: 1, shape: 'square' }
        };
      }
      
      // Set initial active tool
      setActiveTool('draw');
      
      // Load compositions again after everything is set up
      console.log('Loading compositions after tool setup...');
      loadCompositions();
    } else {
      console.error('setupToolSections function not available');
    }
  }, 100);
});

// Expose functions to global scope for inline event handlers
window.editCharacter = editCharacter;
window.toggleFontEditMode = toggleFontEditMode;
window.deleteFont = deleteFont;
window.placeComponent = placeComponent;
window.deleteComponent = deleteComponent;
window.loadComposition = loadComposition;
window.deleteComposition = deleteComposition;
window.loadCompositions = loadCompositions;

// Expose functions to global scope for fontManager to call
window.switchToDrawTool = () => setActiveTool('draw');
window.switchToTypeTool = () => setActiveTool('type');
window.updateUI = updateUI;
window.saveFontCharacter = handleCharacterSave; // Expose for fontManager to use

// Simple getCurrentTool function to replace the missing one from toolManager
window.getCurrentTool = () => window.currentTool || 'draw';

// Placeholder functions for backward compatibility
function editCharacter(fontName, character) {
  // This will be handled by typeManager
  console.log('Edit character:', fontName, character);
}

function toggleFontEditMode(fontName) {
  // This will be handled by typeManager
  console.log('Toggle font edit mode:', fontName);
}

// Export code generator functions
window.updateExportCode = updateExportCode;
window.generateAdafruitGFXFont = generateAdafruitGFXFont;
window.generateAdafruitGFXCharacter = generateAdafruitGFXCharacter;
window.updateExportCodeWithFont = updateExportCodeWithFont;
window.updateExportCodeWithCharacter = updateExportCodeWithCharacter;
window.updateCopyButtonState = updateCopyButtonState;

// Save manager functions
window.enterFontEditMode = enterFontEditMode;
window.exitFontEditMode = exitFontEditMode;
window.getSaveState = getSaveState;
window.saveFontReferenceLinePositions = saveFontReferenceLinePositions;