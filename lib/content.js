export const WORLDS = [
  { id: 'berlin', flag: 'DE', name: 'Berlin', note: 'Where our story began', icon: 'tower', available: false },
  { id: 'egypt', flag: 'EG', name: 'Egypt', note: 'Our first adventure', icon: 'pyramid', available: false },
  { id: 'italy', flag: 'IT', name: 'Italia', note: 'Snow, pasta & a little chaos', icon: 'sun', available: true },
  { id: 'taiwan', flag: 'TW', name: 'Taiwan', note: 'A world closer to home', icon: 'cat', available: false },
  { id: 'tokyo', flag: 'JP', name: 'Tokyo', note: 'Bright lights, little memories', icon: 'train', available: false },
  { id: 'okinawa', flag: 'JP', name: 'Okinawa', note: 'Meet me by the sea', icon: 'shell', available: false }
];
export const CHAPTERS = [
  { id: 'snowman', title: 'Snowman Mania', subtitle: 'A snowball. A very big ambition.', zone: 'mountain', icon: 'snow', tint: '#dbe8e7', actor: 'yiting', goal: 'Roll your snowball through fresh snow. Dodge rocks and gather decorations.', controls: 'Drag left or right, or use ← →. Fresh snow grows your ball. Rocks shrink it.', memory: 'A slightly imperfect snowman, a perfectly good day.', unlock: 0, stages: 12 },
  { id: 'summit', title: 'Summit Sprint', subtitle: 'The view is worth the climb.', zone: 'mountain', icon: 'mountain', tint: '#e0e5d6', actor: 'yiting', goal: 'Climb the snowy trail, collect coins and reach the little red flag.', controls: 'Use the on-screen arrows to move and Jump to leap. Keyboard: ← → and Space.', memory: 'Cold hands. Blue skies. You beside me.', unlock: 1, stages: 12 },
  { id: 'drive', title: 'Snowbound Drive', subtitle: 'Let’s not park in the snow again.', zone: 'mountain', icon: 'car', tint: '#d8e3ec', actor: 'marco', goal: 'Drive through the mountain pass. Dodge snowdrifts and pick up coins.', controls: 'Drag the car left or right. If you get stuck, tap Push! to free the car.', memory: 'Our scenic route had a small snow-related complication.', unlock: 2, stages: 12 },
  { id: 'castle', title: 'Escape the Castle', subtitle: 'One rescue. Several unsolicited tips.', zone: 'rome', icon: 'key', tint: '#eaddd1', actor: 'marco', goal: 'Find the key, dodge the guards and reach Yiting’s cell.', controls: 'Move with ← → and jump with Space or the on-screen controls. Collect the golden key before reaching the cell.', memory: '“Marco, can you hurry up? Also, take a photo.”', unlock: 3, stages: 12 },
  { id: 'rowing', title: 'Row, Row, Rome', subtitle: 'Two oars. One questionable captain.', zone: 'rome', icon: 'boat', tint: '#d7e7dc', actor: 'both', goal: 'Row across the lake and keep your boat between the buoys.', controls: 'Tap the left and right oars alternately. Too much of one side turns the boat. Keyboard: A and D.', memory: 'A tiny boat, a quiet lake, our own little adventure.', unlock: 4, stages: 12 },
  { id: 'photo', title: 'Wait, Marco!', subtitle: 'The camera eats first.', zone: 'rome', icon: 'camera', tint: '#f2dfcb', actor: 'marco', goal: 'Catch coins, not dinner! A camera flash clears the food for a few seconds.', controls: 'Drag Marco left or right. Avoid falling food, collect coins and cameras.', memory: 'One more photo. Then you can eat. Promise.', unlock: 5, stages: 12 },
  { id: 'gelato', title: 'Gelato Tower', subtitle: 'Just one more scoop.', zone: 'south', icon: 'icecream', tint: '#efdcdf', actor: 'yiting', goal: 'Stack scoops on your cone. Keep the tower balanced as it grows.', controls: 'Move the cone by dragging. Line up under the falling scoops. A scoop caught off-center makes the tower wobble.', memory: 'There is always room for gelato.', unlock: 6, stages: 12 },
  { id: 'market', title: 'Mercato di Sicilia', subtitle: 'A basket full of possibilities.', zone: 'south', icon: 'basket', tint: '#e6e4c9', actor: 'yiting', goal: 'Find the ingredients on your list and fill your shopping basket.', controls: 'Tap matching ingredients. Check the list before choosing. Wrong items cost a little time.', memory: 'This market adventure is an imagined stop for our next trip.', unlock: 7, stages: 12 },
  { id: 'pasta', title: 'Pasta di Casa', subtitle: 'Made with love. And a little garlic.', zone: 'south', icon: 'fork', tint: '#efd9cf', actor: 'yiting', goal: 'Shop, chop, stir, cook and plate a little Italian dinner.', controls: 'Tap to chop, trace circles to stir, then stop the timer in the green zone. Arrange the ingredients and plate your dish.', memory: 'Your table. My recipes. Our dinner.', unlock: 8, stages: 12 },
  { id: 'date', title: 'Italian Date Night', subtitle: 'The best part was always you.', zone: 'finale', icon: 'heart', tint: '#e8d1ce', actor: 'both', goal: 'Choose an outfit, collect the last memories and open your Italy postcard.', controls: 'A quiet ending to your Italian adventure.', memory: 'Every detour was worth it, because we took it together.', unlock: 9, stages: 1 }
];
export const ZONES = { mountain: { name: 'The mountains', note: 'Blue skies & snow-covered detours' }, rome: { name: 'Rome & the castle', note: 'A rescue, a lake and dinner on hold' }, south: { name: 'A taste of Italy', note: 'Gelato, an imagined Sicilian market & our kitchen' }, finale: { name: 'One more evening', note: 'A little ending. Many more beginnings.' } };
export const ITEMS = [
  { id: 'cream', category: 'outfit', name: 'The everyday adventure', note: 'Cream knit & blue jeans', price: 0, color: '#eee5d2', sprite: 'yiting', icon: 'shirt' },
  { id: 'winter', category: 'outfit', name: 'Mountain mornings', note: 'Blue stripes & a cozy beanie', price: 180, color: '#597ca4', sprite: 'yiting-winter', icon: 'snow' },
  { id: 'red', category: 'outfit', name: 'A Roman afternoon', note: 'Your little red turtleneck', price: 240, color: '#a94748', sprite: 'yiting-red', icon: 'shirt' },
  { id: 'camera', category: 'accessory', name: 'Camera eats first', note: 'For very important dinner photos', price: 100, icon: 'camera' },
  { id: 'sunglasses', category: 'accessory', name: 'Roman holiday', note: 'A little sunshine accessory', price: 90, icon: 'glasses' },
  { id: 'backpack', category: 'accessory', name: 'Little explorer', note: 'Ready for the next detour', price: 120, icon: 'bag' },
  { id: 'scarf', category: 'accessory', name: 'Warm hugs', note: 'A mustard scarf for winter days', price: 80, icon: 'scarf' },
  { id: 'gelato-pin', category: 'accessory', name: 'Extra scoop', note: 'A gelato pin for your outfit', price: 70, icon: 'icecream' },
  { id: 'lemon-sticker', category: 'souvenir', name: 'Italian sunshine', note: 'A lemon sticker for your passport', price: 60, icon: 'lemon' },
  { id: 'snow-sticker', category: 'souvenir', name: 'Snow day', note: 'A snowflake for your passport', price: 60, icon: 'snow' },
  { id: 'heart-frame', category: 'souvenir', name: 'Our little world', note: 'A heart-stamped passport cover', price: 150, icon: 'heart' },
  { id: 'marco-winter', category: 'marco', name: 'Marco, ready for snow', note: 'A blue winter jacket', price: 130, icon: 'shirt' },
  { id: 'marco-dinner', category: 'marco', name: 'Marco, waiting for dinner', note: 'A handsome dinner look', price: 160, icon: 'fork' }
];
export const RECIPES = ['Pasta al pomodoro', 'Pasta al pesto', 'Spaghetti aglio e olio', 'Pasta alla Norma'];
export const INGREDIENTS = [ { id: 'tomato', emoji: '🍅', name: 'Tomato' }, { id: 'garlic', emoji: '🧄', name: 'Garlic' }, { id: 'basil', emoji: '🌿', name: 'Basil' }, { id: 'pasta', emoji: '🍝', name: 'Pasta' }, { id: 'aubergine', emoji: '🍆', name: 'Aubergine' }, { id: 'cheese', emoji: '🧀', name: 'Cheese' }, { id: 'lemon', emoji: '🍋', name: 'Lemon' }, { id: 'bread', emoji: '🥖', name: 'Bread' }, { id: 'pepper', emoji: '🌶️', name: 'Pepper' }, { id: 'olive', emoji: '🫒', name: 'Olive oil' } ];
export function getChapter(id) { return CHAPTERS.find(c => c.id === id); }
export function chapterUnlocked(state, chapter) { return chapter.unlock === 0 || Boolean(state.scores[`${CHAPTERS[chapter.unlock - 1].id}:1`]); }
export function stageUnlocked(state, chapter, stage) { return chapterUnlocked(state, chapter) && (stage === 1 || Boolean(state.scores[`${chapter.id}:${stage - 1}`])); }
export function completedStages(state) { return Object.keys(state.scores).filter(id => !id.startsWith('daily:')).length; }
export function nextLevel(state) { for (const c of CHAPTERS) { if (chapterUnlocked(state, c)) { for (let stage = 1; stage <= c.stages; stage++) if (!state.scores[`${c.id}:${stage}`]) return { chapter: c, stage }; } } return { chapter: CHAPTERS[0], stage: 1 }; }
