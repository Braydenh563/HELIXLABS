// noprotect

/*
 * HELIXLABS - Interactive Microbiome Simulation (Dewey Cabinet)
 *
 * A generative simulation where users type DNA sequences into the helix text bar to
 * synthesise unique micro-organisms. Each sequence generates a unique species,
 * deterministically mapping a species' attributes with distinct behaviours, colours,
 * shapes, speeds, trails, and glow properties. Users can spawn, observe, manage, and
 * interact with multiple species simultaneously inside a virtual environment via
 * elements which feature a futuristic Jarvis inspired glassmorphism UI aesthetic.
 *
 * Name: Brayden Hoyle | Student Number: n11967340
 *
 * Various code sections were adapted from the following sources:
 * - Craig Reynolds' Boids algorithm (flock behaviour):
 *   https://www.red3d.com/cwr/boids/
 * - Daniel Shiffman's separation steering from Nature of Code (scatter behaviour):
 *   https://natureofcode.com/autonomous-agents/
 * - Jared Donovan's Creative Coding Meandering demo (drift wander behaviour):
 *   https://editor.p5js.org/creativecoding/sketches/m1PcSxkOe
 * - Jared Donovan's Creative Coding Grow demo (growth behaviour):
 *   https://editor.p5js.org/creativecoding/sketches/1yVKKYiAX
 * - Claude Cafe's Colourful Orbits algorithm (orbit behaviour):
 *   https://claudes.cafe/sketches/colorful-orbits/
 * - Claude Cafe's Lissajous Curves algorithm (lissajous behaviour):
 *   https://claudes.cafe/sketches/lissajous-curves/
 * - Claude Cafe's Ripple Effect algorithm (pulse ripple behaviour):
 *   https://claudes.cafe/sketches/ripple-effect/
 * - p5.js Soft Body Maths & Physics example (colony behaviour):
 *   https://p5js.org/examples/math-and-physics-soft-body/
 *
 * Each algorithm was significantly modified with each being integrated
 * into a DNA seed-driven property/attribute system. These behaviours were
 * extended with new steering logic, state machines, and visual trail/glow
 * mechanics.
 */

// ---
// Global Variables
// ---

// Base canvas widths - if larger resolution, canvas will resize to window while retaining the aspect ratio
const canvasWidth = 1280;
const canvasHeight = 720;

let mainCanvas;
let myFont;

// Controls pixel density to control render quality vs performance
let drawPixelDensity = 1.5; // 1, 1.5, 2, 3 - Default: 4

// Caches/stores the generated and blurred terrain as a graphics object to reduce lag, also partially used as the frosted glass layer for some UI elements
let blurredTerrainGraphic; // Store/cache blurred background for UI

// Ambience
let ambienceSounds = []; // Preloaded sound/music files
let ambienceManager; // BackgroundAmbienceManager class instance

// Mute button
let muteUnmuteBtnRadius = 16;
let muteUnmuteBtnX = 0;
let muteUnmuteBtnY = 0;

// Tracks the rendered text height of the generated species description to adjust the scroll height/distance accordingly
let descTotalTextHeight = 0; // Store/cache the description text height

// App State - Which screen is currently active
let programState = "start"; // start, intro, simulation

// Start Page
let startTitleText = "HELIXLABS"; // BIOLABS, HELIXLABS, ASTROGEN, GENLAB, GENESIS LABS, BIOWEAVE, SPIRAL FOUNDARY
let beginBtnW = 215;
let beginBtnH = 58;

let textInput;

// Initialise virtual environment borders
let envX = 0;
let envY = 0;
let envW = 0;
let envH = 0;

let spatialGrid = {};

// All active node instances are stored here
let nodes = [];

// Highest allowed number of nodes able to be spawned even if the dynamically calculated species cap is higher
let maxNodeCap = 70; // 90, 120
let savedNodeTypes = [];

let descScrollY = 0;

// Species index sidebar pages
let speciesIndexPage = 0; // 0 - stats, 1 - description, 2 - polygon graph
let speciesIndexTopPanelH = 346; // Height of the top species index panel // 326
let speciesDescription = ""; // Save generated description, but regenerated when DNA changes

// Tooltip system
let tooltipID = ""; // ID of currently hovered element
let tooltipPrevID = "";
let tooltipTimer = 0;
let tooltipDelay = 50; // Frames before tooltip shows -> ~0.8 secs
let tooltipText = "";
let tooltipDrawX = 0;
let tooltipDrawY = 0;

// Tutorial
let tutorialState = 0; // 0 = not started, 1-3 = tutorialSteps, -1 = done
let introPage = 0; // Current intro slide (0-based index)
let contextualHintsShown = {}; // tracks which hints have been shown
// Keys - "speciesIndex", "activeList", "energyMonitor", "controls"
let activeContextualHint = "";
let contextualHintTimer = 0;
let tutorialSpawnCount = 0;
let postTutorialPromptTimer = 0;

// GIFs
let tutorialGifs = {};
let hintGifs = {};

// Hover state tracking per hint key
let hintHoverFrames = {}; // Frames mouse has been over the feature
let hintShowFrames = {}; // Frames the hint panel has been visible
let hintIsShowing = {}; // Whether hint is currently visible

let hintMinTimePanelShown = 480; // 8 secs rn

// Bottom bar
let bottomBarH = 60; // 48, 54, 68
let helixAreaH = 36; // Top helix strip part of bar
let dnaInputText = ""; // textInput
let speciesNameText = "";
let bottomBarIsTyping = false;
let bottomBarActiveField = ""; // whichever text field is focused
let bottomBarCursorBlink = 0; // cursor blink timer

let sidebarClearBtnY = 0;
let sidebarClearBtnH = 26;

// Description scrollbar drag state
let descScrollbarDragging = false;
let descScrollbarDragStartMouseY = 0;
let descScrollbarDragStartScrollY = 0;

// Stored each frame in drawSidebarDescriptionPage for mousePressed/mouseDragged to read
let descScrollbarThumbY = 0;
let descScrollbarThumbH = 20;
let descScrollbarTrackY = 0;
let descScrollbarTrackH = 100;
let descScrollbarDrawX = 0;
let descMaxScrollStored = 0;

let barY;
let barX;
let barWidth;
let dnaFieldHeight;
let dnaFieldY;
let innerY;

let fieldPad = 8;
let dnaLabelWidth = 0; // 105
let nameLabelWidth = 46;
let btnWidth = 90;
let btnGap = 6;
let nameFieldWidth = 120;
let totalBtnWidths;
let dnaFieldWidth;

let dnaFieldX;
let btnStartX;

let isDarkMode = true;

// let isSpawnMode = true;
let isPaused = false;

let draggedNode = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

let exitBtnRadius = 20;
let exitBtnX;
let exitBtnY;

let tutorialBtnX = 0;
let tutorialBtnY = 0;
let tutorialBoxW = 264;
let tutorialBoxH = 142;
let tutorialBtnRadius = 16;
let tutorialStepComplete = true;

let tutorialBtnIsHovered;

let btnTogglePlayPauseX;
let btnTogglePlayPauseY;
let btnTogglePlayPauseRadius;

let pulse = 0;

let fpsX = 0;
let fpsY = 0;
let fpsPanelW = 245;
let fpsPanelH = 38;
let currentFpsW;
let currentFpsH;
let fpsPanelWCollapsed = 145;
let fpsPanelHCollapsed = 22;
let fpsHistory = [];
let fpsHistoryLength = 30;

let terrainColourSeed = 0;
let terrainGraphic;
let terrainScale; // 4, 6, 7, 8

let colonyGroups = {}; // Stores and tracks each colony's anchor positions, rotation speed, noise offsets, and shape pattern
let colonyGroupCounter = 0; // unique ID counter for new colonies (auto-increments)
let colonyMaxSize = 8; // max nodes per colony group

let currentDNA; // Current dna seed
let sumCode; // The driving dna seed value

let manageNotifications = [];
let weaveBehaviourWarningShown = false;
let predateBehaviourWarningShown = false;

let sidebarWidth = 210;
let sidebarMargin = 18;
let sidebarPadding = 10;
let sidebarX = sidebarMargin;
let sidebarY = sidebarMargin;
let sidebarInnerX = 0;
let sidebarContentW = 0;
let sidebarRightEdge = 0;
let sidebarH = 720 - sidebarMargin * 2;
let openKebabIndex = -1; // Which node type row the kebab is open, -1 - none

let pageSelectorY = 0;
let pageSelectorH = 22;
let pageBtnW = 0;

let isSidebarCollapsed = false;
let sidebarFullWidth = 210;
let sidebarCollapsedWidth = 1; // 26

let kebabMenuX = 0;
let kebabMenuW = 134;
let kebabHeaderH = 24;
let kebabItemH = 26;

let editPanelW = 340;
let editPanelH = 180;
let editPanelX = 0;
let editPanelY = 0;
let editPanelPad = 14;
let isEditPopupOpen = false;
let editPopupIndex = -1;
let editPopupDNAText = "";
let editPopupNameText = "";
let editPopupActiveField = ""; // "dna" or "name"

let secretTabHovered = false;
let isExportingPNG = false;

let isFPSCollapsed = false;
let fpsDisplayValue = 60;
let fpsDisplayTimer = 0;

let btnBottomY;
let btnAreaH = 32;
let previewH = 100; // 130
let propertyY = sidebarMargin + previewH + sidebarPadding + 18;
let dnaListStartY = propertyY + 175;
// let dnaListStartY = 345;
let dnaListScrollOffset = 0;
let isDraggingScrollbar = false;
let scrollbarDragStartY = 0;
let scrollbarDragStartOffset = 0;
let listTop;
let listBottom;
let listVisibleHeight;
let totalListContentHeight;
let scrollbarX;
let dnaListRowHeight = 35;

// let isVisualiseOpen = false;
// let visualiseWidth = 440;
// let visualiseHeight = 360;
// let visualiseX = 0;
// let visualiseY = 0;
// let visualisePreviewCanvas;
let isSidebarDragging = false;
let sidebarDragDNA = null;
let sidebarDragX = 0;
let sidebarDragY = 0;
let sidebarDragOriginX = 0;
let sidebarDragOriginY = 0;

let previewCanvas;
let previewTime = 0;
let previewNodeTrail = [];
let previewTrailMaxLen = 35;
let previewPulseRadius = 0;

let previewNodes = []; // nodes that only exist inside the preview canvas
let previewFrame = 0; // local frame counter for preview canvas
let previewDNAString = ""; // track when DNA changes to re-init preview nodes

// ---
// Arrays & Dictionaries
// ---

// Tutorial GIFs - keyed by step number - 1-based index
let tutorialGifPaths = {
  1: "gifs/HELIXLABS_Tutorial_1-Compressed.gif",
  2: "gifs/HELIXLABS_Tutorial_2-Compressed.gif",
  3: "gifs/HELIXLABS_Tutorial_3-Compressed.gif",
};

// Contextual hint GIFs - keyed by hint key string
let hintGifPaths = {
  speciesIndex: "gifs/HELIXLABS_SpeciesIndex-Compressed.gif",
  activeList: "gifs/HELIXLABS_Tutorial_3-Compressed.gif",
  energyMonitor: "gifs/HELIXLABS_FPSIndicator-Compressed.gif",
  controls: "gifs/HELIXLABS_RandomiseIntroduceControls-Compressed.gif",
};

let dnaStringMaxLength = 16; // 25
let allowedProteins = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

let complementMap = {
  A: "Z",
  Z: "A",
  B: "Y",
  Y: "B",
  C: "X",
  X: "C",
  D: "W",
  W: "D",
  E: "V",
  V: "E",
  F: "U",
  U: "F",
  G: "T",
  T: "G",
  H: "S",
  S: "H",
  I: "R",
  R: "I",
  J: "Q",
  Q: "J",
  K: "P",
  P: "K",
  L: "O",
  O: "L",
  M: "N",
  N: "M",
};

// Map each DNA protein letter and helix rung to its RGB display colour in the DNA helix field
let proteinColourMap = {
  A: [255, 100, 80],
  B: [255, 145, 50],
  C: [255, 200, 40],
  D: [220, 240, 50],
  E: [140, 230, 60],
  F: [60, 220, 90],
  G: [40, 210, 160],
  H: [30, 210, 220],
  I: [50, 175, 255],
  J: [70, 130, 255],
  K: [110, 90, 255],
  L: [160, 70, 255],
  M: [210, 60, 240],
  N: [240, 60, 190],
  O: [255, 60, 140],
  P: [255, 80, 100],
  Q: [255, 160, 90],
  R: [200, 240, 100],
  S: [80, 240, 160],
  T: [0, 215, 190],
  U: [100, 200, 255],
  V: [180, 130, 255],
  W: [255, 120, 180],
  X: [255, 210, 100],
  Y: [160, 255, 130],
  Z: [255, 80, 80],
};

let velocityBehaviours = [
  "bounce",
  "contrail orb",
  "pulse ripple",
  "flock",
  "drift wander",
  "weave",
  "growth",
  "predate",
];

let behaviourPhrases = {
  bounce: [
    "linearly ricochets energetically between environmental boundaries",
    "exhibits high-velocity elastic locomotion along hard surfaces",
    "rebounds off the edges of its habitat with explosive rebound energy",
  ],
  "contrail orb": [
    "traces luminous spiralling contrails through the medium",
    "leaves semi-translucent bioluminescent residue behind as it spirals and drifts",
    "curves through the environment, shedding a glowing wake",
  ],
  flock: [
    "coordinates in graceful bird flock-like group formations",
    "demonstrates consistent schooling behaviour",
    "self-organises into fluid, shifting collective patterns",
  ],
  scatter: [
    "largely sedentary, making rare spontaneous hops between resting positions, but violent evades any other approaching organism",
    "highly territorial - sits anchored between infrequent positional bursts, scattering explosively when any nearby organism encroaches on its space",
    "exhibits punctuated stillness and mostly stationary, but often prone to sudden bursts of movement, with extreme defensive avoidance of all other species",
  ],
  orbit: [
    "locks into persistent elliptical orbits around mass bodies of organisms",
    "gravitates endlessly around foreign species in varying circular arcs",
    "maintains circular patrol routes centred on nearby life-forms",
  ],
  lissajous: [
    "traces precise mathematical trajectories similar to that of a figure-eight",
    "follows complex Lissajous curves with unnerving precision for unknown means",
    "etches elegant parametric paths through the environment",
  ],
  "drift wander": [
    "drifts lazily on invisible environmental microcurrents",
    "meanders with slow smooth motion across the terrain",
    "wanders aimlessly, guided by unseen atmospheric flows",
  ],
  colony: [
    "clusters into tightly-bound rotating and drifting colonial formations",
    "maintains rigid orbital proximity within grouped superorganism clusters",
    "forms mostly stationary colonial formations resembling microscopic star clusters",
  ],
  "pulse ripple": [
    "emits rhythmic concentric pressure wave rings outward",
    "pulses outward in expanding bioluminescent ripples",
    "broadcasts regular shockwave rings from its centre mass",
  ],
  growth: [
    "drifts purposefully toward unseen spacial waypoints, actively repelling its own kind",
    "continuously endeavours to seek unseen spacial waypoints across the terrain, maintaining relative distance from its siblings",
    "explores with slow deliberate motion toward unseen spacial waypoints",
  ],
  weave: [
    "weaves persistent tapestries of bioluminescent thread across the terrain",
    "leaves intricate woven trail networks that slowly fade over time",
    "stitches luminous patterns into the environment as it meanders",
  ],
  predate: [
    "drifts patiently until prey enters its personal territory, then chase and attept to consume its prey if successfully caught. It has been noted that some prey have been able to escape its clutches",
    "an apex predator that despises nearby organisms encroaching apon its territory, and  pursue them across the environment until it succeeds or abandons the hunt",
    "actively hunts and consumes other species should they not respect its personal space, occasionally converting captured prey into new hunters of its own kind",
  ],
};

let shapeTypes = {
  circle: "spherical",
  triangle: "triangular",
  square: "rectilinear",
  ellipse: "ellipsoidal",
  hexagon: "hexagonal",
};
let glowTypes = {
  none: "absent",
  steady: "constant steady emission",
  pulse: "rhythmic pulsing emission",
};
let trailTypes = {
  none: "none",
  "curve fill": "filled organic curve",
  fade: "fading wake",
  dots: "bioluminescent dot trail",
  curve: "smooth curve residue",
  ribbon: "wide luminescent ribbon",
};

// Energy consumption ratings per behaviour to reduce lag and dynamically cap node spawn amounts
let behaviourEnergyRatings = {
  weave: 18, // 10, 12, 15, 22
  flock: 5, // 4
  scatter: 4, // 3
  "contrail orb": 3, // 4
  growth: 4,
  lissajous: 2, // 3
  orbit: 4, // 3
  colony: 2, // 3
  "drift wander": 2,
  bounce: 1,
  "pulse ripple": 2, // could be 3
  predate: 6,
};

let firstNames = [
  "Wanderus",
  "Blobicus",
  "Tremulus",
  "Globulus",
  "Floaticus",
  "Pulsatus",
  "Drifticus",
  "Gyrans",
  "Oscillatus",
  "Clustus",
  "Spiralis",
  "Nudgicus",
  "Floccula",
  "Vibraticus",
  "Orbitans",
];

let lastNames = [
  "Indecisus",
  "Mediocris",
  "Confusus",
  "Erraticus",
  "Absurdus",
  "Peculiaris",
  "Nervosus",
  "Perplexus",
  "Vagus",
  "Dubiosus",
  "Incognitus",
  "Irregularis",
  "Agitatus",
  "Curiosus",
  "Minimus",
];

/*

emergency landing on an unknown planet

as the chief lab technician, you have collected dna protein samples, identified each gene pool by letters of the alphabet, and are experimenting with different dna combinations of these genes.

your task: 
 - Choose letters of the alphabet to form a dna sequence to create a new micro alien life form
 - Click into the environment to i

*/

let introSlideData = [
  {
    title: "Emergency Landing",
    subtitle: "Day 1 - Uncharted Planet, Sector 67-D",
    sections: [
      {
        heading: "SITUATION",
        body:
          "Your research vessel has made an emergency landing on an uncharted planet after drive failure. Rescue is 72 hours away.",
        sectionHeight: 40,
      },
      {
        heading: "CONTEXT",
        body:
          "Surface samples reveal something extraordinary. Local organisms are built from an entirely new set of 26 base proteins - the gene pool here is completely unmapped. High Command has requested you gather data. ",
        sectionHeight: 55,
      },
      {
        heading: "OBJECTIVE",
        body:
          "Use your ship's onboard " +
          startTitleText +
          " simulator to synthesise and study new organisms. Type a DNA sequence, spawn a species, and observe what emerges.",
        sectionHeight: 65,
        highlight: true,
      },
    ],
  },
];

// Tutorial step data - label, body text, target area (x, y, w, h), arrow direction
let tutorialSteps = [
  {
    label: "THE DNA SEQUENCE",
    body:
      "Type any letters into the bar - this sequence defines your organism's behaviour, size, colour and traits.",
    hint: "➤ Click the bar below and type something",
    boxPos: "above-bar",
  },
  {
    label: "SPAWN YOUR SPECIES",
    body:
      "Click anywhere inside the environment border to release your organism. Each unique sequence produces a unique species.",
    hint: "➤ Click anywhere in the environment",
    boxPos: "env-top",
  },
  {
    label: "ACTIVE SPECIES LIST",
    body:
      "All introduced species appear in the list below. Click a row to select it. Use ⋮ to rename, extract individuals, or discard a species. You can manage multiple species here.",
    hint: "➤ Click your species in the list",
    boxPos: "right-sidebar-bottom",
  },
];

let contextualHintData = {
  speciesIndex: {
    label: "SPECIES INDEX",
    body:
      "Stats shows the full property breakdown. Description gives biology notes. Spider Chart visualises the five key stats.",
    hint: "➤ Click any tab above to explore",
    gifKey: "speciesIndex",
  },
  activeList: {
    label: "ACTIVE SPECIES LIST",
    body:
      "All introduced species appear here. Click a row to select it. Use ⋮ to rename, extract individuals, or discard a species entirely.",
    hint: "➤ Try clicking a species row",
    gifKey: "activeList",
  },
  energyMonitor: {
    label: "ENERGY MONITOR",
    body:
      "High-cost species reduce how many nodes you can spawn. The bar fills as your population grows. Click to collapse.",
    hint: "➤ Click the panel to collapse it",
    gifKey: "energyMonitor",
  },
  controls: {
    label: "CONTROLS",
    body:
      "RANDOMISE generates a new random sequence. INTRODUCE spawns a cluster of the current species at a random environment position. CLEAR empties the DNA helix for new protiens to be entered.",
    hint: "➤ Try each button",
    gifKey: "controls",
  },
};

let dnaColours = [
  "#4197D7",
  "#E74C3C",
  "#2ECC71",
  "#F1C40F",
  "#9B59B6",
  "#E67E22",
  "#1ABC9C",
  "#E91E63",
  "#00BCD4",
  "#FF5722",
  "#8BC34A",
  "#FF9800",
  "#3F51B5",
  "#009688",
  "#EA80FC",
  "#F06292",
  "#4DB6AC",
  "#FFD54F",
  "#A1887F",
  "#7986CB",
  "#AED581",
  "#848B79",
  "#FF8A65",
  "#BA68C8",
  "#4FC3F7",
  "#DCE775",
  "#FFF176",
  "#80DEEA",
  "#CE93D8",
];

let colourNames = {
  "#4197D7": "Sky Blue",
  "#E74C3C": "Crimson",
  "#2ECC71": "Emerald",
  "#F1C40F": "Sunflower",
  "#9B59B6": "Violet",
  "#E67E22": "Tangerine",
  "#1ABC9C": "Light Sea Green",
  "#E91E63": "Rose",
  "#00BCD4": "Cerulean",
  "#FF5722": "Ember",
  "#8BC34A": "Lime",
  "#FF9800": "Amber",
  "#3F51B5": "Indigo",
  "#009688": "Seafoam",
  "#EA80FC": "Orchid",
  "#F06292": "Blush",
  "#4DB6AC": "Verdigris",
  "#FFD54F": "Honey",
  "#A1887F": "Clay",
  "#7986CB": "Periwinkle",
  "#AED581": "Sage",
  "#848B79": "Feijoa",
  "#FF8A65": "Coral",
  "#BA68C8": "Amethyst",
  "#4FC3F7": "Ice Blue",
  "#DCE775": "Chartreuse",
  "#FFF176": "Lemon",
  "#80DEEA": "Aqua",
  "#CE93D8": "Wisteria",
};
let behavioursArray = [
  "bounce",
  "contrail orb",
  "flock",
  "scatter",
  "orbit",
  "lissajous",
  "drift wander",
  "colony",
  "pulse ripple",
  "growth",
  "weave",
  "predate",
];

let shapesArray = ["circle", "triangle", "square", "ellipse", "hexagon"];

let trailStylesArray = [
  "none",
  "curve fill",
  "fade",
  "dots",
  "curve",
  "ribbon",
];

let glowStylesArray = ["none", "steady", "pulse"];

let connectionStylesArray = ["same-type", "all", "none"];

// ---
// Core Program Runtime Functions
// ---

function preload() {
  myFont = loadFont("fonts/Montserrat-VariableFont_wght.ttf");
  loadGifs();
  loadAmbienceSounds();
}

function setup() {
  pixelDensity(drawPixelDensity); // 1, 2, 3 - Default:4
  // createCanvas(1280, 720);
  mainCanvas = createCanvas(canvasWidth, canvasHeight);
  snapCanvasToWindow();

  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  document.body.style.background = "#1e1e1e";

  envX = sidebarX + sidebarWidth + sidebarMargin;
  envY = sidebarMargin;
  envW = width - envX - sidebarMargin;
  envH = height - sidebarMargin * 2 - bottomBarH - sidebarMargin;

  terrainScale = int(random(7, 12));
  console.log("terrainScale: " + terrainScale);

  noiseDetail(8, 0.5);
  terrainGraphic = createGraphics(width, height);
  terrainGraphic.pixelDensity(1);

  blurredTerrainGraphic = createGraphics(width, height);
  blurredTerrainGraphic.pixelDensity(1);
  terrainColourSeed = random(360);

  let previewBoxW = sidebarWidth - sidebarPadding * 2 - 2;
  previewCanvas = createGraphics(previewBoxW, previewH);

  let btnX = sidebarX + sidebarPadding;
  let btnWidth = sidebarWidth - sidebarPadding * 2;
  let sidebarBottomEdge = sidebarY + (height - sidebarMargin * 2);
  btnBottomY = sidebarBottomEdge - sidebarPadding;

  btnTogglePlayPauseRadius = 20;
  btnTogglePlayPauseX = width - 50;
  btnTogglePlayPauseY = btnTogglePlayPauseRadius + 30;

  // Begin with dna helix bar empty but include fallback to prevent crash
  // randomiseDNA();
  // dnaInputText = "";
  bottomBarActiveField = "DNA"; // Pre-select the bar

  randomiseDNA();

  document.addEventListener("keydown", function (event) {
    if (event.key === "Backspace") {
      if (tutorialState > 0 && tutorialState !== 1) {
        return;
      }

      if (
        bottomBarActiveField === "" &&
        !isEditPopupOpen &&
        programState === "simulation"
      ) {
        bottomBarActiveField = "DNA";
      }

      if (bottomBarActiveField === "DNA") {
        dnaInputText = dnaInputText.slice(0, -1);
        if (dnaInputText.length > 0) {
          currentDNA = generateDNAProfile(dnaInputText);
        }
        event.preventDefault();
      }

      if (isEditPopupOpen) {
        if (editPopupActiveField === "DNA") {
          editPopupDNAText = editPopupDNAText.slice(0, -1);
        }

        if (editPopupActiveField === "NAME") {
          editPopupNameText = editPopupNameText.slice(0, -1);
        }
        event.preventDefault();
      }
    }

    // if (event.key === "Escape") {
    //   if (isEditPopupOpen) {
    //     isEditPopupOpen = false;
    //     editPopupActiveField = "";
    //   }
    //   openKebabIndex = -1;
    // }

    if (event.key === "Enter" && isEditPopupOpen) {
      confirmEditPopup();
    }
  });

  manageNotifications = new ManageNotifications();

  // Initialise ambience manager and then register each sound file in the corresponding arrays within the manager class
  ambienceManager = new BackgroundAmbienceManager();
  for (let sound of ambienceSounds) {
    ambienceManager.addTrack(sound);
  }

  updateTerrain();
}

