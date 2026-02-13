import { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// TORCHES IN THE DARK — TEXT RPG
// ============================================================

// DICE UTILITIES
const roll = (sides) => Math.floor(Math.random() * sides) + 1;
const d20 = () => roll(20);
const d6 = () => roll(6);
const d4 = () => roll(4);
const d12 = () => roll(12);
const d100 = () => roll(100);

// GAME DATA
const ABILITIES = ["Might","Finesse","Endurance","Insight","Resolve","Presence","Faith","Magick","Luck"];

const RACES = [
  { id:"human", name:"Human", chance:100, desc:"Common folk. Hard to kill, harder to break.", bonuses:{}, bonusPoints:1, traits:["Choose 1 passive, 1 active trait"], freeAbility:true },
  { id:"dwarf", name:"Empire Dwarf", chance:40, desc:"Stout miners from the deep holds. Iron in their guts.", bonuses:{Endurance:3,Might:2}, traits:["Iron Gut"] },
  { id:"drakon", name:"Drakon", chance:20, desc:"Scaled folk. Faith burns in their blood.", bonuses:{Might:2,Faith:3}, traits:["Unshakable Faith"] },
  { id:"orkon", name:"Orkon", chance:20, desc:"Tusked brutes. Born for war, bred for worse.", bonuses:{Might:4,Endurance:1}, traits:["Tenacious"] },
  { id:"elf", name:"Astral Elf", chance:10, desc:"Last children of the void. Eyes like dead stars.", bonuses:{Magick:2,Presence:3}, traits:["Void Gaze","Quiet Mind"] },
];

const GRIM_SORTS = [
  { id:"mercenary", name:"Mercenary", strikes:6, desc:"Professional soldier. You kill for coin and call it honest work.", abilities:[
    {name:"Contract Killer",uses:2,desc:"Mark target, +1 Strike damage for encounter."},
    {name:"Combat Veteran",uses:2,desc:"Reroll attack, accept second result."},
    {name:"Mercenary's Edge",uses:2,desc:"Heal 2 Strikes on critical hit."}
  ]},
  { id:"knave", name:"Knave", strikes:4, desc:"Cunning rogue. The world owes you, and you aim to collect.", abilities:[
    {name:"Dirty Fighting",uses:2,desc:"Target has disadvantage next round."},
    {name:"Lucky Dodge",uses:1,desc:"Turn a hit into a miss."},
    {name:"Knife in the Dark",uses:3,desc:"+2 Strikes if target hasn't acted."}
  ]},
  { id:"wytchHunter", name:"Wytch Hunter", strikes:5, desc:"Scourge of the arcane. You smell sorcery like rot.", abilities:[
    {name:"Sanctified Weapons",uses:99,desc:"Passive: +1 Strike to spellcasters."},
    {name:"Wytch Sight",uses:3,desc:"See illusions, detect auras 12 sq."},
    {name:"Supernatural Resistance",uses:99,desc:"Passive: +2 saves vs magical effects."}
  ]},
  { id:"marauder", name:"Marauder", strikes:5, desc:"Brutal raider. Violence is your mother tongue.", abilities:[
    {name:"Berserker Rage",uses:1,desc:"4 rounds: +2 attacks, immune fear/stun."},
    {name:"Hate-Fueled",uses:99,desc:"Passive: +1 Strike vs enemies who wounded you."},
    {name:"Crushing Blow",uses:3,desc:"Next attack ignores armor/shields."}
  ]},
  { id:"ranger", name:"Ranger", strikes:5, desc:"Master tracker. The wilds speak to you.", abilities:[
    {name:"Expert Shot",uses:3,desc:"Ranged ignores cover; +1 Strike."},
    {name:"Ranger's Shot",uses:1,desc:"Skip move; next attack +3 Strikes."},
    {name:"Tracker's Sense",uses:99,desc:"Passive: Follow week-old tracks."}
  ]},
  { id:"crusader", name:"Crusader", strikes:6, desc:"Holy warrior. The gods are silent, but your blade is not.", abilities:[
    {name:"Empyrean Aura",uses:99,desc:"Passive: Undead/demons in 2 sq take 1 Strike."},
    {name:"Divine Weapon",uses:2,desc:"Next attack +2 Strikes; blessed."},
    {name:"Divine Healing",uses:2,desc:"Heal 1 Strike via prayer."}
  ]},
  { id:"pyromancer", name:"Pyromancer", strikes:4, desc:"Fire wielder. You read omens in the flames.", abilities:[
    {name:"Anointed Oil Bomb",uses:2,desc:"Oil explodes 2 Strikes in area."},
    {name:"Flame Divination",uses:99,desc:"Passive: Read omens in fire; sense lies."},
    {name:"Righteous Immolation",uses:1,desc:"3 rounds: immune cold, +2 Strike."}
  ]},
  { id:"corpseShepherd", name:"Corpse Shepherd", strikes:5, desc:"Commander of the restless dead. They listen to you.", abilities:[
    {name:"Whisper to Bones",uses:99,desc:"Passive: Speak with fresh corpses."},
    {name:"Deadman's March",uses:2,desc:"Animate 1d4 skeletons for encounter."},
    {name:"Grave's Embrace",uses:1,desc:"Touch attack: Endurance DC 14 or CHILLED."}
  ]},
  { id:"blackguard", name:"Blackguard", strikes:6, desc:"Intimidation and brutality. Fear is your sharpest weapon.", abilities:[
    {name:"Ruthless Assault",uses:1,desc:"Two attacks; +2 Strikes if both hit."},
    {name:"Cruel Efficiency",uses:99,desc:"Passive: +1 Strike to wounded/frightened."},
    {name:"Intimidating Reputation",uses:99,desc:"Passive: +3 Presence to intimidate."}
  ]},
  { id:"pitFighter", name:"Pit-Fighter", strikes:5, desc:"Blood-soaked pit veteran. The crowd roars in your dreams.", abilities:[
    {name:"Arena Reflexes",uses:99,desc:"Passive: Advantage vs grapples/disarms."},
    {name:"Low Cut",uses:2,desc:"Halve target's movement 1 round on hit."},
    {name:"Show the Crowd",uses:1,desc:"+1 attack rolls after each kill (max +5)."}
  ]},
];

const PASSIVE_TRAITS = [
  {id:"battleHardened",name:"Battle Hardened",desc:"+2 max Strikes.",effect:{maxStrikesBonus:2}},
  {id:"painTolerance",name:"Pain Tolerance",desc:"Critical hits deal normal damage.",effect:{painTolerance:true}},
  {id:"combatReflexes",name:"Combat Reflexes",desc:"+1 Initiative.",effect:{initBonus:1}},
  {id:"weaponMaster",name:"Weapon Master",desc:"+1 attack with weapons.",effect:{attackBonus:1}},
  {id:"ironConstitution",name:"Iron Constitution",desc:"+3 Endurance vs poison, disease.",effect:{poisonResist:3}},
  {id:"keenSenses",name:"Keen Senses",desc:"+3 Insight for perception.",effect:{perceptionBonus:3}},
  {id:"nightEyes",name:"Night Eyes",desc:"See in darkness; stealth advantage.",effect:{nightVision:true}},
  {id:"dangerSense",name:"Danger Sense",desc:"Cannot be surprised.",effect:{noSurprise:true}},
  {id:"ironWill",name:"Iron Will",desc:"Ignore one mental effect per encounter.",effect:{mentalResist:1}},
  {id:"silverTongue",name:"Silver Tongue",desc:"+3 Presence for persuasion.",effect:{persuasionBonus:3}},
  {id:"lucky",name:"Lucky",desc:"Reroll one d20 per session.",effect:{luckyReroll:1}},
  {id:"tenacious",name:"Tenacious",desc:"Stay conscious until -2 Strikes.",effect:{tenacious:true}},
  {id:"berserker",name:"Berserker",desc:"Below half Strikes: +1 attack, immune fear.",effect:{berserker:true}},
  {id:"thickSkin",name:"Thick Skin",desc:"+1 DR chance regardless of armor.",effect:{drBonus:1}},
];

const ACTIVE_TRAITS = [
  {id:"deathsDoor",name:"Death's Door",uses:1,desc:"At 1 Strike, next attack deals double."},
  {id:"voidStrike",name:"Void Strike",uses:1,desc:"Attack ignores all defenses."},
  {id:"terrorIncarnate",name:"Terror Incarnate",uses:1,desc:"All enemies save vs fear or flee."},
  {id:"execution",name:"Execution",uses:1,desc:"Auto-kill target with 3 or fewer Strikes."},
  {id:"arterialStrike",name:"Arterial Strike",uses:2,desc:"Hit causes ARTERY SLASH."},
  {id:"graveTouch",name:"Grave Touch",uses:2,desc:"Heal 1d4 Strikes by touching corpse."},
  {id:"shadowStep",name:"Shadow Step",uses:2,desc:"Teleport behind enemy for advantage."},
  {id:"dirtyFighting",name:"Dirty Fighting",uses:3,desc:"Target disadvantage on next action."},
  {id:"preciseStrike",name:"Precise Strike",uses:3,desc:"Ignore 2 points of DR."},
  {id:"battleSurge",name:"Battle Surge",uses:3,desc:"Heal 1 Strike after killing enemy."},
  {id:"powerAttack",name:"Power Attack",uses:3,desc:"-2 to hit, +2 Strikes damage."},
  {id:"parryMastery",name:"Parry Mastery",uses:3,desc:"Negate attack and counterstrike."},
  {id:"killingBlow",name:"Killing Blow",uses:3,desc:"+3 Strikes vs enemies at 1 Strike."},
];

const EQUIPMENT_PACKS = [
  {id:"sellsword",name:"Sellsword Pack",armor:"Chain Shirt",armorSlots:2,armorDef:2,armorDR:2,weapon:"Longsword",weaponTag:"Reliable",shield:true,coin:25,items:["50ft rope","Whetstone","Bedroll","3 days rations","Waterskin"]},
  {id:"bandit",name:"Bandit Pack",armor:"Padded Armor",armorSlots:1,armorDef:4,armorDR:1,weapon:"Cutlass",weaponTag:"Notched",shield:false,coin:12,items:["Lockpicks","Mask","30ft rope","Grappling hook","Caltrops","Small mirror"]},
  {id:"explorer",name:"Explorer Pack",armor:"Padded Armor",armorSlots:1,armorDef:4,armorDR:1,weapon:"Hand Axe",weaponTag:"Throwable",shield:false,coin:30,items:["Compass","Spyglass","Climbing gear","100ft rope","Grappling hook","Tent","Flint & steel"]},
  {id:"bountyHunter",name:"Bounty Hunter Pack",armor:"Chain Shirt",armorSlots:2,armorDef:2,armorDR:2,weapon:"Crossbow",weaponTag:"Precise",shield:false,coin:45,items:["Manacles","20 bolts","Tracking gear","Wanted posters","Rope (60ft)","Spyglass"]},
  {id:"noble",name:"Noble Pack",armor:"Padded Armor",armorSlots:1,armorDef:4,armorDR:1,weapon:"Rapier",weaponTag:"Precise",shield:false,coin:100,items:["Signet ring","Fine clothes","Wine flask","Silk rope (30ft)","Jeweled dagger"]},
  {id:"beggar",name:"Beggar Pack",armor:null,armorSlots:0,armorDef:0,armorDR:0,weapon:"Quarterstaff",weaponTag:"Reliable",shield:false,coin:3,items:["Tattered cloak","Lucky charm","Needle & thread"]},
];

// ENEMIES
const ENEMIES = {
  bandit: {name:"Bandit",strikes:1,maxStrikes:1,defense:11,might:2,finesse:1,endurance:2,special:"Battle Cry: allies +1 attack 1 round",dmgType:"slashing"},
  brigand: {name:"Brigand",strikes:2,maxStrikes:2,defense:13,might:3,finesse:3,endurance:2,special:"Crushing Strike: ignore armor once",dmgType:"slashing"},
  slaver: {name:"Slaver",strikes:2,maxStrikes:2,defense:12,might:2,finesse:2,endurance:2,special:"Whip Crack: Resolve save or cower",dmgType:"slashing"},
  assassin: {name:"Assassin",strikes:2,maxStrikes:2,defense:14,might:2,finesse:4,endurance:1,special:"Poisoned Blade: +1 strike next round",dmgType:"puncturing"},
  cultist: {name:"Cultist",strikes:1,maxStrikes:1,defense:10,might:1,finesse:0,endurance:1,special:"Fanatical: immune to fear",dmgType:"slashing"},
  mercenary: {name:"Mercenary",strikes:2,maxStrikes:2,defense:13,might:3,finesse:3,endurance:2,special:"Combat Veteran: +1 initiative",dmgType:"slashing"},
  wolf: {name:"Wolf",strikes:2,maxStrikes:2,defense:13,might:2,finesse:3,endurance:2,special:"Pack Hunter: +1 if ally attacked same",dmgType:"fang"},
  ghoul: {name:"Ghoul",strikes:2,maxStrikes:2,defense:12,might:2,finesse:2,endurance:2,special:"Paralysis: Endurance save or lose action",dmgType:"fang"},
  skeleton: {name:"Skeleton",strikes:1,maxStrikes:1,defense:10,might:1,finesse:0,endurance:0,special:"Immune to fear, poison, mental",dmgType:"slashing"},
  wight: {name:"Wight",strikes:3,maxStrikes:3,defense:13,might:4,finesse:3,endurance:3,special:"Energy Drain: lose 1 random ability",dmgType:"slashing"},
  // NEW ENEMIES
  deserter: {name:"Imperial Deserter",strikes:2,maxStrikes:2,defense:12,might:2,finesse:2,endurance:2,special:"Desperate: +1 attack when below half health",dmgType:"slashing"},
  pitFighter: {name:"Pit-Fighter",strikes:3,maxStrikes:3,defense:13,might:4,finesse:2,endurance:3,special:"Haymaker: crits on 19-20",dmgType:"crushing"},
  smuggler: {name:"Smuggler",strikes:1,maxStrikes:1,defense:12,might:1,finesse:3,endurance:1,special:"Slippery: first attack against them has disadvantage",dmgType:"puncturing"},
  dockThug: {name:"Dock Thug",strikes:2,maxStrikes:2,defense:11,might:3,finesse:1,endurance:3,special:"Cheap Shot: +1 damage if player hasn't acted",dmgType:"crushing"},
  corruptGuard: {name:"Corrupt Watchman",strikes:2,maxStrikes:2,defense:13,might:2,finesse:2,endurance:3,special:"Shield Wall: +1 DEF per allied guard alive",dmgType:"slashing"},
  hexMarked: {name:"Hex-Marked Thrall",strikes:2,maxStrikes:2,defense:11,might:3,finesse:1,endurance:3,special:"Undying: stays at 1 strike once per combat",dmgType:"slashing"},
  harborCaptain: {name:"Harbor Captain Rennik",strikes:4,maxStrikes:4,defense:14,might:3,finesse:3,endurance:3,special:"Rally: heals all allies 1 strike once per combat",dmgType:"slashing",isBoss:false},
  // BOSSES
  bossGarran: {name:"Garran the Flay-King",strikes:4,maxStrikes:4,defense:14,might:4,finesse:3,endurance:3,special:"Ruthless: +2 Strikes if both attacks hit. Attacks twice.",dmgType:"slashing",isBoss:true},
  bossIronMadam: {name:"The Iron Madam",strikes:5,maxStrikes:5,defense:15,might:3,finesse:4,endurance:4,special:"Slaver's Whip: Resolve DC 14 or stunned. Bodyguard takes first hit.",dmgType:"slashing",isBoss:true},
  bossBarrowKing: {name:"The Barrow King",strikes:6,maxStrikes:6,defense:13,might:5,finesse:2,endurance:5,special:"Undead: immune fear/poison. Energy Drain on crit. Summons 1d4 skeletons.",dmgType:"crushing",isBoss:true},
  bossWytch: {name:"Morvaine the Ash-Tongued",strikes:8,maxStrikes:8,defense:14,might:2,finesse:4,endurance:3,special:"Casts spells each round. Void Shield: first attack each round misses. At half health summons Shadow Birth.",dmgType:"slashing",isBoss:true},
  // NEW BOSSES
  bossVargKnife: {name:"Varg the Knife",strikes:5,maxStrikes:5,defense:15,might:3,finesse:5,endurance:2,special:"Twin Blades: attacks twice. Poison: failed Endurance DC 13 or lose 1 strike next round.",dmgType:"puncturing",isBoss:true},
  bossOldHolloway: {name:"Old Holloway",strikes:7,maxStrikes:7,defense:12,might:5,finesse:1,endurance:6,special:"Unkillable: regenerates 1 strike per round. Weakness: fire damage prevents regen.",dmgType:"crushing",isBoss:true},
  bossRedMask: {name:"The Red Mask",strikes:6,maxStrikes:6,defense:14,might:4,finesse:4,endurance:3,special:"Duelist: counterattacks on player miss. Riposte: +2 damage after successful parry.",dmgType:"slashing",isBoss:true},
};

// PARTY MEMBERS
const PARTY_MEMBERS = {
  kael: {id:"kael",name:"Kael",strikes:4,maxStrikes:4,defense:13,attackBonus:5,damage:1,special:"Disciplined: attacks the most wounded enemy.",alive:true},
  dorn: {id:"dorn",name:"Dorn",strikes:5,maxStrikes:5,defense:12,attackBonus:4,damage:1,special:"Juggernaut: cannot be knocked out in first 3 rounds.",alive:true,juggernautActive:true},
  sable: {id:"sable",name:"Sable",strikes:3,maxStrikes:3,defense:14,attackBonus:6,damage:1,special:"First Strike: +1 damage on first attack of combat.",alive:true,firstStrikeUsed:false},
  brotherCade: {id:"brotherCade",name:"Brother Cade",strikes:5,maxStrikes:5,defense:11,attackBonus:3,damage:1,special:"Divine Shield: absorbs first hit directed at him each combat.",alive:true,divineShieldActive:true},
};

// NARRATIVE SCENES
const SCENES = {
  // ===== PROLOGUE =====
  prologue: {
    text: [
      "The smoke found you before the screaming did.",
      "You woke to the taste of ash and the orange glow of Thornwall burning. The village that raised you—forty souls of farmers, smiths, and drunks—was dying in the dark.",
      "She stood in the village square like something the night had coughed up. Thin as a willow switch, wrapped in rags that moved when there was no wind. Her hands were open, palms up, and from each palm ran threads of something that was not light and was not shadow but ate both.",
      "The threads found flesh. Old Brennan the smith went first—his mouth opened in a scream that never came, and something bright and wet pulled itself from his chest and threaded into her waiting fingers. He dropped like a puppet with its strings cut.",
      "One by one, she fed. Methodical. Patient. A reaper in a field of wheat.",
      "You survived. Maybe she didn't see you. Maybe she left you on purpose—a witness, a message, a seed of fear planted in fertile soil. You crawled from the wreckage of the only home you'd known with nothing but rage and the clothes on your back.",
      "Three days later, a peddler found you on the road to Squall's End. He gave you water and a name for what you'd seen.",
      "\"A Wytch,\" he said, and spat. \"Morvaine, they call her. The Ash-Tongued. She's been moving north, village to village, feeding. The bounty on her head would buy a lordship.\"",
      "He studied your face and whatever he saw there made him look away.",
      "\"You're going after her,\" he said. It wasn't a question.",
    ],
    choices: [{text:"Begin your hunt. Create your character.", next:"charCreate"}],
  },

  // ===== ACT 1: THE GALLOWS ROAD =====
  gallowsRoad: {
    text: [
      "THE GALLOWS ROAD",
      "—",
      "The road south from Thornwall is a scar through marshland. They call it the Gallows Road because the empire used to hang deserters from the bridge-posts, and some of the ropes still dangle there, frayed and black with age.",
      "Rain comes down in sheets. The marsh stinks of sulfur and rot. To the east, the treeline is a wall of dripping green. To the west, the bog stretches flat and grey until it meets the sky.",
      "You've been walking for two days. Your boots are soaked. Your supplies are thin. But you're alive, and the trail is fresh—ash-marks on the trees where Morvaine passed, and a village called Millhaven three miles ahead that may have seen her.",
      "The road forks. A crude sign, half-rotted, points left toward MILLHAVEN and right toward the OLD BRIDGE.",
    ],
    choices: [
      {text:"Take the road to Millhaven.", next:"millhaven"},
      {text:"Head for the Old Bridge—shorter, but the marshes are thick.", next:"oldBridge"},
    ],
  },

  oldBridge: {
    text: [
      "The bridge is older than the empire. Stone, cracked, covered in moss that glows faintly in the rain. Something about the light here is wrong—too green, too cold.",
      "Halfway across, you hear them. Boots on stone. Three figures step from the treeline on the far side. Brigands. Road-wolves. The kind of men who gut travelers for boot-leather.",
      "The leader is a thick-necked brute with a scar that splits his face from temple to jaw. He grins with what teeth remain.",
      "\"Toll road, friend. Everything you've got, and we let you keep your skin.\"",
    ],
    choices: [
      {text:"Pay the toll. (Lose half your coin.)", next:"bridgePay", check:"coin"},
      {text:"\"I've buried better men than you this week.\" (Fight)", next:"bridgeFight"},
      {text:"Try to talk your way past. (Presence check DC 14)", next:"bridgeTalk", check:"presence"},
    ],
  },

  bridgePay: {
    text: ["You hand over the coin. The brigand leader weighs it, nods, and waves you through. \"Smart,\" he says. \"Most aren't.\"","You cross the bridge with lighter pockets and a sour taste in your mouth. The road rejoins toward Millhaven."],
    effect: {halveCoin:true},
    choices:[{text:"Continue to Millhaven.", next:"millhaven"}],
  },

  bridgeFight: {
    text:["The brigand's grin widens. \"Bold. Stupid, but bold.\" He draws a notched blade. His companions fan out.","Steel rings in the rain."],
    combat:{enemies:["brigand","bandit","bandit"],type:"normal"},
    choices:[{text:"Search the bodies and continue.", next:"bridgeAfterFight"}],
  },

  bridgeAfterFight: {
    text:["The rain washes the blood between the bridge stones. You find 15 Golm on the bodies, a rusty dagger, and a scrap of paper—a bounty notice for Morvaine, offering 500 Golm. Someone else is hunting her too.","You pocket the coin and press on toward Millhaven."],
    effect:{addCoin:15},
    choices:[{text:"Continue to Millhaven.", next:"millhaven"}],
  },

  bridgeTalk: {
    text:["You study the brigand's eyes. There's fear there, buried under bravado. These men are hungry, not brave."],
    check:{ability:"Presence",dc:14,
      success:{text:["\"You don't want this fight,\" you say, quiet and certain. \"I've been walking from Thornwall. You know what happened there. Whatever did that is ahead of me, and I'm in no mood for delays.\"","The leader's grin falters. He's heard the stories. They all have.","\"Go on, then,\" he mutters, stepping aside. \"Die on your own terms.\""],next:"millhaven"},
      fail:{text:["The brigand laughs. \"Nice try. But I've heard better from men with swords at their throats.\" He draws his blade."],next:"bridgeFight"}
    },
    choices:[],
  },

  millhaven: {
    text:[
      "MILLHAVEN",
      "—",
      "Millhaven is barely a village—a dozen houses clustered around a mill that hasn't turned in years. But it has a tavern, the Drowned Rat, and that's what matters.",
      "Inside, the air is thick with smoke and the smell of bad ale. A dozen faces turn toward you, then turn away. Strangers aren't welcome, but they aren't unusual either.",
      "Three people catch your eye:",
      "A WOMAN at the bar, armored in boiled leather, nursing a drink. She has the look of a sellsword—scarred hands, watchful eyes.",
      "An OLD MAN in the corner, muttering into his cup. The barkeep avoids his end of the room.",
      "A HOODED FIGURE by the fire, reading a letter by candlelight.",
    ],
    choices:[
      {text:"Approach the armored woman.", next:"npcKael"},
      {text:"Talk to the old man.", next:"npcHedge"},
      {text:"Investigate the hooded figure.", next:"npcVoss"},
      {text:"Ask the barkeep about Morvaine.", next:"barkeep"},
    ],
  },

  npcKael: {
    text:[
      "She watches you approach with the calm appraisal of someone who's killed before and expects to again.",
      "\"Sit or don't,\" she says. \"But don't waste my time.\"",
      "Her name is Kael. Former soldier, now freelance. She's heading south toward Squall's End for work.",
      "\"Morvaine?\" She sets down her cup. \"I know the name. Bounty's been posted from here to the Iron Principalities. Five hundred Golm, dead. A thousand alive, though only a fool would try that.\"",
      "She studies you. \"You're hunting her. I can see it in your face—that look like you've already died and you're just waiting for the world to catch up.\"",
      "\"I'll come with you as far as Squall's End. After that, we'll see. My blade costs 8 Golm a day, but for someone hunting a Wytch?\" She almost smiles. \"Half price.\"",
    ],
    choices:[
      {text:"\"Welcome aboard.\" (Kael joins as party member)", next:"millhavenReturn", effect:{addPartyMember:{...PARTY_MEMBERS.kael}}},
      {text:"\"I work alone.\"", next:"millhavenReturn"},
      {text:"Ask her what she knows about the road ahead.", next:"kaelInfo"},
    ],
  },

  kaelInfo: {
    text:[
      "\"The Gallows Road runs into Squall's End, biggest free port on the coast. That's where the bounty board is, and that's where you'll find anyone else stupid enough to hunt a Wytch.\"",
      "\"But between here and there?\" She leans forward. \"Garran the Flay-King runs a brigand company out of the old watchtower. Calls himself a lord. He's been hitting every caravan on the road, and word is he's got some arrangement with slavers out of the Red Sands.\"",
      "\"You could go around—through the Barrows—but that's its own kind of trouble. Old things sleep in those hills. Things that don't like being woken.\"",
    ],
    choices:[
      {text:"\"I'll take you up on that offer.\" (Kael joins)", next:"millhavenReturn", effect:{addPartyMember:{...PARTY_MEMBERS.kael}}},
      {text:"Thank her and return to the tavern.", next:"millhavenReturn"},
    ],
  },

  npcHedge: {
    text:[
      "The old man smells like grave dirt and herbs. His eyes are milky but sharp.",
      "\"You stink of ash,\" he says before you speak. \"Thornwall ash. I can smell it.\"",
      "He's a hedge-priest. No god answers his prayers anymore, but he knows things—old things, the kind written in blood on cave walls.",
      "\"Morvaine was not always what she is. She was a Prelate once, a healer. Then she found the Black Book—or it found her. The tome rewrites you, boy. Eats your name and gives you a new one.\"",
      "\"She's heading for the Wytch Spires. There's a ritual she needs—seven villages, seven feedings, and at the seventh she'll open a door that should stay closed.\"",
      "\"Thornwall was the fifth. She needs two more. You have time, but not much.\"",
      "He presses a small vial into your hand. A healing potion, crude but potent.",
    ],
    effect:{addItem:"Healing Potion"},
    choices:[{text:"Thank him and return to the tavern.", next:"millhavenReturn"}],
  },

  npcVoss: {
    text:[
      "The hooded figure doesn't look up as you approach. The letter in their hands bears a wax seal you don't recognize—something coiled, serpentine.",
      "\"If you're going to loom, at least buy me a drink,\" they say. The voice is soft, educated. Noble-born, or trained to sound it.",
      "The figure lowers the hood. Sharp features, dark eyes, a thin smile that doesn't reach them. \"Name's Voss. I'm a collector of rare things. Right now, the rarest thing in this miserable stretch of mud is information about a certain Wytch.\"",
      "\"I represent interested parties who would very much like Morvaine's Black Book recovered. The Wytch herself is your business. The book is mine. For this arrangement, I'll pay 200 Golm up front and another 300 on delivery.\"",
    ],
    choices:[
      {text:"\"Deal.\" (Gain 200 Golm. Quest: Recover the Black Book)", next:"millhavenReturn", effect:{addCoin:200,addQuest:"blackBook"}},
      {text:"\"I don't trust you.\"", next:"vossRefuse"},
      {text:"\"Who are these 'interested parties'?\"", next:"vossPress"},
    ],
  },

  vossPress: {
    text:["Voss's smile doesn't change. \"People who understand that some doors, once opened, cannot be closed. People who have been watching Morvaine's progress with considerable alarm.\"","\"That's all you need to know. The offer stands.\""],
    choices:[
      {text:"\"Fine. Deal.\" (Gain 200 Golm)", next:"millhavenReturn", effect:{addCoin:200,addQuest:"blackBook"}},
      {text:"\"No. Keep your coin and your secrets.\"", next:"millhavenReturn"},
    ],
  },

  vossRefuse: {
    text:["\"Trust is expensive in this part of the world,\" Voss says, folding the letter. \"If you change your mind, I'll be in Squall's End. The Broken Anchor tavern. Ask for the collector.\""],
    choices:[{text:"Return to the tavern.", next:"millhavenReturn"}],
  },

  barkeep: {
    text:[
      "The barkeep is a heavyset woman named Marta. She pours you an ale without asking.",
      "\"Morvaine? She passed through four days ago. Didn't stop. Walked straight through town in the dead of night. My dog wouldn't stop howling.\"",
      "\"She's heading south. Toward Squall's End, or maybe past it—toward the Spires.\"",
      "\"Word of advice? The road south is bad. Garran's boys are thick as fleas on a dog. If you're going, go armed and go careful.\"",
    ],
    choices:[{text:"Thank her and consider your options.", next:"millhavenReturn"}],
  },

  millhavenReturn: {
    text:["You've learned what you can from Millhaven. The road south calls. Morvaine has a four-day lead, and every hour you wait, she gets closer to the Wytch Spires.","Dawn breaks grey and cold. Time to move."],
    choices:[
      {text:"Take the Gallows Road south. (Faster, but Garran's territory)", next:"garranTerritory"},
      {text:"Cut through the Black Barrows. (Slower, but avoids the brigands)", next:"barrowsApproach"},
    ],
  },

  // ===== ACT 2: GARRAN'S TERRITORY / BARROWS =====
  garranTerritory: {
    text:[
      "THE WATCHTOWER",
      "—",
      "Garran's watchtower rises from the marsh like a rotten tooth. It was imperial once—you can see the old eagle carved above the door, defaced now with crude paint. Smoke rises from within. Men move on the battlements.",
      "The road passes within bowshot. There's no going around without losing a day in the swamp.",
      "As you approach, a voice calls down from the wall.",
      "\"State your business or catch an arrow!\"",
    ],
    choices:[
      {text:"\"Just a traveler. I'll pay the toll.\"", next:"garranToll"},
      {text:"\"I'm here for Garran. I have a proposition.\"", next:"garranProposition"},
      {text:"Try to sneak past at nightfall. (Finesse check DC 15)", next:"garranSneak"},
      {text:"Investigate the iron cages at the crossroads.", next:"ironwoodGibbet"},
    ],
  },

  garranToll: {
    text:["They open the gate and escort you in. A dozen brigands in mismatched armor watch you with the hungry eyes of men who've forgotten what honest work looks like.","Garran himself sits on a stolen throne in the tower's great hall. He's bigger than you expected—a former pit-fighter by the look of him, with arms like knotted rope and a face like hammered meat.","\"Toll's 50 Golm,\" he says. \"Or everything you've got if it's less.\""],
    choices:[
      {text:"Pay 50 Golm.", next:"garranPaid", check:"coin50"},
      {text:"\"That's robbery.\" (Fight Garran)", next:"garranFight"},
    ],
  },

  garranPaid: {
    text:["You count out the coin. Garran weighs it, nods.","\"Smart. I like smart people. They live longer.\" He waves you through.","On the way out, one of his men whispers to you: \"The Ash Road, two miles south. A slaver caravan. They've got people from Thornwall. Survivors.\"","Your blood goes cold."],
    effect:{halveCoin:true},
    choices:[
      {text:"Press south toward the slaver caravan.", next:"slaverCaravan"},
      {text:"Ignore it. Morvaine is your only quarry.", next:"squallsEnd"},
    ],
  },

  garranProposition: {
    text:["Garran listens. His eyes are small and cunning in that ruined face.","\"A proposition, is it? I like propositions. They usually mean someone wants me to kill someone else.\" He grins. \"Speak.\""],
    choices:[
      {text:"\"I'm hunting Morvaine the Wytch. Let me pass, and I'll bring you her head—and the bounty.\"", next:"garranDeal"},
      {text:"\"I hear you work with slavers. I'm looking for survivors from Thornwall.\"", next:"garranSlavers"},
    ],
  },

  garranDeal: {
    text:["Garran leans forward. \"Five hundred Golm, is it? Split it with me and you walk free. Refuse...\" He gestures at his men. There are a lot of them.","\"Deal?\""],
    choices:[
      {text:"\"Deal.\" (Garran lets you pass. You owe him half the bounty.)", next:"slaverCaravan", effect:{addQuest:"garranDebt"}},
      {text:"\"I don't split with road trash.\" (Fight Garran)", next:"garranFight"},
    ],
  },

  garranSlavers: {
    text:["Something shifts in Garran's face. The humor drains out like water from a cracked jug.","\"The slavers are my business partners, friend. And those people are merchandise.\" He stands. All six and a half feet of him.","\"You can leave. Or you can die here. Pick.\""],
    choices:[
      {text:"Leave. For now.", next:"slaverCaravan"},
      {text:"\"I pick the third option.\" (Fight Garran)", next:"garranFight"},
    ],
  },

  garranFight: {
    text:["BOSS FIGHT: GARRAN THE FLAY-KING","—","Garran kicks over the table and draws a cleaver the size of your forearm. His men form a ring. This is entertainment for them.","\"Finally,\" he breathes. \"Someone with spine.\""],
    combat:{enemies:["bossGarran","brigand"],type:"boss"},
    choices:[{text:"Search the watchtower.", next:"garranAfterFight"}],
  },

  garranAfterFight: {
    text:["Garran's men scatter like rats when their king falls. You find 85 Golm in his quarters, a decent blade, and a ledger—records of his dealings with the slavers.","The ledger names the slaver operation: \"The Iron Madam's caravan, Ash Road, rotating schedule.\" It includes routes and camp locations.","With Garran dead, the road south is open."],
    effect:{addCoin:85,addQuest:"slaverLedger"},
    choices:[
      {text:"Hunt the slaver caravan.", next:"slaverCaravan"},
      {text:"Press on to Squall's End.", next:"squallsEnd"},
    ],
  },

  garranSneak: {
    text:["You wait for nightfall. The marsh swallows the moonlight."],
    check:{ability:"Finesse",dc:15,
      success:{text:["You slip past the watchtower like a ghost. The sentries never see you. By dawn, you're well south, and the tower is a dark smudge on the horizon."],next:"slaverCaravan"},
      fail:{text:["A sentry spots you. An arrow hisses past your ear.","\"RUNNER! Get the boys!\"","You sprint into the marsh. They chase you for an hour before you lose them in the reeds, but you take an arrow graze."],next:"slaverCaravan",effect:{loseStrike:1}}
    },
    choices:[],
  },

  slaverCaravan: {
    text:[
      "THE ASH ROAD — SLAVER CAMP",
      "—",
      "You find them at dusk. Three wagons, iron-barred. A dozen slavers in the uniform of the Red Sands—loose robes over chain, curved blades at their hips. And in the wagons, huddled shapes. People.",
      "Among them, you recognize faces. Thornwall faces. Survivors of the massacre, sold like cattle.",
      "A woman commands the operation. They call her the Iron Madam—tall, whip-thin, with a voice like cracking ice. She inspects her merchandise with the detachment of a butcher examining cuts of meat.",
    ],
    choices:[
      {text:"Attack at nightfall. Free the prisoners.", next:"slaverFight"},
      {text:"Try to buy the Thornwall survivors. (Requires 150+ Golm)", next:"slaverBuy",check:"coin150"},
      {text:"Scout the camp for weaknesses. (Insight check DC 13)", next:"slaverScout"},
    ],
  },

  slaverScout: {
    text:["You circle the camp, watching."],
    check:{ability:"Insight",dc:13,
      success:{text:["You notice the guards change shifts at midnight. There's a gap—three minutes where only two men watch the wagons. The keys hang on the Iron Madam's belt.","You also spot a weakness: the wagon axles are old. One good hit would break them, blocking the road and preventing escape.","This information will help in the fight."],next:"slaverFightAdvantage"},
      fail:{text:["You can't find an obvious weakness. The camp is well-organized. You'll have to go in hard."],next:"slaverFight"}
    },
    choices:[],
  },

  slaverFightAdvantage: {
    text:["You strike at the shift change. The advantage is yours.","BOSS FIGHT: THE IRON MADAM","—","The Iron Madam wakes fast—she sleeps in her armor, blade beneath her pillow. But you're already among them, and chaos is your ally."],
    combat:{enemies:["bossIronMadam","slaver"],type:"boss",advantage:true},
    choices:[{text:"Free the prisoners.", next:"slaverAfterFight"}],
  },

  slaverFight: {
    text:["BOSS FIGHT: THE IRON MADAM","—","You come in hard and fast. The camp erupts.","The Iron Madam draws her blade with the easy grace of someone who's killed more people than she can count. \"Another hero,\" she sighs. \"How tedious.\""],
    combat:{enemies:["bossIronMadam","slaver","slaver"],type:"boss"},
    choices:[{text:"Free the prisoners.", next:"slaverAfterFight"}],
  },

  slaverBuy: {
    text:["The Iron Madam considers your offer.","\"One hundred fifty for the lot? They're worth twice that in Ocileb.\" She studies you. \"But carrying merchandise through wytch-country is expensive. Done.\"","You pay. The Thornwall survivors stumble free, blinking in the light. Among them is a boy who remembers you. He grabs your hand and won't let go."],
    effect:{addCoin:-150},
    choices:[{text:"Send the survivors north to Millhaven. Press on.", next:"squallsEnd"}],
  },

  slaverAfterFight: {
    text:[
      "The Iron Madam falls. The survivors pour from the wagons—a dozen souls, thin and bruised but alive.",
      "Among them, old Hester from Thornwall. She grabs your arm with surprising strength.",
      "\"She took something from us,\" Hester whispers. \"Not just our lives. Our names. I can feel it—a hole where my name used to be. Morvaine feeds on more than blood, child. She feeds on identity. On self. That's what the ritual needs.\"",
      "You find 120 Golm, a ring of keys, and a map showing the slaver routes—all roads lead to Squall's End.",
    ],
    effect:{addCoin:120},
    choices:[{text:"Send the survivors north. Continue to Squall's End.", next:"squallsEnd"}],
  },

  // ===== BARROWS PATH =====
  barrowsApproach: {
    text:[
      "THE BLACK BARROWS",
      "—",
      "The Barrows are older than memory. Low hills, arranged in concentric rings, each one a tomb for kings whose names are dust. The grass here is black—not burned, but grown that way, as if the earth itself is in mourning.",
      "The wind makes sounds like voices. Your skin crawls.",
      "You make camp at the edge. In the night, something scratches at the stones of the nearest barrow. Long nails on old rock.",
      "Dawn comes grey. The scratching stopped an hour ago.",
    ],
    choices:[
      {text:"Cross through the Barrows quickly. Stay on the surface.", next:"barrowsSurface"},
      {text:"Enter the largest barrow. There might be weapons or gold inside.", next:"barrowsDeep"},
    ],
  },

  barrowsSurface: {
    text:["You move fast, keeping to the ridgelines. The dead stir below you—you can feel it, a vibration in the earth like a held breath.","Halfway through, you encounter a pair of ghouls feeding on something you don't want to identify."],
    combat:{enemies:["ghoul","ghoul"],type:"normal"},
    choices:[{text:"Press through to the other side.", next:"barrowsExit"}],
  },

  barrowsDeep: {
    text:[
      "THE BARROW KING'S TOMB",
      "—",
      "The barrow opens like a wound in the hillside. Stone steps descend into blackness. The air smells of dust and something older—something that was alive once and forgot to stop.",
      "Inside, the walls are carved with scenes of battle. A king in horned armor, leading armies against things with too many eyes. At the bottom, a chamber. A throne. And on it, something that should not be sitting upright.",
      "The Barrow King. Dead for a thousand years, but his eyes open as you enter. Blue fire burns in empty sockets.",
      "\"WHO WAKES ME?\" The voice comes from everywhere.",
    ],
    choices:[
      {text:"\"A hunter, chasing a Wytch. I mean no disrespect.\"", next:"barrowKingTalk"},
      {text:"Draw your weapon.", next:"barrowKingFight"},
    ],
  },

  barrowKingTalk: {
    text:[
      "The Barrow King's skull tilts. The flames in his eyes flicker.",
      "\"A WYTCH. YES. I FELT HER PASS. SHE STINKS OF THE OLD HUNGER—THE VOID BETWEEN STARS.\"",
      "\"I WILL LET YOU PASS. MORE—I WILL GIVE YOU A GIFT. BUT GIFTS FROM THE DEAD CARRY WEIGHT, MORTAL. YOU WILL OWE ME A FAVOR, TO BE COLLECTED WHEN I CHOOSE.\"",
      "\"DO YOU ACCEPT?\"",
    ],
    choices:[
      {text:"\"I accept.\" (Gain Rune-Carved weapon tag: +2 saves vs magic)", next:"barrowsExit", effect:{addWeaponTag:"Rune-Carved",addQuest:"barrowDebt"}},
      {text:"\"I'll make my own luck.\" (Fight the Barrow King)", next:"barrowKingFight"},
      {text:"\"What kind of favor?\"", next:"barrowKingClarify"},
    ],
  },

  barrowKingClarify: {
    text:["\"THE KIND THAT COSTS. BUT I AM PATIENT. I HAVE BEEN DEAD FOR A THOUSAND YEARS. I CAN WAIT A FEW MORE FOR WHAT I NEED.\"","The flames pulse. \"DECIDE.\""],
    choices:[
      {text:"Accept the bargain.", next:"barrowsExit", effect:{addWeaponTag:"Rune-Carved",addQuest:"barrowDebt"}},
      {text:"Refuse and fight.", next:"barrowKingFight"},
    ],
  },

  barrowKingFight: {
    text:["BOSS FIGHT: THE BARROW KING","—","The dead king rises from his throne. Ancient armor clatters. A sword of black iron materializes in his grip, cold as a grave.","\"THEN YOU JOIN MY COURT.\"","From the walls, skeletal hands claw free of the stone."],
    combat:{enemies:["bossBarrowKing","skeleton","skeleton"],type:"boss"},
    choices:[{text:"Take what you can and leave.", next:"barrowsExit", effect:{addCoin:200}}],
  },

  barrowsExit: {
    text:["You emerge from the Barrows as the sun sets. The air tastes clean after the dust of the dead. Ahead, the road descends toward the coast, and you can smell salt on the wind.","Squall's End is a day's march south. Morvaine's trail leads there—ash marks on the trees, dead birds with their eyes burned out. She's close."],
    choices:[{text:"March to Squall's End.", next:"squallsEnd"}],
  },

  // ===== ACT 3: SQUALL'S END =====
  squallsEnd: {
    text:[
      "SQUALL'S END",
      "—",
      "The largest free port on the coast is a screaming, stinking, beautiful mess. Ships from every nation crowd the harbor. The streets are rivers of mud and commerce. You can buy anything in Squall's End—weapons, information, loyalty, and things darker still.",
      "Morvaine was here. You can feel it. The taverns buzz with stories: a woman in rags who walked through the night market and every candle guttered as she passed.",
      "You have leads to follow and preparations to make before the final hunt. The Wytch Spires are three days north, through the Ashwood. Morvaine is heading there. You need to be ready.",
    ],
    choices:[
      {text:"Visit the Bounty Board for information.", next:"bountyBoard"},
      {text:"Find the weapon merchant.", next:"weaponShop"},
      {text:"Rest at the inn. (Full heal, 15 Golm)", next:"restInn"},
      {text:"Visit the Chapel of Ainerth.", next:"chapelAinerth"},
      {text:"Check the Broken Anchor for Voss. (If you met him)", next:"vossReturn"},
      {text:"Descend into the Underdocks.", next:"underdocks"},
      {text:"Head straight for the Wytch Spires. No more delays.", next:"ashwoodRoad"},
    ],
  },

  bountyBoard: {
    text:[
      "The bounty board outside the harbormaster's office is thick with notices. Most are the usual—petty thieves, runaway debtors, a missing ship.",
      "But one notice dominates: MORVAINE, THE ASH-TONGUED. 500 GOLM DEAD. 1,000 ALIVE. APPROACH WITH EXTREME CAUTION. LAST SEEN HEADING NORTH TOWARD THE WYTCH SPIRES.",
      "Below it, in smaller script: \"Information regarding Morvaine's weaknesses can be obtained from Brother Ashford at the Chapel of Ainerth, Dock Ward.\"",
    ],
    choices:[
      {text:"Visit Brother Ashford at the chapel.", next:"chapelAinerth"},
      {text:"Return to the city.", next:"squallsEnd"},
    ],
  },

  brotherAshford: {
    text:[
      "The chapel is small, damp, and mostly empty. Brother Ashford is a gaunt man with the look of someone who hasn't slept in weeks.",
      "\"You're hunting her,\" he says. \"Good. Someone must.\"",
      "\"Morvaine draws power from her Black Book—a flesh-bound grimoire that contains the stolen names of her victims. Destroy the book, and her power breaks. But the book cannot be destroyed by mundane means. It must be burned in consecrated fire—or fed to the Void, if you can find a tear.\"",
      "\"She is weakest at dawn, when the night's power fades. And she fears iron that has been blessed—Cold Iron, they call it. If you can wound her with it, her healing slows.\"",
      "He gives you a vial of holy oil. \"Anoint your blade with this before you face her. It won't kill her, but it will make her bleed.\"",
    ],
    effect:{addItem:"Holy Oil (anoint weapon: +2 vs Morvaine)"},
    choices:[{text:"Return to the city.", next:"squallsEnd"}],
  },

  weaponShop: {
    text:[
      "IRON MARTA'S FORGE",
      "—",
      "The smithy is a wall of heat and noise. Iron Marta is an Empire Dwarf, barely four feet tall but built like a barrel of muscle. She eyes you with professional interest.",
      "\"Buying or browsing?\"",
    ],
    shop:true,
    choices:[{text:"Leave the shop.", next:"squallsEnd"}],
  },

  restInn: {
    text:["You rent a room at the Broken Anchor. The bed is hard, the blankets smell of old sweat, but after the road, it feels like a king's chamber.","You sleep deep and dreamless. When you wake, your wounds have closed and your strength has returned.","(All Strikes restored)"],
    effect:{fullHeal:true,addCoin:-15},
    choices:[{text:"Return to the city.", next:"squallsEnd"}],
  },

  // ===== ACT 4: THE FINAL HUNT =====
  ashwoodRoad: {
    text:[
      "THE ASHWOOD",
      "—",
      "The forest is wrong. Trees stand leafless and pale, their bark covered in a fine grey ash that falls like snow. No birds sing. No insects buzz. The silence is a living thing that presses against your ears.",
      "Morvaine's trail is unmistakable now—the ash thickens as you follow, and occasionally you find the remains of animals: a deer, a fox, a crow. All drained. All empty husks.",
      "On the second day, you find a camp. Still warm. She's close—hours, not days.",
      "The Wytch Spires rise ahead, black needles against a bruised sky.",
    ],
    choices:[
      {text:"Push forward. Close the distance.", next:"spireApproach"},
      {text:"Make camp. Rest before the final fight.", next:"ashwoodCamp"},
      {text:"Investigate smoke rising from the east. Another village?", next:"charredVillage"},
    ],
  },

  ashwoodCamp: {
    text:["You risk a small fire. The ash-trees give poor shelter, but you need your strength for what comes next.","In the night, you hear singing—thin, reedy, wrong. It comes from the direction of the Spires. The sound makes your teeth ache.","You sleep poorly, but you sleep. (Heal 1d4 Strikes)"],
    effect:{healPartial:true},
    choices:[{text:"March for the Spires at dawn.", next:"spireApproach"}],
  },

  spireApproach: {
    text:[
      "THE WYTCH SPIRES",
      "—",
      "They were prisons once, when the God Binder ruled. Towers of black stone, impossibly tall, impossibly thin, reaching for a sky that seems to recoil from their touch. There are seven of them, arranged in a circle, and at their center is a courtyard of cracked flagstones.",
      "Morvaine is there. You see her from the treeline—standing at the center of the courtyard, her Black Book open before her. The air around her shimmers and distorts, and from the book pour whispers—hundreds of voices, the stolen names of the dead.",
      "She's beginning the ritual. You're almost too late.",
      "Her voice carries across the dead air: \"I know you've been following me. Come out. Let me see the face of the fool who thinks they can stop what's already begun.\"",
    ],
    choices:[
      {text:"Step forward. Face her.", next:"finalConfrontation"},
      {text:"Circle around. Attack from the shadows. (Finesse DC 16)", next:"finalStealth"},
    ],
  },

  finalStealth: {
    text:["You move through the dead trees, silent as a grave."],
    check:{ability:"Finesse",dc:16,
      success:{text:["You get behind her. She doesn't see you—or pretends not to. But you're in position. When the fight starts, you'll have the advantage."],next:"finalFightAdvantage"},
      fail:{text:["A branch snaps. Her head turns, and those empty eyes find you.","\"There you are,\" she whispers, and the shadows lunge."],next:"finalFight"}
    },
    choices:[],
  },

  finalConfrontation: {
    text:[
      "You step into the courtyard. Morvaine watches you approach. Up close, she's worse than you remembered—the skin stretched too tight over bones that seem to move beneath it, the eyes like holes burned in parchment.",
      "\"Thornwall,\" she says, and smiles. It's the worst thing you've ever seen. \"I remember Thornwall. You taste like grief and iron. I left you alive because grief is the finest seasoning.\"",
      "\"But you've come to kill me. How... predictable.\"",
      "She raises one hand. The shadows around the Spires begin to breathe.",
    ],
    choices:[
      {text:"\"You killed everyone I loved. Today, you die.\"", next:"finalFight"},
      {text:"\"Give me the Black Book and I'll let you run.\"", next:"finalNegotiate"},
    ],
  },

  finalNegotiate: {
    text:["Morvaine laughs. It sounds like paper tearing.","\"The Book? The Book is me, child. I am its pages. It is my tongue. You ask me to give you my soul.\" Her smile fades.","\"No more words. Let us see what you're made of.\""],
    choices:[{text:"Draw your weapon.", next:"finalFight"}],
  },

  finalFightAdvantage: {
    text:["FINAL BOSS: MORVAINE THE ASH-TONGUED","—","You strike from the shadows. Your first blow draws blood—black, thick, wrong. She screams, and the sound shakes dust from the Spires.","\"CLEVER!\" she shrieks. \"BUT NOT CLEVER ENOUGH!\""],
    combat:{enemies:["bossWytch"],type:"boss",advantage:true},
    choices:[{text:"...", next:"ending"}],
  },

  finalFight: {
    text:["FINAL BOSS: MORVAINE THE ASH-TONGUED","—","The air splits. Shadow pours from Morvaine like ink from a broken bottle. The courtyard darkens. The Spires begin to hum.","Her hands open, and those threads of not-light reach for you—the same threads that killed Thornwall.","This is it. Everything has led here."],
    combat:{enemies:["bossWytch"],type:"boss"},
    choices:[{text:"...", next:"ending"}],
  },

  ending: {
    text:[
      "Morvaine falls.",
      "She doesn't die like a human. She comes apart—the stolen names pour from her in a river of whispers, rising into the air like smoke, dispersing into the wind. Hundreds of voices, maybe thousands, all saying their own names one final time before they fade.",
      "The Black Book lies on the flagstones, its pages blank now. Empty. Whatever it was, it's spent.",
      "Morvaine's body shrinks, desiccates, becomes the husk of the woman she was before the Book found her. For a moment—just a moment—she looks human. Afraid. Young.",
      "Then she's dust, and the wind takes her.",
      "The Wytch Spires go quiet. The hum dies. The shadows retreat to their proper places. Somewhere in the distance, a bird sings—the first birdsong you've heard in days.",
      "It's over.",
      "The walk back to Squall's End takes three days. You collect the bounty—500 Golm for the Wytch's end. It's enough to start over. Enough to buy a farm, or a ship, or a new name in a new city.",
      "But you don't. Not yet. Because old Hester's words echo in your skull: 'She feeds on identity. On self.'",
      "You look at your hands—scarred, calloused, bloodied—and you wonder how much of yourself you lost along the way. How much of you is still the person who crawled from Thornwall's ashes.",
      "Maybe it doesn't matter. Maybe the point was never to come back whole. Maybe the point was just to come back.",
      "You turn your face to the sea, and you breathe, and you begin again.",
      "— END —",
    ],
    choices:[{text:"Play Again", next:"restart"}],
  },

  // ===== THE UNDERDOCKS =====
  underdocks: {
    text:[
      "THE UNDERDOCKS",
      "—",
      "The smell hits you first—brine and rot and something worse beneath it. The tunnels below Squall's End weren't built by the city. They're older, carved when this coast belonged to something else.",
      "Now they belong to no one and everyone. Smugglers. Deserters. People with nowhere left to run.",
      "Water drips from the ceiling. Torchlight wavers against slick stone. Voices echo from deeper in—a card game turning ugly, someone selling something they shouldn't.",
      "You've descended because the trail led here. Morvaine passed through the Underdocks on her way north. Someone down here saw her. Someone always sees.",
    ],
    choices:[
      {text:"Find the smuggler called Fen. He trades in information.", next:"underdocksSmugglers"},
      {text:"Check out the Blood Circus fighting pit.", next:"underdocksPit"},
      {text:"Push deeper into the old tunnels.", next:"underdocksDeep"},
      {text:"Seek out Varg the Knife's den. (If quest active)", next:"vargLair"},
      {text:"Return to the surface.", next:"squallsEnd"},
    ],
  },

  underdocksSmugglers: {
    text:[
      "Fen operates out of a converted cistern. The water's long gone, replaced by crates and barrels of dubious origin. The man himself is lean and wary, with eyes that calculate your worth before you open your mouth.",
      "\"Morvaine?\" He sets down a flask. \"Yeah, I saw her. Hard to miss. She bought passage on a river barge—headed upriver, not the road. Smart. The Ashwood Road's crawling with Garran's boys and worse.\"",
      "He leans forward. \"But information ain't free. I got a problem. Harbor Captain Rennik—bent bastard runs the dock watch. He's been squeezing my operation, taking more than his cut. You deal with him, I'll tell you everything I know about the Wytch's route.\"",
    ],
    choices:[
      {text:"Accept the job. (Start quest: The Smuggler's Bargain)", next:"underdocks", effect:{addQuest:"smugglerBargain"}},
      {text:"(Insight DC 12) Try to read if Fen's telling the truth.", next:"underdocksFenInsight"},
      {text:"Decline and leave.", next:"underdocks"},
    ],
  },

  underdocksFenInsight: {
    text:["You study Fen's face. The micro-expressions. The way his hand rests too casually near a knife."],
    check:{ability:"Insight",dc:12},
    onSuccess:{
      text:"He's lying—not about Rennik, but about why. This isn't about money. It's personal. Rennik has something on Fen, or someone Fen cares about. The desperation is real, even if the story's half-truth.",
      next:"underdocks",
    },
    onFail:{
      text:"You can't get a read on him. Could be genuine. Could be setting you up. Hard to say.",
      next:"underdocks",
    },
  },

  underdocksPit: {
    text:[
      "The Blood Circus isn't a circus. It's a pit carved into the bedrock, lit by torches and packed with bodies. The fights are bare-knuckle, no rules, first blood or last breath.",
      "In the ring: a stocky dwarf with fists like hammerstones and a face that's taken every punch the world's got. His opponent, some dockside thug, is already bleeding.",
      "The dwarf doesn't showboat. He just works. Left hook. Right hook. The thug goes down and stays down.",
      "The crowd roars. The dwarf—Dorn, they call him—spits blood and waits for the next fight.",
    ],
    choices:[
      {text:"Challenge Dorn. Win, and maybe he'll join you.", next:"underdocksPitFight"},
      {text:"Talk to Dorn after his fight.", next:"underdocksDornTalk"},
      {text:"Leave the pit.", next:"underdocks"},
    ],
  },

  underdocksPitFight: {
    text:[
      "ARENA FIGHT",
      "—",
      "You step into the ring. The crowd noise fades to a roar, then a pulse. Dorn cracks his knuckles.",
      "\"Alright then. Let's see what you've got.\"",
    ],
    combat:{enemies:["pitFighter","dockThug"],type:"normal"},
    choices:[{text:"Catch your breath and talk to Dorn.", next:"underdocksDornRecruit", effect:{addCoin:60}}],
  },

  underdocksDornTalk: {
    text:[
      "Dorn doesn't look up when you approach. He's wrapping his knuckles with fresh cloth, methodical.",
      "\"You want something, or you just like watching people bleed?\"",
      "You tell him about Morvaine. About Thornwall. About the hunt.",
      "He stops wrapping. Looks at you. \"A Wytch, huh? Been a while since I fought something that could actually kill me. Pit fights get old.\"",
      "He stands. \"You win your next fight in the ring, I'll come with you. Otherwise, you're not worth my time.\"",
    ],
    choices:[
      {text:"Accept the challenge.", next:"underdocksPitFight"},
      {text:"Leave.", next:"underdocks"},
    ],
  },

  underdocksDornRecruit: {
    text:[
      "Dorn nods, almost respectful. \"You can take a hit. That's good. Most people hunting Wytches can't.\"",
      "He gathers his gear—a worn pack, a maul that's seen better days. \"I'm in. But if this gets us killed, I'm haunting you.\"",
    ],
    choices:[{text:"Welcome him to the group.", next:"underdocks", effect:{addPartyMember:{...PARTY_MEMBERS.dorn}}}],
  },

  underdocksDeep: {
    text:[
      "The tunnels go deeper than they should. The stonework changes—smoother, older, wrong. Symbols carved into the walls that hurt to look at.",
      "Hex-marks. Morvaine's signature. She was here, and recently.",
      "The air tastes like copper and ash. Something pulses in the dark ahead—not sound, not light, but something between.",
    ],
    check:{ability:"Resolve",dc:14},
    onSuccess:{
      text:"You steady yourself. Push through the psychic pressure. The marks are a warning, or a trap, or both. You press on.",
      next:"underdocksDeepLoot",
    },
    onFail:{
      text:"The pressure splits your skull. You stumble back, nose bleeding. The dark laughs.",
      next:"underdocksDeepFail",
      effect:{loseStrike:1},
    },
  },

  underdocksDeepLoot: {
    text:[
      "In an alcove, half-buried: ritual components. Wytch-marks burned into bone. And something else—an amulet of blackened bone, still warm.",
      "It hums faintly. Protective magic, old and ugly, but real.",
    ],
    choices:[{text:"Take the Wytch-Bone Amulet and return.", next:"underdocks", effect:{addItem:"Wytch-Bone Amulet (+1 DEF vs magic)"}}],
  },

  underdocksDeepFail: {
    text:["You retreat, head pounding. The tunnels here are too dangerous. Maybe later, with better preparation."],
    choices:[{text:"Return to the main tunnels.", next:"underdocks"}],
  },

  rennikFight: {
    text:[
      "BOSS FIGHT: HARBOR CAPTAIN RENNIK",
      "—",
      "Rennik's office reeks of bribe money and old blood. The man himself is broad-shouldered, competent, and utterly corrupt.",
      "\"Fen sent you? That rat. Fine. Let's make this quick. I got a schedule.\"",
      "He draws a cutlass, and two of his watchmen flank him, shields up.",
    ],
    combat:{enemies:["harborCaptain","corruptGuard","corruptGuard"],type:"boss"},
    choices:[{text:"Search the office and return to Fen.", next:"rennikAfter", effect:{addCoin:100}}],
  },

  rennikAfter: {
    text:[
      "Fen examines Rennik's ledger with something close to satisfaction. \"Good. He had that coming.\"",
      "He looks up. \"You want what I know. Fair deal. Morvaine took a barge called the Silt Queen—river route, not the road. She paid the captain in something that wasn't coin. He looked... wrong, after. Like he'd aged ten years in a minute.\"",
      "\"She's faster than you think. River's quicker than the road. If you're chasing her, you need to move. She's heading for the Wytch Spires, and she's almost there.\"",
    ],
    choices:[{text:"Thank Fen and return to the surface.", next:"squallsEnd"}],
  },

  // ===== THE CHARRED VILLAGE =====
  charredVillage: {
    text:[
      "THE CHARRED VILLAGE OF BRANNOC",
      "—",
      "The smoke rises lazy and black. From a distance, you thought it might be cookfires. Up close, you know better.",
      "Brannoc—or what's left of it—is Thornwall all over again. Twenty buildings reduced to char and bone. Bodies in the street with their chests cracked open like eggs, the life pulled out of them and consumed.",
      "Morvaine's work. Another village. Another harvest.",
      "You walk the ruins with your jaw tight and your fists tighter. The smell is familiar now. You hate that.",
    ],
    choices:[
      {text:"Search for survivors.", next:"charredSurvivor"},
      {text:"Investigate Morvaine's trail.", next:"charredInvestigate"},
      {text:"Scavenge for supplies among the ruins.", next:"charredAmbush"},
      {text:"Move on. There's nothing here for you.", next:"ashwoodRoad"},
    ],
  },

  charredSurvivor: {
    text:[
      "You find her in a cellar, hidden beneath a collapsed farmhouse. A young woman, maybe twenty, with a bow across her lap and eyes that have seen too much.",
      "She doesn't flinch when you descend. Just watches.",
      "\"You're hunting her,\" she says. Not a question.",
      "Her name is Sable. She tracked Morvaine here from a village to the south—another burned husk on the Wytch's trail. She arrived too late. Just like you did at Thornwall.",
      "\"I'm good with a bow,\" she says. \"Better at tracking. And I want her dead just as much as you do. Maybe more.\"",
    ],
    choices:[
      {text:"Offer her a place in your group.", next:"charredSableJoin", effect:{addPartyMember:{...PARTY_MEMBERS.sable}}},
      {text:"Tell her to go home. This isn't her fight.", next:"charredSableRefuse"},
    ],
  },

  charredSableJoin: {
    text:[
      "Sable nods once, sharp. \"Good. Let's move.\"",
      "She gathers her gear—a well-maintained longbow, a quiver of grey-fletched arrows, and a knife that's seen use. Professional. Controlled. Dangerous.",
      "You've seen that look before. The look of someone who's decided dying is acceptable if it means the target dies first.",
    ],
    choices:[{text:"Leave the ruins together.", next:"ashwoodRoad"}],
  },

  charredSableRefuse: {
    text:[
      "She doesn't argue. Just stands, shoulders her pack, and walks past you up the cellar steps.",
      "At the threshold, she pauses. \"When you find her, make it hurt.\"",
      "Then she's gone, swallowed by the smoke.",
    ],
    choices:[{text:"Return to your search.", next:"charredVillage"}],
  },

  charredInvestigate: {
    text:[
      "You follow the ash trail east, toward the treeline. She made camp here—recently. The fire pit is still warm.",
      "Ritual components scattered across a flat stone: bones, dried flowers, something that might have been a heart once. The markings are fresher than the ones in the Underdocks, more elaborate.",
    ],
    check:{ability:"Insight",dc:13},
    onSuccess:{
      text:"You piece it together. Notes scrawled in old script. Part of the ritual Morvaine's building. The pattern. These aren't random killings—they're mapped. Geometric. Each village is a point in a constellation she's drawing across the land. The Wytch Spires are the center. The climax. You take the notes. They might give you an edge when the time comes.",
      next:"charredVillage",
      effect:{addItem:"Ritual Notes (+2 to first attack vs Morvaine)"},
    },
    onFail:{
      text:"The symbols blur together. You can't make sense of it. Just more death and strange magic. You move on.",
      next:"charredVillage",
    },
  },

  charredAmbush: {
    text:[
      "As you turn to leave, movement. A whistle. Then voices.",
      "Imperial deserters—three of them, plus a brigand who looks like he leads. They've moved into the ruins to pick the bones clean.",
      "\"Fresh meat,\" the brigand says, grinning. \"Drop your coin and maybe we let you walk.\"",
      "You don't drop your coin.",
    ],
    combat:{enemies:["deserter","deserter","deserter","brigand"],type:"normal"},
    choices:[{text:"Search the bodies and move on.", next:"ashwoodRoad", effect:{addCoin:40,addItem:"Decent Blade"}}],
  },

  // ===== THE IRONWOOD GIBBET =====
  ironwoodGibbet: {
    text:[
      "THE IRONWOOD GIBBET",
      "—",
      "The crossroads is marked by dead trees and deader men. Iron cages dangle from the branches, each one holding the remains of someone who crossed Garran or didn't pay their debts. Most are just bones now.",
      "But one cage still holds a living man.",
      "He's middle-aged, well-dressed once. A merchant by the look of his clothes. He watches you approach with the desperate hope of a drowning man.",
      "\"Please,\" he rasps. \"Three days. No water. Garran's men—they said they'd come back. They haven't. Please.\"",
    ],
    choices:[
      {text:"(Might DC 12) Break the lock and free him.", next:"gibbetFree"},
      {text:"(If you have lockpicks) Pick the lock.", next:"gibbetFree"},
      {text:"Leave him. Not your problem.", next:"gibbetLeave"},
      {text:"Move on quickly.", next:"garranPaid"},
    ],
  },

  gibbetFree: {
    text:[
      "The lock breaks with a wrench. The merchant—Torvin, he says his name is—collapses to the ground, gasping.",
      "\"Thank you. Gods. Thank you.\"",
      "When he can stand, he fumbles in his shirt and produces a small leather purse. Seventy-five Golm. \"It's all I have left, but it's yours.\"",
      "He also tells you about a cache—goods he buried before Garran's men took him. Quality weapons and gear, hidden three miles south.",
    ],
    check:{ability:"Might",dc:12},
    onSuccess:{
      text:"You free him easily. He's grateful and gives you the coin and directions.",
      next:"gibbetCache",
      effect:{addCoin:75},
    },
    onFail:{
      text:"You free him. He's grateful but weak. He gives you what he can.",
      next:"garranPaid",
      effect:{addCoin:75},
    },
  },

  gibbetCache: {
    text:[
      "You find the cache where Torvin said it would be—a false stone beneath a marker tree. Inside: a finely crafted blade and a pouch of coin.",
      "Your choice: take the blade (Keen weapon upgrade) or the coin (150 Golm).",
    ],
    choices:[
      {text:"Take the Keen Blade.", next:"garranPaid", effect:{addWeaponTag:"Keen"}},
      {text:"Take the coin.", next:"garranPaid", effect:{addCoin:150}},
    ],
  },

  gibbetLeave: {
    text:[
      "You turn away. The merchant's pleas follow you down the road, then fade.",
      "Later, camped by the roadside, you can't shake the image. The cage. The eyes. The desperate hope dying.",
    ],
    check:{ability:"Presence",dc:10},
    onSuccess:{
      text:"You steel yourself. You've got bigger problems. The guilt fades, eventually.",
      next:"garranPaid",
    },
    onFail:{
      text:"The guilt settles in your gut like a stone. You're haunted. The man's face follows you. (-1 to Resolve checks until you rest)",
      next:"garranPaid",
      effect:{addQuest:"haunted"},
    },
  },

  // ===== VOSS / VARG QUESTLINE =====
  vossReturn: {
    text:[
      "THE BROKEN ANCHOR BASEMENT",
      "—",
      "Voss is waiting in the back room, surrounded by books that smell like grave dirt. He doesn't look up when you enter.",
      "\"You've made progress,\" he says. \"I can smell Morvaine on you. Or maybe that's just death.\"",
      "He sets down a black quill. \"I have more for you. Information that'll help. But I need a favor first.\"",
      "His eyes meet yours. \"There's a crime lord in the Underdocks. Varg the Knife. He stole something from me—a lockbox. Small, iron, marked with my seal. Get it back, and I'll tell you what you need to know about the Spires.\"",
    ],
    choices:[
      {text:"Accept the job.", next:"underdocks", effect:{addQuest:"vossLockbox"}},
      {text:"Refuse. You don't have time.", next:"squallsEnd"},
    ],
  },

  vargLair: {
    text:[
      "VARG'S DEN",
      "—",
      "The deeper tunnels beneath the Underdocks are Varg's territory. The walls are carved with knife marks—his signature. A reminder that this is a killing ground.",
      "You can smell blood and cheap wine. Voices ahead, laughter with edges.",
    ],
    choices:[
      {text:"(Finesse DC 14) Sneak in quietly.", next:"vargSneak"},
      {text:"Walk in openly. Violence is simpler.", next:"vargFight"},
    ],
  },

  vargSneak: {
    text:["You move through shadow. Quiet as a held breath."],
    check:{ability:"Finesse",dc:14},
    onSuccess:{
      text:"You slip past Varg's guards. His inner sanctum is undefended. The lockbox sits on a table, almost mocking in its simplicity. You take it and leave. No one the wiser.",
      next:"vossReward",
      effect:{addItem:"Voss's Lockbox"},
    },
    onFail:{
      text:"A guard spots you. Whistles. Steel scrapes from sheaths. \"Varg! We got company!\"",
      next:"vargFight",
    },
  },

  vargFight: {
    text:[
      "BOSS FIGHT: VARG THE KNIFE",
      "—",
      "Varg is lean and quick, with twin blades and a smile like cut glass. His men flank him—smugglers and thugs.",
      "\"Bold,\" he says. \"Stupid, but bold. I like that. Let's see how you bleed.\"",
    ],
    combat:{enemies:["bossVargKnife","smuggler","dockThug"],type:"boss"},
    choices:[{text:"Search the lair.", next:"vargAfter"}],
  },

  vargAfter: {
    text:[
      "Varg dies on his knives, bleeding out with that same smile.",
      "You find the lockbox in his quarters, along with a hundred Golm and a poisoned dagger that's worth keeping.",
    ],
    choices:[{text:"Take your prizes and return to Voss.", next:"vossReward", effect:{addCoin:100,addItem:"Poisoned Dagger (+1 dmg, Venomous)"}}],
  },

  vossReward: {
    text:[
      "Voss examines the lockbox, satisfied. \"Good. You're efficient. I respect that.\"",
      "He opens it. Inside: a small book bound in something that isn't leather. He doesn't let you see the pages.",
      "\"Morvaine's heading for the Wytch Spires. You know that. What you don't know is why. The Spires were built by the God Binder, back when gods walked and witches ruled. There's a fire at the top of the central spire—sacred flame that's burned for a thousand years.\"",
      "He taps the lockbox. \"The Black Book—your prize from the bridge—can only be destroyed in that flame. Do so, and you'll weaken Morvaine's ritual. Maybe enough to kill her.\"",
      "He counts out three hundred Golm. \"For your trouble.\"",
    ],
    choices:[{text:"Take the coin and the knowledge.", next:"squallsEnd", effect:{addCoin:300}}],
  },

  // ===== EXPANDED CHAPEL =====
  chapelAinerth: {
    text:[
      "THE CHAPEL OF AINERTH",
      "—",
      "The chapel stands in the Dock Ward, a quiet grey building that smells of incense and old prayers. Inside, candlelight flickers against worn stone.",
      "Brother Ashford is here, as before—an old priest with gentle eyes and a voice like worn velvet. But there's someone else too.",
      "A man in tarnished crusader armor kneels before the altar. His sword rests across his knees, and his head is bowed. Not in prayer. In shame.",
      "Brother Ashford notices you. \"Ah. The hunter returns. Have you come for wisdom, or steel?\"",
    ],
    choices:[
      {text:"Ask about Morvaine's weaknesses.", next:"ashfordWytchLore"},
      {text:"Talk to the crusader.", next:"cadeIntro"},
      {text:"Leave the chapel.", next:"squallsEnd"},
    ],
  },

  cadeIntro: {
    text:[
      "The man doesn't look up when you approach. His armor is scratched, dented. Blood has dried in the joints.",
      "\"Brother Cade,\" Ashford says softly. \"He arrived three days ago. He's... lost.\"",
      "Cade finally lifts his head. His eyes are hard and empty. \"I led a company against the Ashwood cultists. Fifty men. Blessed weapons. Divine mandate. We were supposed to cleanse the forest.\"",
      "His jaw tightens. \"We found the cult. They summoned something. I don't know what. Half my men died screaming. The rest ran. I...\" He looks at his hands. \"I prayed. Nothing answered. So I killed it myself. Alone.\"",
      "\"I'm done with faith. But I'm not done with killing things that need to die.\"",
    ],
    choices:[
      {text:"Offer him a place in your group.", next:"cadeJoin", effect:{addPartyMember:{...PARTY_MEMBERS.brotherCade}}},
      {text:"Leave him to his grief.", next:"chapelAinerth"},
    ],
  },

  cadeJoin: {
    text:[
      "Cade stands. The armor clatters. \"Alright. A Wytch, you said? Good. I've got some prayers left. Let's see if they work on her.\"",
      "He gathers his gear. His sword—a blessed blade, heavy and worn—goes across his back.",
      "Brother Ashford watches with sad eyes. \"Go with the light, Brother. Even if you no longer see it.\"",
    ],
    choices:[{text:"Leave with Cade.", next:"squallsEnd"}],
  },

  ashfordWytchLore: {
    text:[
      "Brother Ashford leads you to a side chapel. Scrolls and old texts are spread across a table.",
      "\"Morvaine the Ash-Tongued. A soul-eater. She was human once, or so the texts claim. A scholar who sought immortality through forbidden ritual. She found it. Or it found her.\"",
      "\"Her weakness? Fire, ironically. The same element she's consumed by. But not regular fire—consecrated flame. The kind that burns in the Wytch Spires. Bring her to that fire, and she can be destroyed.\"",
    ],
    choices:[{text:"Thank him and return to the chapel.", next:"chapelAinerth"}],
  },

  death: {
    text:[
      "THE DARK TAKES YOU",
      "—",
      "You fall. The world tilts and goes grey at the edges. Blood—your blood—pools beneath you, warm at first, then cold.",
      "The last thing you see is the sky, or maybe the ceiling, or maybe nothing at all. It doesn't matter. The hunt is over.",
      "Morvaine walks on. The ritual continues. The doors open.",
      "In Thornwall, the ashes cool.",
      "No one remembers your name.",
    ],
    choices:[{text:"Try Again", next:"restart"}],
  },
};

// SHOP ITEMS
const SHOP_ITEMS = [
  {name:"Longsword (Keen)",cost:200,type:"weapon",tag:"Keen"},
  {name:"Battle Axe (Brutal)",cost:85,type:"weapon",tag:"Brutal"},
  {name:"Chain Mail",cost:2200,type:"armor",def:4,dr:2,slots:2},
  {name:"Healing Potion",cost:50,type:"consumable",heals:3},
  {name:"Antidote",cost:25,type:"consumable",cures:"poison"},
  {name:"Torch (3 pack)",cost:6,type:"item"},
  {name:"Rope (50ft)",cost:8,type:"item"},
  // NEW ITEMS
  {name:"Cold Iron Blade",cost:300,type:"weapon",tag:"Cold Iron (+2 vs supernatural)"},
  {name:"Brigandine Armor",cost:350,type:"armor",def:3,dr:3,slots:2},
  {name:"Healing Potion (Greater)",cost:120,type:"consumable",heals:5},
  {name:"Fire Oil (3 uses)",cost:45,type:"consumable"},
  {name:"Warding Charm",cost:80,type:"item"},
  {name:"Lockpicks (Fine)",cost:35,type:"item"},
];

// ============================================================
// MAIN GAME COMPONENT
// ============================================================

export default function TorchesInTheDark() {
  // GAME STATE
  const [phase, setPhase] = useState("title"); // title, prologue, charCreate, playing, combat, shop, death
  const [charStep, setCharStep] = useState(0); // 0-4 for char creation steps
  
  // CHARACTER
  const [charName, setCharName] = useState("");
  const [abilities, setAbilities] = useState({Might:0,Finesse:0,Endurance:0,Insight:0,Resolve:0,Presence:0,Faith:0,Magick:0,Luck:0});
  const [pointsLeft, setPointsLeft] = useState(10);
  const [race, setRace] = useState(null);
  const [grimSort, setGrimSort] = useState(null);
  const [passiveTrait, setPassiveTrait] = useState(null);
  const [activeTrait, setActiveTrait] = useState(null);
  const [equipPack, setEquipPack] = useState(null);
  
  // DERIVED STATS
  const [maxStrikes, setMaxStrikes] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [defense, setDefense] = useState(0);
  const [coin, setCoin] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [weapon, setWeapon] = useState("");
  const [weaponTag, setWeaponTag] = useState("");
  const [armor, setArmor] = useState("");
  const [armorDef, setArmorDef] = useState(0);
  const [armorDR, setArmorDR] = useState(0);
  const [hasShield, setHasShield] = useState(false);
  const [party, setParty] = useState([]);
  const [quests, setQuests] = useState([]);
  const [sortAbilityUses, setSortAbilityUses] = useState({});
  const [traitUses, setTraitUses] = useState(0);
  
  // GAME STATE
  const [currentScene, setCurrentScene] = useState("prologue");
  const [log, setLog] = useState([]);
  const [showCharSheet, setShowCharSheet] = useState(false);
  
  // COMBAT STATE
  const [inCombat, setInCombat] = useState(false);
  const [enemies, setEnemies] = useState([]);
  const [combatLog, setCombatLog] = useState([]);
  const [combatTurn, setCombatTurn] = useState("player");
  const [combatAdvantage, setCombatAdvantage] = useState(false);
  const [afterCombatScene, setAfterCombatScene] = useState(null);
  const [playerActed, setPlayerActed] = useState(false);
  
  const logRef = useRef(null);
  
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log, combatLog]);

  // DICE HELPER
  const rollCheck = (ability, dc) => {
    const mod = abilities[ability] || 0;
    const r = d20();
    const total = r + mod;
    return { roll: r, mod, total, success: total >= dc, dc };
  };

  // INITIALIZE CHARACTER
  const finalizeCharacter = () => {
    const gs = grimSort;
    let ms = gs.strikes;
    if (passiveTrait?.effect?.maxStrikesBonus) ms += passiveTrait.effect.maxStrikesBonus;
    const ep = equipPack;
    const def = 5 + (abilities.Finesse || 0) + (ep.armorDef || 0) + (ep.shield ? 1 : 0);
    
    setMaxStrikes(ms);
    setStrikes(ms);
    setDefense(def);
    setCoin(ep.coin);
    setWeapon(ep.weapon);
    setWeaponTag(ep.weaponTag);
    setArmor(ep.armor || "None");
    setArmorDef(ep.armorDef || 0);
    setArmorDR(ep.armorDR || 0);
    setHasShield(ep.shield || false);
    setInventory([...ep.items]);
    
    // Init sort ability uses
    const uses = {};
    gs.abilities.forEach(a => { uses[a.name] = a.uses >= 99 ? 99 : a.uses; });
    setSortAbilityUses(uses);
    if (activeTrait) setTraitUses(activeTrait.uses);
    
    setPhase("playing");
    setCurrentScene("gallowsRoad");
    setLog([]);
  };

  // SCENE PROCESSING
  const processScene = (sceneId) => {
    if (sceneId === "restart") {
      setPhase("title");
      setCharStep(0);
      setAbilities({Might:0,Finesse:0,Endurance:0,Insight:0,Resolve:0,Presence:0,Faith:0,Magick:0,Luck:0});
      setPointsLeft(10);
      setRace(null);
      setGrimSort(null);
      setPassiveTrait(null);
      setActiveTrait(null);
      setEquipPack(null);
      setQuests([]);
      setParty([]);
      return;
    }
    if (sceneId === "charCreate") {
      setPhase("charCreate");
      return;
    }
    
    const scene = SCENES[sceneId];
    if (!scene) return;
    
    // Apply effects
    if (scene.effect) applyEffect(scene.effect);
    
    // Handle checks
    if (scene.check && typeof scene.check === "object" && scene.check.ability) {
      const result = rollCheck(scene.check.ability, scene.check.dc);
      const outcome = result.success ? scene.check.success : scene.check.fail;
      setLog(prev => [...prev, `[${scene.check.ability} Check: rolled ${result.roll} + ${result.mod} = ${result.total} vs DC ${result.dc} — ${result.success ? "SUCCESS" : "FAILURE"}]`]);
      if (outcome.effect) applyEffect(outcome.effect);
      setLog(prev => [...prev, ...outcome.text]);
      if (outcome.next) {
        setTimeout(() => processScene(outcome.next), 100);
      }
      return;
    }
    
    // Handle combat
    if (scene.combat) {
      setLog(prev => [...prev, ...scene.text]);
      startCombat(scene.combat.enemies, scene.combat.advantage || false, scene.choices?.[0]?.next || "death");
      return;
    }
    
    // Handle shop
    if (scene.shop) {
      setLog(prev => [...prev, ...scene.text]);
      setPhase("shop");
      setCurrentScene(sceneId);
      return;
    }
    
    setCurrentScene(sceneId);
    setLog(prev => [...prev, "", ...scene.text]);
  };

  const applyEffect = (eff) => {
    if (eff.addCoin) setCoin(p => p + eff.addCoin);
    if (eff.halveCoin) setCoin(p => Math.floor(p / 2));
    if (eff.addItem) setInventory(p => [...p, eff.addItem]);
    if (eff.addCompanion) setParty(p => p.length < 3 ? [...p, eff.addCompanion] : p); // Legacy support
    if (eff.addPartyMember) setParty(p => p.length < 3 ? [...p, eff.addPartyMember] : p);
    if (eff.removePartyMember) setParty(p => p.filter(m => m.id !== eff.removePartyMember));
    if (eff.addQuest) setQuests(p => [...p, eff.addQuest]);
    if (eff.addWeaponTag) setWeaponTag(p => p + ", " + eff.addWeaponTag);
    if (eff.fullHeal) setStrikes(maxStrikes);
    if (eff.healPartial) setStrikes(p => Math.min(maxStrikes, p + d4()));
    if (eff.loseStrike) setStrikes(p => Math.max(0, p - eff.loseStrike));
  };

  // COMBAT SYSTEM
  const startCombat = (enemyIds, advantage, nextScene) => {
    const combatEnemies = enemyIds.map((id, i) => {
      const template = ENEMIES[id];
      return { ...template, id: `${id}_${i}`, strikes: template.strikes, maxStrikes: template.maxStrikes };
    });
    setEnemies(combatEnemies);
    setCombatLog(["— COMBAT BEGINS —"]);
    setCombatAdvantage(advantage);
    setAfterCombatScene(nextScene);
    setInCombat(true);
    setPhase("combat");
    setPlayerActed(false);
    
    // Initiative
    const initRoll = d6();
    if (initRoll >= 4 || advantage) {
      setCombatTurn("player");
      setCombatLog(prev => [...prev, advantage ? "You have the advantage! You act first." : `Initiative: ${initRoll} — You act first!`]);
    } else {
      setCombatTurn("enemy");
      setCombatLog(prev => [...prev, `Initiative: ${initRoll} — Enemies act first!`]);
      setTimeout(() => enemyTurn(combatEnemies), 800);
    }
  };

  const playerAttack = (targetIdx, useAbility = null) => {
    if (combatTurn !== "player" || playerActed) return;
    setPlayerActed(true);
    
    const target = enemies[targetIdx];
    if (!target || target.strikes <= 0) { setPlayerActed(false); return; }
    
    let attackMod = abilities.Might || 0;
    if (weaponTag.includes("Finesse") || weaponTag.includes("Precise")) attackMod = Math.max(attackMod, abilities.Finesse || 0);
    let bonus = 0;
    if (passiveTrait?.effect?.attackBonus) bonus += passiveTrait.effect.attackBonus;
    
    const r = d20();
    const total = r + attackMod + bonus;
    const hit = total >= target.defense;
    const crit = r === 20;
    const fumble = r === 1;
    
    let dmg = 1;
    if (crit) dmg = 2;
    if (useAbility) {
      // Handle special abilities damage bonus
      if (useAbility.includes("+2 Strikes") || useAbility.includes("+2 Strike")) dmg += 2;
      if (useAbility.includes("+3 Strikes") || useAbility.includes("+3 Strike")) dmg += 3;
      if (useAbility.includes("+1 Strike")) dmg += 1;
    }
    
    let newLog = [];
    if (fumble) {
      newLog.push(`You attack ${target.name}: rolled 1 — FUMBLE! The GM winces.`);
    } else if (hit) {
      // Check DR
      let blocked = false;
      if (target.defense > 12) { // simple DR simulation for tough enemies
        const drRoll = d6();
        if (drRoll === 1) { blocked = true; dmg = Math.max(0, dmg - 1); }
      }
      
      newLog.push(`You attack ${target.name}: rolled ${r}+${attackMod+bonus}=${total} vs DEF ${target.defense} — HIT! ${dmg} Strike${dmg>1?'s':''} damage!${crit ? ' CRITICAL!' : ''}${blocked ? ' (1 blocked by armor)' : ''}`);
      
      const newEnemies = [...enemies];
      newEnemies[targetIdx] = { ...target, strikes: Math.max(0, target.strikes - dmg) };
      
      if (newEnemies[targetIdx].strikes <= 0) {
        newLog.push(`${target.name} falls!`);
        // Battle surge heal
        if (activeTrait?.id === "battleSurge") {
          setStrikes(p => Math.min(maxStrikes, p + 1));
          newLog.push("Battle Surge! You heal 1 Strike.");
        }
      }
      setEnemies(newEnemies);
      
      // Check if all enemies dead
      if (newEnemies.every(e => e.strikes <= 0)) {
        newLog.push("", "— VICTORY! —");
        setCombatLog(prev => [...prev, ...newLog]);
        setTimeout(() => endCombat(true), 1200);
        return;
      }
    } else {
      newLog.push(`You attack ${target.name}: rolled ${r}+${attackMod+bonus}=${total} vs DEF ${target.defense} — MISS!`);
    }
    
    setCombatLog(prev => [...prev, ...newLog]);
    
    // Party member attacks
    if (party.length > 0 && enemies.some(e => e.strikes > 0)) {
      setTimeout(() => {
        const aliveEnemies = enemies.filter(e => e.strikes > 0);
        const aliveParty = party.filter(m => m.alive && m.strikes > 0);
        
        if (aliveParty.length === 0 || aliveEnemies.length === 0) {
          setCombatTurn("enemy");
          setTimeout(() => enemyTurn(), 800);
          return;
        }
        
        let updatedEnemies = [...enemies];
        let partyLog = [];
        
        aliveParty.forEach((member, memberIdx) => {
          if (updatedEnemies.filter(e => e.strikes > 0).length === 0) return;
          
          const aliveTargets = updatedEnemies.filter(e => e.strikes > 0);
          let target;
          
          // Kael's special: target most wounded
          if (member.id === "kael") {
            target = aliveTargets.reduce((prev, curr) => 
              (curr.strikes < prev.strikes) ? curr : prev
            );
          } else {
            // Random target for others
            target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
          }
          
          const roll = d20();
          const total = roll + member.attackBonus;
          
          if (total >= target.defense) {
            let dmg = member.damage;
            
            // Sable's first strike bonus
            if (member.id === "sable" && !member.firstStrikeUsed) {
              dmg += 1;
              partyLog.push(`${member.name} unleashes her First Strike!`);
              // Mark first strike as used
              setParty(p => p.map(m => m.id === "sable" ? {...m, firstStrikeUsed: true} : m));
            }
            
            const targetIdx = updatedEnemies.findIndex(e => e.id === target.id);
            updatedEnemies[targetIdx] = { 
              ...updatedEnemies[targetIdx], 
              strikes: Math.max(0, updatedEnemies[targetIdx].strikes - dmg) 
            };
            
            partyLog.push(`${member.name} attacks ${target.name}: ${roll}+${member.attackBonus}=${total} — HIT! ${dmg} Strike${dmg>1?'s':''}.${updatedEnemies[targetIdx].strikes <= 0 ? ` ${target.name} falls!` : ''}`);
          } else {
            partyLog.push(`${member.name} attacks ${target.name}: ${roll}+${member.attackBonus}=${total} — Miss.`);
          }
        });
        
        setEnemies(updatedEnemies);
        setCombatLog(prev => [...prev, ...partyLog]);
        
        if (updatedEnemies.every(e => e.strikes <= 0)) {
          setCombatLog(prev => [...prev, "", "— VICTORY! —"]);
          setTimeout(() => endCombat(true), 1200);
          return;
        }
        
        setCombatTurn("enemy");
        setTimeout(() => enemyTurn(), 800);
      }, 600);
    } else {
      setCombatTurn("enemy");
      setTimeout(() => enemyTurn(), 800);
    }
  };

  const enemyTurn = (overrideEnemies = null) => {
    const currentEnemies = overrideEnemies || enemies;
    const alive = currentEnemies.filter(e => e.strikes > 0);
    if (alive.length === 0) return;
    
    let newLog = [];
    const aliveParty = party.filter(m => m.alive && m.strikes > 0);
    
    alive.forEach(enemy => {
      const r = d20();
      const attackBonus = enemy.finesse || enemy.might || 2;
      const total = r + attackBonus;
      
      // Determine target: 50% player, 50% split among party
      const targetRoll = Math.random();
      let targetType = "player";
      let targetMember = null;
      let targetDef = 5 + (abilities.Finesse || 0) + armorDef + (hasShield ? 1 : 0);
      
      if (aliveParty.length > 0 && targetRoll > 0.5) {
        // Target random party member
        targetMember = aliveParty[Math.floor(Math.random() * aliveParty.length)];
        targetType = "party";
        targetDef = 5 + targetMember.defense - 10; // Convert their defense to a bonus
      }
      
      if (total >= targetDef) {
        let dmg = 1;
        if (r === 20) dmg = 2;
        if (enemy.isBoss) dmg += (r >= 18 ? 1 : 0);
        
        if (targetType === "player") {
          // Attack player - check DR
          if (armorDR > 0) {
            const drRoll = d6();
            if (drRoll <= armorDR) {
              dmg = Math.max(0, dmg - 1);
              if (dmg === 0) {
                newLog.push(`${enemy.name} attacks you: ${r}+${attackBonus}=${total} — Hit, but your armor absorbs it!`);
                return;
              }
            }
          }
          
          const newStrikes = Math.max(0, strikes - dmg);
          setStrikes(newStrikes);
          newLog.push(`${enemy.name} attacks you: ${r}+${attackBonus}=${total} vs DEF ${targetDef} — HIT! ${dmg} Strike${dmg>1?'s':''}!${r===20?' CRITICAL!':''}`);
          
          if (newStrikes <= 0) {
            setCombatLog(prev => [...prev, ...newLog, "", "You fall..."]);
            setTimeout(() => endCombat(false), 1500);
            return;
          }
        } else {
          // Attack party member
          // Brother Cade's divine shield
          if (targetMember.id === "brotherCade" && targetMember.divineShieldActive) {
            newLog.push(`${enemy.name} attacks ${targetMember.name}: ${r}+${attackBonus}=${total} — Hit blocked by Divine Shield!`);
            setParty(p => p.map(m => m.id === "brotherCade" ? {...m, divineShieldActive: false} : m));
            return;
          }
          
          // Dorn's juggernaut passive
          const combatRound = Math.floor((combatLog.length) / 10); // Rough estimate
          if (targetMember.id === "dorn" && targetMember.juggernautActive && combatRound < 3) {
            dmg = Math.max(0, dmg - 1);
            if (dmg === 0) {
              newLog.push(`${enemy.name} attacks ${targetMember.name}: ${r}+${attackBonus}=${total} — Hit absorbed by Juggernaut!`);
              return;
            }
          }
          
          const newMemberStrikes = Math.max(0, targetMember.strikes - dmg);
          setParty(p => p.map(m => {
            if (m.id === targetMember.id) {
              const knockedOut = newMemberStrikes <= 0;
              return {...m, strikes: newMemberStrikes, alive: !knockedOut};
            }
            return m;
          }));
          
          newLog.push(`${enemy.name} attacks ${targetMember.name}: ${r}+${attackBonus}=${total} vs DEF ${targetDef} — HIT! ${dmg} Strike${dmg>1?'s':''}!${r===20?' CRITICAL!':''}${newMemberStrikes <= 0 ? ` ${targetMember.name} is knocked out!` : ''}`);
        }
      } else {
        const targetName = targetType === "player" ? "you" : targetMember.name;
        newLog.push(`${enemy.name} attacks ${targetName}: ${r}+${attackBonus}=${total} vs DEF ${targetDef} — Miss.`);
      }
    });
    
    setCombatLog(prev => [...prev, ...newLog]);
    setCombatTurn("player");
    setPlayerActed(false);
  };

  const endCombat = (victory) => {
    setInCombat(false);
    if (victory) {
      // Revive knocked out party members with 1 strike
      setParty(p => p.map(m => ({
        ...m, 
        alive: true, 
        strikes: m.strikes <= 0 ? 1 : m.strikes,
        firstStrikeUsed: false, // Reset Sable's ability
        divineShieldActive: m.id === "brotherCade", // Reset Brother Cade's shield
        juggernautActive: m.id === "dorn" // Reset Dorn's juggernaut
      })));
      
      setPhase("playing");
      if (afterCombatScene) {
        setTimeout(() => processScene(afterCombatScene), 500);
      }
    } else {
      // Death / horrible wounds
      const deathRoll = d12();
      if (deathRoll <= 4) {
        // Survived but wounded
        setStrikes(1);
        setCombatLog(prev => [...prev, `Horrible Wound roll: ${deathRoll} — You survive, barely. 1 Strike remaining.`]);
        setPhase("playing");
        if (afterCombatScene) setTimeout(() => processScene(afterCombatScene), 500);
      } else {
        setPhase("playing");
        processScene("death");
      }
    }
  };

  const useAbility = (abilityName) => {
    if (sortAbilityUses[abilityName] <= 0 || sortAbilityUses[abilityName] === 99) return;
    setSortAbilityUses(prev => ({...prev, [abilityName]: prev[abilityName] - 1}));
    setCombatLog(prev => [...prev, `You activate ${abilityName}!`]);
    
    // Heal abilities
    if (abilityName.includes("Heal") || abilityName.includes("Divine Healing")) {
      setStrikes(p => Math.min(maxStrikes, p + 1));
      setCombatLog(prev => [...prev, "You heal 1 Strike."]);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  const sceneData = SCENES[currentScene];

  // TITLE SCREEN
  if (phase === "title") {
    return (
      <div style={styles.container}>
        <div style={styles.titleScreen}>
          <div style={styles.titleFlame}>🔥</div>
          <h1 style={styles.titleMain}>TORCHES<br/><span style={styles.titleSub}>in the</span><br/>DARK</h1>
          <p style={styles.titleQuote}>"Steel is honest. Sorcery is hungry. Choose your debts."</p>
          <div style={styles.titleDivider}/>
          <p style={styles.titleDesc}>A text-based RPG in the World of Ohr</p>
          <button style={styles.titleButton} onClick={() => { setPhase("prologue"); setLog([]); }}>
            BEGIN
          </button>
          <p style={styles.titleCredit}>Based on Torches in the Dark by Ohr Games</p>
        </div>
      </div>
    );
  }

  // PROLOGUE
  if (phase === "prologue") {
    const scene = SCENES.prologue;
    return (
      <div style={styles.container}>
        <div style={styles.gameScreen}>
          <div style={styles.header}>
            <span style={styles.headerTitle}>TORCHES IN THE DARK</span>
          </div>
          <div style={styles.narrativeBox} ref={logRef}>
            {scene.text.map((line, i) => (
              <p key={i} style={i === 0 ? styles.narrativeFirstLine : styles.narrativeLine}>{line}</p>
            ))}
          </div>
          <div style={styles.choiceBox}>
            {scene.choices.map((c, i) => (
              <button key={i} style={styles.choiceButton} onClick={() => processScene(c.next)}>{c.text}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // CHARACTER CREATION
  if (phase === "charCreate") {
    return (
      <div style={styles.container}>
        <div style={styles.gameScreen}>
          <div style={styles.header}>
            <span style={styles.headerTitle}>CHARACTER CREATION</span>
            <span style={styles.headerStep}>Step {charStep + 1} of 5</span>
          </div>
          <div style={styles.charCreateBox}>
            {charStep === 0 && (
              <div>
                <h2 style={styles.sectionTitle}>Name & Ability Scores</h2>
                <p style={styles.flavorText}>10 points to distribute. No score above +6.</p>
                <div style={styles.nameInput}>
                  <label style={styles.label}>Name:</label>
                  <input style={styles.input} value={charName} onChange={e => setCharName(e.target.value)} placeholder="Enter name..." maxLength={20}/>
                </div>
                <p style={styles.pointsLeft}>Points remaining: <span style={{color: pointsLeft > 0 ? '#d4a847' : pointsLeft === 0 ? '#6a8' : '#c44'}}>{pointsLeft}</span></p>
                <div style={styles.abilityGrid}>
                  {ABILITIES.map(ab => (
                    <div key={ab} style={styles.abilityRow}>
                      <span style={styles.abilityName}>{ab}</span>
                      <button style={styles.abButton} onClick={() => { if (abilities[ab] > 0) { setAbilities(p=>({...p,[ab]:p[ab]-1})); setPointsLeft(p=>p+1); }}}>−</button>
                      <span style={styles.abilityVal}>+{abilities[ab]}</span>
                      <button style={styles.abButton} onClick={() => { if (pointsLeft > 0 && abilities[ab] < 6) { setAbilities(p=>({...p,[ab]:p[ab]+1})); setPointsLeft(p=>p-1); }}}>+</button>
                    </div>
                  ))}
                </div>
                <button style={{...styles.choiceButton, opacity: (pointsLeft === 0 && charName.trim()) ? 1 : 0.4}} onClick={() => { if (pointsLeft === 0 && charName.trim()) setCharStep(1); }}>
                  Continue →
                </button>
              </div>
            )}

            {charStep === 1 && (
              <div>
                <h2 style={styles.sectionTitle}>Choose Your Race</h2>
                <p style={styles.flavorText}>Rare races require a d100 roll equal to or under the listed chance.</p>
                <div style={styles.optionList}>
                  {RACES.map(r => {
                    const canPick = r.chance >= 100 || d100() <= r.chance;
                    return (
                      <button key={r.id} style={{...styles.optionCard, borderColor: race?.id === r.id ? '#d4a847' : '#3a3020'}}
                        onClick={() => setRace(r)}>
                        <div style={styles.optionName}>{r.name} <span style={styles.optionChance}>{r.chance < 100 ? `(${r.chance}%)` : '(Common)'}</span></div>
                        <div style={styles.optionDesc}>{r.desc}</div>
                        <div style={styles.optionBonus}>
                          {Object.entries(r.bonuses).map(([k,v]) => `+${v} ${k}`).join(', ') || '+1 to any ability'}
                          {r.traits.length > 0 && ` | ${r.traits.join(', ')}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {race && <button style={styles.choiceButton} onClick={() => {
                  // Apply race bonuses
                  if (race.bonuses) {
                    const newAb = {...abilities};
                    Object.entries(race.bonuses).forEach(([k,v]) => { newAb[k] = (newAb[k]||0) + v; });
                    setAbilities(newAb);
                  }
                  if (race.freeAbility) {
                    // Human gets +1 to highest
                    const highest = ABILITIES.reduce((a,b) => abilities[a] >= abilities[b] ? a : b);
                    setAbilities(p => ({...p, [highest]: p[highest]+1}));
                  }
                  setCharStep(2);
                }}>Continue →</button>}
              </div>
            )}

            {charStep === 2 && (
              <div>
                <h2 style={styles.sectionTitle}>Choose Your Grim Sort</h2>
                <p style={styles.flavorText}>Your class. Your burden. Your way of surviving.</p>
                <div style={styles.optionList}>
                  {GRIM_SORTS.map(gs => (
                    <button key={gs.id} style={{...styles.optionCard, borderColor: grimSort?.id === gs.id ? '#d4a847' : '#3a3020'}}
                      onClick={() => setGrimSort(gs)}>
                      <div style={styles.optionName}>{gs.name} <span style={styles.optionChance}>| {gs.strikes} Strikes</span></div>
                      <div style={styles.optionDesc}>{gs.desc}</div>
                      <div style={styles.optionBonus}>
                        {gs.abilities.map(a => a.name).join(' • ')}
                      </div>
                    </button>
                  ))}
                </div>
                {grimSort && <button style={styles.choiceButton} onClick={() => setCharStep(3)}>Continue →</button>}
              </div>
            )}

            {charStep === 3 && (
              <div>
                <h2 style={styles.sectionTitle}>Choose Traits</h2>
                <p style={styles.flavorText}>One passive. One active. These define you.</p>
                <h3 style={styles.subTitle}>Passive Trait</h3>
                <div style={styles.traitGrid}>
                  {PASSIVE_TRAITS.map(t => (
                    <button key={t.id} style={{...styles.traitCard, borderColor: passiveTrait?.id === t.id ? '#d4a847' : '#3a3020'}}
                      onClick={() => setPassiveTrait(t)}>
                      <strong>{t.name}</strong><br/><span style={styles.traitDesc}>{t.desc}</span>
                    </button>
                  ))}
                </div>
                <h3 style={styles.subTitle}>Active Trait</h3>
                <div style={styles.traitGrid}>
                  {ACTIVE_TRAITS.map(t => (
                    <button key={t.id} style={{...styles.traitCard, borderColor: activeTrait?.id === t.id ? '#d4a847' : '#3a3020'}}
                      onClick={() => setActiveTrait(t)}>
                      <strong>{t.name}</strong> ({t.uses}/enc)<br/><span style={styles.traitDesc}>{t.desc}</span>
                    </button>
                  ))}
                </div>
                {passiveTrait && activeTrait && <button style={styles.choiceButton} onClick={() => setCharStep(4)}>Continue →</button>}
              </div>
            )}

            {charStep === 4 && (
              <div>
                <h2 style={styles.sectionTitle}>Choose Equipment Pack</h2>
                <p style={styles.flavorText}>What you carry determines how you die.</p>
                <div style={styles.optionList}>
                  {EQUIPMENT_PACKS.map(ep => (
                    <button key={ep.id} style={{...styles.optionCard, borderColor: equipPack?.id === ep.id ? '#d4a847' : '#3a3020'}}
                      onClick={() => setEquipPack(ep)}>
                      <div style={styles.optionName}>{ep.name} <span style={styles.optionChance}>| {ep.coin} Golm</span></div>
                      <div style={styles.optionDesc}>
                        {ep.armor || 'No Armor'} • {ep.weapon} ({ep.weaponTag}){ep.shield ? ' • Shield' : ''}
                      </div>
                      <div style={styles.optionBonus}>{ep.items.join(', ')}</div>
                    </button>
                  ))}
                </div>
                {equipPack && (
                  <div>
                    <div style={styles.charSummary}>
                      <h3 style={styles.subTitle}>CHARACTER SUMMARY</h3>
                      <p><strong>{charName}</strong> — {race?.name} {grimSort?.name}</p>
                      <p>Strikes: {grimSort?.strikes + (passiveTrait?.effect?.maxStrikesBonus || 0)} | Defense: {5 + abilities.Finesse + (equipPack?.armorDef || 0) + (equipPack?.shield ? 1 : 0)}</p>
                      <p>Passive: {passiveTrait?.name} | Active: {activeTrait?.name}</p>
                    </div>
                    <button style={styles.choiceButton} onClick={finalizeCharacter}>
                      Enter the World of Ohr →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // SHOP
  if (phase === "shop") {
    return (
      <div style={styles.container}>
        <div style={styles.gameScreen}>
          <div style={styles.header}>
            <span style={styles.headerTitle}>IRON MARTA'S FORGE</span>
            <span style={styles.headerStep}>Coin: {coin} Golm</span>
          </div>
          <div style={styles.shopBox}>
            {SHOP_ITEMS.map((item, i) => (
              <div key={i} style={styles.shopItem}>
                <span style={styles.shopName}>{item.name}</span>
                <span style={styles.shopCost}>{item.cost}g</span>
                <button style={{...styles.abButton, opacity: coin >= item.cost ? 1 : 0.3}}
                  onClick={() => {
                    if (coin >= item.cost) {
                      setCoin(p => p - item.cost);
                      if (item.type === "weapon") { setWeapon(item.name); setWeaponTag(item.tag); }
                      else if (item.type === "armor") { setArmor(item.name); setArmorDef(item.def); setArmorDR(item.dr); }
                      else setInventory(p => [...p, item.name]);
                    }
                  }}>BUY</button>
              </div>
            ))}
          </div>
          <div style={styles.choiceBox}>
            <button style={styles.choiceButton} onClick={() => { setPhase("playing"); processScene("squallsEnd"); }}>Leave the Shop</button>
          </div>
        </div>
      </div>
    );
  }

  // COMBAT
  if (phase === "combat") {
    return (
      <div style={styles.container}>
        <div style={styles.gameScreen}>
          <div style={styles.header}>
            <span style={styles.headerTitle}>⚔ COMBAT ⚔</span>
            <span style={styles.headerStep}>{charName} | Strikes: {strikes}/{maxStrikes}</span>
          </div>
          
          <div style={styles.combatEnemies}>
            {enemies.map((e, i) => (
              <div key={e.id} style={{...styles.enemyCard, opacity: e.strikes > 0 ? 1 : 0.3}}>
                <div style={styles.enemyName}>{e.name}{e.isBoss ? ' ★' : ''}</div>
                <div style={styles.enemyHP}>
                  <div style={{...styles.enemyHPBar, width: `${(e.strikes/e.maxStrikes)*100}%`}}/>
                </div>
                <div style={styles.enemyStats}>STR {e.strikes}/{e.maxStrikes} | DEF {e.defense}</div>
                {e.strikes > 0 && combatTurn === "player" && !playerActed && (
                  <button style={styles.attackButton} onClick={() => playerAttack(i)}>ATTACK</button>
                )}
              </div>
            ))}
          </div>

          <div style={styles.combatLogBox} ref={logRef}>
            {combatLog.map((line, i) => (
              <p key={i} style={{...styles.combatLogLine, color: line.includes('HIT') ? '#c44' : line.includes('Miss') ? '#888' : line.includes('VICTORY') ? '#d4a847' : '#ccc'}}>{line}</p>
            ))}
          </div>

          <div style={styles.combatActions}>
            <div style={styles.turnIndicator}>
              {combatTurn === "player" && !playerActed ? "YOUR TURN" : "ENEMY TURN..."}
            </div>
            {grimSort && grimSort.abilities.filter(a => a.uses < 99 && sortAbilityUses[a.name] > 0).map(a => (
              <button key={a.name} style={styles.abilityButton} onClick={() => useAbility(a.name)} title={a.desc}>
                {a.name} ({sortAbilityUses[a.name]})
              </button>
            ))}
            {inventory.includes("Healing Potion") && (
              <button style={styles.abilityButton} onClick={() => {
                setStrikes(p => Math.min(maxStrikes, p + 3));
                setInventory(p => { const n = [...p]; n.splice(n.indexOf("Healing Potion"), 1); return n; });
                setCombatLog(prev => [...prev, "You drink a Healing Potion! Heal 3 Strikes."]);
              }}>🧪 Healing Potion</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // MAIN GAME SCREEN
  if (phase === "playing") {
    const scene = SCENES[currentScene];
    return (
      <div style={styles.container}>
        <div style={styles.gameScreen}>
          <div style={styles.header}>
            <span style={styles.headerTitle}>TORCHES IN THE DARK</span>
            <button style={styles.charSheetToggle} onClick={() => setShowCharSheet(!showCharSheet)}>
              {showCharSheet ? '✕ Close' : '☰ Character'}
            </button>
          </div>

          {showCharSheet && (
            <div style={styles.charSheet}>
              <h3 style={styles.csName}>{charName}</h3>
              <p style={styles.csInfo}>{race?.name} {grimSort?.name} | Strikes: {strikes}/{maxStrikes} | DEF: {5 + abilities.Finesse + armorDef + (hasShield?1:0)} | Coin: {coin}g</p>
              <div style={styles.csAbilities}>
                {ABILITIES.map(ab => <span key={ab} style={styles.csAbility}>{ab.slice(0,3)}: +{abilities[ab]}</span>)}
              </div>
              <p style={styles.csGear}>⚔ {weapon} ({weaponTag}) | 🛡 {armor} | {hasShield ? '🔰 Shield' : ''}</p>
              <p style={styles.csGear}>Passive: {passiveTrait?.name} | Active: {activeTrait?.name}</p>
              {party.length > 0 && (
                <div>
                  <p style={styles.csGear}>Party Members:</p>
                  {party.map(m => (
                    <p key={m.id} style={{...styles.csGear, color: m.alive ? '#4a9' : '#888'}}>
                      • {m.name} ({m.strikes}/{m.maxStrikes} Strikes, DEF {m.defense}, +{m.attackBonus} ATK)
                    </p>
                  ))}
                </div>
              )}
              {quests.length > 0 && <p style={styles.csGear}>Quests: {quests.join(', ')}</p>}
              <p style={styles.csGear}>Pack: {inventory.join(', ')}</p>
            </div>
          )}

          <div style={styles.narrativeBox} ref={logRef}>
            {log.map((line, i) => {
              if (!line) return <div key={i} style={{height:12}}/>;
              if (line.startsWith('[')) return <p key={i} style={styles.checkLine}>{line}</p>;
              if (line.startsWith('—') || line === '—') return <div key={i} style={styles.divider}/>;
              if (line === line.toUpperCase() && line.length > 3 && !line.startsWith('(')) return <h2 key={i} style={styles.sceneTitle}>{line}</h2>;
              return <p key={i} style={styles.narrativeLine}>{line}</p>;
            })}
          </div>

          <div style={styles.choiceBox}>
            {scene?.choices?.map((c, i) => {
              // Check coin requirements
              if (c.check === "coin50" && coin < 50) return <button key={i} style={{...styles.choiceButton, opacity:0.3}} disabled>Pay 50 Golm (insufficient funds)</button>;
              if (c.check === "coin150" && coin < 150) return <button key={i} style={{...styles.choiceButton, opacity:0.3}} disabled>Buy survivors — 150 Golm (insufficient funds)</button>;
              if (c.check === "coin" && coin <= 0) return null;
              
              return (
                <button key={i} style={styles.choiceButton} onClick={() => {
                  if (c.effect) applyEffect(c.effect);
                  processScene(c.next);
                }}>{c.text}</button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================
// STYLES
// ============================================================
const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0806',
    backgroundImage: 'radial-gradient(ellipse at 50% 0%, #1a1208 0%, #0a0806 70%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '20px',
    fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif",
    color: '#c4b48a',
  },
  // TITLE
  titleScreen: {
    textAlign: 'center',
    padding: '60px 40px',
    maxWidth: 500,
  },
  titleFlame: { fontSize: 48, marginBottom: 20 },
  titleMain: {
    fontSize: 52,
    fontWeight: 700,
    color: '#d4a847',
    lineHeight: 1.1,
    letterSpacing: 4,
    textShadow: '0 0 40px rgba(212,168,71,0.3)',
    margin: 0,
  },
  titleSub: {
    fontSize: 24,
    fontWeight: 400,
    color: '#8a7a5a',
    fontStyle: 'italic',
    letterSpacing: 6,
  },
  titleQuote: {
    fontStyle: 'italic',
    color: '#8a7a5a',
    margin: '30px 0',
    fontSize: 14,
  },
  titleDivider: {
    height: 1,
    background: 'linear-gradient(90deg, transparent, #d4a847, transparent)',
    margin: '20px 0',
  },
  titleDesc: { color: '#6a5a3a', fontSize: 13, marginBottom: 30 },
  titleButton: {
    background: 'none',
    border: '1px solid #d4a847',
    color: '#d4a847',
    padding: '14px 50px',
    fontSize: 18,
    letterSpacing: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.3s',
  },
  titleCredit: { color: '#4a3a2a', fontSize: 11, marginTop: 40 },

  // GAME SCREEN
  gameScreen: {
    maxWidth: 720,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 'calc(100vh - 40px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #2a2010',
    marginBottom: 16,
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 13,
    letterSpacing: 3,
    color: '#8a7a5a',
    textTransform: 'uppercase',
  },
  headerStep: {
    fontSize: 12,
    color: '#6a5a3a',
  },
  charSheetToggle: {
    background: 'none',
    border: '1px solid #3a3020',
    color: '#8a7a5a',
    padding: '4px 12px',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // NARRATIVE
  narrativeBox: {
    flex: 1,
    overflowY: 'auto',
    paddingRight: 8,
    marginBottom: 16,
    maxHeight: 'calc(100vh - 280px)',
    scrollbarWidth: 'thin',
    scrollbarColor: '#3a3020 transparent',
  },
  narrativeLine: {
    fontSize: 15,
    lineHeight: 1.7,
    color: '#c4b48a',
    margin: '8px 0',
  },
  narrativeFirstLine: {
    fontSize: 17,
    lineHeight: 1.7,
    color: '#d4a847',
    margin: '8px 0',
    fontStyle: 'italic',
  },
  sceneTitle: {
    fontSize: 18,
    letterSpacing: 3,
    color: '#d4a847',
    margin: '16px 0 4px 0',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    background: 'linear-gradient(90deg, transparent, #3a3020, transparent)',
    margin: '8px 0',
  },
  checkLine: {
    fontSize: 13,
    color: '#7a9a6a',
    fontStyle: 'italic',
    margin: '4px 0',
    padding: '4px 8px',
    background: '#0a1208',
    borderLeft: '2px solid #4a6a3a',
  },
  flavorText: {
    fontSize: 13,
    color: '#8a7a5a',
    fontStyle: 'italic',
    marginBottom: 16,
  },

  // CHOICES
  choiceBox: {
    flexShrink: 0,
    borderTop: '1px solid #2a2010',
    paddingTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  choiceButton: {
    background: 'none',
    border: '1px solid #3a3020',
    color: '#c4b48a',
    padding: '12px 16px',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    transition: 'all 0.2s',
    lineHeight: 1.4,
  },

  // CHARACTER CREATION
  charCreateBox: {
    flex: 1,
    overflowY: 'auto',
    paddingRight: 8,
    maxHeight: 'calc(100vh - 140px)',
  },
  sectionTitle: {
    fontSize: 20,
    color: '#d4a847',
    letterSpacing: 2,
    margin: '0 0 8px 0',
  },
  subTitle: {
    fontSize: 15,
    color: '#d4a847',
    letterSpacing: 1,
    margin: '16px 0 8px 0',
  },
  nameInput: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '16px 0',
  },
  label: { fontSize: 14, color: '#8a7a5a' },
  input: {
    background: '#1a1208',
    border: '1px solid #3a3020',
    color: '#d4a847',
    padding: '8px 12px',
    fontSize: 16,
    fontFamily: 'inherit',
    flex: 1,
    outline: 'none',
  },
  pointsLeft: { fontSize: 14, margin: '8px 0 16px 0' },
  abilityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 6,
    marginBottom: 20,
  },
  abilityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 8px',
    background: '#12100a',
    border: '1px solid #2a2010',
  },
  abilityName: { fontSize: 12, color: '#8a7a5a', flex: 1, letterSpacing: 1 },
  abilityVal: { fontSize: 16, color: '#d4a847', width: 30, textAlign: 'center', fontWeight: 'bold' },
  abButton: {
    background: 'none',
    border: '1px solid #3a3020',
    color: '#d4a847',
    width: 28,
    height: 28,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  optionCard: {
    background: '#12100a',
    border: '1px solid #3a3020',
    padding: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    color: '#c4b48a',
    transition: 'all 0.2s',
  },
  optionName: { fontSize: 15, color: '#d4a847', fontWeight: 'bold' },
  optionChance: { fontSize: 12, color: '#8a7a5a', fontWeight: 'normal' },
  optionDesc: { fontSize: 13, color: '#8a7a5a', margin: '4px 0', fontStyle: 'italic' },
  optionBonus: { fontSize: 12, color: '#7a9a6a' },
  traitGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 6,
    marginBottom: 12,
  },
  traitCard: {
    background: '#12100a',
    border: '1px solid #3a3020',
    padding: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    color: '#d4a847',
    fontSize: 12,
    transition: 'all 0.2s',
  },
  traitDesc: { color: '#8a7a5a', fontWeight: 'normal' },
  charSummary: {
    background: '#12100a',
    border: '1px solid #d4a847',
    padding: 16,
    marginBottom: 16,
    marginTop: 16,
  },

  // CHAR SHEET OVERLAY
  charSheet: {
    background: '#12100a',
    border: '1px solid #3a3020',
    padding: 12,
    marginBottom: 12,
    fontSize: 12,
  },
  csName: { color: '#d4a847', margin: '0 0 4px 0', fontSize: 16, letterSpacing: 2 },
  csInfo: { color: '#c4b48a', margin: '2px 0' },
  csAbilities: { display: 'flex', flexWrap: 'wrap', gap: 8, margin: '6px 0' },
  csAbility: { color: '#8a7a5a', background: '#1a1208', padding: '2px 6px', border: '1px solid #2a2010' },
  csGear: { color: '#8a7a5a', margin: '2px 0' },

  // COMBAT
  combatEnemies: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  enemyCard: {
    background: '#1a0808',
    border: '1px solid #4a2020',
    padding: '10px 12px',
    flex: '1 1 200px',
    transition: 'opacity 0.3s',
  },
  enemyName: { color: '#c44', fontSize: 14, fontWeight: 'bold' },
  enemyHP: {
    height: 6,
    background: '#2a1010',
    margin: '4px 0',
    overflow: 'hidden',
  },
  enemyHPBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #c44, #a33)',
    transition: 'width 0.3s',
  },
  enemyStats: { color: '#8a5a5a', fontSize: 11 },
  attackButton: {
    background: '#2a0808',
    border: '1px solid #c44',
    color: '#c44',
    padding: '6px 16px',
    marginTop: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
    letterSpacing: 2,
    width: '100%',
  },
  combatLogBox: {
    flex: 1,
    overflowY: 'auto',
    padding: 8,
    background: '#0a0806',
    border: '1px solid #2a2010',
    marginBottom: 12,
    maxHeight: 'calc(100vh - 420px)',
    minHeight: 120,
  },
  combatLogLine: { fontSize: 13, margin: '2px 0', lineHeight: 1.5 },
  combatActions: {
    borderTop: '1px solid #2a2010',
    paddingTop: 8,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  turnIndicator: {
    fontSize: 14,
    color: '#d4a847',
    letterSpacing: 2,
    fontWeight: 'bold',
    width: '100%',
    textAlign: 'center',
    marginBottom: 4,
  },
  abilityButton: {
    background: '#1a1208',
    border: '1px solid #3a3020',
    color: '#d4a847',
    padding: '6px 10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 11,
  },

  // SHOP
  shopBox: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: 12,
  },
  shopItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
    borderBottom: '1px solid #1a1208',
  },
  shopName: { flex: 1, fontSize: 14, color: '#c4b48a' },
  shopCost: { fontSize: 14, color: '#d4a847', fontWeight: 'bold' },
};
