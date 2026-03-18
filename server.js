const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 10e6 });

app.use(express.static(path.join(__dirname, 'public')));

// ── Card Data ────────────────────────────────────────────────────────────────

const PROMPT_CARDS = [
  { id:'l01', name:'Studio Lighting', category:'lighting', desc:'Clean, even illumination with controlled shadows' },
  { id:'l02', name:'Neon Glow', category:'lighting', desc:'Vibrant colored neon light casting electric hues' },
  { id:'l03', name:'Golden Hour', category:'lighting', desc:'Warm, low-angle sunlight with long shadows' },
  { id:'l04', name:'Dramatic Shadow', category:'lighting', desc:'High contrast with deep, moody shadows' },
  { id:'l05', name:'Rim Light', category:'lighting', desc:'Bright edge lighting that outlines the form' },
  { id:'l06', name:'Soft Diffused', category:'lighting', desc:'Gentle, even light with minimal shadows' },
  { id:'l07', name:'Backlit Silhouette', category:'lighting', desc:'Strong light from behind creating dark outlines' },
  { id:'l08', name:'Candlelight', category:'lighting', desc:'Warm, flickering glow with intimate atmosphere' },
  { id:'l09', name:'Overcast', category:'lighting', desc:'Flat, even daylight through cloud cover' },
  { id:'l10', name:'Spotlight', category:'lighting', desc:'Single focused beam on the subject' },
  { id:'l11', name:'Volumetric Fog', category:'lighting', desc:'Visible light rays cutting through haze' },
  { id:'l12', name:'Sunset Gradient', category:'lighting', desc:'Sky painted in warm oranges and purples' },
  { id:'l13', name:'Moonlit', category:'lighting', desc:'Cool, pale blue light in darkness' },
  { id:'l14', name:'Industrial Fluorescent', category:'lighting', desc:'Harsh overhead tube lighting, slightly green' },
  { id:'l15', name:'RGB Gaming', category:'lighting', desc:'Multi-colored LED light show' },
  { id:'l16', name:'Underwater Caustics', category:'lighting', desc:'Rippling light patterns through water' },
  { id:'l17', name:'Flash Photography', category:'lighting', desc:'Harsh direct flash with hard shadows' },
  { id:'l18', name:'Campfire', category:'lighting', desc:'Warm orange glow from below with dancing shadows' },
  { id:'l19', name:'Bioluminescent', category:'lighting', desc:'Eerie organic glow in darkness' },
  { id:'l20', name:'Eclipse', category:'lighting', desc:'Corona of light around a dark center' },
  { id:'s01', name:'Cyberpunk', category:'style', desc:'Neon-soaked dystopian futurism' },
  { id:'s02', name:'Minimalist', category:'style', desc:'Stripped to essentials, nothing extra' },
  { id:'s03', name:'Retro 80s', category:'style', desc:'Synthwave pastels and chrome' },
  { id:'s04', name:'Photorealistic', category:'style', desc:'Indistinguishable from a real photograph' },
  { id:'s05', name:'Clay Render', category:'style', desc:'Matte grey material study, no textures' },
  { id:'s06', name:'Wireframe', category:'style', desc:'Visible mesh structure, no surfaces' },
  { id:'s07', name:'Vaporwave', category:'style', desc:'Pastel gradients, Greek busts, retro tech' },
  { id:'s08', name:'Art Deco', category:'style', desc:'Geometric luxury from the 1920s' },
  { id:'s09', name:'Bauhaus', category:'style', desc:'Primary colors, geometric forms, functional beauty' },
  { id:'s10', name:'Brutalist', category:'style', desc:'Raw concrete, massive forms, no decoration' },
  { id:'s11', name:'Japanese Zen', category:'style', desc:'Wabi-sabi simplicity, natural imperfection' },
  { id:'s12', name:'Steampunk', category:'style', desc:'Victorian machinery meets brass and gears' },
  { id:'s13', name:'Y2K', category:'style', desc:'Shiny chrome, bubble shapes, early internet energy' },
  { id:'s14', name:'Memphis Design', category:'style', desc:'Bold patterns, clashing colors, squiggly shapes' },
  { id:'s15', name:'Swiss Typography', category:'style', desc:'Grid-perfect, Helvetica-clean precision' },
  { id:'s16', name:'Glitch Art', category:'style', desc:'Digital corruption, broken pixels, data decay' },
  { id:'s17', name:'Low Poly', category:'style', desc:'Faceted surfaces, visible polygons, game aesthetic' },
  { id:'s18', name:'Isometric', category:'style', desc:'30-degree angled technical illustration' },
  { id:'s19', name:'Film Noir', category:'style', desc:'Black and white, venetian blind shadows' },
  { id:'s20', name:'Pop Art', category:'style', desc:'Bold outlines, halftone dots, Warhol colors' },
  { id:'m01', name:'Chrome', category:'material', desc:'Mirror-polished reflective metal' },
  { id:'m02', name:'Matte Black', category:'material', desc:'Light-absorbing, velvety dark finish' },
  { id:'m03', name:'Frosted Glass', category:'material', desc:'Semi-transparent with soft diffusion' },
  { id:'m04', name:'Leather', category:'material', desc:'Rich, textured hide with visible grain' },
  { id:'m05', name:'Carbon Fiber', category:'material', desc:'Woven high-tech composite pattern' },
  { id:'m06', name:'Brushed Aluminum', category:'material', desc:'Directional scratches on soft metal' },
  { id:'m07', name:'Marble', category:'material', desc:'Polished stone with dramatic veining' },
  { id:'m08', name:'Wood Grain', category:'material', desc:'Natural timber with visible rings and texture' },
  { id:'m09', name:'Concrete', category:'material', desc:'Raw cement with aggregate and imperfections' },
  { id:'m10', name:'Ceramic', category:'material', desc:'Smooth, glazed pottery finish' },
  { id:'m11', name:'Velvet', category:'material', desc:'Soft, plush fabric that catches light' },
  { id:'m12', name:'Translucent Resin', category:'material', desc:'See-through plastic with color depth' },
  { id:'m13', name:'Hammered Copper', category:'material', desc:'Dimpled warm metal with patina' },
  { id:'m14', name:'Woven Textile', category:'material', desc:'Visible thread pattern and texture' },
  { id:'m15', name:'Rubber', category:'material', desc:'Matte, grippy, slightly soft surface' },
  { id:'m16', name:'Gold Leaf', category:'material', desc:'Thin sheets of precious metal, ornate' },
  { id:'m17', name:'Sandstone', category:'material', desc:'Rough, warm, granular natural stone' },
  { id:'m18', name:'Iridescent', category:'material', desc:'Color-shifting rainbow surface' },
  { id:'m19', name:'Cork', category:'material', desc:'Natural, warm, porous tree bark' },
  { id:'m20', name:'Titanium', category:'material', desc:'Lightweight aerospace metal, subtle blue tint' },
  { id:'c01', name:"Bird's Eye", category:'camera', desc:'Looking straight down from above' },
  { id:'c02', name:'Macro Close-up', category:'camera', desc:'Extreme detail, filling the frame' },
  { id:'c03', name:'Exploded View', category:'camera', desc:'Parts separated and floating in space' },
  { id:'c04', name:'Hero Shot', category:'camera', desc:'Low angle, dramatic, powerful framing' },
  { id:'c05', name:'3/4 Angle', category:'camera', desc:'Classic product photography perspective' },
  { id:'c06', name:'Dutch Angle', category:'camera', desc:'Tilted camera for tension and unease' },
  { id:'c07', name:'Eye Level', category:'camera', desc:'Straight-on human perspective' },
  { id:'c08', name:"Worm's Eye", category:'camera', desc:'Looking up from the ground' },
  { id:'c09', name:'Over-the-shoulder', category:'camera', desc:'Framed past a foreground element' },
  { id:'c10', name:'Panoramic', category:'camera', desc:'Ultra-wide environmental context' },
  { id:'c11', name:'Fisheye', category:'camera', desc:'Extreme wide-angle barrel distortion' },
  { id:'c12', name:'Tilt Shift', category:'camera', desc:'Miniature effect with selective focus' },
  { id:'c13', name:'Flat Lay', category:'camera', desc:'Arranged objects shot from directly above' },
  { id:'c14', name:'Cross Section', category:'camera', desc:'Cut away to reveal internals' },
  { id:'c15', name:'Floating / Zero-G', category:'camera', desc:'Object suspended weightlessly in space' },
  { id:'c16', name:'Depth of Field', category:'camera', desc:'Sharp subject, beautifully blurred background' },
  { id:'c17', name:'Motion Blur', category:'camera', desc:'Speed and movement captured in streaks' },
  { id:'c18', name:'Symmetrical', category:'camera', desc:'Perfect bilateral symmetry, centered' },
  { id:'c19', name:'Reflection Shot', category:'camera', desc:'Subject mirrored in a reflective surface' },
  { id:'c20', name:'First Person', category:'camera', desc:'From the user\u2019s hands/perspective' },
  { id:'p01', name:'Monochrome', category:'palette', desc:'Single color in various tones and shades' },
  { id:'p02', name:'Earth Tones', category:'palette', desc:'Warm browns, tans, olive, terracotta' },
  { id:'p03', name:'Neon Brights', category:'palette', desc:'Electric, eye-searing vivid colors' },
  { id:'p04', name:'Pastel Dream', category:'palette', desc:'Soft, muted, candy-like pastels' },
  { id:'p05', name:'Black & Gold', category:'palette', desc:'Luxurious dark base with gold accents' },
  { id:'p06', name:'Ice Blue', category:'palette', desc:'Cool, frosty, crystalline blue spectrum' },
  { id:'p07', name:'Sunset Warm', category:'palette', desc:'Oranges, corals, and warm pinks' },
  { id:'p08', name:'Forest Green', category:'palette', desc:'Deep greens with mossy, natural tones' },
  { id:'p09', name:'Candy Pop', category:'palette', desc:'Bright pinks, teals, yellows \u2014 sugar rush' },
  { id:'p10', name:'Grayscale + One', category:'palette', desc:'All grey except one vivid accent color' },
  { id:'p11', name:'Ocean Gradient', category:'palette', desc:'Deep navy to turquoise to seafoam' },
  { id:'p12', name:'Rust & Teal', category:'palette', desc:'Complementary warmth and coolness' },
  { id:'p13', name:'Lavender Haze', category:'palette', desc:'Soft purples and lilacs, dreamy' },
  { id:'p14', name:'High Contrast B&W', category:'palette', desc:'Pure black and white, no grey' },
  { id:'p15', name:'Holographic', category:'palette', desc:'Shifting rainbow iridescence' },
  { id:'e01', name:'Floating in Space', category:'environment', desc:'Zero gravity among stars and nebulae' },
  { id:'e02', name:'Desert Dunes', category:'environment', desc:'Endless sand under a blazing sky' },
  { id:'e03', name:'Urban Rooftop', category:'environment', desc:'City skyline at dusk backdrop' },
  { id:'e04', name:'Gallery Pedestal', category:'environment', desc:'White museum display with spot lighting' },
  { id:'e05', name:'Underwater', category:'environment', desc:'Submerged with bubbles and blue depth' },
  { id:'e06', name:'Foggy Forest', category:'environment', desc:'Misty trees with filtered light' },
  { id:'e07', name:'Neon City Street', category:'environment', desc:'Rain-slicked road with neon reflections' },
  { id:'e08', name:'Volcanic', category:'environment', desc:'Molten lava and cracked obsidian' },
  { id:'e09', name:'Arctic Ice', category:'environment', desc:'Frozen landscape of blue-white ice' },
  { id:'e10', name:'Abstract Void', category:'environment', desc:'Pure gradient background, no scene' },
  { id:'e11', name:'Living Room', category:'environment', desc:'Cozy domestic interior setting' },
  { id:'e12', name:'Workshop Bench', category:'environment', desc:'Tools and wood shavings, maker space' },
  { id:'e13', name:'Runway Stage', category:'environment', desc:'Fashion show catwalk with spotlights' },
  { id:'e14', name:'Museum Display', category:'environment', desc:'Glass case with dramatic lighting' },
  { id:'e15', name:'Overgrown Ruins', category:'environment', desc:'Nature reclaiming old architecture' },
  { id:'d01', name:'Cozy', category:'mood', desc:'Warm, comfortable, inviting feeling' },
  { id:'d02', name:'Aggressive', category:'mood', desc:'Sharp, intense, powerful energy' },
  { id:'d03', name:'Ethereal', category:'mood', desc:'Dreamlike, otherworldly, floating' },
  { id:'d04', name:'Playful', category:'mood', desc:'Fun, energetic, slightly silly' },
  { id:'d05', name:'Luxurious', category:'mood', desc:'Premium, expensive, aspirational' },
  { id:'d06', name:'Dystopian', category:'mood', desc:'Dark, decaying, ominous future' },
  { id:'d07', name:'Nostalgic', category:'mood', desc:'Warm memory, vintage charm' },
  { id:'d08', name:'Futuristic', category:'mood', desc:'Sleek, advanced, tomorrow\u2019s world' },
  { id:'d09', name:'Raw / Unfinished', category:'mood', desc:'Exposed, rough, work in progress' },
  { id:'d10', name:'Mysterious', category:'mood', desc:'Hidden, shadowy, questions unanswered' },
];