/* Scales the canvas to fill the browser window while preserving the preset aspect ratio, and also centers the canvas horizontally and vertically within the window
 */
function snapCanvasToWindow() {
  // Calculate scale amount while retaining aspect ratio
  let scaleFactor = min(windowWidth / canvasWidth, windowHeight / canvasHeight);
  let cssWidth = floor(canvasWidth * scaleFactor);
  let cssHeight = floor(canvasHeight * scaleFactor);

  // Resize canvas
  mainCanvas.elt.style.width = cssWidth + "px";
  mainCanvas.elt.style.height = cssHeight + "px";

  // Centre canvas in window
  mainCanvas.elt.style.position = "absolute";
  mainCanvas.elt.style.left = floor((windowWidth - cssWidth) / 2) + "px";
  mainCanvas.elt.style.top = floor((windowHeight - cssHeight) / 2) + "px";
}

// Automatically called when window is resized
function windowResized() {
  snapCanvasToWindow();
}

// Could have some node variants create obstacles on the canvas
// Some or all node types could interact with various generated environment feature
// Potential room for node behaviour where the node type is attracted to environment features and interacts/congregates with and around them

function draw() {
  if (programState === "intro") {
    drawIntroSlides();
    return;
  } else if (programState === "start") {
    drawStartScreen();
    // dnaInputText = "";
    return;
  }

  textStyle(NORMAL);
  textFont();

  let envTabGap = 12;
  envX = sidebarX + sidebarWidth + 12 + envTabGap;
  envY = sidebarMargin;
  envW = width - envX - sidebarMargin;
  envH = height - sidebarMargin * 2 - bottomBarH - sidebarMargin;

  background(isDarkMode ? 30 : 245);

  drawTerrain();

  // Environment border - decorative walled area
  let environmentBorderRadius = 18;
  let envPulse = 0.4 + 0.6 * abs(sin(frameCount * 0.018)); // 0.5, 0.5 - 0.025

  noFill();
  // stroke(0, 150, 200, 120 * envPulse); // 50
  stroke(0, 200, 250, 155 * envPulse); // 50, 135
  strokeWeight(3); // 2, 2.5, 5
  rect(envX, envY, envW, envH, environmentBorderRadius);

  if (!isExportingPNG) {
    noStroke();
    fill(
      isDarkMode ? [0, 200, 255, 130 * envPulse] : [0, 100, 180, 122 * envPulse]
    ); // 38, 30 - 68, 60
    textSize(15);
    textStyle(BOLD);
    textAlign(CENTER, TOP);
    text("VIRTUAL ENVIRONMENT", envX + envW / 2, envY + 15);
    textAlign(LEFT, BASELINE);
    textStyle(NORMAL);
  }

  // Clipping Mask to prevent trails and wrapping nodes from bleeding outside the border
  drawingContext.save();
  drawingContext.beginPath();
  roundRectanglePath(
    drawingContext,
    envX,
    envY,
    envW,
    envH,
    environmentBorderRadius
  );
  drawingContext.clip();

  // Slowly drift each colony anchor using Perlin noise
  let colonyEdgePadding = 85;
  for (let groupID in colonyGroups) {
    let colGroup = colonyGroups[groupID];
    let t = frameCount * 0.0008;
    colGroup.anchorX += map(noise(colGroup.noiseOffsetX, t), 0, 1, -0.18, 0.18);
    colGroup.anchorY += map(noise(colGroup.noiseOffsetY, t), 0, 1, -0.18, 0.18);
    colGroup.anchorX = constrain(
      colGroup.anchorX,
      envX + colonyEdgePadding,
      envX + envW - colonyEdgePadding
    );
    colGroup.anchorY = constrain(
      colGroup.anchorY,
      envY + colonyEdgePadding,
      envY + envH - colonyEdgePadding
    );
  }

  // Update pass
  for (let node of nodes) {
    if (!isPaused || node === draggedNode) {
      node.update(nodes);
    }
  }

  // Remove any nodes eaten by predators in this frame
  if (nodes.some((n) => n.isDead)) {
    nodes = nodes.filter((n) => !n.isDead);
    for (let entry of savedNodeTypes) {
      entry.count = nodes.filter(
        (n) => n.dnaString === entry.dna.dnaString
      ).length;
    }
  }

  // Display pass
  for (let node of nodes) {
    node.display();
  }

  push();
  noFill();

  // Spacial grid to try and reduce lag lol

  // Sort nodes into grid cells to prevent checking distant nodes
  let cellSize = 200;
  // let spatialGrid = {};

  for (let key in spatialGrid) {
    spatialGrid[key].length = 0;
  }

  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    node.id = i;
    node.centerX = floor(node.x / cellSize);
    node.centerY = floor(node.y / cellSize);
    let key = node.centerX * 10000 + node.centerY;

    if (!spatialGrid[key]) {
      spatialGrid[key] = []; // Only create a new array if current grid cell hasn't yet been visited by a node
    }
    spatialGrid[key].push(node);
  }

  let scaleFactor = map(nodes.length, 20, maxNodeCap, 1.0, 0.4);
  scaleFactor = constrain(scaleFactor, 0.4, 1.0);

  if (fpsDisplayValue < 16) {
    scaleFactor *= 0.6;
  }

  for (let nodeA of nodes) {
    if (nodeA.connectionStyle === "none") {
      continue;
    }

    // Only check the cell the node is in, and the 8 surrounding adjacent cells
    for (let offsetX = -1; offsetX <= 1; offsetX++) {
      for (let offsetY = -1; offsetY <= 1; offsetY++) {
        let neighbourKey =
          (nodeA.centerX + offsetX) * 10000 + (nodeA.centerY + offsetY);
        // let neighbourKey = (nodeA.centerX + offsetX) + "," + (nodeA.centerY + offsetY);
        let neighbours = spatialGrid[neighbourKey];

        if (neighbours) {
          for (let nodeB of neighbours) {
            // HI
            if (nodeA.id >= nodeB.id) {
              continue; // Prevent self-checking & double-drawing
            }

            if (nodeB.connectionStyle === "none") {
              continue;
            }

            let isColonyMatch =
              nodeA.behaviour === "colony" &&
              nodeB.behaviour === "colony" &&
              nodeA.colonyGroupID === nodeB.colonyGroupID &&
              nodeA.colonyGroupID !== -1;

            let bothNodesSameType =
              nodeA.connectionStyle === "same-type" &&
              nodeB.connectionStyle === "same-type";

            if (bothNodesSameType && nodeA.dnaString !== nodeB.dnaString) {
              continue;
            }

            let oneNodeSameType =
              nodeA.connectionStyle === "same-type" ||
              nodeB.connectionStyle === "same-type";

            let otherIsAll =
              nodeA.connectionStyle === "all" ||
              nodeB.connectionStyle === "all";

            if (
              oneNodeSameType &&
              !otherIsAll &&
              nodeA.dnaString !== nodeB.dnaString
            ) {
              continue;
            }

            let dx = nodeA.x - nodeB.x;
            let dy = nodeA.y - nodeB.y;
            let threshold =
              (nodeA.connectionThreshold + nodeB.connectionThreshold) / 2;

            if (!isColonyMatch) {
              threshold *= scaleFactor;
            }

            if (dx * dx + dy * dy > threshold * threshold) {
              continue;
            }

            let nodeDist = sqrt(dx * dx + dy * dy);

            if (isColonyMatch && nodeDist < 200) {
              drawBezierConnection(
                nodeA.x,
                nodeA.y,
                nodeB.x,
                nodeB.y,
                nodeA.colour,
                1.5
              );
            } else if (nodeDist < threshold) {
              let connectionAlpha = map(nodeDist, 0, threshold, 255, 0);
              let c = [150, 150, 150, connectionAlpha];
              drawBezierConnection(nodeA.x, nodeA.y, nodeB.x, nodeB.y, c, 1);
            }
          }
        }
      }
    }
  }

  pop();

  // End of clipping mask
  drawingContext.restore();

  // Draw Sidebar
  if (!isExportingPNG) {
    drawSidebar();
  }

  // Draw Logo
  drawLogo();

  if (!isExportingPNG) {
    // Draw FPS Indicator
    drawFPSIndicator();

    exitBtnRadius = 20;
    exitBtnX = width - 50;
    exitBtnY = exitBtnRadius + 30;

    btnTogglePlayPauseRadius = 20;
    btnTogglePlayPauseX =
      exitBtnX - exitBtnRadius - btnTogglePlayPauseRadius - 10;
    btnTogglePlayPauseY = exitBtnY;

    tutorialBtnRadius = 16;
    tutorialBtnX =
      btnTogglePlayPauseX - btnTogglePlayPauseRadius - tutorialBtnRadius - 10;
    tutorialBtnY = btnTogglePlayPauseY;

    muteUnmuteBtnRadius = 16;
    muteUnmuteBtnX = envX + envW - muteUnmuteBtnRadius - 14;
    muteUnmuteBtnY = envY + envH - muteUnmuteBtnRadius - 14;

    let exitBtnIsHovered =
      dist(mouseX, mouseY, exitBtnX, exitBtnY) < exitBtnRadius;

    if (exitBtnIsHovered) {
      registerTooltip(
        "exitBtn",
        "Return to Start Menu",
        exitBtnX,
        exitBtnY + exitBtnRadius + 35
      );
    }

    push();

    // Frosted Glass circle
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.clip();
    image(blurredTerrainGraphic, 0, 0);

    noStroke();
    // Tint red on mouse hover
    fill(exitBtnIsHovered ? [255, 80, 80, 65] : [0, 130, 210, 48]);
    circle(exitBtnX, exitBtnY, exitBtnRadius * 2);
    drawingContext.restore();

    noStroke();
    fill(exitBtnIsHovered ? [200, 50, 50, 55] : [0, 80, 160, 44]);
    circle(exitBtnX, exitBtnY, exitBtnRadius * 2);

    noFill();
    stroke(exitBtnIsHovered ? [255, 100, 100, 120] : [0, 200, 255, 55]);
    strokeWeight(1.5);
    circle(exitBtnX, exitBtnY, exitBtnRadius * 2);

    noStroke();
    fill(exitBtnIsHovered ? [255, 200, 200, 255] : [130, 210, 255, 300]);
    textSize(11);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text("➜]", exitBtnX, exitBtnY);
    // text("➜]", exitBtnX + 1, exitBtnY - 1);

    pop();

    // Play/Pause Button
    let playPauseIsHovered =
      dist(mouseX, mouseY, btnTogglePlayPauseX, btnTogglePlayPauseY) <
      btnTogglePlayPauseRadius;
    if (playPauseIsHovered) {
      registerTooltip(
        "playPauseBtn",
        "Restart tutorial",
        btnTogglePlayPauseX,
        btnTogglePlayPauseY + btnTogglePlayPauseRadius + 35
      );
    }

    drawGlassCircleBtn(
      btnTogglePlayPauseX,
      btnTogglePlayPauseY,
      btnTogglePlayPauseRadius,
      playPauseIsHovered,
      isPaused ? "▶" : "❚❚"
    );

    // Restart Tutorial Button
    tutorialBtnIsHovered =
      dist(mouseX, mouseY, tutorialBtnX, tutorialBtnY) < tutorialBtnRadius;
    if (tutorialBtnIsHovered) {
      registerTooltip(
        "tutorialBtn",
        "Restart tutorial",
        tutorialBtnX,
        tutorialBtnY + tutorialBtnRadius + 35
      );
    }

    drawGlassCircleBtn(
      tutorialBtnX,
      tutorialBtnY,
      tutorialBtnRadius,
      tutorialBtnIsHovered,
      "?"
    );

    // Mute/Unmute Button
    muteUnmuteBtnRadius = 16;
    muteUnmuteBtnX =
      tutorialBtnX - tutorialBtnRadius - muteUnmuteBtnRadius - 10;
    muteUnmuteBtnY = tutorialBtnY;

    let muteUnmuteBtnIsHovered =
      dist(mouseX, mouseY, muteUnmuteBtnX, muteUnmuteBtnY) <
      muteUnmuteBtnRadius;
    if (muteUnmuteBtnIsHovered) {
      registerTooltip(
        "muteUnmuteBtn",
        ambienceManager.isMuted ? "Unmute ambience" : "Mute ambience",
        muteUnmuteBtnX,
        muteUnmuteBtnY + muteUnmuteBtnRadius + 35
      );
    }

    drawGlassCircleBtn(
      muteUnmuteBtnX,
      muteUnmuteBtnY,
      muteUnmuteBtnRadius,
      muteUnmuteBtnIsHovered,
      ambienceManager.isMuted ? "🔇" : "🔊"
    );

    if (isEditPopupOpen) {
      drawEditPopup();
    }

    drawDnaListScrollbar();
    drawKebabMenu(openKebabIndex);
    drawSecretCornerTab();
    drawSidebarGhostNode();
    drawBottomBar();

    drawTutorialHighlight();
    drawTutorialOverlay();

    checkContextualHintHovers();
    drawContextualHintPanels();

    ambienceManager.update();

    // Show & manage notifications
    manageNotifications.update();
    manageNotifications.draw();

    // Manage Tool Tip
    if (tooltipID === "") {
      tooltipTimer = 0;
      tooltipPrevID = "";
      tooltipText = "";
    }

    tooltipID = ""; // reset for next frame
    drawTooltip();

    updateCursorStyle();
  }

  // PNG Export - lasts one frame
  if (isExportingPNG) {
    let exportPad = 10; // px outside the environment border to include
    let exportImg = get(
      floor(envX - exportPad),
      floor(envY - exportPad),
      ceil(envW + exportPad * 2),
      ceil(envH + exportPad * 2)
    );
    save(exportImg, "helixlabs_snapshot.png");
    isExportingPNG = false;
    showNotification("Environment snapshot exported!", "success");
  }
}

// ---
// Screen States
// ---

function drawStartScreen() {
  background(30);
  drawTerrain();

  noStroke();
  fill(0, 0, 0, 110);
  rect(0, 0, width, height);

  let centerX = width / 2;
  let centerY = height / 2;

  push();

  stroke(0, 200, 255, 300);
  strokeWeight(0.5);
  let lineHalfW = 130;
  line(centerX - lineHalfW, centerY - 190, centerX + lineHalfW, centerY - 190);
  noStroke();

  // Title
  noStroke();
  fill(220, 230, 255, 220);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textFont(myFont);
  textSize(70);
  fill(isDarkMode ? [0, 200, 255, 210] : [0, 100, 180, 210]); // 150 opacity
  text(startTitleText, centerX, centerY - 160);

  stroke(0, 200, 255, 300);
  strokeWeight(0.5);
  line(centerX - lineHalfW, centerY - 110, centerX + lineHalfW, centerY - 110);
  noStroke();

  // Subtitle??
  textSize(16);
  textStyle(BOLD);
  fill(150, 165, 205, 500);
  text("A MICROBIOME SIMULATION", centerX, centerY - 90);

  // Begin Button :D
  let btnX = centerX - beginBtnW / 2;
  let btnY = centerY + 14;
  let isHovered =
    mouseX > btnX &&
    mouseX < btnX + beginBtnW &&
    mouseY > btnY &&
    mouseY < btnY + beginBtnH;

  // Button label

  // Subtle idle pulse on the glow border
  let pulse = 0.4 + 0.6 * abs(sin(frameCount * 0.018));
  let borderAlpha = isHovered ? 160 : int(150 * pulse); // 160, 150 * pulse
  let blurAmount = isHovered ? 10 : 7;

  // Frost blur layer
  drawingContext.filter = `blur(${blurAmount}px)`;
  noStroke();
  fill(isHovered ? [0, 190, 255, 40] : [0, 140, 200, 38]);
  rect(btnX, btnY, beginBtnW, beginBtnH, 8);
  drawingContext.filter = "none";

  // Glass body
  noStroke();
  fill(isHovered ? [0, 110, 185, 25] : [0, 85, 185, 35]); // 25, 35
  rect(btnX, btnY, beginBtnW, beginBtnH, 8);

  // Outer glow border (when idle will pulse and glow upon mouse hover)
  noFill();
  stroke(0, 220, 255, borderAlpha + 350);
  strokeWeight(isHovered ? 1.5 : 1);
  rect(btnX, btnY, beginBtnW, beginBtnH, 8);

  // Top highlight
  stroke(160, 240, 255, isHovered ? 55 : 30);
  strokeWeight(0.75);
  line(btnX + 9, btnY + 1.5, btnX + beginBtnW - 9, btnY + 1.5);

  // Bottom edge subtle shadow line
  stroke(0, 30, 60, isHovered ? 80 : 40);
  strokeWeight(0.75);
  line(
    btnX + 9,
    btnY + beginBtnH - 1.5,
    btnX + beginBtnW - 9,
    btnY + beginBtnH - 1.5
  );
  noStroke();

  // Button label
  // noStroke();
  // strokeWeight(2);
  fill(
    isHovered
      ? [230, 228, 255, 1500] // 150 Opacity
      : [180, 205, 255, 1500] // 150 Opacity
  );
  textSize(20);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("ACTIVATE", centerX, btnY + beginBtnH / 2 - 1);
  pop();

  // Credit & notice board / panel
  push();
  textFont();
  let creditPanelW = 420;
  let creditPanelH = 150;
  let creditPanelX = centerX - creditPanelW / 2;
  let creditPanelY = btnY + beginBtnH + 100;

  drawJarvisGlass(creditPanelX, creditPanelY, creditPanelW, creditPanelH, 8);
  drawCornerBraces(
    creditPanelX,
    creditPanelY,
    creditPanelW,
    creditPanelH,
    8,
    18,
    70
  );

  // Developer credit line
  noStroke();
  fill(0, 200, 255, 175);
  textSize(12);
  textStyle(BOLD);
  textAlign(CENTER, TOP);
  text("AN EXPERIENCE BY BRAYDEN HOYLE", centerX, creditPanelY + 25);

  // Tutorial notice
  fill(0, 200, 255, 200);
  textSize(14);
  textStyle(BOLD);
  textAlign(CENTER, TOP);
  text(
    "DEVELOPER NOTICE: ",
    creditPanelX + 12,
    creditPanelY + 60,
    creditPanelW - 24,
    36
  );
  textSize(12.5);
  fill(255, 200, 60, 215);
  text(
    "Please read the tutorial slides!",
    creditPanelX + 12,
    creditPanelY + 78,
    creditPanelW - 24,
    36
  );
  fill(230, 70, 70, 215);
  textStyle(BOLDITALIC);
  text(
    "You WILL NOT understand what to do if you do not. ",
    creditPanelX + 12,
    creditPanelY + 94,
    creditPanelW - 24,
    36
  );
  fill(180, 255, 220, 215);
  textStyle(NORMAL);
  text(
    "Enjoy! I look forward to seeing what you can make :D",
    creditPanelX + 12,
    creditPanelY + 110,
    creditPanelW - 24,
    36
  );
  pop();
}

