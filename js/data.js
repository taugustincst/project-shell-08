/* Cartographer's Apprentice — content: clue vocabulary, career, workshop upgrades, rivals, prestige commissions. */
(function (root) {
'use strict';
const LANG_FAMILY = {
  Romance: ['French','Spanish','Portuguese','Italian','Romanian','Romansh','Haitian Creole'],
  Germanic: ['English','German','Dutch','Luxembourgish','Danish','Norwegian','Swedish','Icelandic','Afrikaans'],
  Slavic: ['Polish','Czech','Slovak','Ukrainian','Belarusian','Russian','Bulgarian','Serbian','Croatian','Bosnian','Slovene','Macedonian','Montenegrin'],
  Baltic: ['Lithuanian','Latvian'], Finnic: ['Finnish','Estonian'], Uralic: ['Hungarian'],
  Hellenic: ['Greek'], Albanian: ['Albanian'], Celtic: ['Irish'], Armenian: ['Armenian'], Kartvelian: ['Georgian'],
  Turkic: ['Turkish','Azerbaijani','Kazakh','Uzbek','Turkmen','Kyrgyz'], Iranian: ['Persian','Pashto','Dari','Tajik','Kurdish'],
  Semitic: ['Arabic','Hebrew','Amharic','Tigrinya','Maltese'], Indic: ['Hindi','Urdu','Bengali','Nepali','Sinhala','Fiji Hindi'], Dravidian: ['Tamil'],
  'Sino-Tibetan': ['Mandarin Chinese','Burmese','Dzongkha'], Japonic: ['Japanese'], Koreanic: ['Korean'], Mongolic: ['Mongolian'],
  'Tai-Kadai': ['Thai','Lao'], Austroasiatic: ['Vietnamese','Khmer'], Austronesian: ['Malay','Indonesian','Filipino','Malagasy','Māori','Fijian','Tetum','Tok Pisin','Hiri Motu'],
  Cushitic: ['Somali'], Bantu: ['Swahili','Zulu','Xhosa','Shona','Ndebele','Setswana','Chichewa','Kinyarwanda','Kirundi','Lingala'],
  'West African': ['Hausa','Yoruba','Igbo','Wolof','Bambara','Sango'], Quechuan: ['Quechua','Aymara'], Tupian: ['Guaraní']
};
const PLANT_WORDS = ['tree','palm','oak','orchid','rose','tulip','sunflower','grapevine','cedar','baobab','papyrus','yerba','welwitschia','tea','cocoa','centaury','beech','apricot'];
const CUR_FAMILIES = ['dollar','peso','franc','pound','dinar','rupee','krona','króna','krone','shilling','riyal','rial','manat','som','real','lira','euro','yen','yuan','won','ruble','rand','kwacha','dirham','leu','lev','mark','kuna','forint','złoty','koruna','hryvnia','lari','dram','tenge','baht','kip','riel','đồng','ringgit','rupiah','taka','ngultrum','afghani','birr','nakfa','naira','cedi','ouguiya','pula','metical','ariary','kwanza','quetzal','lempira','córdoba','colón','balboa','gourde','boliviano','guaraní','bolívar','sol','kina','tögrög','somoni','kyat','lek','denar'];
const GAUGE_CLASS = g => g === 0 ? 'no railways' : g === 1435 ? 'standard gauge' : g > 1435 ? 'broad gauge' : 'narrow gauge';
const RANKS = [
  { id: 1, name: 'Apprentice', rep: 0, blurb: 'You sharpen pencils, grind pigments, and are allowed, under supervision, to say where a coastline is.' },
  { id: 2, name: 'Journeyman', rep: 60, blurb: 'Your own desk by the window. Clients still ask for the master, but the master sends them to you.' },
  { id: 3, name: 'Draughtsman', rep: 160, blurb: 'Your name on the plates. The rival workshops have started to spell it correctly.' },
  { id: 4, name: 'Surveyor', rep: 320, blurb: 'Commissions arrive addressed to you. The master has taken up gardening.' },
  { id: 5, name: 'Master Cartographer', rep: 560, blurb: 'The workshop is yours. Apprentices sharpen your pencils and are allowed, under supervision, to say where a coastline is.' }
];
const FREE_RANK = 2, FREE_CONTINENTS = ['EU', 'NA', 'SA'];
const LAYERS = [
  { id: 'coast', name: 'Coasts and borders', cost: 0, desc: 'Which seas a land touches, and which lands it touches. The oldest layer in the atlas.' },
  { id: 'lang', name: 'Languages and scripts', cost: 0, desc: 'What is spoken and how it is written. Signs are evidence.' },
  { id: 'sun', name: 'Sun tables', cost: 0, desc: 'Noon shadow lengths by date and latitude. A pole and a ruler are an instrument.' },
  { id: 'drive', name: 'Rules of the road', cost: 120, desc: 'Which side of the road the carts keep to. Half the world does it the other way.' },
  { id: 'gauge', name: 'Railway gauges', cost: 180, desc: 'The distance between the rails, measured by engineers and argued about by empires.' },
  { id: 'currency', name: 'Coinage', cost: 240, desc: 'What the client paid with. Dollars, pesos and francs travel further than you think.' },
  { id: 'wild', name: 'Flora and fauna', cost: 300, desc: 'A creature or a tree, glimpsed from a carriage window, that lives in one place on earth.' },
  { id: 'flag', name: 'Flags of the world', cost: 360, desc: 'Every flag, correctly drawn, so you can tell how an eyewitness got one wrong.' }
];
const UPGRADES = [
  { id: 'wager', name: 'Wager licence', cost: 200, desc: 'The guild permits you to stake reputation on a deduction. Double pay when right; triple the loss when wrong.' },
  { id: 'index', name: 'Index cards', cost: 250, desc: 'Search the atlas by name instead of scanning the map.' },
  { id: 'inks', name: 'Coloured inks', cost: 300, desc: 'Tap a clue to shade every land it allows. Deduction becomes visible.' },
  { id: 'apprentice', name: 'A second apprentice', cost: 600, desc: 'Someone else grinds the pigments. Commissions pay 15% more.' },
  { id: 'dossier', name: 'Rival dossier', cost: 450, desc: 'Know what the rival workshops are chasing before they chase it.' },
  { id: 'sextant', name: 'Brass sextant', cost: 800, desc: 'Sun-angle evidence is read twice as finely.' },
  { id: 'press', name: 'Printing press', cost: 1600, desc: 'Prestige commissions pay 50% more. The plates are yours to sell.' },
  { id: 'globe', name: 'The great globe', cost: 3200, desc: 'A yard across, on brass. Returning clients pay full rate instead of half.' }
];
const RIVALS = [
  { id: 'vosk', name: 'Vosk & Daughters', style: 'fast and careless', blurb: 'They will answer any commission in an hour and be wrong by lunch.' },
  { id: 'pell', name: 'Pell\'s Atlas House', style: 'expensive and slow', blurb: 'Beautiful plates, three months late. Their clients come to you when they can no longer wait.' },
  { id: 'ortel', name: 'The Ortel Society', style: 'secretive', blurb: 'Nobody has seen their workshop. Their maps appear in libraries with no name on them.' }
];
/* Authored prestige commissions: text + target + clue recipe (types and tiers). Clue data is generated from the seed and validated for a unique answer. */
const PRESTIGE = [
  { id: 'p01', target: 'JP', rank: 2, rival: 'vosk', title: 'The Lacquer Box', client: 'A merchant\'s widow brings a lacquered box. "He said the island where it was made had a mountain you could see from the capital on a clear day."', clues: [['coast',1],['lang',2],['drive',1]] },
  { id: 'p02', target: 'EG', rank: 2, rival: 'pell', title: 'The River That Runs North', client: 'A geologist\'s notebook: "The river runs the wrong way, north, through a land of two seas."', clues: [['coast',1],['sun',2],['currency',2]] },
  { id: 'p03', target: 'CL', rank: 2, rival: 'ortel', title: 'The Long Country', client: 'A sailor swears he sailed down one coast for three weeks without the land ending.', clues: [['coast',1],['gauge',1],['lang',3]] },
  { id: 'p04', target: 'IS', rank: 2, rival: 'vosk', title: 'No Rails at All', client: 'An engineer, offended: "They have hot springs, glaciers, and not a single railway."', clues: [['gauge',1],['sun',1],['coast',2]] },
  { id: 'p05', target: 'IN', rank: 2, rival: 'pell', title: 'The Wide Rails', client: 'A tea planter: "The trains run on rails wider than anywhere in Europe, and the signs are in a script I could not read."', clues: [['gauge',1],['lang',2],['drive',1]] },
  { id: 'p06', target: 'ZA', rank: 2, rival: 'ortel', title: 'Two Oceans', client: 'A letter from a naturalist who saw a springbok, and two oceans, from the same hill.', clues: [['wild',1],['coast',1],['drive',1]] },
  { id: 'p07', target: 'MN', rank: 3, rival: 'vosk', title: 'The Sea of Grass', client: 'A horseman describes a land with no coast at all, where the trains run on the wide Russian rails.', clues: [['coast',2],['gauge',1],['lang',2]] },
  { id: 'p08', target: 'MG', rank: 3, rival: 'pell', title: 'The Island of Lemurs', client: 'A ship\'s surgeon kept a lemur. "It came from the big island, where they drove on the right and paid in a coin I cannot pronounce."', clues: [['wild',1],['drive',1],['currency',3]] },
  { id: 'p09', target: 'CH', rank: 2, rival: 'ortel', title: 'Four Tongues', client: 'A courier heard four languages in one day without crossing a border, and the coins were francs.', clues: [['lang',1],['currency',2],['coast',2]] },
  { id: 'p10', target: 'AU', rank: 3, rival: 'vosk', title: 'The Southern Cross', client: 'An eyewitness describes a flag with the Union Jack and stars, "and the kangaroos," he adds, "were real."', clues: [['flag',1],['wild',1],['sun',2]] },
  { id: 'p11', target: 'NZ', rank: 3, rival: 'pell', title: 'The Other Southern Cross', client: 'The same eyewitness, a week later, is less sure. "The stars were red. The bird did not fly."', clues: [['flag',1],['wild',1],['drive',1]] },
  { id: 'p12', target: 'BR', rank: 3, rival: 'ortel', title: 'The Portuguese Giant', client: 'A rubber trader: Portuguese spoken on a continent where everyone else speaks Spanish, and the rails were narrow.', clues: [['lang',1],['gauge',2],['sun',3]] },
  { id: 'p13', target: 'ET', rank: 3, rival: 'vosk', title: 'The Script Nobody Reads', client: 'A missionary copied a sign in a script with its own alphabet, from a highland with no coast.', clues: [['lang',2],['coast',2],['wild',1]] },
  { id: 'p14', target: 'IR', rank: 3, rival: 'pell', title: 'The Caspian Shore', client: 'A carpet buyer travelled from the Caspian to the Gulf without changing country, "and the shadows at noon were short."', clues: [['coast',1],['sun',1],['lang',1]] },
  { id: 'p15', target: 'TH', rank: 3, rival: 'ortel', title: 'Five Stripes', client: 'An eyewitness flag: five horizontal stripes, red, white, blue — "or was it the other way round?" The carts kept left.', clues: [['flag',1],['drive',1],['gauge',2]] },
  { id: 'p16', target: 'CA', rank: 2, rival: 'vosk', title: 'The Maple Leaf', client: 'A lumberjack describes a flag with a leaf, a beaver on the coin, and three oceans.', clues: [['flag',1],['coast',1],['lang',1]] },
  { id: 'p17', target: 'AR', rank: 3, rival: 'pell', title: 'The Sun on the Flag', client: 'A gaucho\'s flag: pale blue and white with a sun. "The rails," he adds, "were the wide ones."', clues: [['flag',1],['gauge',1],['sun',2]] },
  { id: 'p18', target: 'PE', rank: 3, rival: 'ortel', title: 'The Llama Caravan', client: 'A mining engineer: llamas, Quechua spoken on the signs, and a Pacific port.', clues: [['wild',1],['lang',1],['coast',1]] },
  { id: 'p19', target: 'KZ', rank: 4, rival: 'vosk', title: 'The Steppe Eagle', client: 'A railway surveyor: broad gauge, a flag of sky blue with an eagle, and the Caspian at the western edge.', clues: [['gauge',1],['flag',1],['coast',1]] },
  { id: 'p20', target: 'ID', rank: 4, rival: 'pell', title: 'The Dragon Island', client: 'A zoologist saw a lizard the size of a boat on an island in an archipelago where they drive on the left.', clues: [['wild',1],['drive',1],['sun',2]] },
  { id: 'p21', target: 'MA', rank: 3, rival: 'ortel', title: 'The Green Star', client: 'An eyewitness: a red flag with one green star. Two seas. Macaques on a rock.', clues: [['flag',1],['coast',1],['wild',1]] },
  { id: 'p22', target: 'KE', rank: 4, rival: 'vosk', title: 'The Shield and Spears', client: 'A hunter\'s flag: black, red and green with a shield. Swahili on the signs. Carts on the left.', clues: [['flag',1],['lang',1],['drive',1]] },
  { id: 'p23', target: 'NP', rank: 4, rival: 'pell', title: 'The Flag That Is Not a Rectangle', client: 'An eyewitness insists the flag was two triangles, one above the other. The land had no coast.', clues: [['flag',1],['coast',2],['lang',2]] },
  { id: 'p24', target: 'FI', rank: 3, rival: 'ortel', title: 'The Odd Gauge', client: 'An engineer: "Their rails are four millimetres wider than Russia\'s. They are very proud of this."', clues: [['gauge',1],['lang',1],['sun',2]] },
  { id: 'p25', target: 'ES', rank: 2, rival: 'vosk', title: 'The Iberian Gauge', client: 'A traveller changed trains at the French border because the rails were wider on the far side.', clues: [['gauge',1],['lang',1],['coast',1]] },
  { id: 'p26', target: 'PT', rank: 3, rival: 'pell', title: 'The Cork Forest', client: 'A wine shipper: cork oaks, Atlantic coast, and the same wide rails as their neighbour.', clues: [['wild',1],['gauge',1],['lang',1]] },
  { id: 'p27', target: 'GE', rank: 4, rival: 'ortel', title: 'Five Crosses', client: 'An eyewitness: a white flag with five red crosses. Its own alphabet. The Black Sea.', clues: [['flag',1],['lang',2],['coast',1]] },
  { id: 'p28', target: 'CU', rank: 3, rival: 'vosk', title: 'The Island of Stripes', client: 'A cigar importer\'s flag: blue and white stripes with a red triangle, "on an island of the Caribbean, and the Gulf."', clues: [['flag',1],['coast',1],['lang',1]] },
  { id: 'p29', target: 'VN', rank: 4, rival: 'pell', title: 'The Single Star', client: 'A red flag with one yellow star. Latin letters with strange marks. Metre-gauge railway down the coast.', clues: [['flag',1],['lang',2],['gauge',1]] },
  { id: 'p30', target: 'TR', rank: 3, rival: 'ortel', title: 'The Crescent Between Seas', client: 'A diplomat: three seas, a crescent flag, Latin script, and the sun high at noon in June.', clues: [['flag',1],['coast',1],['sun',2]] },
  { id: 'p31', target: 'BT', rank: 4, rival: 'vosk', title: 'The Dragon Flag', client: 'An eyewitness: a dragon on a flag divided diagonally. No railway. No coast. Takin on the hills.', clues: [['flag',1],['gauge',1],['wild',1]] },
  { id: 'p32', target: 'PG', rank: 4, rival: 'pell', title: 'The Bird of Paradise', client: 'A plume trader: a bird-of-paradise on a flag, carts on the left, no railways, half an island.', clues: [['wild',1],['drive',1],['gauge',1]] },
  { id: 'p33', target: 'NA', rank: 4, rival: 'ortel', title: 'The Plant That Lives Two Thousand Years', client: 'A botanist: welwitschia in a desert on the Atlantic, Afrikaans on the signs, carts on the left.', clues: [['wild',1],['lang',1],['coast',1]] },
  { id: 'p34', target: 'UY', rank: 3, rival: 'vosk', title: 'The Small Neighbour', client: 'A cattle buyer: a sun in the canton, standard-gauge rails, Spanish, and the Atlantic.', clues: [['flag',1],['gauge',1],['coast',1]] },
  { id: 'p35', target: 'LK', rank: 4, rival: 'pell', title: 'The Lion With a Sword', client: 'An eyewitness flag: a lion holding a sword. Tea on the hills. Carts on the left. The widest rails.', clues: [['flag',1],['drive',1],['gauge',1]] },
  { id: 'p36', target: 'SA', rank: 4, rival: 'ortel', title: 'The Sword Beneath the Words', client: 'A pilgrim: a green flag with writing above a sword; two seas; standard-gauge rails across the sand.', clues: [['flag',1],['coast',1],['gauge',1]] },
  { id: 'p37', target: 'JM', rank: 4, rival: 'vosk', title: 'The Yellow Cross', client: 'A rum shipper: a flag of green and black quartered by a yellow diagonal cross, an island, carts on the left.', clues: [['flag',1],['drive',1],['coast',1]] },
  { id: 'p38', target: 'UZ', rank: 5, rival: 'pell', title: 'Twelve Stars', client: 'A silk buyer: twelve stars and a crescent on blue, white and green; no coast; broad gauge; Latin letters.', clues: [['flag',1],['coast',2],['gauge',1],['lang',2]] },
  { id: 'p39', target: 'CY', rank: 5, rival: 'ortel', title: 'The Island on the Flag', client: 'An eyewitness: a white flag with the island itself drawn on it in copper. Greek on the signs. Carts on the left.', clues: [['flag',1],['lang',1],['drive',1]] },
  { id: 'p40', target: 'MT', rank: 5, rival: 'vosk', title: 'The George Cross', client: 'A naval chaplain: a white-and-red flag with a medal in the corner, an island with no railway where the carts keep left.', clues: [['flag',1],['gauge',1],['drive',1]] }
];
const CLIENTS = ['a spice merchant', 'a retired admiral', 'a botanist with a pressed leaf', 'a railway engineer', 'a missionary\'s widow', 'a stamp collector', 'a diplomat\'s secretary', 'a shipping clerk', 'a schoolteacher with a globe', 'a newspaper correspondent', 'a tea planter', 'a woman who found a letter in a bottle', 'an opera singer who toured too much', 'a customs officer', 'a cartographer from a rival house, in disguise'];
const DATA = { LANG_FAMILY, PLANT_WORDS, CUR_FAMILIES, GAUGE_CLASS, RANKS, FREE_RANK, FREE_CONTINENTS, LAYERS, UPGRADES, RIVALS, PRESTIGE, CLIENTS };
if (typeof module !== 'undefined' && module.exports) module.exports = DATA; else root.CA_DATA = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
