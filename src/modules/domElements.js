// DOM Elements Module
// Centralized DOM element selections

// Color Controls
export const drawColorPicker = document.getElementById('drawColorPicker');
export const drawColorDisplay = document.getElementById('drawColorDisplay');
export const fillColorPicker = document.getElementById('fillColorPicker');
export const fillColorDisplay = document.getElementById('fillColorDisplay');

// Tools and Controls
export const toolButtons = document.querySelectorAll('.tool-icon-btn[data-tool]');
export const shapeButtons = document.querySelectorAll('.shape-btn');
export const clearBtn = document.getElementById('clearBtn');

// Draw Tool Controls
export const drawBrushSize = document.getElementById('drawBrushSize');
export const drawBrushSizeValue = document.getElementById('drawBrushSizeValue');

// Erase Tool Controls
export const eraseBrushSize = document.getElementById('eraseBrushSize');
export const eraseBrushSizeValue = document.getElementById('eraseBrushSizeValue');

// Type Tool Controls
export const typeToolGroup = document.getElementById('typeToolGroup');
export const fontSelector = document.getElementById('fontSelector');
export const typeTextInput = document.getElementById('typeTextInput');
export const typeStatus = document.getElementById('typeStatus');
export const typeSpacingSlider = document.getElementById('typeSpacingSlider');
export const typeSpacingValue = document.getElementById('typeSpacingValue');

// Tool Groups
export const drawShapeGroup = document.getElementById('drawShapeGroup');
export const drawSizeGroup = document.getElementById('drawSizeGroup');
export const eraseShapeGroup = document.getElementById('eraseShapeGroup');
export const eraseSizeGroup = document.getElementById('eraseSizeGroup');

// Canvas Controls
export const pixelGrid = document.getElementById('pixelGrid');
export const canvasName = document.getElementById('canvasName');
export const saveBtn = document.getElementById('saveBtn');
export const saveOptions = document.getElementById('saveOptions');
export const saveAsComponent = document.getElementById('saveAsComponent');
export const saveAsComposition = document.getElementById('saveAsComposition');
export const widthInput = document.getElementById('widthInput');
export const heightInput = document.getElementById('heightInput');
export const applyDimensionsBtn = document.getElementById('applyDimensionsBtn');
export const quickWidthSelector = document.getElementById('quickWidthSelector');
export const quickHeightSelector = document.getElementById('quickHeightSelector');
export const currentDimensions = document.getElementById('currentDimensions');



// Font Management
export const fontNameInput = document.getElementById('fontNameInput');
export const createFontBtn = document.getElementById('createFontBtn');
export const fontsList = document.getElementById('fontsList');
export const fontsTitle = document.getElementById('fontsTitle');


// Saved Items
export const componentsList = document.getElementById('componentsList');
export const componentsTitle = document.getElementById('componentsTitle');

export const compositionsList = document.getElementById('compositionsList');
export const compositionsTitle = document.getElementById('compositionsTitle');


// Font Edit Notification
export const fontEditNotification = document.getElementById('fontEditNotification');
export const fontEditNotificationText = document.getElementById('fontEditNotificationText');
export const fontEditNotificationClose = document.getElementById('fontEditNotificationClose');

// Export Controls
export const exportContent = document.getElementById('exportContent');
export const copyCodeBtn = document.getElementById('copyCodeBtn');
export const protocolRadios = document.querySelectorAll('input[name="protocol"]');
export const formatRadios = document.querySelectorAll('input[name="format"]');
export const subFormatRadios = document.querySelectorAll('input[name="subformat"]');
export const subFormatSelector = document.getElementById('subFormatSelector');
export const colorFormatOptions = document.getElementById('colorFormatOptions');
export const monochromeFormatOptions = document.getElementById('monochromeFormatOptions');

// Modals
export const confirmModal = document.getElementById('confirmModal');
export const confirmMessage = document.getElementById('confirmMessage');
export const confirmYes = document.getElementById('confirmYes');
export const confirmNo = document.getElementById('confirmNo');
export const alertModal = document.getElementById('alertModal');
export const alertMessage = document.getElementById('alertMessage');
export const alertOk = document.getElementById('alertOk');

// Debug DOM elements
console.log('DOM Elements loaded:', {
    pixelGrid: !!pixelGrid,
    saveBtn: !!saveBtn,
    saveOptions: !!saveOptions,
    saveAsComponent: !!saveAsComponent,
    saveAsComposition: !!saveAsComposition,
    fontsList: !!fontsList,
    exportContent: !!exportContent
});

// Utility function to get elements by data attribute
export const getToolButton = (tool) => document.querySelector(`[data-tool="${tool}"]`);
export const getShapeButton = (shape) => document.querySelector(`[data-shape="${shape}"]`);