function drawIntroSlides() {
  background(isDarkMode ? 18 : 240);
  drawTerrain();

  noStroke();
  fill(0, 0, 0, 120);
  rect(0, 0, width, height);

  let slide = introSlideData[introPage];
  let centerX = width / 2;
  let centerY = height / 2;
  let boxWidth = 560;
  let boxHeight = 400; // 200
  let boxX = centerX - boxWidth / 2;
  let boxY = centerY - boxHeight / 2;

  // Logo above panel
  let pulse = 0.4 + 0.5 * abs(sin(frameCount * 0.018));
  noStroke();
  fill(0, 200, 255, int(120 * pulse));
  textSize(14);

  push();
  // Outer glow
  drawingContext.shadowBlur = 10 * pulse;
  drawingContext.shadowColor = isDarkMode
    ? "rgba(0,200,255,0.3)"
    : "rgba(0,100,180,0.2)";

  // Subtle divider line
  stroke(0, 200, 255, int(300 * pulse));
  strokeWeight(0.5);
  let lineHalfW = 38;
  line(centerX - lineHalfW, boxY - 50, centerX + lineHalfW, boxY - 50);
  noStroke();

  noStroke();
  fill(
    isDarkMode
      ? [0, 200, 255, int(300 * pulse)]
      : [0, 100, 180, int(150 * pulse)]
  );
  textSize(20);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  textFont(myFont);
  text(startTitleText, centerX, boxY - 40);

  drawingContext.shadowBlur = 0;
  drawingContext.shadowColor = "rgba(0,0,0,0)";

  // Subtle divider line
  stroke(isDarkMode ? [0, 200, 255, int(200 * pulse)] : [0, 100, 180, 150]);
  strokeWeight(0.5);
  line(centerX - lineHalfW, boxY - 25, centerX + lineHalfW, boxY - 25);
  noStroke();
  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
  pop();

  // Slide panel
  drawJarvisGlass(boxX, boxY, boxWidth, boxHeight, 14);
  drawCornerBraces(boxX, boxY, boxWidth, boxHeight, 8, 18, 70);

  // Slide number dots
  for (let i = 0; i < introSlideData.length; i++) {
    noStroke();
    fill(i === introPage ? [0, 200, 255, 240] : [0, 100, 160, 120]);
    circle(
      centerX + (i - 1.5) * 16,
      boxY + boxHeight - 20,
      i === introPage ? 8 : 5
    );
  }

  // Title
  noStroke();
  fill(0, 200, 255, 220);
  textSize(25);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(slide.title, centerX, boxY + 42);

  // Subtitle
  fill(100, 180, 220, 160);
  textSize(10);
  textStyle(NORMAL);
  text(slide.subtitle, centerX, boxY + 65);

  // Divider
  stroke(0, 200, 255, 50);
  strokeWeight(1);
  line(boxX + 24, boxY + 74, boxX + boxWidth - 24, boxY + 77);

  let currentY = boxY + 95; // Start intro text Y position
  let contentPad = 32;

  for (let i = 0; i < slide.sections.length; i++) {
    let section = slide.sections[i];

    // Heading
    noStroke();
    fill(section.highlight ? [230, 180, 60, 240] : [0, 210, 255, 230]);
    textSize(15);
    textStyle(BOLD);
    textAlign(CENTER, TOP);
    text(section.heading, boxX + boxWidth / 2, currentY);

    // Draw Body Text for this section
    currentY += 20; // Shift down below heading

    fill(section.highlight ? [230, 225, 170, 230] : [160, 220, 255, 190]);
    textSize(14);
    textStyle(section.highlight ? ITALIC : NORMAL);
    text(
      section.body,
      boxX + contentPad,
      currentY,
      boxWidth - contentPad * 2,
      section.sectionHeight
    );

    // Shift down by the height of this paragraph plus space padding
    currentY += section.sectionHeight + 12;
  }

  // Next / Begin button
  let isLastStep = introPage >= introSlideData.length - 1;
  let btnLabel = isLastStep ? "BEGIN EXPERIMENT   ▶" : "NEXT  ➜";
  let nextBtnW = isLastStep ? 158 : 110;
  let nextBtnH = 32;
  let nextBtnX = boxX + boxWidth - 24 - nextBtnW;
  let nextBtnY = boxY + boxHeight - 24 - nextBtnH;
  let nextBtnHov =
    mouseX > nextBtnX &&
    mouseX < nextBtnX + nextBtnW &&
    mouseY > nextBtnY &&
    mouseY < nextBtnY + nextBtnH;

  drawingContext.filter = "blur(6px)";
  noStroke();
  fill(nextBtnHov ? [0, 180, 255, 60] : [0, 120, 200, 30]);
  rect(nextBtnX, nextBtnY, nextBtnW, nextBtnH, 6);
  drawingContext.filter = "none";
  noStroke();
  fill(nextBtnHov ? [0, 140, 220, 45] : [0, 90, 170, 20]);
  rect(nextBtnX, nextBtnY, nextBtnW, nextBtnH, 6);
  noFill();
  stroke(nextBtnHov ? [0, 220, 255, 140] : [0, 200, 255, 65]);
  strokeWeight(1);
  rect(nextBtnX, nextBtnY, nextBtnW, nextBtnH, 6);
  noStroke();
  fill(nextBtnHov ? [200, 240, 255, 255] : [150, 215, 255, 210]);
  textSize(11);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(btnLabel, nextBtnX + nextBtnW / 2, nextBtnY + nextBtnH / 2);

  // Back button
  let backBtnW = 80;
  let backBtnH = 32;
  let backBtnX = boxX + 24;
  let backBtnY = nextBtnY;
  let backBtnHov =
    mouseX > backBtnX &&
    mouseX < backBtnX + backBtnW &&
    mouseY > backBtnY &&
    mouseY < backBtnY + backBtnH;
  let backLabel = introPage === 0 ? "⬅  MENU" : "⬅  BACK";

  drawingContext.filter = "blur(4px)";
  noStroke();
  fill(backBtnHov ? [0, 120, 180, 45] : [0, 80, 140, 22]);
  rect(backBtnX, backBtnY, backBtnW, backBtnH, 6);
  drawingContext.filter = "none";

  noStroke();
  fill(backBtnHov ? [0, 90, 160, 32] : [0, 60, 130, 14]);
  rect(backBtnX, backBtnY, backBtnW, backBtnH, 6);
  noFill();
  stroke(backBtnHov ? [0, 200, 255, 90] : [0, 180, 255, 35]);
  strokeWeight(1);
  rect(backBtnX, backBtnY, backBtnW, backBtnH, 6);
  noStroke();
  fill(backBtnHov ? [180, 230, 255, 240] : [100, 180, 220, 160]);
  textSize(11);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(backLabel, backBtnX + backBtnW / 2, backBtnY + backBtnH / 2);

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function handleIntroClick() {
  let centerX = width / 2;
  let centerY = height / 2;
  let boxWidth = 560;
  let boxHeight = 400; // 200, 280
  let boxX = centerX - boxWidth / 2;
  let boxY = centerY - boxHeight / 2;
  let isLastPage = introPage >= introSlideData.length - 1;

  // Next / Begin button
  let nextBtnW = isLastPage ? 158 : 110;
  let nextBtnH = 32;
  let nextBtnX = boxX + boxWidth - 24 - nextBtnW;
  let nextBtnY = boxY + boxHeight - 24 - nextBtnH;
  if (
    mouseX > nextBtnX &&
    mouseX < nextBtnX + nextBtnW &&
    mouseY > nextBtnY &&
    mouseY < nextBtnY + nextBtnH
  ) {
    if (isLastPage) {
      programState = "simulation";
      setTutorialState(1);
      envX = sidebarX + sidebarWidth + sidebarMargin;
      envY = sidebarMargin;
      envW = width - envX - sidebarMargin;
      envH = height - sidebarMargin * 2 - bottomBarH - sidebarMargin;

      if (savedNodeTypes.length === 0) {
        createInitialNodes();
      }

      ambienceManager.start();
    } else {
      introPage++;
    }

    return;
  }

  // Back button
  let backBtnX = boxX + 24;
  let backBtnY = nextBtnY;
  let backBtnW = 80;
  let backBtnH = 32;
  if (
    mouseX > backBtnX &&
    mouseX < backBtnX + backBtnW &&
    mouseY > backBtnY &&
    mouseY < backBtnY + backBtnH
  ) {
    if (introPage === 0) {
      programState = "start";
    } else {
      introPage--;
    }
  }
}

// ---
// Draw Simulation UI
// ---

function drawTerrain() {
  drawingContext.imageSmoothingEnabled = true;
  drawingContext.imageSmoothingQuality = "high";
  image(terrainGraphic, 0, 0);
}

function updateTerrain() {
  let t = millis() * 0.00008;
  let tScroll = millis() * 0.00005;

  terrainGraphic.loadPixels();

  for (let x = 0; x < width; x += terrainScale) {
    for (let y = 0; y < height; y += terrainScale) {
      // Use two layers of noise with different scales for detail! :)
      let noiseX = (x / terrainScale) * 0.018 + tScroll * 0.3;
      let noiseY = (y / terrainScale) * 0.018 + tScroll * 0.15;
      let noise1 = noise(noiseX, noiseY, t); // Larger blobs
      let noise2 = noise(noiseX * 3.5, noiseY * 3.5, t * 2.2 + 100); // smaller parts

      // Combine noise layers
      // Make larger blobs primary with the smaller parts for detail
      let noiseValue = noise1 * 0.72 + noise2 * 0.28;

      let smoothStep = (noiseValue - 0.28) / 0.72; // (v - low) / (high - low)
      smoothStep = smoothStep < 0 ? 0 : smoothStep > 1 ? 1 : smoothStep;
      smoothStep = smoothStep * smoothStep * (3 - 2 * smoothStep);

      // Map noise and colour zones to make microbiome look
      let r;
      let g;
      let b;
      let a;

      if (isDarkMode) {
        r = (8 + smoothStep * 42) | 0;
        g = (12 + smoothStep * 133) | 0;
        b = (22 + smoothStep * 103) | 0;
        a = (60 + smoothStep * 140) | 0;
      } else {
        r = (145 + smoothStep * 60) | 0;
        g = (160 - smoothStep * 45) | 0;
        b = (135 + smoothStep * 65) | 0;
        a = (90 + smoothStep * 155) | 0;
      }

      // Generate terrainScale * terrainScale pixel block
      for (let bx = 0; bx < terrainScale && x + bx < width; bx++) {
        for (let by = 0; by < terrainScale && y + by < height; by++) {
          let index = (x + bx + (y + by) * width) * 4;
          terrainGraphic.pixels[index] = r;
          terrainGraphic.pixels[index + 1] = g;
          terrainGraphic.pixels[index + 2] = b;
          terrainGraphic.pixels[index + 3] = a;
        }
      }
    }
  }

  terrainGraphic.updatePixels();
  // terrainGraphic.filter(BLUR, 1);
  // terrainGraphic.filter(BLUR, 2);
  terrainGraphic.filter(BLUR, 3);

  // Generate heavy blur version once for the UI to use
  blurredTerrainGraphic.clear(); // Clear old buffer
  blurredTerrainGraphic.image(terrainGraphic, 0, 0);
  blurredTerrainGraphic.filter(BLUR, 8);
}

function drawLogo() {
  let logoAreaCX = (envX + width) / 2;
  let logoY = envH - 16;

  push();
  // Outer glow
  let pulse = 0.4 + 0.5 * abs(sin(frameCount * 0.018));
  drawingContext.shadowBlur = 10 * pulse;
  drawingContext.shadowColor = isDarkMode
    ? "rgba(0,200,255,0.3)"
    : "rgba(0,100,180,0.2)";

  // Subtle divider line
  stroke(isDarkMode ? [0, 200, 255, int(300 * pulse)] : [0, 100, 180, 15]);

  strokeWeight(0.5);
  let lineHalfW = 38;
  line(logoAreaCX - lineHalfW, logoY - 10, logoAreaCX + lineHalfW, logoY - 10);
  noStroke();

  fill(
    isDarkMode
      ? [0, 200, 255, int(300 * pulse)]
      : [0, 100, 180, int(150 * pulse)]
  );
  textSize(20);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  textFont(myFont);
  text(startTitleText, logoAreaCX, logoY);

  drawingContext.shadowBlur = 0;
  drawingContext.shadowColor = "rgba(0,0,0,0)";

  // Subtle divider line
  stroke(isDarkMode ? [0, 200, 255, int(20 * pulse)] : [0, 100, 180, 15]);
  stroke(isDarkMode ? [0, 200, 255, int(300 * pulse)] : [0, 100, 180, 15]);
  strokeWeight(0.5);
  line(logoAreaCX - lineHalfW, logoY + 15, logoAreaCX + lineHalfW, logoY + 15);
  noStroke();
  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
  pop();
}

function drawSidebar() {
  sidebarH = height - sidebarMargin * 2 + 15;
  let sidebarRightEdge = sidebarX + sidebarWidth;

  // Trapezoid collapse button
  let tabcenterY =
    (height - sidebarMargin * 2 - bottomBarH - sidebarMargin) / 2;
  let tabProtrusion = 12;
  let tabFH = 28;
  let tabTH = 20;
  let tabL = sidebarX + sidebarWidth + 6;
  let tabR = tabL + tabProtrusion;
  let tabHov =
    mouseX > tabL - 4 &&
    mouseX < tabR + 4 &&
    mouseY > tabcenterY - tabFH - 2 &&
    mouseY < tabcenterY + tabFH + 2;

  drawingContext.filter = "blur(6px)";
  noStroke();
  fill(tabHov ? [0, 180, 255, 55] : [0, 120, 200, 30]);
  beginShape();
  vertex(tabL, tabcenterY - tabFH);
  vertex(tabR, tabcenterY - tabTH);
  vertex(tabR, tabcenterY + tabTH);
  vertex(tabL, tabcenterY + tabFH);
  endShape(CLOSE);
  drawingContext.filter = "none";

  noStroke();
  fill(tabHov ? [0, 150, 220, 35] : [0, 90, 160, 20]);
  beginShape();
  vertex(tabL, tabcenterY - tabFH);
  vertex(tabR, tabcenterY - tabTH);
  vertex(tabR, tabcenterY + tabTH);
  vertex(tabL, tabcenterY + tabFH);
  endShape(CLOSE);

  noFill();
  stroke(tabHov ? [0, 220, 255, 130] : [0, 200, 255, 60]);
  strokeWeight(1);
  beginShape();
  vertex(tabL, tabcenterY - tabFH);
  vertex(tabR, tabcenterY - tabTH);
  vertex(tabR, tabcenterY + tabTH);
  vertex(tabL, tabcenterY + tabFH);
  endShape(CLOSE);

  noStroke();
  fill(160, 225, 255, 210);
  textSize(9);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(isSidebarCollapsed ? "▶" : "◀", tabL + tabProtrusion * 0.48, tabcenterY);
  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);

  if (isSidebarCollapsed) {
    return;
  }

  // Species Index Top Sidebar Panel
  let topH = speciesIndexTopPanelH;
  let innerX = sidebarX + sidebarPadding;
  let centerWidth = sidebarWidth - sidebarPadding * 2;
  let previewBoxY = sidebarY + sidebarPadding + 2;
  let centerX = innerX + centerWidth / 2 + 50;
  let previewRadius = previewH / 2 - 10;
  let previewX;
  let previewY;

  drawJarvisGlass(sidebarX, sidebarY, sidebarWidth, topH, 8);
  drawPanelBorder(sidebarX, sidebarY, sidebarWidth, topH, 8);

  // Species Preview - remains at top of species index
  let centerY = previewBoxY + 14 + previewH / 2 + 15;

  fill(isDarkMode ? [0, 220, 255, 180] : [0, 80, 160, 180]);
  noStroke();
  textSize(10);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text("SPECIES INDEX", innerX, previewBoxY);

  updateAndDrawPreviewCanvas();

  // for (let dnaEntry of savedNodeTypes) {
  //   dnaEntry.count = nodes.filter(
  //     (n) => n.dnaString === dnaEntry.dna.dnaString
  //   ).length;
  // }

  // Page Selector Pill Slider -Stats/Properties, Info, Spider Chart/Diagram
  let pageSelectorY = previewBoxY + 14 + previewH + 6;
  let pageSelectorHeight = 22;
  let pageBtnWidth = (centerWidth - 4) / 3;
  let pageLabels = ["Stats", "Description", "Spider-Chart"];

  for (let i = 0; i < 3; i++) {
    let pbX = innerX + i * (pageBtnWidth + 2);
    let isActive = speciesIndexPage === i;
    let pbHov =
      mouseX > pbX &&
      mouseX < pbX + pageBtnWidth &&
      mouseY > pageSelectorY &&
      mouseY < pageSelectorY + pageSelectorHeight;

    drawingContext.filter = "blur(4px)";
    noStroke();
    fill(
      isActive
        ? [0, 160, 220, 75]
        : pbHov
        ? [0, 160, 230, 80]
        : [0, 130, 200, 55]
    );
    rect(pbX, pageSelectorY, pageBtnWidth, pageSelectorHeight, 4);
    drawingContext.filter = "none";

    noStroke();
    fill(isActive ? [0, 130, 200, 65] : [0, 70, 130, 25]);
    rect(pbX, pageSelectorY, pageBtnWidth, pageSelectorHeight, 4);

    noFill();
    stroke(isActive ? [0, 210, 255, 110] : [0, 180, 255, 35]);
    strokeWeight(1.2);
    rect(pbX, pageSelectorY, pageBtnWidth, pageSelectorHeight, 4);

    noStroke();
    fill(
      isActive
        ? isDarkMode
          ? [160, 230, 255, 240]
          : [35]
        : isDarkMode
        ? [80, 160, 200, 180]
        : [35]
    );
    textSize(8.5);
    textStyle(isActive ? BOLD : NORMAL);
    textAlign(CENTER, CENTER);
    text(
      pageLabels[i],
      pbX + pageBtnWidth / 2,
      pageSelectorY + pageSelectorHeight / 2
    );
  }
  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);

  // Divider below page selector
  stroke(isDarkMode ? [0, 150, 200, 70] : [0, 100, 160, 70]);
  strokeWeight(1);
  let dividerY = pageSelectorY + pageSelectorHeight + 6;
  line(innerX, dividerY, sidebarRightEdge - sidebarPadding, dividerY);
  noStroke();

  // Species Index Content
  let contentStartY = dividerY + 6;
  let contentH = sidebarY + topH - contentStartY - 8;

  if (speciesIndexPage === 0)
    drawSidebarStatsPage(innerX, contentStartY, contentH, sidebarRightEdge);
  else if (speciesIndexPage === 1)
    drawSidebarDescriptionPage(innerX, contentStartY, contentH, centerWidth);
  else if (speciesIndexPage === 2)
    drawSidebarSpiderChartPage(
      innerX + centerWidth / 2,
      contentStartY + contentH / 2 - 4,
      min(contentH / 2 - 20, 60)
    );

  // Bottom Sidebar Panel - Active Node Species List
  let bottomPanelY = sidebarY + topH + 8;
  let bottomPanelH = sidebarY + sidebarH - bottomPanelY - 12;

  drawJarvisGlass(sidebarX, bottomPanelY, sidebarWidth, bottomPanelH, 8);
  drawPanelBorder(sidebarX, bottomPanelY, sidebarWidth, bottomPanelH, 8);

  // Active Species Label
  fill(0, 180, 255, 160);
  noStroke();
  textSize(9);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text("ACTIVE SPECIES", innerX, bottomPanelY + sidebarPadding + 2);
  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);

  // Divider
  stroke(isDarkMode ? [0, 130, 180, 50] : [0, 80, 140, 50]);
  strokeWeight(1);
  line(
    innerX,
    bottomPanelY + sidebarPadding + 14,
    sidebarRightEdge - sidebarPadding,
    bottomPanelY + sidebarPadding + 14
  );
  noStroke();

  // List starts here
  dnaListStartY = bottomPanelY + sidebarPadding + 20;
  listBottom = bottomPanelY + bottomPanelH - 46; // leave room for clear button

  if (savedNodeTypes.length === 0) {
    fill(0, 225, 255, 160);
    noStroke();
    textSize(9);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(
      "NO SPECIES REGISTERED",
      innerX + (sidebarWidth - sidebarPadding * 2) / 2,
      dnaListStartY + 18
    );
    textAlign(LEFT, BASELINE);
    textStyle(NORMAL);
  }

  btnBottomY = sidebarY + sidebarH - sidebarPadding;

  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(
    sidebarX,
    dnaListStartY,
    sidebarWidth,
    listBottom - dnaListStartY
  );
  drawingContext.clip();

  for (let i = 0; i < savedNodeTypes.length; i++) {
    let dnaEntry = savedNodeTypes[i];
    let rowY = dnaListStartY + i * dnaListRowHeight - dnaListScrollOffset;

    if (rowY + dnaListRowHeight < dnaListStartY - 2 || rowY > listBottom + 2) {
      continue;
    }

    let isActive = dnaEntry.dna.dnaString === currentDNA.dnaString;
    let kebabX = sidebarRightEdge - 25;
    let kebabY = rowY + dnaListRowHeight / 2;
    let kebabIsHov = dist(mouseX, mouseY, kebabX, kebabY) < 12;
    let isRowHov =
      mouseX > sidebarX + 4 &&
      mouseX < kebabX - 4 &&
      mouseY > rowY &&
      mouseY < rowY + dnaListRowHeight;

    // Row background
    let rowFill;
    if (isActive) rowFill = isDarkMode ? [0, 90, 140, 200] : [0, 120, 180, 150];
    else if (isRowHov)
      rowFill = isDarkMode ? [0, 60, 110, 160] : [0, 100, 160, 120];
    else rowFill = isDarkMode ? [15, 70, 95, 130] : [205, 218, 232, 110];

    noStroke();
    fill(rowFill);
    rect(sidebarX + 8, rowY + 1, sidebarWidth - 15, dnaListRowHeight - 2, 4);

    // Active accent bar
    if (isActive) {
      noStroke();
      fill(0, 150, 230, 180);
      rect(sidebarX + 8, rowY + 1, 3, dnaListRowHeight - 2, 2);
    }

    // Colour swatch
    fill(dnaEntry.dna.colour);
    circle(sidebarX + 24, rowY + 15, 13);

    // Kebab dots & ring
    // noFill();
    fill(0, 160, 350, 60);
    stroke(
      openKebabIndex === i || kebabIsHov
        ? [0, 200, 255, 300] // 180
        : [100, 155, 190, 250] // 150
    );
    strokeWeight(1.5); // 1
    circle(kebabX, kebabY, 22);

    noStroke();
    fill(
      openKebabIndex === i || kebabIsHov
        ? [0, 200, 255, 300] // 220
        : [100, 155, 190, 250] // 120
    );

    for (let d = -1; d <= 1; d++) {
      circle(kebabX + d * 4, kebabY, 3.6);
    }

    // Species name (top line)
    textStyle(NORMAL);
    fill(isDarkMode ? [210, 228, 255, 220] : [10, 30, 70, 220]);
    textSize(10);
    textAlign(LEFT, BASELINE);
    let displayName =
      dnaEntry.name.length > 25
        ? dnaEntry.name.substring(0, 25) + "…"
        : dnaEntry.name;
    text(displayName, sidebarX + 36, rowY + 13);

    // Behaviour + count (bottom line)
    fill(isDarkMode ? [0, 150, 195, 170] : [30, 80, 130, 160]);
    textSize(9);
    text(
      dnaEntry.dna.behaviour + "  ×" + dnaEntry.count,
      sidebarX + 36,
      rowY + 26
    );
    textAlign(LEFT, BASELINE);
  }

  drawingContext.restore();

  // Clear All Nodes button
  let clearBtnY = listBottom + 4;
  let clearBtnX = innerX;
  let clearBtnWidth = centerWidth;
  let clearBtnHeight = 26;
  sidebarClearBtnY = clearBtnY;
  sidebarClearBtnH = clearBtnHeight;
  let clearBtnIsHovered =
    mouseX > clearBtnX &&
    mouseX < clearBtnX + clearBtnWidth &&
    mouseY > clearBtnY &&
    mouseY < clearBtnY + clearBtnHeight;

  stroke(isDarkMode ? [0, 110, 155, 55] : [0, 80, 130, 55]);
  strokeWeight(1);
  line(innerX, clearBtnY - 5, sidebarRightEdge - sidebarPadding, clearBtnY - 5);

  noStroke();
  fill(clearBtnIsHovered ? [140, 40, 40, 200] : [0, 55, 95, 120]);
  rect(clearBtnX, clearBtnY, clearBtnWidth, clearBtnHeight, 6);

  noFill();
  stroke(clearBtnIsHovered ? [200, 80, 80, 120] : [0, 200, 255, 45]);
  strokeWeight(1);
  rect(clearBtnX, clearBtnY, clearBtnWidth, clearBtnHeight, 6);

  noStroke();
  fill(isDarkMode ? [200, 225, 245] : [15, 40, 80]);
  textSize(9.5);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(
    "EXTRACT ALL SPECIES",
    clearBtnX + clearBtnWidth / 2,
    clearBtnY + clearBtnHeight / 2
  );
  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function drawBottomBar() {
  bottomBarH = 60;
  barY = height - bottomBarH - sidebarMargin;
  barX = sidebarX + sidebarWidth + sidebarMargin;
  barWidth = width - barX - sidebarMargin + 40;
  innerY = barY + bottomBarH / 2;

  // Floating centered bar
  let maxBarW = 820;
  let canvasMidX = (sidebarX + sidebarWidth + width) / 2;
  let barW = min(
    maxBarW,
    width - (sidebarX + sidebarWidth) - sidebarMargin * 2
  );
  barX = canvasMidX - barW / 2;
  barWidth = barW;

  dnaFieldHeight = bottomBarH - 14;
  dnaFieldY = barY + 7;
  dnaFieldX = barX + fieldPad + dnaLabelWidth + 130;
  // totalBtnWidths = btnWidth * 2 + btnGap * 2 - 28;
  totalBtnWidths = btnWidth * 3 + btnGap * 2 - 22; // 28
  dnaFieldWidth =
    barWidth - dnaLabelWidth - totalBtnWidths - fieldPad * 6 - 138;
  btnStartX = dnaFieldX + dnaFieldWidth + fieldPad;
  innerY = barY + bottomBarH / 2;

  drawJarvisGlass(barX, barY, barW, bottomBarH, 10, false);
  drawCornerBraces(barX, barY, barW, bottomBarH, 5, 12, 60);

  // Label
  noStroke();
  // fill(isDarkMode ? [0, 200, 255, 160] : [0, 100, 160, 180]);
  fill(isDarkMode ? [0, 200, 250, 300] : [0, 100, 160, 180]);
  textSize(12);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("DNA SEQUENCE", barX + fieldPad + 10, innerY - 9);

  // fill(0, 100, 150, 300);
  // fill((0, 200, 250, 300);
  fill(0, 200, 255, 160);
  textSize(11);
  textStyle(BOLD);
  text(
    "PROTEINS: " + dnaInputText.length + " / " + dnaStringMaxLength,
    barX + fieldPad + 10,
    barY + bottomBarH * 0.65
  );

  // DNA helix field
  let dnaActive = bottomBarActiveField === "DNA";
  let helixFieldX = dnaFieldX;
  let helixFieldY = barY + 7; // 6
  let helixFieldH = bottomBarH - 14; // 12

  stroke(isDarkMode ? [0, 180, 230, 80] : [0, 100, 180, 80]);
  strokeWeight(2);
  fill(dnaActive ? [0, 50, 90, 200] : [0, 30, 60, 150]);
  rect(helixFieldX, helixFieldY, dnaFieldWidth, helixFieldH, 5);

  drawDNAHelixField(
    helixFieldX,
    helixFieldY,
    dnaFieldWidth,
    helixFieldH,
    dnaActive
  );

  // Buttons
  let btnLabels = ["INTRODUCE", "RANDOMISE", "CLEAR"];
  let displayBarY = barY;
  let displayInnerY = barY + bottomBarH / 2;
  let dnaIsActive = bottomBarActiveField === "DNA";

  for (let i = 0; i < btnLabels.length; i++) {
    let btnX = btnStartX + i * (btnWidth + btnGap);
    let btnY = barY + 8;
    let btnHeight = bottomBarH - 16;
    let isHovered =
      mouseX > btnX &&
      mouseX < btnX + btnWidth &&
      mouseY > btnY &&
      mouseY < btnY + btnHeight;

    if (isHovered) {
      let tips = [
        "Introduce species to environment",
        "Randomise the sequence randomly",
        "Clear the DNA sequence",
      ];
      registerTooltip("bottomBarBtn-" + i, tips[i], btnX + btnWidth / 2, btnY);
    }

    // Frost blur
    drawingContext.filter = "blur(6px)";
    noStroke();
    fill(
      isDarkMode
        ? [0, 130, 210, isHovered ? 32 : 18]
        : [255, 255, 255, isHovered ? 50 : 30]
    );
    rect(btnX, btnY, btnWidth, btnHeight, 5);
    drawingContext.filter = "none";

    // Glass fill
    noStroke();
    fill(
      isDarkMode
        ? [0, 80, 160, isHovered ? 58 : 44]
        : [255, 255, 255, isHovered ? 75 : 55]
    );
    rect(btnX, btnY, btnWidth, btnHeight, 5);

    // Border
    noFill();
    stroke(isDarkMode ? [0, 190, 255, 75] : [255, 255, 255, 120]);

    if (isHovered) {
      stroke(isDarkMode ? [0, 200, 255, 100] : [0, 140, 220, 110]);
    }

    strokeWeight(1.5);
    rect(btnX, btnY, btnWidth, btnHeight, 5);

    // Label text
    noStroke();
    fill(
      isHovered
        ? isDarkMode
          ? [180, 230, 255, 240]
          : [0, 80, 160, 230]
        : isDarkMode
        ? [100, 190, 230, 200]
        : [40, 100, 160, 170]
    );
    textSize(10);
    textStyle(NORMAL);
    textAlign(CENTER, CENTER);
    text(btnLabels[i], btnX + btnWidth / 2, btnY + btnHeight / 2);
  }

  // Reset text state
  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);

  if (tutorialState === -1 && postTutorialPromptTimer > 0) {
    postTutorialPromptTimer--;
    let promptY = barY - 5 + sin(frameCount * 0.15) * 3; // Bob up and down lol

    fill(isDarkMode ? [0, 220, 255, 200] : [0, 100, 180, 200]);
    textSize(10);
    textStyle(BOLD);
    textAlign(CENTER, BOTTOM);
    text(
      "CLICK & TYPE IN HELIX TEXT TO ENTER A NEW SEQUENCE",
      barX + barW / 4,
      promptY
    );

    // Draw little arrow pointing down
    text("▼", barX + barW / 4, promptY + 10); // / 2
  }

  noStroke();
}