const PRODUCT_CARDS = [
  // ── Automotive ──
  { id:'pr01', name:'Sports Car', category:'automotive', desc:'A sleek, high-performance two-seater', img:'photo-1503376780353-7e6692767b70' },
  { id:'pr02', name:'Electric SUV', category:'automotive', desc:'Modern family hauler, zero emissions', img:'photo-1619767886558-efdc259cde1a' },
  { id:'pr03', name:'Motorcycle', category:'automotive', desc:'Two-wheeled freedom machine', img:'photo-1558981806-ec527fa84c39' },
  { id:'pr04', name:'Pickup Truck', category:'automotive', desc:'Rugged workhorse with open bed', img:'photo-1559416523-140ddc3d238c' },
  { id:'pr05', name:'Formula 1 Car', category:'automotive', desc:'Open-wheel racing at 200mph', img:'photo-1541348263662-e068662d82af' },
  { id:'pr06', name:'Classic Muscle Car', category:'automotive', desc:'American V8 power, vintage style', img:'photo-1514316703755-dca7d7d9d882' },
  { id:'pr07', name:'Delivery Van', category:'automotive', desc:'Last-mile logistics vehicle', img:'photo-1566576912321-d58ddd7a6088' },
  { id:'pr08', name:'Concept Hypercar', category:'automotive', desc:'Boundary-pushing automotive art', img:'photo-1544829099-b9a0c07fad1a' },
  // ── Electronics ──
  { id:'pr09', name:'Wireless Earbuds', category:'electronics', desc:'True wireless audio in a tiny package', img:'photo-1606220588913-b3aacb4d2f46' },
  { id:'pr10', name:'Smart Watch', category:'electronics', desc:'Wrist-worn computer and health tracker', img:'photo-1579586337278-3befd40fd17a' },
  { id:'pr11', name:'Gaming Controller', category:'electronics', desc:'Precision input for digital worlds', img:'photo-1600080972464-8e5f35f63d08' },
  { id:'pr12', name:'Portable Speaker', category:'electronics', desc:'Music anywhere, waterproof and loud', img:'photo-1608043152269-423dbba4e7e1' },
  { id:'pr13', name:'Drone', category:'electronics', desc:'Flying camera with autonomous navigation', img:'photo-1507582020474-9a35b7d455d9' },
  { id:'pr14', name:'VR Headset', category:'electronics', desc:'Gateway to virtual reality', img:'photo-1622979135225-d2ba269cf1ac' },
  { id:'pr15', name:'Mechanical Keyboard', category:'electronics', desc:'Tactile typing with custom switches', img:'photo-1618384887929-16ec33fab9ef' },
  { id:'pr16', name:'Action Camera', category:'electronics', desc:'Tiny, tough, captures everything', img:'photo-1526170375885-4d8ecf77b99f' },
  // ── Fashion ──
  { id:'pr17', name:'Running Shoe', category:'fashion', desc:'Engineered for speed and comfort', img:'photo-1542291026-7eec264c27ff' },
  { id:'pr18', name:'High-top Sneaker', category:'fashion', desc:'Street style, ankle support', img:'photo-1600269452121-4f2416e55c28' },
  { id:'pr19', name:'Sunglasses', category:'fashion', desc:'UV protection meets face architecture', img:'photo-1511499767150-a48a237f0083' },
  { id:'pr20', name:'Backpack', category:'fashion', desc:'Daily carry, designed for everything', img:'photo-1553062407-98eeb64c6a62' },
  { id:'pr21', name:'Luxury Wristwatch', category:'fashion', desc:'Timekeeping as art and status', img:'photo-1587836374828-4dbafa94cf0e' },
  { id:'pr22', name:'Hiking Boot', category:'fashion', desc:'Trail-ready with ankle support', img:'photo-1520639888713-7851133b1ed0' },
  { id:'pr23', name:'Handbag', category:'fashion', desc:'Structured carry with style', img:'photo-1584917865442-de89df76afd3' },
  { id:'pr24', name:'Baseball Cap', category:'fashion', desc:'Casual headwear, infinite customization', img:'photo-1588850561407-ed78c334e67a' },
  // ── Furniture ──
  { id:'pr25', name:'Office Chair', category:'furniture', desc:'Ergonomic seating for the daily grind', img:'photo-1580480055273-228ff5388ef8' },
  { id:'pr26', name:'Table Lamp', category:'furniture', desc:'Sculptural light for any surface', img:'photo-1507473885765-e6ed057ab89c' },
  { id:'pr27', name:'Coffee Table', category:'furniture', desc:'Living room centerpiece', img:'photo-1532372576444-dda954194ad0' },
  { id:'pr28', name:'Bookshelf', category:'furniture', desc:'Storage meets display', img:'photo-1507842217343-583bb7270b66' },
  { id:'pr29', name:'Lounge Chair', category:'furniture', desc:'The ultimate seat for relaxation', img:'photo-1555041469-a586c61ea9bc' },
  { id:'pr30', name:'Standing Desk', category:'furniture', desc:'Sit-stand productivity station', img:'photo-1593642632559-0c6d3fc62b89' },
  // ── Sports ──
  { id:'pr31', name:'Bicycle', category:'sports', desc:'Human-powered two-wheeled transport', img:'photo-1532298229144-0ec0c57515c7' },
  { id:'pr32', name:'Skateboard', category:'sports', desc:'Four wheels, infinite tricks', img:'photo-1547447134-cd3f5c716030' },
  { id:'pr33', name:'Tennis Racket', category:'sports', desc:'Precision string and frame engineering', img:'photo-1622279457486-62dcc4a431d6' },
  { id:'pr34', name:'Helmet', category:'sports', desc:'Head protection with aerodynamic design', img:'photo-1557862921-37829c790f19' },
  { id:'pr35', name:'Golf Club', category:'sports', desc:'Precision-engineered for the perfect swing', img:'photo-1535131749006-b7f58c99034b' },
  { id:'pr36', name:'Surfboard', category:'sports', desc:'Wave-riding hydrodynamic craft', img:'photo-1531722569936-825d3dd91b15' },
  // ── Kitchen ──
  { id:'pr37', name:'Blender', category:'kitchen', desc:'High-speed food processing power', img:'photo-1570222094114-d054a817e56b' },
  { id:'pr38', name:'Coffee Machine', category:'kitchen', desc:'Caffeine delivery system, beautifully', img:'photo-1517668808822-9ebb02f2a0e6' },
  { id:'pr39', name:'Toaster', category:'kitchen', desc:'Simple appliance, surprisingly designable', img:'photo-1585659722983-3a675dabf23c' },
  { id:'pr40', name:'Water Bottle', category:'kitchen', desc:'Hydration vessel, endlessly redesigned', img:'photo-1602143407151-7111542de6e8' },
  { id:'pr41', name:'Candle Holder', category:'kitchen', desc:'Ambient light meets sculptural form', img:'photo-1602523961358-f9f03c553485' },
  { id:'pr42', name:'Knife Set', category:'kitchen', desc:'Chef\u2019s precision tools with block', img:'photo-1593618998160-e34014e67546' },
  // ── Tools ──
  { id:'pr43', name:'Power Drill', category:'tools', desc:'Cordless torque for every project', img:'photo-1504148455328-c376907d081c' },
  { id:'pr44', name:'Stethoscope', category:'tools', desc:'Iconic medical listening device', img:'photo-1584515933487-779824d29309' },
  { id:'pr45', name:'Soldering Iron', category:'tools', desc:'Precision heat for electronics work', img:'photo-1563770557-3e47f2e3fcfe' },
  { id:'pr46', name:'Microscope', category:'tools', desc:'Revealing the invisible world', img:'photo-1516339901601-2e1b62dc0c45' },
  { id:'pr47', name:'Prosthetic Hand', category:'tools', desc:'Engineering meets human restoration', img:'photo-1485827404703-89b55fcc595e' },
  { id:'pr48', name:'Safety Goggles', category:'tools', desc:'Eye protection with clear vision', img:'photo-1504439904031-93ded9f93e4e' },
  // ── Gaming ──
  { id:'pr49', name:'Gaming Mouse', category:'gaming', desc:'Precision tracking, RGB everything', img:'photo-1527814050087-3793815479db' },
  { id:'pr50', name:'Toy Robot', category:'gaming', desc:'Playful mechanical companion', img:'photo-1535378917042-10a22c95931a' },
  { id:'pr51', name:'Chess Set', category:'gaming', desc:'Ancient strategy in physical form', img:'photo-1586165368502-1bad197a6461' },
  { id:'pr52', name:'RC Car', category:'gaming', desc:'Miniature speed machine', img:'photo-1581235707960-56fbbb0c7c5a' },
  { id:'pr53', name:'Action Figurine', category:'gaming', desc:'Poseable character collectible', img:'photo-1608889825205-eebdb9fc5806' },
  { id:'pr54', name:'Puzzle Cube', category:'gaming', desc:'3D mechanical brain teaser', img:'photo-1577401239170-897942555fb3' },
  // ── Musical ──
  { id:'pr55', name:'Electric Guitar', category:'musical', desc:'Six strings of sonic possibility', img:'photo-1510915361894-db8b60106cb1' },
  { id:'pr56', name:'Synthesizer', category:'musical', desc:'Electronic sound design machine', img:'photo-1598488035139-bdbb2231ce04' },
  { id:'pr57', name:'Studio Headphones', category:'musical', desc:'Reference audio, over-ear comfort', img:'photo-1583394838336-acd977736f90' },
  { id:'pr58', name:'Turntable', category:'musical', desc:'Vinyl playback, analog warmth', img:'photo-1539375665275-f0ff21b27e18' },
  // ── Wild ──
  { id:'w01', name:"Player's Choice", category:'wild', desc:'You pick any product you want!' },
  { id:'w02', name:'Ask the Judge', category:'wild', desc:'The judge names the product' },
  { id:'w03', name:'Remix', category:'wild', desc:'Use last round\u2019s product again' },
  { id:'w04', name:'Mashup', category:'wild', desc:'Combine any two products into one' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
function makeCode() {
  let code = '';
  for (let i = 0; i < 4; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const AVATAR_COLORS = ['#8b5cf6','#ec4899','#f59e0b','#22c55e','#3b82f6','#ef4444','#06b6d4','#f97316'];
const ANIMAL_AVATARS = ['🐱','🐻','🦊','🐸','🐼','🐨','🦁','🐯'];

function pickAvatar(room) {
  const used = room.players.map(p => p.avatar);
  const available = ANIMAL_AVATARS.filter(a => !used.includes(a));
  if (available.length === 0) return ANIMAL_AVATARS[Math.floor(Math.random() * ANIMAL_AVATARS.length)];
  return available[Math.floor(Math.random() * available.length)];
}

const CATEGORY_ICONS = {
  automotive: '\u{1F3CE}', electronics: '\u{1F4F1}', fashion: '\u{1F45F}',
  furniture: '\u{1FA91}', sports: '\u{1F3C0}', kitchen: '\u{2615}',
  tools: '\u{1F527}', gaming: '\u{1F3AE}', musical: '\u{1F3B8}', wild: '\u{2728}',
};

// ── Rooms ────────────────────────────────────────────────────────────────────

const rooms = {};

function createRoom(hostSocket, name) {
  let code;
  do { code = makeCode(); } while (rooms[code]);

  const player = { id: hostSocket.id, name, color: AVATAR_COLORS[0], score: 0, avatar: ANIMAL_AVATARS[Math.floor(Math.random() * ANIMAL_AVATARS.length)] };
  rooms[code] = {
    code, players: [player], hostId: hostSocket.id,
    phase: 'lobby', round: 0, totalRounds: 0, judgeIndex: 0,
    currentProduct: null, promptDeck: [], productDeck: [],
    hands: {}, selections: {}, submissions: {},
    timerEnd: null, timerId: null, lastProduct: null, judgingOrder: [],
  };
  hostSocket.join(code);
  return rooms[code];
}

function findRoom(socketId) {
  return Object.values(rooms).find(r => r.players.some(p => p.id === socketId));
}

function dealHand(room, playerId) {
  const hand = [];
  for (let i = 0; i < 7; i++) {
    if (room.promptDeck.length === 0) room.promptDeck = shuffle(PROMPT_CARDS);
    hand.push(room.promptDeck.pop());
  }
  room.hands[playerId] = hand;
}

function startTimer(room, seconds, phase, onEnd) {
  if (room.timerId) clearInterval(room.timerId);
  room.timerEnd = Date.now() + seconds * 1000;
  room.timerId = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((room.timerEnd - Date.now()) / 1000));
    io.to(room.code).emit('timer-tick', { phase, remaining, total: seconds });
    if (remaining <= 0) {
      clearInterval(room.timerId);
      room.timerId = null;
      onEnd();
    }
  }, 250);
}

function stopTimer(room) {
  if (room.timerId) { clearInterval(room.timerId); room.timerId = null; }
}

function startRound(room) {
  room.round++;
  room.selections = {};
  room.submissions = {};
  room.judgingOrder = [];
  room.soloMode = room.players.length === 1;

  if (room.productDeck.length === 0) room.productDeck = shuffle(PRODUCT_CARDS);
  room.currentProduct = room.productDeck.pop();

  // In solo mode, no judge. In multiplayer, judge rotates.
  if (room.soloMode) {
    room.judgeIndex = -1;
  } else {
    room.judgeIndex = (room.round - 1) % room.players.length;
  }
  const judgeId = room.soloMode ? null : room.players[room.judgeIndex].id;

  room.hands = {};
  room.players.forEach(p => {
    if (p.id !== judgeId) dealHand(room, p.id);
  });

  room.phase = 'round-start';

  room.players.forEach(p => {
    io.to(p.id).emit('round-started', {
      round: room.round, totalRounds: room.totalRounds,
      product: room.currentProduct, judgeId,
      hand: room.hands[p.id] || null,
      players: room.players,
      soloMode: room.soloMode,
    });
  });

  setTimeout(() => {
    if (room.phase !== 'round-start') return;
    room.phase = 'card-selection';
    io.to(room.code).emit('phase-change', { phase: 'card-selection' });
    startTimer(room, 30, 'card-selection', () => {
      room.players.forEach(p => {
        if (p.id === judgeId || room.selections[p.id]) return;
        const hand = room.hands[p.id] || [];
        room.selections[p.id] = shuffle(hand).slice(0, 3);
        io.to(p.id).emit('auto-selected', { cards: room.selections[p.id] });
      });
      advanceToRendering(room);
    });
  }, 3500);
}

function advanceToRendering(room) {
  room.phase = 'rendering';
  io.to(room.code).emit('all-selected', { selections: room.selections });
  setTimeout(() => {
    io.to(room.code).emit('phase-change', { phase: 'rendering' });
    startTimer(room, 300, 'rendering', () => advanceToJudging(room));
  }, 2000);
}

function advanceToJudging(room) {
  stopTimer(room);

  // Solo mode: auto-win, skip judging
  if (room.soloMode) {
    const p = room.players[0];
    p.score++;
    room.lastProduct = room.currentProduct;
    io.to(room.code).emit('round-result', {
      winnerId: p.id, winnerName: p.name,
      scores: room.players.map(pl => ({ id: pl.id, name: pl.name, color: pl.color, score: pl.score })),
      round: room.round, totalRounds: room.totalRounds, soloMode: true,
    });
    room.phase = 'scoreboard';
    return;
  }

  room.phase = 'judging';

  const nonJudge = room.players.filter((_, i) => i !== room.judgeIndex);
  const shuffled = shuffle(nonJudge.map(p => ({
    playerId: p.id,
    image: room.submissions[p.id]?.image || null,
    cards: room.selections[p.id] || [],
  })));

  room.judgingOrder = shuffled.map(s => s.playerId);

  io.to(room.code).emit('judging-start', {
    submissions: shuffled.map((s, i) => ({
      index: i, image: s.image, cards: s.cards,
    })),
    judgeId: room.players[room.judgeIndex].id,
  });
}

// ── Socket Events ────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`+ ${socket.id}`);

  socket.on('create-room', ({ name }) => {
    const room = createRoom(socket, name);
    socket.emit('room-created', { code: room.code, players: room.players, you: socket.id });
  });

  socket.on('join-room', ({ code, name }) => {
    const room = rooms[code?.toUpperCase()];
    if (!room) return socket.emit('error-msg', { message: 'Room not found' });
    if (room.phase !== 'lobby') return socket.emit('error-msg', { message: 'Game already in progress' });
    if (room.players.length >= 4) return socket.emit('error-msg', { message: 'Room is full (max 4)' });
    if (room.players.some(p => p.name.toLowerCase() === name.toLowerCase()))
      return socket.emit('error-msg', { message: 'Name already taken' });

    const color = AVATAR_COLORS[room.players.length % AVATAR_COLORS.length];
    const avatar = pickAvatar(room);
    const player = { id: socket.id, name, color, score: 0, avatar };
    room.players.push(player);
    socket.join(room.code);
    socket.emit('room-joined', { code: room.code, players: room.players, you: socket.id, hostId: room.hostId });
    socket.to(room.code).emit('player-joined', { player, players: room.players });
  });

  socket.on('start-game', ({ rounds }) => {
    const room = findRoom(socket.id);
    if (!room || room.hostId !== socket.id) return;
    // Allow solo play for testing
    room.totalRounds = rounds || room.players.length;
    room.promptDeck = shuffle(PROMPT_CARDS);
    room.productDeck = shuffle(PRODUCT_CARDS);
    room.phase = 'playing';
    io.to(room.code).emit('game-started', { totalRounds: room.totalRounds });
    setTimeout(() => startRound(room), 1000);
  });

  socket.on('select-cards', ({ cardIds }) => {
    const room = findRoom(socket.id);
    if (!room || room.phase !== 'card-selection') return;
    if (!cardIds || cardIds.length !== 3) return;
    const hand = room.hands[socket.id] || [];
    const selected = hand.filter(c => cardIds.includes(c.id));
    if (selected.length !== 3) return;
    room.selections[socket.id] = selected;
    io.to(room.code).emit('player-selected', { playerId: socket.id });
    const judgeId = room.soloMode ? null : room.players[room.judgeIndex]?.id;
    if (room.players.every(p => p.id === judgeId || room.selections[p.id])) {
      stopTimer(room);
      advanceToRendering(room);
    }
  });

  socket.on('submit-render', ({ image }) => {
    const room = findRoom(socket.id);
    if (!room || room.phase !== 'rendering') return;
    room.submissions[socket.id] = { image };
    io.to(room.code).emit('player-submitted', { playerId: socket.id });
    const judgeId = room.soloMode ? null : room.players[room.judgeIndex]?.id;
    if (room.players.every(p => p.id === judgeId || room.submissions[p.id])) {
      advanceToJudging(room);
    }
  });

  socket.on('judge-pick', ({ index }) => {
    const room = findRoom(socket.id);
    if (!room || room.phase !== 'judging') return;
    if (socket.id !== room.players[room.judgeIndex].id) return;
    const winnerId = room.judgingOrder[index];
    if (!winnerId) return;
    const winner = room.players.find(p => p.id === winnerId);
    if (winner) winner.score++;
    room.lastProduct = room.currentProduct;
    io.to(room.code).emit('round-result', {
      winnerId, winnerName: winner?.name,
      scores: room.players.map(p => ({ id: p.id, name: p.name, color: p.color, score: p.score })),
      round: room.round, totalRounds: room.totalRounds,
    });
    room.phase = 'scoreboard';
  });

  socket.on('next-round', () => {
    const room = findRoom(socket.id);
    if (!room || room.hostId !== socket.id) return;
    if (room.round >= room.totalRounds) {
      room.phase = 'game-over';
      io.to(room.code).emit('game-over', {
        scores: room.players.map(p => ({ id: p.id, name: p.name, color: p.color, score: p.score })),
      });
    } else {
      startRound(room);
    }
  });

  socket.on('play-again', () => {
    const room = findRoom(socket.id);
    if (!room || room.hostId !== socket.id) return;
    room.players.forEach(p => p.score = 0);
    room.round = 0;
    room.phase = 'lobby';
    io.to(room.code).emit('back-to-lobby', { players: room.players });
  });

  socket.on('disconnect', () => {
    const room = findRoom(socket.id);
    if (!room) return;
    room.players = room.players.filter(p => p.id !== socket.id);
    if (room.players.length === 0) { stopTimer(room); delete rooms[room.code]; return; }
    if (room.hostId === socket.id) room.hostId = room.players[0].id;
    io.to(room.code).emit('player-left', { playerId: socket.id, players: room.players, hostId: room.hostId });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`\n  Render Royale \u2192 http://localhost:${PORT}\n`));