function drawFPSIndicator() {
  // FPS tracking
  fpsX = sidebarX + sidebarWidth + sidebarMargin + 22;
  fpsY = sidebarMargin + 15;

  currentFpsW = isFPSCollapsed ? 145 : 245;
  currentFpsH = isFPSCollapsed ? 22 : 38;

  let fpsHovered =
    mouseX > fpsX && mouseX < fpsX + 220 && mouseY > fpsY && mouseY < fpsY + 38;
  if (fpsHovered) {
    registerTooltip(
      "fps_panel",
      "Click to collapse sim efficiency monitor",
      mouseX,
      fpsY
    );
  }

  fpsDisplayTimer++;
  if (fpsDisplayTimer > 6) {
    fpsDisplayTimer = 0;
    let currentFPS = 1000 / deltaTime;
    fpsHistory.push(currentFPS);

    if (fpsHistory.length > fpsHistoryLength) {
      fpsHistory.shift();
    }
  }

  let averageFPS =
    fpsHistory.length > 0
      ? fpsHistory.reduce((s, v) => s + v, 0) / fpsHistory.length
      : 60;
  fpsDisplayValue = averageFPS;

  let effectiveCap = getEffectiveNodeCap();
  let loadPercentage = nodes.length / effectiveCap;

  let fpsColourIndicator;
  // if (averageFPS < 20 || loadPercentage >= 0.9) {
  if (averageFPS < 20) {
    // Turn red if FPS is below 20 or if population is over 90%
    fpsColourIndicator = [220, 70, 60]; // Red
    // } else if (averageFPS < 40 || loadPercentage >= 0.6) {
  } else if (averageFPS < 40) {
    // Turn yellow if FPS is below 40 or if population is over 60%
    fpsColourIndicator = [220, 185, 50]; // Yellow
  } else {
    fpsColourIndicator = [0, 220, 120]; // Green
  }

  let fpsLoadIndicator;
  if (loadPercentage >= 0.9) {
    fpsLoadIndicator = [220, 70, 60];
  } else if (loadPercentage >= 0.6) {
    fpsLoadIndicator = [220, 185, 50];
  } else {
    fpsLoadIndicator = [0, 220, 120];
  }

  if (isFPSCollapsed) {
    let pillW = 145;
    let pillH = 22;
    drawJarvisGlass(fpsX, fpsY, pillW, pillH, 11, false);

    // noStroke();
    fill(fpsColourIndicator);
    textSize(9);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(
      "EFFICIENCY: " + nf(averageFPS, 1, 0) + "%", // SYSTEM INTEGRITY
      fpsX + 52,
      fpsY + pillH / 2
    );

    fill(0, 180, 255, 160);
    textSize(10);
    text("▼", fpsX + 128, fpsY + pillH / 2);
    textAlign(LEFT, BASELINE);
    textStyle(NORMAL);
    return;
  }

  let fpsW = 245;
  let fpsH = 38;
  drawJarvisGlass(fpsX, fpsY, fpsW, fpsH, 8, false);

  noStroke();
  textSize(9.5);
  textStyle(BOLD);
  textAlign(LEFT, BASELINE);

  // Sim Efficiency label colour based off fpsColourIndicator
  fill(fpsColourIndicator);
  let efficiencyLabel = "SIM EFFICIENCY: " + nf(averageFPS, 1, 0) + "%    ";
  text(efficiencyLabel, fpsX + 8, fpsY + 14);

  // Population label colour based off fpsLoadIndicator
  fill(fpsLoadIndicator[0], fpsLoadIndicator[1], fpsLoadIndicator[2]);
  let efficiencyLabelWidth = textWidth(efficiencyLabel);
  text(
    "POPULATION: " + nodes.length + " / " + effectiveCap,
    fpsX + 8 + efficiencyLabelWidth,
    fpsY + 14
  );

  let barW = fpsW - 30;
  let barFill = constrain(map(nodes.length, 0, effectiveCap, 0, barW), 0, barW); // Dynamically maps to the active effective cap

  // stroke(fpsLoadIndicator[0], fpsLoadIndicator[1], fpsLoadIndicator[2]);
  // strokeWeight(0.7);
  fill(isDarkMode ? [0, 40, 70, 140] : [200, 200, 210, 120]);
  rect(fpsX + 8, fpsY + 22, barW, 5, 2);
  fill(fpsColourIndicator);
  rect(fpsX + 8, fpsY + 22, barFill, 5, 2);

  noStroke();
  fill(0, 180, 255, 140);
  textSize(8);
  textStyle(NORMAL);
  textAlign(RIGHT, CENTER);
  text("▲", fpsX + fpsW - 8, fpsY + fpsH / 2);
  textAlign(LEFT, BASELINE);
}

function drawDNAHelixField(x, y, w, h, isActive) {
  let dna = dnaInputText;
  let totalSlots = dnaStringMaxLength;
  let pad = 10;

  let drawableW = w - pad * 2;
  let strandStartX = x + pad;
  let strandMidY = y + h * 0.42; // shift helix up slightly to leave room below for letters
  let speedFactor =
    dnaInputText.length > 0 ? map(currentDNA.speed, 0.5, 3, 0.15, 0.38) : 0.22;
  let waveHeight = h * speedFactor;
  let animationSpeed =
    frameCount * (dnaInputText.length > 0 ? currentDNA.speed * 0.003 : 0.004);
  let waveLoops = 2;
  let drawSteps = 80;
  let labelRowY = y + h - 2; // fixed Y for base letters below the helix

  // Active border
  if (isActive) {
    noFill();
    stroke(0, 170, 220, 160);
    strokeWeight(1.2);
    rect(x, y, w, h, 5);
  }

  if (dnaInputText.length > 0) {
    let iconX = x + w - 12;
    let iconY = y + 10;
    let iconR = 5;
    noStroke();
    fill(0, 200, 255, 100);
    if (currentDNA.shape === "circle") {
      circle(iconX, iconY, iconR * 2);
    } else if (currentDNA.shape === "square") {
      rectMode(CENTER);
      rect(iconX, iconY, iconR * 2, iconR * 2, 1);
      rectMode(CORNER);
    } else if (currentDNA.shape === "triangle") {
      triangle(
        iconX,
        iconY - iconR,
        iconX - iconR,
        iconY + iconR,
        iconX + iconR,
        iconY + iconR
      );
    } else if (currentDNA.shape === "ellipse") {
      ellipse(iconX, iconY, iconR * 2.2, iconR * 1.3);
    } else if (currentDNA.shape === "hexagon") {
      beginShape();
      for (let i = 0; i < 6; i++) {
        vertex(
          iconX + iconR * cos((i * TWO_PI) / 6),
          iconY + iconR * sin((i * TWO_PI) / 6)
        );
      }
      endShape(CLOSE);
    }
  }

  if (dnaInputText.length > 0 && currentDNA.glowStyle !== "none") {
    let sc = currentDNA.colour;
    let ambientPulse =
      currentDNA.glowStyle === "pulse"
        ? 0.3 + 0.3 * abs(sin(frameCount * 0.05))
        : 0.3;
    drawingContext.shadowBlur = 18 * ambientPulse;
    drawingContext.shadowColor = `rgba(${red(sc)}, ${green(sc)}, ${blue(
      sc
    )}, 0.35)`;
    noFill();
    noStroke();
    rect(x, y, w, h, 5); // invisible rect just to trigger the shadow
    drawingContext.shadowBlur = 0;
    drawingContext.shadowColor = "rgba(0,0,0,0)";
  }

  // Top strand
  noFill();
  beginShape();
  let strandAlpha =
    dnaInputText.length > 0 ? int(map(currentDNA.speed, 0.5, 3, 50, 110)) : 80;
  stroke(0, 170, 220, strandAlpha);
  strokeWeight(1.5);
  for (let i = 0; i <= drawSteps; i++) {
    let t = i / drawSteps;
    let dotX = strandStartX + t * drawableW;
    let dotY =
      strandMidY - waveHeight * cos(t * TWO_PI * waveLoops + animationSpeed);
    vertex(dotX, dotY);
  }
  endShape();

  // Bottom strand
  beginShape();

  if (dnaInputText.length > 0) {
    let sc = color(currentDNA.colour);
    stroke(
      lerp(0, red(sc), 0.3),
      lerp(120, green(sc), 0.25),
      lerp(180, blue(sc), 0.25),
      55
    );
  } else {
    stroke(0, 130, 190, 55);
  }

  strokeWeight(1.5);
  for (let i = 0; i <= drawSteps; i++) {
    let t = i / drawSteps;
    let dotX = strandStartX + t * drawableW;
    let dotY =
      strandMidY + waveHeight * cos(t * TWO_PI * waveLoops + animationSpeed);
    vertex(dotX, dotY);
  }
  endShape();

  // Rungs + base labels
  for (let slotIndex = 0; slotIndex < totalSlots; slotIndex++) {
    let t = (slotIndex + 0.5) / totalSlots;
    let rungX = strandStartX + t * drawableW;
    let topStrandY =
      strandMidY - waveHeight * cos(t * TWO_PI * waveLoops + animationSpeed);
    let botStrandY =
      strandMidY + waveHeight * cos(t * TWO_PI * waveLoops + animationSpeed);

    if (slotIndex < dna.length) {
      let userBase = dna[slotIndex];
      let compBase = complementMap[userBase] || "?";
      let userColour = proteinColourMap[userBase] || [150, 150, 150];
      let compColour = proteinColourMap[compBase] || [100, 100, 100];

      // Rung top half
      let rungWeight =
        dnaInputText.length > 0 ? map(currentDNA.size, 5, 35, 1.2, 4.0) : 2;
      stroke(userColour[0], userColour[1], userColour[2], 200);
      strokeWeight(rungWeight);
      line(rungX, topStrandY, rungX, strandMidY - 1);

      // Rung bottom half -complement colour
      stroke(compColour[0], compColour[1], compColour[2], 160);
      strokeWeight(rungWeight);
      line(rungX, strandMidY + 1, rungX, botStrandY);

      // Strand dots
      noStroke();
      fill(userColour[0], userColour[1], userColour[2], 255);
      circle(rungX, topStrandY, 3.5);
      fill(compColour[0], compColour[1], compColour[2], 200);
      circle(rungX, botStrandY, 3.5);

      // Base letter drawn below the helix (not floating above strands)
      fill(userColour[0], userColour[1], userColour[2], 210);
      textSize(8);
      textStyle(BOLD);
      textAlign(CENTER, BASELINE);
      text(userBase, rungX, labelRowY);
    } else if (slotIndex === dna.length) {
      stroke(0, 200, 230, 80);
      strokeWeight(1);
      line(rungX, y, rungX, y + h);

      // Cursor rung
      let cursorPulse = 0.4 + 0.6 * abs(cos(frameCount * 0.1));
      stroke(0, 170, 220, 120 * cursorPulse);
      strokeWeight(1.5);
      line(rungX, topStrandY, rungX, botStrandY);
      noStroke();
      fill(0, 170, 220, 180 * cursorPulse);
      circle(rungX, topStrandY, 4);
      circle(rungX, botStrandY, 4);
    } else {
      // Ghost rung
      stroke(0, 140, 180, 45);
      strokeWeight(1.2);
      line(rungX, topStrandY, rungX, botStrandY);

      // Mini ghost dots at the strand intersections
      noStroke();
      fill(0, 140, 180, 25);
      circle(rungX, topStrandY, 2.5);
      circle(rungX, botStrandY, 2.5);
    }
  }

  // Placeholder text
  if (dna.length === 0) {
    noStroke();
    fill(0, 160, 200, 300);
    textSize(15);
    textStyle(BOLDITALIC);
    textAlign(CENTER, CENTER);

    push();
    textFont(myFont);
    text("TYPE ANY LETTER SEQUENCE", x + w / 2, strandMidY);
    pop();
  }

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

// ---
// Sidebar Pages
// ---

function drawSidebarStatsPage(innerX, startY, contentH, sidebarRightEdge) {
  let lineH = 13; // 14
  let curY = startY + 6; // 8
  let labelColour = isDarkMode
    ? [0, 200, 255, 150] // 130
    : [0, 80, 160, 150]; // 130

  let valueColour = isDarkMode ? [180, 225, 255, 220] : [10, 40, 80, 220];

  let energyRating = behaviourEnergyRatings[currentDNA.behaviour] || 1;
  let effectiveCap = getEffectiveNodeCap();

  let props = [
    ["Species Name", currentDNA.speciesName],
    ["Genetic Value", currentDNA.dnaCharSeedValue],
    ["Observed Behaviour", currentDNA.behaviour],
    ["Average Speed", nf(currentDNA.speed, 1, 2)],
    ["Approximate Size", nf(currentDNA.size, 1, 2)],
    ["Primary Colour", colourNames[currentDNA.colour] || "-"],
    ["Shape", currentDNA.shape],
    ["Imprinted Trail", currentDNA.trailStyle],
    ["Bioluminescence", currentDNA.glowStyle],
    [
      "Bond Range",
      currentDNA.connectionStyle === "none"
        ? "N/A (isolated)"
        : int(currentDNA.connectionThreshold),
    ],
    ["Bond Preference", currentDNA.connectionStyle],
  ];

  for (let p of props) {
    if (curY > startY + contentH - 6) {
      break;
    }

    fill(labelColour);
    textSize(9);
    textStyle(NORMAL);
    textAlign(LEFT, CENTER);
    text(p[0], innerX, curY);

    fill(valueColour);
    textAlign(RIGHT, CENTER);
    text(p[1], sidebarRightEdge - sidebarPadding, curY);
    curY += lineH;
  }

  // Energy cost dot bar + effective cap note
  if (curY < startY + contentH - 4) {
    fill(labelColour);
    textSize(9);
    textStyle(NORMAL);
    textAlign(LEFT, CENTER);
    text("Energy Cost", innerX, curY);

    let dotRadius = 3.5;
    let dotGap = 9;
    let dotStartX = sidebarRightEdge - sidebarPadding - 5 * dotGap + dotGap / 2;
    for (let di = 0; di < 5; di++) {
      let filled = di < energyRating;
      let dotColour =
        energyRating <= 2
          ? [80, 220, 130]
          : energyRating <= 3
          ? [220, 200, 60]
          : energyRating <= 4
          ? [255, 145, 50]
          : [220, 60, 60];

      noStroke();

      if (filled) {
        fill(dotColour[0], dotColour[1], dotColour[2], 255);
      } else {
        fill(isDarkMode ? 35 : 180, 80);
      }

      circle(dotStartX + di * dotGap, curY, dotRadius * 2);
    }
    curY += lineH;

    // Effective cap line
    if (curY < startY + contentH - 4) {
      fill(labelColour);
      textAlign(LEFT, CENTER);
      text("Species Cap", innerX, curY); // label

      let maxOfThisSpecies = getAbsoluteMaxForSpecies(currentDNA);
      textAlign(RIGHT, CENTER);
      text(maxOfThisSpecies, sidebarRightEdge - sidebarPadding, curY); // value
    }
  }

  textAlign(LEFT, BASELINE);
}

function drawSidebarDescriptionPage(innerX, startY, contentH, contentW) {
  textSize(12);

  if (speciesDescription === "") {
    speciesDescription = generateSpeciesDescription(currentDNA);
  }
  textSize(11);

  let boxH = contentH - 8;
  let boxX = innerX - 2;
  let boxY = startY + 2;
  let boxW = contentW + 4;

  // Background box
  noStroke();
  fill(isDarkMode ? [0, 35, 65, 130] : [195, 215, 238, 85]);
  rect(boxX, boxY, boxW, boxH, 4);

  descMaxScrollStored = max(0, descTotalTextHeight - boxH);
  descScrollY = constrain(descScrollY, 0, descMaxScrollStored);

  // Clip to box
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(boxX + 1, boxY + 1, boxW - 2, boxH - 2);
  drawingContext.clip();

  fill(isDarkMode ? [155, 218, 255, 198] : [8, 48, 100, 198]);
  textSize(9);
  textStyle(NORMAL);
  textAlign(LEFT, TOP);
  text(
    speciesDescription,
    innerX + 4,
    boxY + 6 - descScrollY,
    contentW - 12,
    descTotalTextHeight
  );

  drawingContext.restore();

  // Scrollbar
  if (descMaxScrollStored > 0) {
    let scrollbarX = boxX + boxW - 5;
    let trackH = boxH - 4;
    let thumbH = max(16, (boxH / descTotalTextHeight) * trackH);
    let ratio = constrain(descScrollY / descMaxScrollStored, 0, 1);
    let thumbY = boxY + 2 + ratio * (trackH - thumbH);

    // Store for drag detection
    descScrollbarDrawX = scrollbarX;
    descScrollbarThumbY = thumbY;
    descScrollbarThumbH = thumbH;
    descScrollbarTrackY = boxY + 2;
    descScrollbarTrackH = trackH;

    noStroke();
    fill(isDarkMode ? [0, 100, 150, 55] : [0, 80, 140, 45]);
    rect(scrollbarX, boxY + 2, 3, trackH, 2);

    let thumbColour = descScrollbarDragging
      ? [0, 220, 255, 200]
      : [0, 190, 255, 160];
    fill(thumbColour);
    rect(scrollbarX, thumbY, 3, thumbH, 2);
  }

  textAlign(LEFT, BASELINE);
}

function drawSidebarSpiderChartPage(chartX, chartY, chartRadius) {
  let trailIndex = trailStylesArray.indexOf(currentDNA.trailStyle);
  let glowIndex = glowStylesArray.indexOf(currentDNA.glowStyle);

  let connectionRangeValue =
    currentDNA.connectionStyle === "none"
      ? 0
      : map(currentDNA.connectionThreshold, 0, 200, 0, 1);

  let values = [
    currentDNA.behaviour === "colony" ? 0 : map(currentDNA.speed, 0, 3, 0, 1),
    map(currentDNA.size, 0, 35, 0, 1),
    connectionRangeValue,
    map(trailIndex, 0, trailStylesArray.length - 1, 0, 1),
    map(glowIndex, 0, glowStylesArray.length - 1, 0, 1),
  ];

  let labels = ["Speed", "Size", "Range", "Trail", "Glow"];
  drawSpiderChart(
    chartX,
    chartY,
    chartRadius,
    values,
    labels,
    currentDNA.colour
  );

  // Value readouts below chart
  fill(isDarkMode ? [0, 160, 200, 160] : [0, 80, 140, 160]);
  textSize(8);
  textStyle(NORMAL);
  textAlign(CENTER, CENTER);
  text(
    "Speed: " +
      (currentDNA.behaviour === "colony"
        ? "N/A"
        : nf(currentDNA.speed, 1, 1) + " nm/s") +
      "  |  Size: " +
      int(currentDNA.size) +
      (currentDNA.connectionStyle === "none"
        ? "nm  |  Bond Pref: No Bonds"
        : "nm  |  Bond Dist: " +
          int(currentDNA.connectionThreshold) +
          " units"),
    chartX,
    chartY + chartRadius + 21
  );
  textAlign(LEFT, BASELINE);
}

function drawSpiderChart(
  chartX,
  chartY,
  chartRadius,
  chartValues,
  chartLabels,
  accentColour
) {
  let n = chartValues.length;
  let spiderChartColour = color(accentColour);
  let spiderChartRed = red(spiderChartColour);
  let spiderChartGreen = green(spiderChartColour);
  let spiderChartBlue = blue(spiderChartColour);

  // Background grid rings
  for (let ring = 1; ring <= 3; ring++) {
    let ringRadius = (chartRadius * ring) / 3;
    noFill();
    stroke(0, 180, 255, 15 + ring * 8);
    strokeWeight(0.5);
    beginShape();
    for (let i = 0; i < n; i++) {
      let a = -HALF_PI + (TWO_PI * i) / n;
      vertex(chartX + ringRadius * cos(a), chartY + ringRadius * sin(a));
    }
    endShape(CLOSE);
  }

  // Axis lines from centre
  for (let i = 0; i < n; i++) {
    let a = -HALF_PI + (TWO_PI * i) / n;
    stroke(0, 180, 255, 20);
    strokeWeight(0.5);
    line(
      chartX,
      chartY,
      chartX + chartRadius * cos(a),
      chartY + chartRadius * sin(a)
    );
  }

  // Filled stat polygon
  fill(spiderChartRed, spiderChartGreen, spiderChartBlue, 45);
  noStroke();
  beginShape();
  for (let i = 0; i < n; i++) {
    let a = -HALF_PI + (TWO_PI * i) / n;
    let spiderChartVertex = chartRadius * constrain(chartValues[i], 0, 1);
    vertex(
      chartX + spiderChartVertex * cos(a),
      chartY + spiderChartVertex * sin(a)
    );
  }
  endShape(CLOSE);

  // Polygon outline
  noFill();
  stroke(spiderChartRed, spiderChartGreen, spiderChartBlue, 200);
  strokeWeight(1.5);
  beginShape();
  for (let i = 0; i < n; i++) {
    let a = -HALF_PI + (TWO_PI * i) / n;
    let spiderChartVertex = chartRadius * constrain(chartValues[i], 0, 1);
    vertex(
      chartX + spiderChartVertex * cos(a),
      chartY + spiderChartVertex * sin(a)
    );
  }
  endShape(CLOSE);

  // Axis labels
  for (let i = 0; i < n; i++) {
    let a = -HALF_PI + (TWO_PI * i) / n;
    let labelRadius = chartRadius + 13;
    let labelX = chartX + labelRadius * cos(a) - 1;
    let labelY = chartY + labelRadius * sin(a) + 2;
    noStroke();
    fill(0, 180, 220, 180);
    textSize(8);
    textStyle(NORMAL);
    textAlign(CENTER, CENTER);
    text(chartLabels[i], labelX, labelY);
  }
  textAlign(LEFT, BASELINE);
}

function updateAndDrawPreviewCanvas() {
  let pCanvasW = previewCanvas.width;
  let pCanvasH = previewCanvas.height;

  let savedEnvX = envX;
  let savedEnvY = envY;
  let savedEnvW = envW;
  let savedEnvH = envH;
  let savedColonyGroups = colonyGroups;
  let savedColonyGroupCounter = colonyGroupCounter;

  // Preview box position on the main canvas
  let pEnvX = sidebarX + sidebarPadding; // 28
  let pEnvY = sidebarY + sidebarPadding + 2 + 14; // 44
  let pEnvW = pCanvasW;
  let pEnvH = pCanvasH;

  envX = pEnvX;
  envY = pEnvY;
  envW = pEnvW;
  envH = pEnvH;

  let spawnCX = pEnvX + pEnvW / 2;
  let spawnCY = pEnvY + pEnvH / 2;

  if (currentDNA.dnaString !== previewDNAString) {
    previewDNAString = currentDNA.dnaString;
    previewNodes = [];
    previewFrame = 0;

    let spawnCount =
      currentDNA.behaviour === "flock" || currentDNA.behaviour === "colony"
        ? 4
        : 2;

    for (let i = 0; i < spawnCount; i++) {
      let previewDNA = Object.assign({}, currentDNA, {
        size: currentDNA.size * 0.65,
      });

      let isCentred =
        currentDNA.behaviour === "orbit" ||
        currentDNA.behaviour === "lissajous" ||
        currentDNA.behaviour === "pulse ripple";

      let startX = isCentred ? spawnCX : random(pEnvX + 10, pEnvX + pEnvW - 10);
      let startY = isCentred ? spawnCY : random(pEnvY + 10, pEnvY + pEnvH - 10);

      if (currentDNA.behaviour === "lissajous") {
        startX += i * 3;
      }

      let previewNode = new Node(startX, startY, previewDNA);
      previewNode.orbitCentre.set(spawnCX, spawnCY);

      // Cap radius so orbit fits inside the preview box
      let maxR = min(pEnvW, pEnvH) * 0.32;
      previewNode.orbitRadius = min(previewNode.orbitRadius, maxR);

      previewNode.weaveMaxHistory = 200;
      previewNode.weaveMaxAge = 200;
      previewNode.historyLength = min(previewNode.historyLength, 35);

      previewNodes.push(previewNode);
    }
  }

  previewFrame++;

  // Jarvis Glassmorphism Preview Background
  push();
  drawingContext.filter = "blur(6px)";
  noStroke();
  fill(isDarkMode ? [0, 160, 255, 12] : [0, 100, 200, 15]);
  rect(pEnvX, pEnvY, pEnvW, pEnvH, 5);
  drawingContext.filter = "none";

  noStroke();
  fill(isDarkMode ? [12, 80, 100, 50] : [220, 238, 245, 190]);
  rect(pEnvX, pEnvY, pEnvW, pEnvH, 5);

  noFill();
  stroke(isDarkMode ? [0, 220, 255, 60] : [0, 150, 200, 60]);

  strokeWeight(1.2);
  rect(pEnvX, pEnvY, pEnvW, pEnvH, 5);
  pop();

  colonyGroups = {};
  colonyGroupCounter = savedColonyGroupCounter;

  for (let pn of previewNodes) {
    if (pn.behaviour === "colony" && pn.colonyGroupID !== -1) {
      if (!colonyGroups[pn.colonyGroupID]) {
        colonyGroups[pn.colonyGroupID] = {
          anchorX: spawnCX,
          anchorY: spawnCY,
          noiseOffsetX: random(1000),
          noiseOffsetY: random(1000),
          colonyRotationSpeed:
            savedColonyGroups[pn.colonyGroupID]?.colonyRotationSpeed ??
            random(0.005, 0.02),
          shapePattern: savedColonyGroups[pn.colonyGroupID]?.shapePattern ?? 0,
        };
      }
    }
  }

  drawingContext.save();
  drawingContext.beginPath();
  roundRectanglePath(drawingContext, pEnvX, pEnvY, pEnvW, pEnvH, 5);
  drawingContext.clip();

  for (let i = 0; i < previewNodes.length; i++) {
    let previewNode = previewNodes[i];

    previewNode.update(previewNodes);

    if (
      previewNode.behaviour === "orbit" ||
      previewNode.behaviour === "lissajous"
    ) {
      // Default center
      let offsetX = 0;

      // Horizontally offset Lissajous preview nodes
      if (previewNode.behaviour === "lissajous") {
        offsetX = i === 0 ? -22 : 22; // Offset ot left and right
      }

      previewNode.orbitCentre.set(spawnCX + offsetX, spawnCY);

      if (previewNode.behaviour === "orbit") {
        previewNode.x =
          spawnCX + cos(previewNode.orbitAngle) * previewNode.orbitRadius;
        previewNode.y =
          spawnCY + sin(previewNode.orbitAngle) * previewNode.orbitRadius;
      } else {
        previewNode.x =
          previewNode.orbitCentre.x +
          previewNode.orbitRadius *
            sin(
              previewNode.lissajousA * previewNode.lissajousTime +
                previewNode.lissajousPhase
            );
        previewNode.y =
          previewNode.orbitCentre.y +
          previewNode.orbitRadius *
            sin(previewNode.lissajousB * previewNode.lissajousTime);
      }

      if (previewNode.posHistory.length > 0) {
        // previewNode.posHistory[previewNode.posHistory.length - 1].set(
        //   previewNode.x,
        //   previewNode.y
        // );

        previewNode.posHistory[previewNode.posHistory.length - 1].pos.set(
          previewNode.x,
          previewNode.y
        );
      }

      let padding = previewNode.size / 2 + 2;
      previewNode.x = constrain(
        previewNode.x,
        pEnvX + padding,
        pEnvX + pEnvW - padding
      );
      previewNode.y = constrain(
        previewNode.y,
        pEnvY + padding,
        pEnvY + pEnvH - padding
      );
    }

    previewNode.display();
  }

  drawingContext.restore();

  // Restore globals
  envX = savedEnvX;
  envY = savedEnvY;
  envW = savedEnvW;
  envH = savedEnvH;
  colonyGroups = savedColonyGroups;
  colonyGroupCounter = savedColonyGroupCounter;
}

// ---
// Tutorial Overlays & Popups
// ---

function drawTutorialOverlay() {
  if (tutorialState <= 0 || tutorialState > tutorialSteps.length) {
    return;
  }

  let step = tutorialSteps[tutorialState - 1];
  let boxW = 264;
  let boxH = 190; // 118, 148, 155
  let pos = getTutorialBoxPos(tutorialState, boxW, boxH);
  let boxX = pos.x;
  let boxY = pos.y;

  // Slight dimming overlay
  drawDimmedTutorialBackground(tutorialState);

  // Panel
  // Frost layer
  drawingContext.filter = "blur(8px)";
  noStroke();
  fill(0, 130, 210, 35);
  rect(boxX, boxY, boxW, boxH, 10);
  drawingContext.filter = "none";

  // Solid body
  noStroke();
  fill(0, 60, 140, 55);
  rect(boxX, boxY, boxW, boxH, 10);

  // Border
  noFill();
  stroke(0, 200, 255, 150); // 70
  strokeWeight(2); // 1
  rect(boxX, boxY, boxW, boxH, 10);

  // Top highlight
  stroke(100, 230, 255, 35);
  strokeWeight(0.5);
  line(boxX + 10 + 1, boxY + 1, boxX + boxW - 10 - 1, boxY + 1);
  noStroke();

  drawCornerBraces(boxX, boxY, boxW, boxH, 4, 10, 55);

  // Step counter
  noStroke();
  fill(0, 160, 200, 150);
  textSize(8);
  textStyle(NORMAL);
  textAlign(RIGHT, TOP);
  text(
    tutorialState + " / " + tutorialSteps.length,
    boxX + boxW / 2,
    boxY + boxH - 12
  );

  // Label
  noStroke();
  fill(0, 200, 255, 220);
  textSize(16);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text(step.label, boxX + 10, boxY + 10);

  // Body
  fill(160, 225, 255, 185);
  textSize(14);
  textStyle(NORMAL);
  text(step.body, boxX + 10, boxY + 32, boxW - 20, 90); // 52

  // Action hint
  if (step.hint) {
    noStroke();
    fill(60, 210, 130, 190);
    textSize(11);
    textStyle(BOLDITALIC);
    textAlign(LEFT, BASELINE);
    text(step.hint, boxX + 15, boxY + 138); // 110
  }

  let isLastStep = tutorialState >= tutorialSteps.length;
  let btnH = 22;
  let btnY = boxY + boxH - btnH - 7;

  // Next / Done button
  let nextBtnW = isLastStep ? 76 : 58;
  let nextBtnX = boxX + boxW - nextBtnW - 8;
  let nextHov =
    mouseX > nextBtnX &&
    mouseX < nextBtnX + nextBtnW &&
    mouseY > btnY &&
    mouseY < btnY + btnH;

  noStroke();
  fill(nextHov ? [0, 150, 220, 160] : [0, 100, 170, 100]); // greyed out when locked
  rect(nextBtnX, btnY, nextBtnW, btnH, 5);

  noFill();
  stroke(0, 200, 255, 80);
  strokeWeight(1);
  rect(nextBtnX, btnY, nextBtnW, btnH, 5);

  noStroke();
  fill(160, 230, 255, 240);

  if (isLastStep) {
    text("DONE ✔", nextBtnX + nextBtnW / 2 - 20, btnY + btnH / 2 + 4);
  } else {
    text("NEXT ➜", nextBtnX + nextBtnW / 2 - 20, btnY + btnH / 2 + 4);
  }

  // Back button (not on step 1)
  if (tutorialState > 1) {
    let backBtnW = 50;
    let backBtnX = boxX + 8;
    let backHov =
      mouseX > backBtnX &&
      mouseX < backBtnX + backBtnW &&
      mouseY > btnY &&
      mouseY < btnY + btnH;

    noStroke();
    fill(backHov ? [0, 80, 130, 120] : [0, 60, 110, 60]);
    rect(backBtnX, btnY, backBtnW, btnH, 5);
    noFill();
    stroke(0, 160, 220, 50);
    strokeWeight(1);
    rect(backBtnX, btnY, backBtnW, btnH, 5);
    noStroke();
    fill(100, 190, 230, 200);
    textSize(9);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text("⬅ Back", backBtnX + backBtnW / 2, btnY + btnH / 2);
  }

  // Skip button
  let skipBtnW = 38;
  let skipBtnH = 16;
  let skipBtnX = boxX + boxW - skipBtnW - 8;
  let skipBtnY = boxY + 6;
  let skipHov =
    mouseX > skipBtnX &&
    mouseX < skipBtnX + skipBtnW &&
    mouseY > skipBtnY &&
    mouseY < skipBtnY + skipBtnH;

  noStroke();
  fill(skipHov ? [60, 0, 0, 100] : [0, 0, 0, 40]);
  rect(skipBtnX, skipBtnY, skipBtnW, skipBtnH, 4);
  noFill();
  stroke(180, 60, 60, skipHov ? 140 : 60);
  strokeWeight(0.75);
  rect(skipBtnX, skipBtnY, skipBtnW, skipBtnH, 4);
  noStroke();
  fill(200, 120, 120, skipHov ? 240 : 160);
  textSize(8);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("Skip ≫", skipBtnX + skipBtnW / 2, skipBtnY + skipBtnH / 2);

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);

  // Tutorial GIFs
  let tutGif = tutorialGifs[tutorialState];
  if (tutGif) {
    let gifW = boxW;
    let gifH = 90;
    let gifX = boxX;
    let gifY = boxY - gifH - 10;

    drawingContext.save();
    drawingContext.beginPath();
    roundRectanglePath(drawingContext, gifX, gifY, gifW, gifH, 8);
    drawingContext.clip();
    image(tutGif, gifX, gifY, gifW, gifH);
    drawingContext.restore();

    noFill();
    stroke(0, 200, 255, 300); // 150
    strokeWeight(2);
    rect(gifX, gifY, gifW, gifH, 8);
    noStroke();
  }

  if (tutorialState === 2) {
    let clickHereX = envX + envW / 2;
    let clickHereY = envY + envH * 0.7;
    let clickHereRadius = 36;
    let clickHerePulse = 0.5 + 0.5 * abs(sin(frameCount * 0.018));

    // Outer glow
    drawingContext.shadowBlur = 20 * clickHerePulse;
    drawingContext.shadowColor = `rgba(40, 170, 255, ${0.7 * clickHerePulse})`;
    noFill();
    // stroke(40, 170, 255, int(210 * clickHerePulse));
    stroke(40, 220, 255, int(210 * clickHerePulse));
    strokeWeight(2.5);
    circle(clickHereX, clickHereY, clickHereRadius * 3);

    // Inner faint fill
    drawingContext.shadowBlur = 0;
    drawingContext.shadowColor = "rgba(0,0,0,0)";
    noStroke();
    fill(0, 140, 220, int(40 * clickHerePulse));
    circle(clickHereX, clickHereY, clickHereRadius * 3);

    // Label
    noStroke();
    fill(200, 235, 255, 230);
    textSize(10);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text("CLICK HERE", clickHereX, clickHereY);
    textAlign(LEFT, BASELINE);
    textStyle(NORMAL);
  }
}

function drawTutorialHighlight() {
  if (tutorialState <= 0 || tutorialState > tutorialSteps.length) {
    return;
  }

  let pulse = 0.5 + 0.5 * abs(sin(frameCount * 0.06));
  let pad = 5;
  let rx;
  let ry;
  let rw;
  let rh;
  let rr;

  switch (tutorialState) {
    case 1: // DNA helix bar
      rx = dnaFieldX - pad;
      ry = dnaFieldY - pad;
      rw = dnaFieldWidth + pad * 2;
      rh = dnaFieldHeight + pad * 2;
      rr = 8;
      break;
    case 2: // Environment
      rx = envX + pad;
      ry = envY + pad;
      rw = envW - pad * 2;
      rh = envH - pad * 2;
      rr = 16;
      break;
    case 3: // Bottom sidebar (species list) // 4
      let bpY3 = sidebarY + speciesIndexTopPanelH + 8;
      let bpH3 = height - sidebarMargin - bpY3 - 2;
      rx = sidebarX - pad;
      ry = bpY3 - pad;
      rw = sidebarWidth + pad * 2;
      rh = bpH3 + pad * 2 + 5;
      rr = 10;
      break;
    default:
      return;
  }

  // Glow blur layer
  drawingContext.filter = "blur(7px)";
  noFill();
  stroke(30, 160, 255, int(130 * pulse));
  strokeWeight(5);
  rect(rx, ry, rw, rh, rr);
  drawingContext.filter = "none";

  // Sharp border
  noFill();
  stroke(40, 170, 255, int(210 * pulse));
  strokeWeight(1.5);
  rect(rx, ry, rw, rh, rr);
  noStroke();
}

function drawDimmedTutorialBackground(step) {
  let pad = 8;
  let rectangleX;
  let rectangleY;
  let rectangleWidth;
  let rectangleHeight;
  let rectangleRadius;

  switch (step) {
    case 1:
      rectangleX = dnaFieldX - pad;
      rectangleY = dnaFieldY - pad;
      rectangleWidth = dnaFieldWidth + pad * 2;
      rectangleHeight = dnaFieldHeight + pad * 2;
      rectangleRadius = 8;
      break;
    case 2:
      rectangleX = envX + pad - 10;
      rectangleY = envY + pad - 10;
      rectangleWidth = envW - pad * 2 + 20;
      rectangleHeight = envH - pad * 2 + 20;
      rectangleRadius = 16;
      break;
    case 3: // 4
      let bpY3 = sidebarY + speciesIndexTopPanelH + 8;
      let bpH3 = height - sidebarMargin - bpY3 - 2;

      rectangleX = sidebarX - pad;
      rectangleY = bpY3 - pad;
      rectangleWidth = sidebarWidth + pad * 2;
      rectangleHeight = bpH3 + pad * 2 + 2;
      rectangleRadius = 10;
      break;
    default:
      noStroke();
      fill(0, 0, 0, 130);
      rect(0, 0, width, height);
      return;
  }

  // Draw dim over everything EXCEPT the highlight rect
  drawingContext.save();
  drawingContext.fillStyle = "rgba(0, 0, 0, 0.8)"; // 0.5, 0.6
  drawingContext.beginPath();

  // Outer rectangle - the whole canvas
  drawingContext.rect(0, 0, width, height);

  // Inner rounded rectangle cutout
  roundRectanglePath(
    drawingContext,
    rectangleX,
    rectangleY,
    rectangleWidth,
    rectangleHeight,
    rectangleRadius
  );
  drawingContext.closePath();
  drawingContext.evenoddFill = true; // set before fill
  drawingContext.fill("evenodd"); // even/odd (inner is cut out and outer is darkened)
  drawingContext.restore();
}

function drawContextualHintPanels() {
  let positionMap = {
    speciesIndex: { x: sidebarX + sidebarWidth + 28, y: sidebarY + 61 },
    activeList: {
      x: sidebarX + sidebarWidth + 28,
      y: sidebarY + speciesIndexTopPanelH + 70,
    },
    energyMonitor: {
      x: sidebarX + sidebarWidth + sidebarMargin + 15,
      y: sidebarY + 160,
    },
    controls: { x: barX + barWidth / 2 + 120, y: barY - 215 },
  };

  for (let key in hintIsShowing) {
    if (!hintIsShowing[key] || contextualHintsShown[key]) {
      continue;
    }

    let data = contextualHintData[key];
    let panelPosition = positionMap[key];

    if (!data || !panelPosition) {
      continue;
    }

    let boxW = 264;
    let boxH = 190; // 142
    let boxX = constrain(panelPosition.x, 4, width - boxW - 4);
    let boxY = constrain(panelPosition.y, 4, height - boxH - 4);

    // Panel body
    drawingContext.filter = "blur(8px)";
    noStroke();
    fill(0, 130, 210, 35);
    rect(boxX, boxY, boxW, boxH, 10);
    drawingContext.filter = "none";

    noStroke();
    fill(0, 60, 140, 55); // 55
    rect(boxX, boxY, boxW, boxH, 10);

    noFill();
    stroke(0, 200, 255, 150); // 70
    strokeWeight(2); // 1
    rect(boxX, boxY, boxW, boxH, 10);

    stroke(100, 230, 255, 35);
    strokeWeight(0.5);
    line(boxX + 11, boxY + 1, boxX + boxW - 11, boxY + 1);
    noStroke();

    drawCornerBraces(boxX, boxY, boxW, boxH, 4, 10, 55);

    // Label
    noStroke();
    fill(0, 200, 255, 220);
    textSize(16);
    textStyle(BOLD);
    textAlign(LEFT, TOP);
    text(data.label, boxX + 10, boxY + 10);

    // Body
    fill(160, 225, 255, 185);
    textSize(14);
    textStyle(NORMAL);
    text(data.body, boxX + 10, boxY + 32, boxW - 20, 110); // 52, 74

    // Hint
    if (data.hint) {
      fill(60, 210, 130, 190);
      textSize(11);
      textStyle(ITALIC);
      textAlign(LEFT, BASELINE);
      text(data.hint, boxX + 15, boxY + 152); // 100
    }

    // GOT IT / ACKNOWLEDGED button
    let btnW = 68;
    let btnH = 22;
    let btnX = boxX + boxW - btnW - 8;
    let btnY = boxY + boxH - btnH - 8;
    let btnHov =
      mouseX > btnX &&
      mouseX < btnX + btnW &&
      mouseY > btnY &&
      mouseY < btnY + btnH;

    noStroke();
    fill(btnHov ? [0, 150, 220, 160] : [0, 100, 170, 100]);
    rect(btnX, btnY, btnW, btnH, 5);
    noFill();
    stroke(0, 200, 255, 80);
    strokeWeight(1);
    rect(btnX, btnY, btnW, btnH, 5);
    noStroke();
    fill(160, 230, 255, 240);
    textSize(9);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text("GOT IT  ✔", btnX + btnW / 2, btnY + btnH / 2);

    // Fade indicator - min time shown before panel closes unless manually closed by user
    let progress = hintShowFrames[key] / hintMinTimePanelShown;
    let barW = boxW - 20;
    noStroke();
    fill(isDarkMode ? [0, 40, 70, 80] : [200, 215, 230, 80]);
    rect(boxX + 10, boxY + boxH - 6, barW, 2, 1);
    fill(isDarkMode ? [0, 180, 255, 100] : [0, 130, 200, 120]);
    rect(boxX + 10, boxY + boxH - 6, barW * progress, 2, 1);

    // Display GIFs
    let gif = hintGifs[key];

    if (gif) {
      let gifW;
      let gifH;
      let gifX;
      let gifY;

      // Custom bounds for specific GIFs
      if (key === "speciesIndex") {
        gifW = boxW;
        gifH = 238;
        gifX = boxX;
        gifY = boxY + boxH + 15;
      } else {
        gifW = boxW;
        gifH = 90;
        gifX = boxX;
        gifY = boxY - gifH - 8;
      }

      // Clipped and rounded environment container
      drawingContext.save();
      drawingContext.beginPath();
      roundRectanglePath(drawingContext, gifX, gifY, gifW, gifH, 8);
      drawingContext.clip();
      image(gif, gifX, gifY, gifW, gifH);
      drawingContext.restore();

      noFill();
      stroke(0, 200, 255, 300); // 55
      strokeWeight(2);
      rect(gifX, gifY, gifW, gifH, 8);
    }

    textAlign(LEFT, BASELINE);
    textStyle(NORMAL);
  }
}

function drawKebabMenu(index) {
  if (index < 0 || index >= savedNodeTypes.length) {
    return;
  }

  let rowY = dnaListStartY + index * dnaListRowHeight - dnaListScrollOffset;
  let menuX = sidebarX + sidebarWidth + 5;
  let menuW = 134;
  let headerH = 24; // height of the MANAGE header row
  let items = [
    { label: "EDIT", c: [160, 225, 255] },
    { label: "EXTRACT INDIVIDUAL", c: [255, 165, 50] },
    { label: "EXTRACT ALL", c: [255, 130, 50] },
    { label: "DISCARD DNA", c: [230, 70, 70] }, // 220, 70, 70
  ];
  let itemH = 26;
  let menuH = headerH + items.length * itemH + 10;
  let menuY = constrain(rowY, sidebarMargin + 2, height - menuH - 70);

  drawJarvisGlass(menuX, menuY, menuW, menuH, 7);

  // Manage header
  // Label
  noStroke();
  fill(0, 180, 255, 220); // 160
  textSize(10);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("MANAGE", menuX + 10, menuY + headerH / 2);

  // Close X circle
  let closeKX = menuX + menuW - 12;
  let closeKY = menuY + headerH / 2;
  let closeKHov = dist(mouseX, mouseY, closeKX, closeKY) < 9;
  noStroke();
  fill(closeKHov ? [200, 55, 55, 120] : [140, 40, 40, 60]);
  circle(closeKX, closeKY, 16);
  fill(240, 180, 180, 150);
  textSize(9);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("✖", closeKX, closeKY);

  // Divider below header
  stroke(0, 170, 255, 40);
  strokeWeight(0.5);
  line(menuX + 6, menuY + headerH, menuX + menuW - 6, menuY + headerH);

  // Menu panel items
  for (let i = 0; i < items.length; i++) {
    let iy = menuY + headerH + 5 + i * itemH;
    let isItemHov =
      mouseX > menuX + 2 &&
      mouseX < menuX + menuW - 2 &&
      mouseY > iy &&
      mouseY < iy + itemH;

    if (isItemHov) {
      noStroke();
      fill(0, 140, 200, 45);
      rect(menuX + 3, iy + 1, menuW - 6, itemH - 2, 4);
    }

    let c = items[i].c;
    noStroke();
    fill(c[0], c[1], c[2], isItemHov ? 270 : 220);
    textSize(10);
    textStyle(BOLD);
    textAlign(LEFT, CENTER);
    text(items[i].label, menuX + 12, iy + itemH / 2);
  }

  textAlign(LEFT, BASELINE);
}

function getKebabMenuClick(index) {
  let rowY = dnaListStartY + index * dnaListRowHeight - dnaListScrollOffset;
  let menuX = sidebarX + sidebarWidth + 5;
  let menuW = 134;
  let headerH = 24;
  let items = ["EDIT", "EXTRACT INDIVIDUAL", "EXTRACT ALL", "DISCARD DNA"];
  let itemH = 26;
  let menuH = headerH + items.length * itemH + 10;
  let menuY = constrain(rowY, sidebarMargin + 2, height - menuH - 70);

  for (let i = 0; i < items.length; i++) {
    let iy = menuY + headerH + 5 + i * itemH;

    if (
      mouseX > menuX &&
      mouseX < menuX + menuW &&
      mouseY > iy &&
      mouseY < iy + itemH
    ) {
      return items[i];
    }
  }
  return null;
}

function drawEditPopup() {
  if (!isEditPopupOpen) {
    return;
  }

  let editPanelWidth = 340;
  let editPanelHeight = 180;
  let editPanelX = (sidebarX + sidebarWidth + width) / 2 - editPanelWidth / 2;
  let editPanelY = height / 2 - editPanelHeight / 2;
  let editPanelPad = 14;

  drawJarvisGlass(
    editPanelX,
    editPanelY,
    editPanelWidth,
    editPanelHeight,
    12,
    true
  );

  // Title
  noStroke();
  fill(0, 200, 255, 220);
  textSize(11);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("EDIT SPECIES", editPanelX + editPanelPad, editPanelY + 16);

  // Close X
  let closeEditPanelX = editPanelX + editPanelWidth - 16;
  let closeEditPanelY = editPanelY + 10;
  let closeEditPanelHovered =
    dist(mouseX, mouseY, closeEditPanelX + 4, closeEditPanelY + 4) < 10;

  noStroke();
  fill(closeEditPanelHovered ? [180, 60, 60, 200] : [120, 50, 50, 160]);
  circle(closeEditPanelX + 4, closeEditPanelY + 4, 16);
  fill(230, 230, 255, 220);
  textSize(8);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("✖", closeEditPanelX + 4, closeEditPanelY + 4);

  // Divider
  stroke(0, 200, 255, 50);
  strokeWeight(1);
  line(
    editPanelX + editPanelPad,
    editPanelY + 28,
    editPanelX + editPanelWidth - editPanelPad,
    editPanelY + 28
  );

  // Name field
  noStroke();
  fill(0, 180, 255, 200); // 130 Opacity
  textSize(9);
  textStyle(NORMAL);
  textAlign(LEFT, CENTER);
  text("NAME", editPanelX + editPanelPad, editPanelY + 50);

  let editPanelNameFieldX = editPanelX + editPanelPad + 42;
  let editPanelNameFieldY = editPanelY + 38;
  let editPanelNameFieldWidth = editPanelWidth - editPanelPad * 2 - 42;
  let editPanelNameFieldHeight = 26;

  let editPanelNameFieldActive = editPopupActiveField === "NAME";
  drawingContext.filter = "blur(4px)";
  noStroke();
  fill(editPanelNameFieldActive ? [0, 130, 210, 35] : [0, 80, 160, 20]);
  rect(
    editPanelNameFieldX,
    editPanelNameFieldY,
    editPanelNameFieldWidth,
    editPanelNameFieldHeight,
    4
  );
  drawingContext.filter = "none";

  noStroke();
  fill(editPanelNameFieldActive ? [0, 60, 100, 150] : [0, 40, 80, 120]);
  rect(
    editPanelNameFieldX,
    editPanelNameFieldY,
    editPanelNameFieldWidth,
    editPanelNameFieldHeight,
    4
  );

  fill(160, 225, 255, 220);
  noStroke();
  textSize(10);
  textAlign(LEFT, CENTER);

  let nameDisplay =
    editPopupNameText +
    (editPanelNameFieldActive && frameCount % 60 < 30 ? "|" : "");
  text(
    nameDisplay,
    editPanelNameFieldX + 6,
    editPanelNameFieldY + editPanelNameFieldHeight / 2
  );

  // DNA field
  noStroke();
  fill(0, 180, 255, 200); // 130 Opacity
  textSize(9);
  textAlign(LEFT, CENTER);
  text("DNA", editPanelX + editPanelPad, editPanelY + 90);

  let editPanelDNAFieldX = editPanelX + editPanelPad + 42;
  let editPanelDNAFieldY = editPanelY + 78;
  let editPanelDNAFieldWidth = editPanelWidth - editPanelPad * 2 - 42;
  let editPanelDNAFieldHeight = 26;

  let editPanelDNAFieldActive = editPopupActiveField === "DNA";
  noStroke();
  fill(editPanelDNAFieldActive ? [0, 60, 100, 200] : [0, 40, 80, 160]);
  rect(
    editPanelDNAFieldX,
    editPanelDNAFieldY,
    editPanelDNAFieldWidth,
    editPanelDNAFieldHeight,
    4
  );

  if (editPanelDNAFieldActive) {
    noFill();
    stroke(0, 200, 255, 180);
    strokeWeight(1);
    rect(
      editPanelDNAFieldX,
      editPanelDNAFieldY,
      editPanelDNAFieldWidth,
      editPanelDNAFieldHeight,
      4
    );
  }

  fill(160, 225, 255, 220);
  noStroke();
  textSize(10);
  textAlign(LEFT, CENTER);

  let dnaDisplay =
    editPopupDNAText +
    (editPanelDNAFieldActive && frameCount % 60 < 30 ? "|" : "");
  text(
    dnaDisplay,
    editPanelDNAFieldX + 6,
    editPanelDNAFieldY + editPanelDNAFieldHeight / 2
  );

  // Confirm button
  let editPanelConfirmButtonX = editPanelX + editPanelWidth - editPanelPad - 90;
  let editPanelConfirmButtonY = editPanelY + editPanelHeight - 40;
  let editPanelConfirmButtonWidth = 90;
  let editPanelConfirmButtonHeight = 28;

  let editPanelConfirmButtonHovered =
    mouseX > editPanelConfirmButtonX &&
    mouseX < editPanelConfirmButtonX + editPanelConfirmButtonWidth &&
    mouseY > editPanelConfirmButtonY &&
    mouseY < editPanelConfirmButtonY + editPanelConfirmButtonHeight;
  noStroke();
  fill(editPanelConfirmButtonHovered ? [0, 160, 220, 100] : [0, 110, 170, 60]);
  rect(
    editPanelConfirmButtonX,
    editPanelConfirmButtonY,
    editPanelConfirmButtonWidth,
    editPanelConfirmButtonHeight,
    5
  );

  noFill();
  stroke(0, 200, 255, 100);
  strokeWeight(1);
  rect(
    editPanelConfirmButtonX,
    editPanelConfirmButtonY,
    editPanelConfirmButtonWidth,
    editPanelConfirmButtonHeight,
    5
  );

  noStroke();
  fill(160, 230, 255, 230);
  textSize(10);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(
    "Confirm",
    editPanelConfirmButtonX + editPanelConfirmButtonWidth / 2,
    editPanelConfirmButtonY + editPanelConfirmButtonHeight / 2
  );

  // Cancel button
  let editPanelCancelButtonX = editPanelConfirmButtonX - 80 - 6;
  let editPanelCancelButtonWidth = 80;
  let editPanelCancelButtonHeight = 28;
  let editPanelCancelButtonHovered =
    mouseX > editPanelCancelButtonX &&
    mouseX < editPanelCancelButtonX + editPanelCancelButtonWidth &&
    mouseY > editPanelConfirmButtonY &&
    mouseY < editPanelConfirmButtonY + editPanelCancelButtonHeight;

  noStroke();
  fill(editPanelCancelButtonHovered ? [80, 30, 30, 100] : [50, 20, 20, 60]);
  rect(
    editPanelCancelButtonX,
    editPanelConfirmButtonY,
    editPanelCancelButtonWidth,
    editPanelCancelButtonHeight,
    5
  );

  noFill();
  stroke(180, 80, 80, 80);
  strokeWeight(1);
  rect(
    editPanelCancelButtonX,
    editPanelConfirmButtonY,
    editPanelCancelButtonWidth,
    editPanelCancelButtonHeight,
    5
  );

  noStroke();
  fill(220, 140, 140, 200);
  textSize(10);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(
    "Cancel",
    editPanelCancelButtonX + editPanelCancelButtonWidth / 2,
    editPanelConfirmButtonY + editPanelCancelButtonHeight / 2
  );

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function drawSecretCornerTab() {
  let panelW = 140;
  let panelH = 80; // 80, 90, 110, 120
  let panelX = width - panelW - 5;
  let panelY = 6;

  let earW = 50;
  let earH = 5;
  let earX = width - earW - 75;
  let earY = 0;

  let overEar =
    mouseX > earX - 2 &&
    mouseX < earX + earW + 4 &&
    mouseY > earY - 4 &&
    mouseY < earY + earH + 4;

  let overPanel =
    secretTabHovered &&
    mouseX > panelX - 4 &&
    mouseX < panelX + panelW + 4 &&
    mouseY > panelY - 4 &&
    mouseY < panelY + panelH + 4;

  secretTabHovered = overEar || overPanel;

  if (!secretTabHovered) {
    // Draw the always-visible small ear protrusion
    drawingContext.filter = "blur(4px)";
    noStroke();
    fill(0, 130, 210, 30);
    rect(earX, earY, earW, earH, 4);
    drawingContext.filter = "none";

    noStroke();
    fill(0, 80, 160, 20);
    rect(earX, earY, earW, earH, 4);

    noFill();
    stroke(0, 200, 255, 55);
    strokeWeight(1);
    rect(earX, earY, earW, earH, 4);
    return;
  }

  // Full panel revealed on hover
  drawJarvisGlass(panelX, panelY, panelW, panelH, 8, false);

  let pillX = panelX + 8;
  let pillY = panelY + 10;
  let pillW = panelW - 16;
  let pillH = 26;
  let pillHov =
    mouseX > pillX &&
    mouseX < pillX + pillW &&
    mouseY > pillY &&
    mouseY < pillY + pillH;

  drawingContext.filter = "blur(4px)";
  noStroke();
  fill(pillHov ? [0, 180, 255, 50] : [0, 120, 200, 28]);
  rect(pillX, pillY, pillW, pillH, 13);
  drawingContext.filter = "none";

  noStroke();
  fill(pillHov ? [0, 140, 210, 35] : [0, 80, 160, 18]);
  rect(pillX, pillY, pillW, pillH, 13);

  noFill();
  stroke(pillHov ? [0, 220, 255, 120] : [190, 205, 245, 55]);
  strokeWeight(1);
  rect(pillX, pillY, pillW, pillH, 13);

  noStroke();
  fill(pillHov ? [220, 240, 255, 240] : [160, 210, 255, 190]);
  textSize(9);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(
    isDarkMode ? "Light Mode" : "Dark Mode",
    pillX + pillW / 2,
    pillY + pillH / 2
  );

  //   let returnToStartBtnX = panelX + 8;
  //   let returnToStartBtnY = pillY + pillH + 8;
  //   let returnToStartBtnW = panelW - 16;
  //   let returnToStartBtnH = 26;
  //   let returnToStartBtnHov =
  //     mouseX > returnToStartBtnX &&
  //     mouseX < returnToStartBtnX + returnToStartBtnW &&
  //     mouseY > returnToStartBtnY &&
  //     mouseY < returnToStartBtnY + returnToStartBtnH;

  //   // Frost blur
  //   drawingContext.filter = "blur(4px)";
  //   noStroke();
  //   fill(returnToStartBtnHov ? [180, 60, 60, 50] : [0, 120, 200, 28]);
  //   rect(
  //     returnToStartBtnX,
  //     returnToStartBtnY,
  //     returnToStartBtnW,
  //     returnToStartBtnH,
  //     13
  //   );
  //   drawingContext.filter = "none";

  //   // Glass fill
  //   noStroke();
  //   fill(returnToStartBtnHov ? [140, 40, 40, 38] : [0, 80, 160, 18]);
  //   rect(
  //     returnToStartBtnX,
  //     returnToStartBtnY,
  //     returnToStartBtnW,
  //     returnToStartBtnH,
  //     13
  //   );

  //   // Border
  //   noFill();
  //   stroke(returnToStartBtnHov ? [255, 120, 120, 130] : [0, 200, 255, 55]);
  //   strokeWeight(1);
  //   rect(
  //     returnToStartBtnX,
  //     returnToStartBtnY,
  //     returnToStartBtnW,
  //     returnToStartBtnH,
  //     13
  //   );

  //   // Label
  //   noStroke();
  //   fill(returnToStartBtnHov ? [255, 200, 200, 240] : [160, 210, 255, 190]);
  //   textSize(9);
  //   textStyle(BOLD);
  //   textAlign(CENTER, CENTER);
  //   text(
  //     "↩ Start Menu",
  //     returnToStartBtnX + returnToStartBtnW / 2,
  //     returnToStartBtnY + returnToStartBtnH / 2
  //   );

  // Export PNG button
  let exportBtnX = panelX + 8;
  let exportBtnY = pillY + pillH + 8;
  let exportBtnW = panelW - 16;
  let exportBtnH = 26;

  // let exportBtnX = panelX + 8;
  // let exportBtnY = returnToStartBtnY + returnToStartBtnH + 8;
  // let exportBtnW = panelW - 16;
  // let exportBtnH = 26;

  let exportBtnHov =
    mouseX > exportBtnX &&
    mouseX < exportBtnX + exportBtnW &&
    mouseY > exportBtnY &&
    mouseY < exportBtnY + exportBtnH;

  // Frost blur
  drawingContext.filter = "blur(4px)";
  noStroke();
  fill(exportBtnHov ? [0, 180, 80, 50] : [0, 120, 200, 28]);
  rect(exportBtnX, exportBtnY, exportBtnW, exportBtnH, 13);
  drawingContext.filter = "none";

  // Glass fill
  noStroke();
  fill(exportBtnHov ? [0, 140, 60, 38] : [0, 80, 160, 18]);
  rect(exportBtnX, exportBtnY, exportBtnW, exportBtnH, 13);

  // Border
  noFill();
  stroke(exportBtnHov ? [80, 255, 160, 130] : [0, 200, 255, 55]);
  strokeWeight(1);
  rect(exportBtnX, exportBtnY, exportBtnW, exportBtnH, 13);

  // Label
  noStroke();
  fill(exportBtnHov ? [200, 255, 220, 240] : [160, 210, 255, 190]);
  textSize(9);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(
    "⇩ Export PNG",
    exportBtnX + exportBtnW / 2,
    exportBtnY + exportBtnH / 2
  );

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}

function drawTooltip() {
  if (tooltipTimer < tooltipDelay || tooltipText === "") {
    return;
  }

  let tooltipWidth = max(90, tooltipText.length * 5.8 + 18);
  let tooltipHeight = 20;
  let tooltipX = constrain(tooltipDrawX, 2, width - tooltipWidth - 2);
  let tooltipY = tooltipDrawY - tooltipHeight - 8;

  if (tooltipY < 2) {
    tooltipY = tooltipDrawY + 16;
  }

  drawingContext.filter = "blur(4px)";
  noStroke();
  fill(0, 100, 180, 40);
  rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);
  drawingContext.filter = "none";

  noStroke();
  fill(0, 70, 140, 28);
  rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);

  noFill();
  stroke(0, 200, 255, 80);
  strokeWeight(0.5);
  rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);

  noStroke();
  fill(160, 225, 255, 220);
  textSize(8.5);
  textStyle(NORMAL);
  textAlign(LEFT, CENTER);
  text(tooltipText, tooltipX + 6, tooltipY + tooltipHeight / 2);
  textAlign(LEFT, BASELINE);
}

function drawSidebarGhostNode() {
  if (!isSidebarDragging || sidebarDragDNA === null) {
    return;
  }

  if (
    dist(sidebarDragX, sidebarDragY, sidebarDragOriginX, sidebarDragOriginY) < 8
  ) {
    return; // threshold not met
  }

  let isOnCanvas =
    sidebarDragX > sidebarX + sidebarWidth &&
    sidebarDragY < height - bottomBarH - sidebarMargin;

  noFill();
  stroke(isOnCanvas ? [100, 220, 140, 120] : [180, 190, 220, 60]);
  strokeWeight(1.5);
  circle(sidebarDragX, sidebarDragY, sidebarDragDNA.size + 20);

  noStroke();
  fill(sidebarDragDNA.colour);
  circle(sidebarDragX, sidebarDragY, sidebarDragDNA.size);

  noStroke();
  fill(
    isOnCanvas
      ? isDarkMode
        ? [200, 240, 210, 220]
        : [30, 100, 50, 220]
      : isDarkMode
      ? [180, 185, 210, 160]
      : [80, 85, 110, 160]
  );
  textSize(9);
  textStyle(NORMAL);
  textAlign(CENTER, TOP);
  text(
    isOnCanvas
      ? "Drop to spawn species cluster"
      : "Drag species to environment",
    sidebarDragX,
    sidebarDragY + sidebarDragDNA.size / 2 + 12
  );
  textAlign(LEFT, BASELINE);
}

function drawDnaListScrollbar() {
  if (isSidebarCollapsed) {
    return;
  }

  listTop = dnaListStartY;
  listBottom = btnBottomY - btnAreaH - 15;
  listVisibleHeight = listBottom - listTop;
  totalListContentHeight = savedNodeTypes.length * dnaListRowHeight;

  // Only draw if content overflows
  if (totalListContentHeight <= listVisibleHeight) {
    return;
  }

  scrollbarX = sidebarX + sidebarWidth - 8;
  let scrollbarTrackH = listVisibleHeight;
  let scrollbarThumbtnHeight = max(
    20,
    (listVisibleHeight / totalListContentHeight) * scrollbarTrackH
  );
  let maxScroll = totalListContentHeight - listVisibleHeight;
  let scrollRatio = constrain(dnaListScrollOffset / maxScroll, 0, 1);
  let scrollbarThumbtnY =
    listTop + scrollRatio * (scrollbarTrackH - scrollbarThumbtnHeight);

  // Track
  noStroke();
  fill(isDarkMode ? [0, 50, 100, 80] : [0, 50, 100, 80]);
  rect(scrollbarX, listTop, 6, scrollbarTrackH, 3);

  // Thumb
  fill(isDarkMode ? [0, 180, 255, 80] : [0, 120, 200, 80]);
  rect(scrollbarX, scrollbarThumbtnY, 6, scrollbarThumbtnHeight, 3);
}

// ---
// Input Handlers
// ---

function mousePressed() {
  if (programState === "start") {
    let btnX = width / 2 - beginBtnW / 2;
    let btnY = height / 2 + 14;

    if (
      mouseX > btnX &&
      mouseX < btnX + beginBtnW &&
      mouseY > btnY &&
      mouseY < btnY + beginBtnH
    ) {
      programState = "intro";
      introPage = 0;
      textStyle(NORMAL);
      textFont();
    }
    return;
  }

  if (programState === "intro") {
    handleIntroClick();
    return;
  }

  // Handle Tutorial Overlay Button Clicks
  if (tutorialState > 0 && tutorialState <= tutorialSteps.length) {
    let boxW = 264;
    let boxH = 190; // 142
    let pos = getTutorialBoxPos(tutorialState, boxW, boxH);
    let bx = pos.x;
    let by = pos.y;

    // Check Skip Button
    let skipBtnW = 38;
    let skipBtnH = 16;
    let skipBtnX = bx + boxW - skipBtnW - 8;
    let skipBtnY = by + 6;
    if (
      mouseX > skipBtnX &&
      mouseX < skipBtnX + skipBtnW &&
      mouseY > skipBtnY &&
      mouseY < skipBtnY + skipBtnH
    ) {
      setTutorialState(-1);
      postTutorialPromptTimer = 100; // Trigger timed prompt
      return;
    }

    // Check inner bounding box for Next/Done/Back
    if (
      mouseX > bx &&
      mouseX < bx + boxW &&
      mouseY > by &&
      mouseY < by + boxH
    ) {
      let isLastStep = tutorialState >= tutorialSteps.length;
      let btnH = 22;
      let btnY = by + boxH - btnH - 7;

      // Check Next / Done button
      let nextBtnW = isLastStep ? 76 : 58;
      let nextBtnX = bx + boxW - nextBtnW - 8;

      if (
        mouseX > nextBtnX &&
        mouseX < nextBtnX + nextBtnW &&
        mouseY > btnY &&
        mouseY < btnY + btnH
      ) {
        setTutorialState(tutorialState + 1);

        if (tutorialState > tutorialSteps.length) {
          setTutorialState(-1);
          postTutorialPromptTimer = 100; // Trigger timed prompt
        }

        return;
      }

      // Check Back button
      if (tutorialState > 1) {
        let backBtnX = bx + 8;
        let backBtnW = 50;

        if (
          mouseX > backBtnX &&
          mouseX < backBtnX + backBtnW &&
          mouseY > btnY &&
          mouseY < btnY + btnH
        ) {
          setTutorialState(tutorialState - 1);
          tutorialStepComplete = true;
          return;
        }
      }
      return;
    }
  }

  if (handleContextualHintClicks()) {
    return;
  }

  if (isEditPopupOpen) {
    let editPanelWidth = 340;
    let editPanelHeight = 180;
    let editPanelX = (sidebarX + sidebarWidth + width) / 2 - editPanelWidth / 2;
    let editPanelY = height / 2 - editPanelHeight / 2;
    let editPanelPad = 14;

    let closeX = editPanelX + editPanelWidth - 16;
    let closeY = editPanelY + 10;
    if (dist(mouseX, mouseY, closeX + 4, closeY + 4) < 10) {
      isEditPopupOpen = false;
      editPopupActiveField = "";
      return;
    }

    let confirmBtnX = editPanelX + editPanelWidth - editPanelPad - 90;
    let btnY = editPanelY + editPanelHeight - 40;
    let cancelBtnX = confirmBtnX - 80 - 6;
    if (
      mouseX > cancelBtnX &&
      mouseX < cancelBtnX + 80 &&
      mouseY > btnY &&
      mouseY < btnY + 28
    ) {
      isEditPopupOpen = false;
      editPopupActiveField = "";
      return;
    }

    if (
      mouseX > confirmBtnX &&
      mouseX < confirmBtnX + 90 &&
      mouseY > btnY &&
      mouseY < btnY + 28
    ) {
      confirmEditPopup();
      return;
    }

    let nameFieldX = editPanelX + editPanelPad + 42;
    let nameFieldY = editPanelY + 38;
    let nameFieldWidth = editPanelWidth - editPanelPad * 2 - 42;
    if (
      mouseX > nameFieldX &&
      mouseX < nameFieldX + nameFieldWidth &&
      mouseY > nameFieldY &&
      mouseY < nameFieldY + 26
    ) {
      editPopupActiveField = "NAME";
      return;
    }

    let dnaFieldX = editPanelX + editPanelPad + 42;
    let dnaFieldY = editPanelY + 78;
    let dnaFieldWidth = editPanelWidth - editPanelPad * 2 - 42;
    if (
      mouseX > dnaFieldX &&
      mouseX < dnaFieldX + dnaFieldWidth &&
      mouseY > dnaFieldY &&
      mouseY < dnaFieldY + 26
    ) {
      editPopupActiveField = "DNA";
      return;
    }

    isEditPopupOpen = false;
    editPopupActiveField = "";
    return;
  }

  if (secretTabHovered) {
    if (tutorialState > 0) {
      return;
    }

    let panelW = 140;
    let panelX = width - panelW - 6;
    let panelY = 6;
    let pillX = panelX + 8;
    let pillY = panelY + 10;
    let pillW = panelW - 16;
    let pillH = 26;

    if (
      mouseX > pillX &&
      mouseX < pillX + pillW &&
      mouseY > pillY &&
      mouseY < pillY + pillH
    ) {
      toggleLightDark();
      return;
    }

    //     let returnBtnX = panelX + 8;
    //     let returnBtnY = pillY + pillH + 8;
    //     let returnBtnW = panelW - 16;
    //     let returnBtnH = 26;

    //     if (
    //       mouseX > returnBtnX &&
    //       mouseX < returnBtnX + returnBtnW &&
    //       mouseY > returnBtnY &&
    //       mouseY < returnBtnY + returnBtnH
    //     ) {
    //       programState = "start";
    //       nodes = [];
    //       colonyGroups = {};
    //       colonyGroupCounter = 0;
    //       savedNodeTypes = [];
    //       sidebarWidth = sidebarFullWidth;
    //       isSidebarCollapsed = false;
    //       speciesIndexPage = 0;
    //       descScrollY = 0;
    //       dnaListScrollOffset = 0;
    //       isEditPopupOpen = false;
    //       openKebabIndex = -1;
    //       isPaused = false;
    //       randomiseDNA();
    //       return;
    //     }

    // Export PNG button click
    let exportBtnX = panelX + 8;
    let exportBtnY = pillY + pillH + 8;
    let exportBtnW = panelW - 16;
    let exportBtnH = 26;

    // let exportBtnX = panelX + 8;
    // let exportBtnY = returnBtnY + returnBtnH + 8;
    // let exportBtnW = panelW - 16;
    // let exportBtnH = 26;

    if (
      mouseX > exportBtnX &&
      mouseX < exportBtnX + exportBtnW &&
      mouseY > exportBtnY &&
      mouseY < exportBtnY + exportBtnH
    ) {
      isExportingPNG = true;
      return;
    }

    return;
  }

  if (openKebabIndex >= 0) {
    let menuX = sidebarX + sidebarWidth + 5;
    let isInMenu = mouseX > menuX && mouseX < menuX + 126;
    let isInSidebar = mouseX > sidebarX && mouseX < sidebarX + sidebarWidth;

    let menuW = 134;
    let headerH = 24;
    let itemsLength = 4;
    let menuH = headerH + itemsLength * 26 + 10;
    let rowY =
      dnaListStartY + openKebabIndex * dnaListRowHeight - dnaListScrollOffset;
    let menuY = constrain(rowY, sidebarMargin + 2, height - menuH - 70);

    let closeKX = menuX + menuW - 12;
    let closeKY = menuY + headerH / 2;
    if (dist(mouseX, mouseY, closeKX, closeKY) < 9) {
      openKebabIndex = -1;
      return;
    }

    if (!isInMenu && !isInSidebar) {
      openKebabIndex = -1;
      isSpawnMode = true;
      return;
    } else if (isInMenu) {
      isSpawnMode = false;
      let i = openKebabIndex;
      let action = getKebabMenuClick(i);
      if (action === "EDIT") {
        editPopupIndex = i;
        editPopupDNAText = savedNodeTypes[i].dna.dnaString;
        editPopupNameText = savedNodeTypes[i].name;
        editPopupActiveField = "";
        isEditPopupOpen = true;
        openKebabIndex = -1;
        return;
      } else if (action === "EXTRACT INDIVIDUAL") {
        trimNodeType(i);
        return;
      } else if (action === "EXTRACT ALL") {
        let targetDNA = savedNodeTypes[i].dna.dnaString;
        nodes = nodes.filter((n) => n.dnaString !== targetDNA);
        savedNodeTypes[i].count = 0;
        cleanupEmptyColonyGroups();
        showNotification("Species DNA Discarded", "warning");
        return;
      } else if (action === "DISCARD DNA") {
        deleteNodeType(i);
        return;
      }
      return;
    }
    openKebabIndex = -1;
  }

  // Species Index page selector clicks
  let pageSelectorY = sidebarY + sidebarPadding + 2 + 14 + previewH + 6;
  let pageSelectorH = 22;
  let pageBtnWidth = (sidebarWidth - sidebarPadding * 2 - 4) / 3;
  let innerX_ps = sidebarX + sidebarPadding;

  if (mouseY > pageSelectorY && mouseY < pageSelectorY + pageSelectorH) {
    if (tutorialState > 0 && tutorialState !== 3) {
      return;
    }

    for (let pi = 0; pi < 3; pi++) {
      let pbX = innerX_ps + pi * (pageBtnWidth + 2);

      if (mouseX > pbX && mouseX < pbX + pageBtnWidth) {
        speciesIndexPage = pi;

        if (tutorialState === 3) {
          tutorialStepComplete = true;
        }
        return;
      }
    }
  }

  readUserInput();

  // FPS panel toggle click
  fpsX = sidebarX + sidebarWidth + sidebarMargin + 22;
  fpsY = sidebarMargin + 15;
  fpsPanelW = isFPSCollapsed ? 145 : 245;
  fpsPanelH = isFPSCollapsed ? 22 : 38;

  if (
    mouseX > fpsX &&
    mouseX < fpsX + fpsPanelW &&
    mouseY > fpsY &&
    mouseY < fpsY + fpsPanelH
  ) {
    if (tutorialState > 0 && tutorialState !== 6) {
      return;
    }

    isFPSCollapsed = !isFPSCollapsed;
    return;
  }

  // Click DNA field
  if (
    mouseX > dnaFieldX &&
    mouseX < dnaFieldX + dnaFieldWidth &&
    mouseY > dnaFieldY &&
    mouseY < dnaFieldY + dnaFieldHeight
  ) {
    if (tutorialState > 0 && tutorialState !== 1) {
      return;
    }

    bottomBarActiveField = "DNA";
    return;
  }

  // Bottom bar button click handling
  // Click the INTRODUCE button
  if (
    mouseX > btnStartX &&
    mouseX < btnStartX + btnWidth &&
    mouseY > dnaFieldY &&
    mouseY < dnaFieldY + dnaFieldHeight
  ) {
    if (tutorialState > 0 && tutorialState !== 5) {
      return;
    }
    if (tutorialState === 5) {
      tutorialStepComplete = true;
    }
    bottomBarActiveField = "";
    introduceSpecies();
    return;
  }

  // Click the RANDOMISE button
  let randomBtnX = btnStartX + btnWidth + btnGap;
  if (
    mouseX > randomBtnX &&
    mouseX < randomBtnX + btnWidth &&
    mouseY > dnaFieldY &&
    mouseY < dnaFieldY + dnaFieldHeight
  ) {
    if (tutorialState > 0 && tutorialState !== 5) {
      return;
    }
    if (tutorialState === 5) {
      tutorialStepComplete = true;
    }
    bottomBarActiveField = "";
    randomiseDNA();
    return;
  }

  // Click the CLEAR button
  let clearDNABtnX = btnStartX + (btnWidth + btnGap) * 2;
  if (
    mouseX > clearDNABtnX &&
    mouseX < clearDNABtnX + btnWidth &&
    mouseY > dnaFieldY &&
    mouseY < dnaFieldY + dnaFieldHeight
  ) {
    if (tutorialState > 0) {
      return;
    }
    dnaInputText = "";
    bottomBarActiveField = "DNA"; // Keep the field focused
    return;
  }

  if (mouseY < barY) {
    bottomBarActiveField = "";
  }

  // Exit to Start Menu button
  exitBtnRadius = 20;
  exitBtnX = width - 50;
  exitBtnY = exitBtnRadius + 30;

  if (
    !secretTabHovered &&
    dist(mouseX, mouseY, exitBtnX, exitBtnY) < exitBtnRadius
  ) {
    if (tutorialState > 0) {
      return;
    }

    programState = "start";
    nodes = [];
    colonyGroups = {};
    colonyGroupCounter = 0;
    savedNodeTypes = [];
    sidebarWidth = sidebarFullWidth;
    isSidebarCollapsed = false;
    speciesIndexPage = 0;
    descScrollY = 0;
    dnaListScrollOffset = 0;
    isEditPopupOpen = false;
    openKebabIndex = -1;
    isPaused = false;
    randomiseDNA();
    return;
  }

  // Play/Pause button
  if (
    !secretTabHovered &&
    dist(mouseX, mouseY, btnTogglePlayPauseX, btnTogglePlayPauseY) <
      btnTogglePlayPauseRadius
  ) {
    if (tutorialState > 0) {
      return;
    }

    isPaused = !isPaused;
    if (isPaused) {
      showNotification("Paused", "info");
    } else {
      showNotification("Resumed", "info");
    }
    return;
  }

  // Tutorial '?' button click
  if (
    !secretTabHovered &&
    dist(mouseX, mouseY, tutorialBtnX, tutorialBtnY) < tutorialBtnRadius
  ) {
    if (tutorialState > 0) {
      setTutorialState(-1);
    } else {
      setTutorialState(1);
      resetContextualHints();
      openKebabIndex = -1;
      showNotification("Tutorial started", "info");
    }
    return;
  }

  // Mute/Unmute ambience button
  if (
    !secretTabHovered &&
    dist(mouseX, mouseY, muteUnmuteBtnX, muteUnmuteBtnY) < muteUnmuteBtnRadius
  ) {
    ambienceManager.toggleMute();
    showNotification(
      ambienceManager.isMuted ? "Sound Muted" : "Ambience Unmuted",
      "info"
    );
    return;
  }

  // Node dragging with mouse
  if (mouseX > sidebarX + sidebarWidth) {
    let closestNode = null;
    // let closestDist = 30;
    let closestDistSquare = 30 * 30; // 900

    for (let node of nodes) {
      let distanceSquare =
        (mouseX - node.x) * (mouseX - node.x) +
        (mouseY - node.y) * (mouseY - node.y);

      if (distanceSquare < closestDistSquare) {
        closestDistSquare = distanceSquare;
        closestNode = node;
      }
    }

    if (closestNode) {
      if (tutorialState > 0) {
        return;
      }

      draggedNode = closestNode;
      dragOffsetX = closestNode.x - mouseX;
      dragOffsetY = closestNode.y - mouseY;
      draggedNode.isPinned = true;
      draggedNode.growthVector.set(0, 0);

      let clickedTypeIndex = savedNodeTypes.findIndex(
        (entry) => entry.dna.dnaString === closestNode.dnaString
      );

      if (clickedTypeIndex >= 0) {
        selectNodeType(clickedTypeIndex);

        let listVisibleHeight = listBottom - dnaListStartY;
        let maxScroll = max(
          0,
          savedNodeTypes.length * dnaListRowHeight - listVisibleHeight
        );
        if (maxScroll > 0) {
          let targetScroll =
            clickedTypeIndex * dnaListRowHeight -
            listVisibleHeight / 2 +
            dnaListRowHeight / 2;
          dnaListScrollOffset = constrain(targetScroll, 0, maxScroll);
        }
      }
      return;
    }
  }

  // Sidebar trapezoid collapse button
  {
    let tabcenterY =
      (height - sidebarMargin * 2 - bottomBarH - sidebarMargin) / 2;
    let tabL = sidebarX + sidebarWidth;
    let tabProtrusion = 12;
    let tabFH = 28;
    if (
      mouseX > tabL - 4 &&
      mouseX < tabL + tabProtrusion + 4 &&
      mouseY > tabcenterY - tabFH - 2 &&
      mouseY < tabcenterY + tabFH + 2
    ) {
      if (tutorialState > 0) {
        return;
      }

      isSidebarCollapsed = !isSidebarCollapsed;
      sidebarWidth = isSidebarCollapsed
        ? sidebarCollapsedWidth
        : sidebarFullWidth;
      return;
    }
  }

  if (mouseX > sidebarX && mouseX < sidebarX + sidebarWidth) {
    if (isSidebarCollapsed) {
      return;
    }

    if (
      mouseY > sidebarClearBtnY &&
      mouseY < sidebarClearBtnY + sidebarClearBtnH
    ) {
      if (tutorialState > 0) {
        return;
      }

      clearAllNodes();
      return;
    }

    if (
      speciesIndexPage === 1 &&
      !isSidebarCollapsed &&
      descMaxScrollStored > 0
    ) {
      if (
        mouseX > descScrollbarDrawX - 4 &&
        mouseX < descScrollbarDrawX + 7 &&
        mouseY > descScrollbarThumbY &&
        mouseY < descScrollbarThumbY + descScrollbarThumbH
      ) {
        if (tutorialState > 0) {
          return;
        }

        descScrollbarDragging = true;
        descScrollbarDragStartMouseY = mouseY;
        descScrollbarDragStartScrollY = descScrollY;
        return;
      }
    }

    let scrollListTop = dnaListStartY;
    let scrollListBottom = height - sidebarMargin - btnAreaH - sidebarPadding;
    let scrollListVisibleH = scrollListBottom - scrollListTop;
    let scrollTotalContentH = savedNodeTypes.length * dnaListRowHeight;
    let scrollbarHitX = sidebarX + sidebarWidth - 8;

    if (scrollTotalContentH > scrollListVisibleH) {
      let scrollTrackH = scrollListVisibleH;
      let scrollThumbtnHeight = max(
        20,
        (scrollListVisibleH / scrollTotalContentH) * scrollTrackH
      );

      let maxScroll = scrollTotalContentH - scrollListVisibleH;
      let scrollRatio = constrain(dnaListScrollOffset / maxScroll, 0, 1);

      let scrollThumbtnY =
        scrollListTop + scrollRatio * (scrollTrackH - scrollThumbtnHeight);

      if (
        mouseX > scrollbarHitX - 6 &&
        mouseX < scrollbarHitX + 9 &&
        mouseY > scrollThumbtnY &&
        mouseY < scrollThumbtnY + scrollThumbtnHeight
      ) {
        if (tutorialState > 0) {
          return;
        }

        isDraggingScrollbar = true;
        scrollbarDragStartY = mouseY;
        scrollbarDragStartOffset = dnaListScrollOffset;
        return;
      }
    }

    let scrollbarColX = sidebarX + sidebarWidth - 14;
    if (mouseX >= scrollbarColX) {
      return;
    }

    for (let i = 0; i < savedNodeTypes.length; i++) {
      let rowY = dnaListStartY + i * dnaListRowHeight - dnaListScrollOffset;
      if (rowY + dnaListRowHeight < dnaListStartY || rowY > height) {
        continue;
      }

      let kebabBtnX = sidebarX + sidebarWidth - 22;
      let kebabBtnY = rowY + dnaListRowHeight / 2;

      if (dist(mouseX, mouseY, kebabBtnX, kebabBtnY) < 12) {
        if (tutorialState > 0) {
          return;
        }

        openKebabIndex = openKebabIndex === i ? -1 : i;
        return;
      }

      if (mouseY > rowY && mouseY < rowY + dnaListRowHeight) {
        if (tutorialState > 0 && tutorialState !== 3) {
          // 4
          return;
        }

        selectNodeType(i);
        if (tutorialState === 3) {
          // 4
          tutorialStepComplete = true;
        }

        // Begin drag-ghost
        isSidebarDragging = true;
        sidebarDragDNA = savedNodeTypes[i].dna;
        sidebarDragOriginX = mouseX;
        sidebarDragOriginY = mouseY;
        sidebarDragX = mouseX;
        sidebarDragY = mouseY;
        openKebabIndex = -1;
        return;
      }
    }
  }

  let existingIndex = savedNodeTypes.findIndex(
    (entry) => entry.dna.dnaCharSeedValue === currentDNA.dnaCharSeedValue
  );

  if (existingIndex !== -1) {
    // Auto-correct to the pre-existing species
    currentDNA = savedNodeTypes[existingIndex].dna;
    dnaInputText = currentDNA.dnaString;
  } else {
    // Register the new species
    savedNodeTypes.push({
      dna: currentDNA,
      name: currentDNA.speciesName,
      count: 0,
    });
  }

  // Update counts for the sidebar list
  // for (let dnaEntry of savedNodeTypes) {
  //   dnaEntry.count = nodes.filter(
  //     (node) => node.dnaString === dnaEntry.dna.dnaString
  //   ).length;
  // }

  // Only spawn inside environment rectangle
  if (
    mouseX > envX &&
    mouseX < envX + envW &&
    mouseY > envY &&
    mouseY < envY + envH
  ) {
    if (tutorialState > 0 && tutorialState !== 2) {
      return;
    }

    // Limit spawns during tutorial step 2
    if (tutorialState === 2) {
      if (tutorialSpawnCount >= 3) {
        showNotification(
          "Spawn count limited to 3 during tutorial phase.",
          "info",
          "bottom"
        );
        return;
      }
      tutorialSpawnCount++;
    }

    if (nodes.length >= getEffectiveNodeCap()) {
      showNotification(
        "Population capacity reached. Reduce species in [ACTIVE SPECIES] list to spawn more.",
        "warning"
      );
      return;
    }

    if (currentDNA.behaviour === "weave" && !weaveBehaviourWarningShown) {
      weaveBehaviourWarningShown = true;
      showNotification(
        "WARNING: Behaviour [Weave] has very high energy cost - low limit on spawns",
        "warning"
      );
    }

    if (currentDNA.behaviour === "predate" && !predateBehaviourWarningShown) {
      predateBehaviourWarningShown = true;
      showNotification(
        "WARNING: Behaviour [Predate] will try to consume other species.",
        "warning"
      );
    }

    let effectiveCap = getEffectiveNodeCap();
    let spaceLeft = effectiveCap - nodes.length;
    console.log("spaceLeft: " + spaceLeft);
    let spawnAmount = min(int(random(1, 5)), spaceLeft);
    console.log("spawnAmount: " + spawnAmount);

    for (let i = 0; i < spawnAmount; i++) {
      let spawnX = constrain(
        mouseX + random(-15, 15),
        envX + 5,
        envX + envW - 5
      );
      let spawnY = constrain(
        mouseY + random(-15, 15),
        envY + 5,
        envY + envH - 5
      );
      nodes.push(new Node(spawnX, spawnY, currentDNA));
    }

    refreshNodeCounts();
  }
}

function mouseReleased() {
  if (isSidebarDragging) {
    isSidebarDragging = false;

    if (tutorialState > 0) {
      sidebarDragDNA = null;
      return;
    }

    // Only spawn if released onto active canvas
    let droppedisOnCanvas =
      sidebarDragX > sidebarX + sidebarWidth &&
      sidebarDragY < height - bottomBarH - sidebarMargin;

    if (droppedisOnCanvas && sidebarDragDNA !== null) {
      let previousDNA = currentDNA;
      currentDNA = sidebarDragDNA; // Temporarily swap so energy calculation works for the dragged species

      let effectiveCap = getEffectiveNodeCap();

      if (nodes.length >= effectiveCap) {
        showNotification(
          "Energy Limit Reached. Extract species to recover energy.",
          "warning"
        );
      } else {
        let spaceLeft = effectiveCap - nodes.length;
        let spawnCount = min(int(random(2, 5)), spaceLeft);

        for (let i = 0; i < spawnCount; i++) {
          nodes.push(
            new Node(
              sidebarDragX + random(-15, 15),
              sidebarDragY + random(-15, 15),
              sidebarDragDNA
            )
          );
        }
        refreshNodeCounts();
        showNotification("Species Spawned", "success");
      }

      currentDNA = previousDNA; // restore previous selection
    }

    sidebarDragDNA = null;
    return;
  }

  descScrollbarDragging = false;
  isDraggingScrollbar = false;

  if (draggedNode !== null) {
    draggedNode.isPinned = false;

    if (draggedNode.orbitCentre) {
      draggedNode.orbitCentre.set(draggedNode.x, draggedNode.y);
    } else {
      draggedNode.orbitCentre = createVector(draggedNode.x, draggedNode.y);
    }

    if (
      draggedNode.behaviour === "colony" &&
      colonyGroups[draggedNode.colonyGroupID]
    ) {
      colonyGroups[draggedNode.colonyGroupID].anchorX = draggedNode.x;
      colonyGroups[draggedNode.colonyGroupID].anchorY = draggedNode.y;
    }

    if (velocityBehaviours.includes(draggedNode.behaviour)) {
      draggedNode.growthVector = p5.Vector.random2D().mult(draggedNode.speed);
    } else {
      draggedNode.growthVector.set(0, 0);
    }

    draggedNode.posHistory = [];
    draggedNode = null;
  }
}

function mouseDragged() {
  // Update sidebar drag spawn ghost node position
  if (isSidebarDragging) {
    sidebarDragX = mouseX;
    sidebarDragY = mouseY;
  }

  if (descScrollbarDragging) {
    let dragDelta = mouseY - descScrollbarDragStartMouseY;

    if (descMaxScrollStored > 0) {
      let scrollableTrack = descScrollbarTrackH - descScrollbarThumbH;
      let scrollRatio = dragDelta / max(1, scrollableTrack);
      descScrollY = constrain(
        descScrollbarDragStartScrollY + scrollRatio * descMaxScrollStored,
        0,
        descMaxScrollStored
      );
    }
    return;
  }

  if (isDraggingScrollbar) {
    let listVisibleHeight =
      height - sidebarMargin - btnAreaH - sidebarPadding - dnaListStartY;
    let totalListContentHeight = savedNodeTypes.length * dnaListRowHeight;
    let maxScroll = max(0, totalListContentHeight - listVisibleHeight);
    let scrollbarTrackH = listVisibleHeight;
    let scrollbarThumbtnHeight = max(
      20,
      (listVisibleHeight / totalListContentHeight) * scrollbarTrackH
    );

    let dragRatio =
      (mouseY - scrollbarDragStartY) /
      (scrollbarTrackH - scrollbarThumbtnHeight);
    dnaListScrollOffset = constrain(
      scrollbarDragStartOffset + dragRatio * maxScroll,
      0,
      maxScroll
    );
    return;
  }

  if (draggedNode !== null) {
    draggedNode.isPinned = true;
    draggedNode.x = constrain(
      mouseX + dragOffsetX,
      sidebarX + sidebarWidth + draggedNode.size / 2,
      width - draggedNode.size / 2
    );
    draggedNode.y = constrain(
      mouseY + dragOffsetY,
      draggedNode.size / 2,
      height - draggedNode.size / 2
    );
    draggedNode.growthVector.set(0, 0); // Stop node momentum (should maintain trajectory when resumed)
  }
}

function mouseWheel(event) {
  if (
    speciesIndexPage === 1 &&
    mouseX > sidebarX &&
    mouseX < sidebarX + sidebarWidth &&
    mouseY > sidebarY &&
    mouseY < sidebarY + speciesIndexTopPanelH &&
    !isSidebarCollapsed
  ) {
    descScrollY = max(0, descScrollY + event.delta * 0.35);
    return false;
  }

  if (mouseX > sidebarX && mouseX < sidebarX + sidebarWidth) {
    let listVisibleHeight = listBottom - dnaListStartY;
    let maxScroll = max(
      0,
      savedNodeTypes.length * dnaListRowHeight - listVisibleHeight
    );

    // Prevent scrolling entirely if content fits
    if (maxScroll <= 0) {
      dnaListScrollOffset = 0;
      return false;
    }

    dnaListScrollOffset += event.delta * 0.3;
    dnaListScrollOffset = constrain(dnaListScrollOffset, 0, maxScroll);
    return false;
  }
}

function keyPressed() {
  if (programState === "start" && (keyCode === ENTER || key === " ")) {
    programState = "intro";
    introPage = 0;
    textStyle(NORMAL);
    textFont();
    return false;
  }

  // Enter key to begin simulation from Intro Slide
  if (programState === "intro" && (keyCode === ENTER || key === " ")) {
    programState = "simulation";
    setTutorialState(1);

    if (savedNodeTypes.length === 0) {
      createInitialNodes();
    }

    ambienceManager.start();
    return false;
  }

  if (tutorialState > 0 && tutorialState <= tutorialSteps.length) {
    if (key === " " || keyCode === ENTER || keyCode === RIGHT_ARROW) {
      setTutorialState(tutorialState + 1);
      if (tutorialState > tutorialSteps.length) {
        setTutorialState(-1);
        postTutorialPromptTimer = 1500; // Show prompt after tutorial is completed // 400, 600, 900, 1200
      }
      return false;
    } else if (keyCode === LEFT_ARROW && tutorialState > 1) {
      setTutorialState(tutorialState - 1);
      return false;
    }
  }

  if (bottomBarActiveField === "") {
    return;
  }
}

function keyTyped() {
  if (tutorialState > 0 && tutorialState !== 1) {
    return;
  }

  if (
    bottomBarActiveField === "" &&
    !isEditPopupOpen &&
    programState === "simulation"
  ) {
    bottomBarActiveField = "DNA";
  }

  if (isEditPopupOpen) {
    if (editPopupActiveField === "DNA") {
      let upperKey = key.toUpperCase();
      if (!allowedProteins.includes(upperKey)) {
        return;
      }

      if (editPopupDNAText.length < dnaStringMaxLength) {
        editPopupDNAText += upperKey;
      }
      return;
    } else if (editPopupActiveField === "NAME") {
      if (key !== "Backspace" && key !== "Enter") {
        if (editPopupNameText.length < 30) {
          editPopupNameText += key;
        }
      }
      return;
    }
  }

  if (bottomBarActiveField === "") {
    return;
  }

  if (bottomBarActiveField == "DNA") {
    // if (key == "BACKSPACE" || key == "ENTER" || key == "ESCAPE") {
    if (key == "BACKSPACE" || key == "ENTER") {
      // Can't use escape key for dewey cabinet
      return;
    }

    let upperKey = key.toUpperCase();
    if (!allowedProteins.includes(upperKey)) {
      return;
    }

    if (dnaInputText.length < dnaStringMaxLength) {
      dnaInputText += upperKey;
      currentDNA = generateDNAProfile(dnaInputText);
      postTutorialPromptTimer = 0; // Hide prompt if the user start typing
    } else {
      showNotification(
        "MAX DNA PROTEINS REACHED - DELETE EXISTING PROTEINS IN HELIX TO ADD MORE",
        "warning",
        "top"
      );
    }

    if (tutorialState == 1) {
      tutorialStepComplete = true;
    }
  }
}

// ---
// Node DNA & Species Logic
// ---

/* Generates a deterministic DNA profile object from the currently entered DNA input string/seed. Each property (behaviour, colour, shape, speed, size, etc.) is derived from the total sum of the character codes in the string via the 'map' function (the index of the DNA characters matters), so the same sequence always produces the same species. The function returns a profile object containing all node type properties.
 */
function generateDNAProfile(inputString) {
  let sumCode = 0;

  for (let i = 0; i < inputString.length; i++) {
    // sumCode += inputString.charCodeAt(i);
    sumCode += inputString.charCodeAt(i) * (i + 1); // Make the character's position in the string matter by multiplying the character code by its index
  }

  // let selectedBehaviour = behavioursArray[sumCode % behavioursArray.length];
  let selectedBehaviour =
    behavioursArray[(sumCode * 7) % behavioursArray.length];
  // let selectedColour = dnaColours[(sumCode * 3) % dnaColours.length];
  // let selectedColour = dnaColours[(sumCode * 3 + 13) % dnaColours.length];
  let selectedColour = dnaColours[(sumCode * 5 + 7) % dnaColours.length];
  // let selectedShape = shapesArray[(sumCode * 7) % shapesArray.length];
  // let selectedShape = shapesArray[sumCode % shapesArray.length];
  let selectedShape = shapesArray[(sumCode * 7 + 31) % shapesArray.length];
  // let selectedTrailStyle =
  //   trailStylesArray[(sumCode * 11) % trailStylesArray.length];
  // let selectedTrailStyle =
  //   trailStylesArray[(sumCode * 11 + 47) % trailStylesArray.length];
  let selectedTrailStyle =
    trailStylesArray[(sumCode * 13 + 53) % trailStylesArray.length];
  // let selectedGlowStyle =
  //   glowStylesArray[(sumCode * 13) % glowStylesArray.length];
  let selectedGlowStyle =
    glowStylesArray[(sumCode * 17) % glowStylesArray.length];
  let selectedConnectionStyle =
    connectionStylesArray[(sumCode * 23) % connectionStylesArray.length];

  let selectedSpeed = map((sumCode * 19) % 101, 0, 100, 0.5, 3.0);
  let selectedSize = map((sumCode * 29) % 97, 0, 96, 5, 35);
  let selectedConnectionThreshold = map((sumCode * 31) % 83, 0, 82, 60, 200);

  let selectedlissajousA = ((sumCode * 37) % 4) + 2;
  let selectedlissajousB = ((sumCode * 41) % 4) + 2;

  if (selectedlissajousA === selectedlissajousB) {
    selectedlissajousB = (selectedlissajousB % 4) + 2;
  }

  let selectedLissajousPhase = map((sumCode * 43) % 50, 0, 49, 0, TWO_PI);

  let selectedDnaCharSeedValue = sumCode;
  let selectedSpeciesName = generateSpeciesName(sumCode);

  return {
    behaviour: selectedBehaviour,
    colour: selectedColour,
    shape: selectedShape,
    trailStyle: selectedTrailStyle,
    glowStyle: selectedGlowStyle,
    speed: selectedSpeed,
    size: selectedSize,
    dnaString: inputString,
    dnaCharSeedValue: selectedDnaCharSeedValue,
    speciesName: selectedSpeciesName,
    connectionThreshold: selectedConnectionThreshold,
    connectionStyle: selectedConnectionStyle,
    lissajousA: selectedlissajousA,
    lissajousB: selectedlissajousB,
    lissajousPhase: selectedLissajousPhase,
  };
}

/* Generates a species name by combining entry indexes from the firstNames and lastNames arrays, these are deterministically selected using the sumCode seed. This function returns the name as a "firstName lastName" string.
 */
function generateSpeciesName(sumCode) {
  let firstName = firstNames[sumCode % firstNames.length];
  let lastName = lastNames[(sumCode * 7) % lastNames.length];

  return firstName + " " + lastName;
}

/* Builds an easily human-readable description of for each species based off its DNA profile. The phrasing is selected from pre-defined arrays using the seed value so the description is consistent for a given species. This function returns the description as a formatted multi-line string.
 */
function generateSpeciesDescription(dna) {
  let seed = dna.dnaCharSeedValue;
  let pick = (array, offset) =>
    array[Math.abs(seed * (offset + 1)) % array.length];

  let sizeAdjective =
    dna.size < 13
      ? pick(["minute", "microscopic", "diminutive"], 1)
      : dna.size < 24
      ? pick(["mid-sized", "moderate", "average-scale"], 2)
      : pick(["unusually large", "bulky", "macro-scale"], 3);

  let speedAdjective =
    dna.speed < 1.2
      ? pick(["lethargic", "slow-moving", "leisurely"], 4)
      : dna.speed < 2.2
      ? pick(["moderately paced", "steady", "unhurried"], 5)
      : pick(["swift", "energetically charged", "rapid"], 6);

  let behaviourArray = behaviourPhrases[dna.behaviour] || [
    "moves in an undocumented pattern",
  ];
  let behaviourPhrase = pick(behaviourArray, 10);

  let connectionSentences = {
    "same-type": pick(
      [
        "Forms bonds exclusively within its own species.",
        "Communicates only with genetically similar organisms.",
      ],
      13
    ),
    all: pick(
      [
        "Indiscriminately connects with all nearby organisms.",
        "Reaches out to any species within detection range.",
      ],
      14
    ),
    none: pick(
      [
        "Maintains strict biological isolation from all others.",
        "Refuses all inter-organism contact -entirely self-contained.",
      ],
      15
    ),
  };

  let colourName = colourNames[dna.colour] || "unknown";
  let shapeType = shapeTypes[dna.shape] || dna.shape;
  let glowType = glowTypes[dna.glowStyle] || dna.glowStyle;
  let trailType = trailTypes[dna.trailStyle] || dna.trailStyle;
  let connSentence =
    connectionSentences[dna.connectionStyle] || "Contact preference: unknown.";
  let energyRating = behaviourEnergyRatings[dna.behaviour] || 1;
  let energyLabel =
    energyRating <= 2
      ? "low"
      : energyRating <= 3
      ? "moderate"
      : energyRating <= 4
      ? "high"
      : "very high";

  // Build a formatted multi-section description - colons on their own lines
  return (
    `${dna.speciesName} is a ${sizeAdjective} ${speedAdjective} organism that ${behaviourPhrase}.\n\n` +
    `Colour: ${colourName}.\n` +
    `Embryology: ${shapeType}.\n` +
    `Bioluminescence: ${glowType}.\n` +
    `Imprinted trail: ${trailType}.\n\n` +
    `Bond range: ${int(dna.connectionThreshold)} units.\n` +
    `Bond preference: ${dna.connectionStyle}.\n` +
    `${connSentence}\n\n` +
    `Simulation energy cost: ${energyLabel} (${energyRating}/18).`
  );
}

/* Sets the active species in the sidebar to the node type at the provided index. It updates currentDNA, regenerates and caches/stores the species description text, and also pre-calculates the text height for the scrollbar, resetting the scroll position.
 */
function selectNodeType(index) {
  currentDNA = savedNodeTypes[index].dna;
  dnaInputText = currentDNA.dnaString;

  // Pre-generate & store/cache text height once
  speciesDescription = generateSpeciesDescription(currentDNA);
  let contentWidth = sidebarWidth - sidebarPadding * 2;
  let charactersPerLine = floor((contentWidth - 14) / 5.2);
  let paragraphs = speciesDescription.split("\n");
  let lineCount = 0;

  for (let individualParagraph of paragraphs) {
    if (individualParagraph.trim() === "") {
      lineCount++;
      continue;
    }

    let words = individualParagraph.split(" ");
    let paragraphLines = 1;
    let lineLength = 0;

    for (let individualWord of words) {
      let wordLength = individualWord.length + 1;
      lineLength += wordLength;

      if (lineLength > charactersPerLine) {
        paragraphLines++;
        lineLength = wordLength;
      }
    }
    lineCount += paragraphLines;
  }
  descTotalTextHeight = lineCount * 13 - 5;

  // speciesDescription = ""; // Regenerate description for newly selected species
  descScrollY = 0; // Reset description scroll
  previewNodeTrail = [];
  previewPulseRadius = 0;
}

/* Spawn the initial nodes of a ransomised DNA profile when the user first enters the simulation App state
 */
function createInitialNodes() {
  savedNodeTypes.push({
    dna: currentDNA,
    name: currentDNA.speciesName,
    count: 5,
  });

  // Create initial nodes
  let spawnCount = int(random(2, 5));
  for (let i = 0; i < spawnCount; i++) {
    // 5
    nodes.push(
      new Node(random(sidebarWidth, width), random(height), currentDNA)
    );
  }

  refreshNodeCounts();
  selectNodeType(0);

  // showNotification("Initial node species created", "success");
}

/* Spawns a random cluster of the current species at a random position inside the environment to make it more intuitive and easier to spawn nodes for users who may not understand they need to click within the environment to spawn node species.
 */
function introduceSpecies() {
  let effectiveCap = getEffectiveNodeCap();

  if (nodes.length >= effectiveCap) {
    showNotification(
      "Energy limit reached - extract high-cost species to spawn more",
      "warning"
    );
    return;
  }

  let spawnX = random(sidebarWidth + 60, width - 60);
  let spawnY = random(60, height - 60);

  let existingIndex = savedNodeTypes.findIndex(
    (entry) => entry.dna.dnaCharSeedValue === currentDNA.dnaCharSeedValue
  );

  if (existingIndex !== -1) {
    currentDNA = savedNodeTypes[existingIndex].dna;
    dnaInputText = currentDNA.dnaString;
  } else {
    // New species
    savedNodeTypes.push({
      dna: currentDNA,
      name: currentDNA.speciesName,
      count: 0,
    });
  }

  let spawnCount = int(random(2, 5));
  for (let i = 0; i < spawnCount; i++) {
    if (nodes.length >= getEffectiveNodeCap()) {
      break;
    }

    nodes.push(
      new Node(spawnX + random(-15, 15), spawnY + random(-15, 15), currentDNA)
    );
  }

  refreshNodeCounts();
  showNotification("Species Introduced", "success");
}

function randomiseDNA() {
  let keyboardCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let dnaStringLength;

  if (tutorialState >= 0 && tutorialState <= 3) {
    dnaStringLength = int(random(1, 5));
  } else {
    dnaStringLength = int(random(1, dnaStringMaxLength));
  }

  let rndString = "";
  for (let i = 0; i < dnaStringLength; i++) {
    rndString += keyboardCharacters.charAt(
      int(random(keyboardCharacters.length))
    );
  }
  dnaInputText = rndString;
  readUserInput();
  console.log("Randomised DNA:", currentDNA);
}

/* Applies edit changes within the edit popup panel to the correlating node type, updating all active nodes of that species to reflect the new DNA and/or name.
 */
function confirmEditPopup() {
  if (editPopupIndex < 0 || editPopupIndex >= savedNodeTypes.length) {
    return;
  }

  let newDNA =
    editPopupDNAText.length > 0
      ? editPopupDNAText
      : savedNodeTypes[editPopupIndex].dna.dnaString;

  let newName =
    editPopupNameText.length > 0
      ? editPopupNameText
      : savedNodeTypes[editPopupIndex].name;

  let updatedProfile = generateDNAProfile(newDNA);
  updatedProfile.speciesName = newName; // Overwrite species name

  // Update all existing nodes of this type
  let oldDNAString = savedNodeTypes[editPopupIndex].dna.dnaString;
  for (let node of nodes) {
    if (node.dnaString === oldDNAString) {
      node.dnaString = updatedProfile.dnaString;
      node.speciesName = newName;
      node.colour = updatedProfile.colour;
      node.shape = updatedProfile.shape;
      node.behaviour = updatedProfile.behaviour;
      node.speed = updatedProfile.speed;
      node.size = updatedProfile.size;
      node.trailStyle = updatedProfile.trailStyle;
      node.glowStyle = updatedProfile.glowStyle;
      node.connectionThreshold = updatedProfile.connectionThreshold;
      node.connectionStyle = updatedProfile.connectionStyle;
    }
  }

  savedNodeTypes[editPopupIndex].dna = updatedProfile;
  savedNodeTypes[editPopupIndex].name = newName;

  if (currentDNA.dnaString === oldDNAString) {
    currentDNA = updatedProfile;
    dnaInputText = updatedProfile.dnaString;
  }

  isEditPopupOpen = false;
  editPopupActiveField = "";
  openKebabIndex = -1;

  refreshNodeCounts();
  showNotification("Species Updated", "success");
}

function trimNodeType(index) {
  let targetDNA = savedNodeTypes[index].dna.dnaString;

  for (let i = nodes.length - 1; i >= 0; i--) {
    if (nodes[i].dnaString === targetDNA) {
      nodes.splice(i, 1);
      showNotification(
        "Species Individual Extracted. Population Reduced.",
        "info"
      );
      break;
    }
  }

  if (nodes.length == 0) {
    showNotification("Species Extinct", "error");
  }

  refreshNodeCounts();
  cleanupEmptyColonyGroups();
}

/* Removes all nodes of the specific node type which matches the provided index, then deletes that node type entry from the savedNodeTypes array. It then selects an adjacent species or randomises the DNA input if the species list becomes empty.
 */
function deleteNodeType(index) {
  let dnaNodeTypeToRemove = savedNodeTypes[index].dna.dnaString;

  nodes = nodes.filter((node) => node.dnaString !== dnaNodeTypeToRemove);
  savedNodeTypes.splice(index, 1);

  if (savedNodeTypes.length > 0) {
    let newIndex = max(0, index - 1);
    currentDNA = savedNodeTypes[newIndex].dna;
    selectNodeType(newIndex);
  } else {
    randomiseDNA();
  }

  refreshNodeCounts();
  cleanupEmptyColonyGroups();

  showNotification("Species DNA Discarded", "info");
}

// Reduce all node type counts to zero while retaining each saved node type in the species index
function clearAllNodes() {
  nodes = [];
  colonyGroups = {};
  colonyGroupCounter = 0;
  weaveBehaviourWarningShown = false;
  predateBehaviourWarningShown = false;

  for (let dnaEntry of savedNodeTypes) {
    dnaEntry.count = 0;
  }

  refreshNodeCounts();
  showNotification("All Species Extracted - DNA is Retained", "info");
}

function readUserInput() {
  let textString = dnaInputText;

  if (
    dnaInputText.length > 0 &&
    (!currentDNA || dnaInputText !== currentDNA.dnaString)
  ) {
    dnaInputText = textString;
    currentDNA = generateDNAProfile(dnaInputText);

    // Pre-generate & store/cache text height once
    speciesDescription = generateSpeciesDescription(currentDNA);
    let contentWidth = sidebarWidth - sidebarPadding * 2;
    let charactersPerLine = floor((contentWidth - 14) / 5.2);
    let paragraphs = speciesDescription.split("\n");
    let lineCount = 0;

    for (let individualParagraph of paragraphs) {
      if (individualParagraph.trim() === "") {
        lineCount++;
        continue;
      }

      let words = individualParagraph.split(" ");
      let paragraphLines = 1;
      let lineLength = 0;

      for (let individualWord of words) {
        let wordLength = individualWord.length + 1;
        lineLength += wordLength;
        if (lineLength > charactersPerLine) {
          paragraphLines++;
          lineLength = wordLength;
        }
      }
      lineCount += paragraphLines;
    }
    descTotalTextHeight = lineCount * 13 - 5;

    // speciesDescription = ""; // regenerate on next draw
    console.log("New DNA Loaded:", currentDNA);
  }
}

// ---
// Tutorial & Hints
// ---

function setTutorialState(newState) {
  if (tutorialGifs[tutorialState]) {
    tutorialGifs[tutorialState].pause();
  }

  tutorialState = newState;

  if (tutorialGifs[tutorialState]) {
    tutorialGifs[tutorialState].play();
  }
}

function getTutorialBoxPos(step, boxW, boxH) {
  let boxX;
  let boxY;
  switch (step) {
    case 1:
      boxX = (barX || width / 2) + (barWidth || 400) / 2 - boxW / 2;
      boxY = (barY || height - 80) - boxH - 20;
      break;
    case 2:
      boxX = envX + envW / 2 - boxW / 2;
      boxY = envY + 142;
      break;
    case 3: // 4
      boxX = sidebarX + sidebarWidth + 18;
      boxY = sidebarY + speciesIndexTopPanelH + 28;
      break;
    default:
      boxX = (barX || width / 2) + (barWidth || 400) / 2 - boxW / 2;
      boxY = (barY || height - 80) - boxH - 18;
      break;
  }
  return {
    x: constrain(boxX, 4, width - boxW - 4),
    y: constrain(boxY, 4, height - boxH - 4),
  };
}

function checkContextualHintHovers() {
  if (tutorialState > 0) {
    return; // Don't show during tutorial
  }

  if (isSidebarCollapsed) {
    return;
  }

  // Feature hit-test areas
  let hoverSpeciesIndex =
    mouseX > sidebarX &&
    mouseX < sidebarX + sidebarWidth &&
    mouseY > sidebarY &&
    mouseY < sidebarY + speciesIndexTopPanelH;

  let hoverActiveList =
    mouseX > sidebarX &&
    mouseX < sidebarX + sidebarWidth &&
    mouseY > sidebarY + speciesIndexTopPanelH + 8 && // Starts exactly where top panel ends
    mouseY < height - sidebarMargin;

  fpsX = sidebarX + sidebarWidth + sidebarMargin + 22;
  fpsY = sidebarMargin + 15;
  currentFpsW = isFPSCollapsed ? 145 : 245;
  currentFpsH = isFPSCollapsed ? 22 : 38;

  let hoverEnergyMonitor =
    mouseX > fpsX &&
    mouseX < fpsX + currentFpsW &&
    mouseY > fpsY &&
    mouseY < fpsY + currentFpsH;

  let hoverControls =
    barY !== undefined &&
    mouseX > btnStartX &&
    mouseX < btnStartX + btnWidth * 3 + btnGap &&
    mouseY > barY + 4 &&
    mouseY < barY + bottomBarH - 4;

  let hoverMap = {
    speciesIndex: hoverSpeciesIndex,
    activeList: hoverActiveList,
    energyMonitor: hoverEnergyMonitor,
    controls: hoverControls,
  };

  // Check if ANY panel is currently showing
  let anyPanelShowing = false;

  for (let k in hintIsShowing) {
    if (hintIsShowing[k]) {
      anyPanelShowing = true;
      break;
    }
  }

  for (let key in hoverMap) {
    if (contextualHintsShown[key]) {
      continue; // Already acknowledged
    }

    if (!hintHoverFrames[key]) {
      hintHoverFrames[key] = 0;
    }

    if (!hintShowFrames[key]) {
      hintShowFrames[key] = 0;
    }

    if (hintIsShowing[key] === undefined) {
      hintIsShowing[key] = false;
    }

    let isOver = hoverMap[key];

    // If another panel is open, don't let a new one start loading
    if (anyPanelShowing && !hintIsShowing[key]) {
      hintHoverFrames[key] = 0;
      continue;
    }

    if (isOver && !hintIsShowing[key]) {
      hintHoverFrames[key]++;
      if (hintHoverFrames[key] >= 20) {
        hintIsShowing[key] = true;
        hintShowFrames[key] = 0;
        anyPanelShowing = true; // Lock others out immediately

        if (hintGifs[key]) {
          hintGifs[key].play();
        }
      }
    }

    if (!isOver && !hintIsShowing[key]) {
      hintHoverFrames[key] = 0; // Reset hover counter if mouse leaves before showing
    }

    if (hintIsShowing[key]) {
      hintShowFrames[key]++;

      // Auto-close and mark as shown after set duration
      if (hintShowFrames[key] >= hintMinTimePanelShown) {
        contextualHintsShown[key] = true;
        hintIsShowing[key] = false;

        if (hintGifs[key]) {
          hintGifs[key].pause();
        }
      }
    }
  }
}

// Handle GOT IT button clicks
function handleContextualHintClicks() {
  let positionMap = {
    speciesIndex: { x: sidebarX + sidebarWidth + 28, y: sidebarY + 61 },
    activeList: {
      x: sidebarX + sidebarWidth + 28,
      y: sidebarY + speciesIndexTopPanelH + 70,
    },
    energyMonitor: {
      x: sidebarX + sidebarWidth + sidebarMargin + 15,
      y: sidebarY + 160,
    },
    controls: { x: barX + barWidth / 2 + 120, y: barY - 215 },
  };

  for (let key in hintIsShowing) {
    if (!hintIsShowing[key] || contextualHintsShown[key]) {
      continue;
    }

    let pos = positionMap[key];
    if (!pos) {
      continue;
    }

    let boxW = 264;
    let boxH = 190; // 142
    let boxX = constrain(pos.x, 4, width - boxW - 4);
    let boxY = constrain(pos.y, 4, height - boxH - 4);

    let btnW = 68;
    let btnH = 22;
    let btnX = boxX + boxW - btnW - 8;
    let btnY = boxY + boxH - btnH - 8;

    if (
      mouseX > btnX &&
      mouseX < btnX + btnW &&
      mouseY > btnY &&
      mouseY < btnY + btnH
    ) {
      acknowledgeContextualHint(key);
      return true; // Consumed the click
    }
  }
  return false;
}

// Called when user clicks GOT IT on a hint panel
function acknowledgeContextualHint(hintKey) {
  contextualHintsShown[hintKey] = true;
  hintIsShowing[hintKey] = false;

  if (hintGifs[hintKey]) {
    hintGifs[hintKey].pause();
  }
}

// Reset all hints (called when '?' tutorial button is pressed)
function resetContextualHints() {
  contextualHintsShown = {};
  hintHoverFrames = {};
  hintShowFrames = {};
  hintIsShowing = {};
}

function loadGifs() {
  for (let step in tutorialGifPaths) {
    let path = tutorialGifPaths[step];
    let s = int(step);
    loadImage(
      path,
      (img) => {
        tutorialGifs[s] = img;
      },
      () => {
        // Skip if files not found
      }
    );
  }

  for (let key in hintGifPaths) {
    let k = key;
    loadImage(
      hintGifPaths[k],
      (img) => {
        hintGifs[k] = img;
      },
      () => {
        // Skip if missing
      }
    );
  }
}

function loadAmbienceSounds() {
  let soundPaths = [
    "sounds/computer_lab_ambience_1_compressed.mp3",
    "sounds/space_ambience_1_compressed.mp3",
    "sounds/space_ambience_2_compressed.mp3",
  ];

  for (let path of soundPaths) {
    ambienceSounds.push(loadSound(path));
  }
}

// ---
// Utility Functions
// ---

function drawJarvisGlass(x, y, w, h, r, isOverlay = false) {
  let glassOpacity = isOverlay ? 22 : 14;

  // Frosted Glass - use pre-blurred background
  drawingContext.save();
  drawingContext.beginPath();
  roundRectanglePath(drawingContext, x, y, w, h, r);
  drawingContext.clip();
  image(blurredTerrainGraphic, 0, 0); // Draw stored/cached blur

  // Base frost tint
  noStroke();
  fill(0, 130, 210, 18);
  rect(x, y, w, h, r);
  drawingContext.restore();

  // Glass body
  noStroke();
  fill(0, 80, 160, glassOpacity);
  rect(x, y, w, h, r);

  // Cyan glow border
  noFill();
  stroke(0, 200, 255, 55);
  strokeWeight(1);
  rect(x, y, w, h, r);

  // Top edge inner highlight
  stroke(100, 230, 255, 28);
  strokeWeight(0.5);
  line(x + r + 1, y + 1, x + w - r - 1, y + 1);
  noStroke();
}

function drawPanelBorder(x, y, borderWidth, borderHeight, borderRadius) {
  noFill();
  stroke(isDarkMode ? [0, 150, 230, 30] : [0, 100, 180, 80]);
  strokeWeight(1);
  rect(x, y, borderWidth, borderHeight, borderRadius);
  noStroke();
}

function drawCornerBraces(rx, ry, rw, rh, bracePad, braceLen, braceOpacity) {
  let x1 = rx - bracePad; // left edge
  let y1 = ry - bracePad; // top edge
  let x2 = rx + rw + bracePad; // right edge
  let y2 = ry + rh + bracePad; // bottom edge

  noFill();
  stroke(
    isDarkMode ? [0, 200, 255, braceOpacity] : [0, 100, 180, braceOpacity]
  );
  strokeWeight(1.5);

  // Top-left corner
  line(x1, y1 + braceLen, x1, y1);
  line(x1, y1, x1 + braceLen, y1);

  // Top-right corner
  line(x2 - braceLen, y1, x2, y1);
  line(x2, y1, x2, y1 + braceLen);

  // Bottom-left corner
  line(x1, y2 - braceLen, x1, y2);
  line(x1, y2, x1 + braceLen, y2);

  // Bottom-right corner
  line(x2 - braceLen, y2, x2, y2);
  line(x2, y2 - braceLen, x2, y2);

  noStroke();
}

function drawGlassCircleBtn(x, y, r, isHovered, label, customTooltipID = null) {
  // if (isHovered && !customTooltipID) {
  //   registerTooltip(
  //     "circleBtn_" + label,
  //     label === "▶" ? "Resume simulation" : "Pause simulation",
  //     label === "?" ? "Restart tutorial" : "Restart tutorial",
  //     label === "➜]" ? "Return to Start Menu" : "Return to Start Menu",
  //     x,
  //     y + r + 35
  //   );
  // }

  push();

  // Frosted Glass circle
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.clip();
  image(blurredTerrainGraphic, 0, 0);

  noStroke();
  fill(isHovered ? [0, 170, 255, 58] : [0, 130, 210, 48]); // 28, 18
  circle(x, y, r * 2);
  drawingContext.restore();

  noStroke();
  fill(isHovered ? [0, 100, 200, 52] : [0, 80, 160, 44]); // 52, 14
  circle(x, y, r * 2);

  noFill();
  stroke(isHovered ? [0, 220, 255, 100] : [0, 200, 255, 55]);
  strokeWeight(1);
  circle(x, y, r * 2);

  noStroke();
  fill(isHovered ? [180, 230, 255, 500] : [130, 210, 255, 300]);
  textSize(11);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(label, x, y);

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
  noStroke();
  pop();
}

function drawBezierConnection(
  x1,
  y1,
  x2,
  y2,
  connectionColour,
  connectionWeight
) {
  // Perpendicular offset creates a gentle arc
  let mx = (x1 + x2) / 2;
  let my = (y1 + y2) / 2;
  let dx = x2 - x1;
  let dy = y2 - y1;
  let cpX = mx - dy * 0.12; // control point offset
  let cpY = my + dx * 0.12;

  stroke(connectionColour);
  strokeWeight(connectionWeight);
  noFill();

  bezier(x1, y1, cpX, cpY, cpX, cpY, x2, y2);
}

// Add a rounded rect path to a 2D context
function roundRectanglePath(context, x, y, w, h, r) {
  context.moveTo(x + r, y);
  context.lineTo(x + w - r, y);
  context.arcTo(x + w, y, x + w, y + r, r);
  context.lineTo(x + w, y + h - r);
  context.arcTo(x + w, y + h, x + w - r, y + h, r);
  context.lineTo(x + r, y + h);
  context.arcTo(x, y + h, x, y + h - r, r);
  context.lineTo(x, y + r);
  context.arcTo(x, y, x + r, y, r);
}

function updateCursorStyle() {
  if (draggedNode !== null) {
    cursor("grabbing");
    return;
  }

  if (isSidebarDragging) {
    cursor("grabbing");
    return;
  }

  if (programState !== "simulation") {
    cursor(ARROW);
    return;
  }

  // Show hand cursor while in interact mode and if mouse pointer is near a node on the canvas
  let nearNode = false;
  let grabRadiusSquare = 30 * 30; // 900

  for (let node of nodes) {
    let distanceSquare =
      (mouseX - node.x) * (mouseX - node.x) +
      (mouseY - node.y) * (mouseY - node.y);

    if (distanceSquare < grabRadiusSquare) {
      nearNode = true;
      break;
    }
  }

  isSpawnMode = !nearNode;
  cursor(nearNode ? "grab" : ARROW);
}

/* Registers a tooltip to display close to the provided coordinates after a short hover delay. Only one tooltip is active each frame and toolTipID must be unique for each UI element in order to correctly reset the timer.
 */
function registerTooltip(toolTipID, text, toolTipX, toolTipY) {
  if (toolTipID !== tooltipPrevID) {
    tooltipTimer = 0;
    tooltipPrevID = toolTipID;
  }

  tooltipID = toolTipID;
  tooltipText = text;
  tooltipDrawX = toolTipX;
  tooltipDrawY = toolTipY;
  tooltipTimer++;
}

/* Dynamically calculates how many more nodes can be spawned based on the current population's total energy cost. High-cost and computationally expensive behaviours like weave significantly reduce the effective cap compared to lower-cost ones. It returns the effective max node count for the currently selected DNA profile.
 */
function getEffectiveNodeCap() {
  let totalEnergyCost = 0;
  for (let node of nodes) {
    totalEnergyCost += behaviourEnergyRatings[node.behaviour] || 1;
  }

  // Total system capacity
  let energyBudget = maxNodeCap * 3;
  let remainingBudget = max(0, energyBudget - totalEnergyCost);

  // Cost of the currently selected DNA
  let currentDnaCost = 1;
  if (currentDNA && currentDNA.behaviour) {
    currentDnaCost = behaviourEnergyRatings[currentDNA.behaviour] || 1;
  }

  // How many more of this species can be spawned?
  let maxAdditional = floor(remainingBudget / currentDnaCost);

  // Effective cap = current nodes + how many more can be spawned
  let effectiveCap = nodes.length + maxAdditional;

  // Enforce the maxNodeCap
  return min(effectiveCap, maxNodeCap);
}

function getAbsoluteMaxForSpecies() {
  let energyBudget = maxNodeCap * 3;
  let cost = behaviourEnergyRatings[currentDNA.behaviour] || 1;
  let theoreticalMax = floor(energyBudget / cost);

  return min(theoreticalMax, maxNodeCap);
}

/* Removes any colony group from the colonyGroups array that have no remaining nodes. This function is called when nodes are deleted to keep the colony group register array clean.
 */
function cleanupEmptyColonyGroups() {
  // Make a new array of all the group IDs that nodes are currently using
  let activeGroupIDs = nodes.map((node) => String(node.colonyGroupID));

  for (let groupID in colonyGroups) {
    // If the current groupID isn't in the active array, it is empty and can be deleted
    if (!activeGroupIDs.includes(groupID)) {
      delete colonyGroups[groupID];
    }
  }
}

// Check node radius collisions avoiding sqrt functions to save cpu
function checkHoverCircle(px, py, cx, cy, r) {
  return (px - cx) * (px - cx) + (py - cy) * (py - cy) < r * r;
}

function showNotification(message, severity = "info", position = "top") {
  manageNotifications.add(message, severity, position);
}

function toggleLightDark() {
  isDarkMode = !isDarkMode;
  updateTerrain();

  if (isDarkMode) {
    showNotification("Dark Mode Enabled", "info");
  } else {
    showNotification("Light Mode Enabled", "info");
  }
}

function refreshNodeCounts() {
  for (let dnaEntry of savedNodeTypes) {
    dnaEntry.count = nodes.filter(
      (n) => n.dnaString === dnaEntry.dna.dnaString
    ).length;
  }
}

// ---
// Spare Code
// ---

// Examples
// showNotification("U spawned a node! Yay :D", "success");
// showNotification("Too many nodes lol, feel the lag", "warning");
// showNotification("Dark Mode Enabled", "info");
// showNotification("Species Extinct", "error");

// Change notification position examples
// showNotification("High levels of lag detected", "warning", "top");
// showNotification("Snapshot exported!", "success", "bottom"); // cool feature?? probs not for exhibition

// function drawVisualisePanel() {
//   if (!isVisualiseOpen) {
//     return;
//   }

//   // Centre the popup
//   visualiseX = (sidebarX + sidebarWidth + width) / 2 - visualiseWidth / 2;
//   visualiseY = height / 2 - visualiseHeight / 2;

//   let px = visualiseX;
//   let py = visualiseY;
//   let pw = visualiseWidth;
//   let ph = visualiseHeight;
//   let pad = 14;

//   // Glassmorphism
//   drawJarvisGlass(px, py, pw, ph, 12, true);
//   drawCornerBraces(px, py, pw, ph, 5, 14, 55);

//   // Title bar
//   noStroke();
//   fill(isDarkMode ? [220, 228, 255, 220] : [20, 22, 40, 210]);
//   textSize(11);
//   textStyle(BOLD);
//   textAlign(LEFT, CENTER);
//   text("Visualise Alterations - " + currentDNA.speciesName, px + pad, py + 16);

//   // Close X button
//   let closeX = px + pw - 20;
//   let closeY = py + 10;
//   let closeHovered = dist(mouseX, mouseY, closeX + 5, closeY + 5) < 10;

//   noStroke();
//   fill(
//     isDarkMode
//       ? [150, 100, 100, closeHovered ? 150 : 100]
//       : [160, 70, 70, closeHovered ? 160 : 120]
//   );
//   circle(closeX + 5, closeY + 5, 18);

//   fill(isDarkMode ? [240, 240, 255, 220] : [255, 255, 255, 240]);
//   textSize(9);
//   textStyle(BOLD);
//   textAlign(CENTER, CENTER);
//   text("✖", closeX + 5, closeY + 5);

//   // Divider line below title
//   stroke(isDarkMode ? [140, 155, 200, 60] : [180, 185, 210, 80]);
//   strokeWeight(1);
//   line(px + pad, py + 30, px + pw - pad, py + 30); // 26, 28, 30
//   noStroke();
// }

// function limitTextLength() {
//   let textStringTempValue = textString;
//   if (textStringTempValue.length > dnaStringMaxLength) {
//     textString(textStringTempValue.slice(0, dnaStringMaxLength));
//     showNotification("Max DNA character count reached", "warning");
//   }
// }
