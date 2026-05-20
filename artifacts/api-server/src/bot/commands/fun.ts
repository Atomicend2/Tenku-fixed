import type { CommandContext } from "./index.js";
import { sendText } from "../connection.js";

const CHARACTERS = [
  "Goku (Dragon Ball Z)","Naruto Uzumaki (Naruto)","Luffy (One Piece)",
  "Ichigo (Bleach)","Zoro (One Piece)","Sasuke (Naruto)","Vegeta (DBZ)",
  "Levi (Attack on Titan)","Todoroki (MHA)","Itachi (Naruto)",
  "Light Yagami (Death Note)","L (Death Note)","Natsu (Fairy Tail)",
  "Erza (Fairy Tail)","Rem (Re:Zero)","Zero Two (Darling in the FranXX)",
  "Kirito (SAO)","Asuna (SAO)","Mikasa (AoT)","Hinata (Naruto)",
];

const POVS = [
  "You just realized you're the villain of someone else's story.",
  "You wake up and your entire memory is gone.",
  "You find a note that says 'Don't look behind you.'",
  "Everyone can see your aura except you.",
  "The world ended last night and you slept through it.",
  "You discover you've been an NPC this whole time.",
];

const RELATIONS = [
  "Soulmates", "Rivals", "Best Friends", "Enemies", "Secret Lovers",
  "Childhood Friends", "Mentor & Student", "Twin Flames", "Frenemies",
];

const WYR = [
  "Fight 100 duck-sized horses or 1 horse-sized duck?",
  "Never eat your favorite food again OR eat only your favorite food forever?",
  "Be able to fly but only 1 inch off the ground OR run at 100mph?",
  "Know when you'll die OR how you'll die?",
  "Live without music OR live without TV/movies?",
  "Be able to speak all languages OR talk to animals?",
  "Have unlimited money but no friends OR be loved by everyone but be broke?",
];

const JOKES = [
  "I told my therapist I was afraid of elevators.\nShe said she'd help me take steps to overcome it. 💀",
  "My doctor told me I had type A blood, but it was a type O. 🩸",
  "I used to be addicted to soap. I'm clean now. 🧼",
  "Cemetery just raised their prices. Blamed it on the cost of living. ⚰️",
  "My wife told me I had to stop acting like a flamingo. I had to put my foot down. 🦩",
  "I have a lot of jokes about unemployed people. Sadly, none of them work. 😂",
  "My wife's leaving me because I'm a compulsive gambler. I'll do anything to win her back. 🃏",
  "Why don't they play poker in the jungle? Too many cheetahs. 🐆",
  "I asked my dog what 2 minus 2 is. He said nothing. 🐶",
  "I tried to write a book about clocks. It was about time. ⏰",
  "My grandfather's dying wish was for us to stop arguing... but that was too much to grant. 💀",
  "I bought shoes from a drug dealer. I don't know what he laced them with but I was tripping all day. 👟",
  "I hate double standards. If you burn a body at a crematorium, you're doing a good deed. If you do it at home, police show up. 🔥",
  "My therapist says I have trouble letting go of things. We'll see about that. 🗑️",
  "I grew up with six brothers. That's how I learned to dance — waiting for the bathroom. 🚿",
  "I'm reading a horror story in Braille. Something bad is going to happen. I can feel it. 📚",
  "Why do nurses like red crayons? Sometimes they have to draw blood. 🩺",
  "I asked a pretty girl at the gym what her workout routine was. She looked at me and said, 'Running away from men like you.' 😅",
  "My wife told me to take the spider out instead of killing it. We had a few drinks, cool guy, works in web design. 🕷️",
  "I'm on a seafood diet. I see food and I eat it. Then I feel terrible about my choices. 🍔",
  "I told my doctor I broke my arm in two places. He told me to stop going to those places. 🦴",
  "My boss told me to have a good day, so I went home. 🏠",
  "I have a lot of growing up to do. I realized that the other day inside my fort. 🏰",
  "Why did the invisible man turn down the job offer? He couldn't see himself doing it. 👻",
  "I used to think I was indecisive, but now I'm not too sure. 🤔",
  "My wife said I should do lunges to stay in shape. That would be a big step forward. 🏋️",
  "A skeleton walks into a bar. Orders a beer... and a mop. 💀",
  "I hate when someone knocks on my door and says 'have you seen my cat?' No, I have not. Stop asking. 😤",
  "My memory is so bad. How bad is it? How bad is what? 🧠",
  "A cop pulled me over and said 'Sir, do you know why I pulled you over?' I said 'Because I'm a little slow?' 🚗",
  "I'm at the age where I need to use a bookmark. It's my knee. 📖",
  "My wife and I decided not to have kids. The kids are taking it pretty hard. 👶",
  "The future isn't what it used to be. Neither is the past. 🔮",
  "My friend got attacked by a can of soup. He said it was 'unprovoked.' Looked pretty souper to me. 🥫",
  "I quit my job at the helium factory. I will not be spoken to in that tone. 🎈",
  "Someone stole my Microsoft Office and I'm going to find them. You have my Word. 💻",
  "I used to hate math, but then I realized decimals had a point. 📊",
  "I tried to organize a professional hide-and-seek tournament. But good players are hard to find. 🙈",
  "My father has schizophrenia, but he's good people. 🧩",
  "The cemetery raised their prices due to the high cost of living. 🪦",
  "Life is short. Smile while you still have teeth. 😬",
  "My blood type is coffee positive. ☕",
  "I'm not saying I'm Batman, but no one has ever seen me and Batman in a room together. 🦇",
  "If at first you don't succeed, skydiving is not for you. 🪂",
  "I asked my North Korean friend how life was there. He said he couldn't complain. 🙃",
  "I told a joke to my friends about a staircase. It was a step up from my usual material. 🪜",
  "Why did the scarecrow win an award? Outstanding in his field — and also kind of dead inside. 🌾",
  "I named my dog 'Six Miles' so I can tell people I walk Six Miles every day. 🐕",
  "I accidentally swallowed food coloring. The doctor says I'm okay, but I feel like I've dyed a little inside. 🎨",
  "My wife says I treat her like a child. So I gave her a gold star for telling me that. ⭐",
  "I have an addiction to cheddar cheese — but it's only mild. 🧀",
  "I started investing in stocks. Beef, chicken, vegetable. One day I'll be a bouillonaire. 📈",
  "Why don't graveyards ever get overcrowded? Because everyone is dying to get in. 😈",
  "I never realized how short I was until today... when I looked in the mirror and my reflection said 'loading...' ⬛",
  "My wife told me to be more flexible. I disagreed. She said I was too rigid. ☯️",
  "I ate a clock yesterday. It was very time-consuming. ⏰",
  "Why did the ghost stop lying? Because you could see right through him. 👻",
  "I told my cat a joke. He didn't laugh. Tough crowd. 🐱",
  "My mom cried when my dad gave her a frying pan for Christmas. Those were tears of joy — it was cast iron. 🍳",
  "Why don't scientists trust atoms? Because they make up everything. ⚛️",
  "I asked my wife what she wanted for her anniversary. 'Nothing would make me happier than diamonds,' she said. So I got her nothing. 💎",
  "I broke my arm in two places. My therapist says I need to stop visiting those places. 🪖",
  "I got a job at a bakery because I kneaded dough. 🥖",
  "My gym instructor is dead now. Should I still do the plank? 🏋️",
  "I have a joke about time travel but you didn't like it. ⌛",
  "I told my friend he should embrace his mistakes. He gave me a hug. 🤗",
  "My wife's leaving me because I'm obsessed with astronomy. It's not like I planet. 🪐",
  "I can't stand Russian dolls. They're so full of themselves. 🪆",
  "I failed my driver's test today. The instructor asked me what I do when the car slides. I said 'panic.' 🚗",
  "I'm currently reading a book about anti-gravity. It's impossible to put down. 📚",
  "I sleep eight hours a day and so does my dad, which is impressive because we only sleep six hours apart. 😴",
  "My ex girlfriend cheated on me with her gym instructor. I should've seen the signs — she was working out too often. 💪",
  "What do you call a fake noodle? An impasta. 🍝",
  "A guy walks into a library and asks for books about paranoia. The librarian whispers: 'They're right behind you.' 📖",
  "I hate Russian dolls so much. You open one, there's another problem inside. 🪆",
  "I have a pet parrot who can sing. It's pretty cocky. 🦜",
  "Why don't eggs tell jokes? They'd crack each other up. 🥚",
  "I got fired from the calendar factory. All I did was take a day off. 📅",
  "My wife said she wanted to feel special on her birthday. I hired a clown — just like our wedding. 🤡",
  "I finally told my suitcase there'd be no more trips. Now it's emotional baggage. 🧳",
  "I told my cat a dark joke. He still looked at me like I'm the monster in this house. 🐱",
  "My friend's getting married to a lighthouse keeper. I hope the relationship stands firm. 🏮",
  "Why was the math book so sad? It had too many problems. 📐",
  "I used to work in a shoe recycling shop. It was sole destroying. 👟",
  "I went to see a psychic last week. She didn't answer the door. I guess she knew I was coming. 🔮",
  "I'm friends with all electricians. We have good current connections. ⚡",
  "I have a split personality. Luckily we agree on most things. 🧠",
  "My boss yelled at me for missing work yesterday. He was right — it was very enjoyable. 🏖️",
  "I wasn't originally going to get a brain transplant but then I changed my mind. 🧠",
  "I keep trying to write a book about time. It's killing me. Mostly the clocks. ⏱️",
  "My wife said she was leaving me because I was obsessed with Twitter. I almost replied 'This.' 🐦",
  "A man walks into a library and asks for books about paranoia and conspiracy theories. The librarian says, 'They're right behind you...' 📚",
  "I'm terrified of elevators. I'm going to start taking steps to avoid them. 🪜",
  "I started a band called 999 Megabytes. We haven't gotten a gig yet. 💾",
  "My grandfather invented the cold air balloon. It never really took off. 🎈",
  "The best revenge is living well. The second best is a carefully worded text. 📱",
  "My neighbor's cat stares at me every day. I think it's plotting something. 🐱",
  "I accidentally superglued myself to my autobiography. That's my story and I'm sticking to it. 📖",
  "I have a fear of speed bumps but I'm slowly getting over it. 🚗",
  "I tried to find a joke about construction but I'm still working on it. 🏗️",
  "The pessimist sees the glass half empty. The optimist sees it half full. The engineer sees it twice as big as it needs to be. 🥛",
  "I was going to make a belt out of watches. Then I thought — that's a waist of time. ⌚",
  "I was once addicted to soap. I'm clean now but it was a hard habit to wash away. 🧼",
  "I used to be a banker but I lost interest. 🏦",
  "My wife told me I'm immature. I said 'Oh yeah? Tell that to my pillow fort.' 🏰",
  "A blind man walks into a bar. And a table. And a chair. 🦯",
  "I asked the librarian if they had books about paranoia. She whispered, 'Yes. They're watching you read this.' 👁️",
  "I dated a tennis player but love meant nothing to her. 🎾",
  "The first time I got a universal remote I thought, 'This changes everything.' 📺",
  "My wife and I were happy for 20 years. Then we met. 💍",
  "I have an inferiority complex but it's not a very good one. 🤷",
  "What do you call a man who can't stand? Neil. 🧎",
  "My wife says I never listen. Or something like that. 👂",
  "I'm reading a book on the history of glue. I just can't put it down. 📚",
  "I don't trust atoms. They make up literally everything. ⚛️",
  "My friend thinks he's smart. He told me an onion is the only food that makes you cry. I threw a coconut at his face. 🥥",
  "I'm on a seafood diet. I see food and eat it, then cry about it for an hour. 🍟",
  "My doctor told me to watch my drinking, so now I do it in front of a mirror. 🍺",
  "I used to be a banker. Then I lost interest. 🏦",
  "Why is Peter Pan always flying? He Neverlands. 🧚",
  "I just got back from a job interview where they asked if I could perform under pressure. I said yes and sang Bohemian Rhapsody. 🎤",
  "My math teacher called me average. How mean. 📊",
  "Why don't programmers like nature? Too many bugs. 🐛",
  "I asked my dog what 2+2 was. She said nothing. She's not good at math but she's great for emotional support. 🐕",
  "My dad died doing what he loved — arguing with everyone at Thanksgiving. 🦃",
  "I had a joke about infinity but it goes on forever. ♾️",
  "I tried making a belt out of watches. It was a complete waist of time. ⌚",
  "My wife's birthday is coming up. She said she wanted something she hadn't had in years. I'm moving out. 🏠",
  "My friend asked me how I stay in shape. I told him I round up. 🏋️",
  "Why don't scientists trust atoms? Because they literally make up everything you've ever been told. ⚗️",
  "I have a great joke about pizza. But it's a little too cheesy. 🍕",
  "I told my friend he should embrace his mistakes. He's been hugging the wrong person ever since. 🫂",
  "I'm not lazy, I'm on energy-saving mode. 🔋",
  "My wife left a note saying 'It's not working.' I fixed the TV. Problem solved. 📺",
  "I have a joke about COVID but it might not land well. 😷",
  "I told my friend 10 jokes to make him laugh. Sadly, no pun in ten did. 🤦",
  "I put my grandma on speed dial. I call that Instagram. 📱",
  "Why did the nurse need a red pen at work? In case she needed to draw blood. 🩸",
  "My wife asked me to take her to a place she'd never been. I took her to the kitchen. 🍳",
  "I'm not saying my wife is controlling, but... nothing. I'm not saying anything. 😶",
  "I named my horse 'Mayo.' Mayo neighs. 🐴",
  "Two cannibals are eating a clown. One says to the other, 'Does this taste funny to you?' 🤡",
  "I told my sister she should draw eyebrows higher on her face. She looked surprised. 🤨",
  "My dad says I spend too much time online. He must be really lonely now that I'm not replying. 💻",
  "I asked my wife if I was the only one she'd ever been with. She said yes — all the others were nines and tens. 😐",
  "I'm writing a book on reverse psychology. Please don't buy it. 📚",
  "The secret to a good marriage? Find someone who annoys you least. 💑",
  "I wrote a song about a tortilla. Actually, it's more of a wrap. 🌯",
  "I used to hate facial hair but then it grew on me. 🧔",
  "What's the difference between a snowman and a snow woman? Snow balls. ❄️",
  "Why don't skeletons fight each other? They don't have the guts. 💀",
  "I have a joke about construction. I'm still working on it. 🔨",
  "My therapist told me I need to work on my communication skills. I didn't know what to say. 🗣️",
  "My friend asked if I was okay with being called short. I said 'I can live with it.' He said, 'Can you reach it though?' 📏",
  "I joined a gym. My first week I worked out every day. My second week I just paid. 💸",
  "I asked my wife what she wanted for our anniversary. She said 'surprise me.' So I sneaked up behind her in the kitchen. 😱",
  "I have a condition where I see things in black and white. Doctors say it's just my personality. 🖤",
  "A man tells his doctor he feels like he's addicted to Twitter. The doctor replies: 'Sorry, I don't follow you.' 🐦",
  "The other day I was eating my favorite soup and I found a button. That was a weird can of tomato soup. 🧷",
  "I tried to write a dark joke. I couldn't. The room was too bright. 💡",
  "My friend asked why I carry a ladder. I told him I'm trying to rise above it all. 🪜",
  "People say love is the most beautiful thing. They've never been to Japan in cherry blossom season. 🌸",
  "Why was the archaeologist fired? His career was in ruins. 🏺",
  "If a man says he'll fix it, he will. You don't need to remind him every six months. 🔧",
  "My ex texted me: 'Go to hell.' I replied: 'Miss you too.' 😂",
  "I told my boss that three companies were after me. I needed a raise or I'd leave. He said 'Which companies?' I said: 'Electric, gas, and water.' 💸",
  "My wife asked me to get groceries. I came back with chips and a lifetime of regret. 🛒",
  "I hate people who steal my ideas before I think of them. 🤬",
  "They say milk is good for your teeth. But when's the last time you saw a cow at the dentist? 🐄",
  "I applied for a job at the mirror factory. I could see myself working there. 🪞",
  "I have enough money to live comfortably for the rest of my life. If I die next Thursday. 💀",
  "I went to a bookshop and asked for books about paranoia. The librarian said: 'They're right behind you.' I ran. 🏃",
  "My friend said, 'You don't know sarcasm.' I said, 'Oh yeah, great observation.' 🙄",
  "I'm not fat, I'm just easy to see. 👀",
  "My wife said I should be more responsible. I told her I'm responsible for all my bad decisions. ✅",
  "My son cried when I told him Santa wasn't real. Even worse was telling him his father wasn't either. 🎅",
  "Life's too short to worry. Life's also too short not to worry. Make up your mind, life. 😤",
];

// 20 anime-inspired Unicode font styles for .fancy command
const FANCY_STYLES = [
  (t: string) => t.split("").map(c => "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇0123456789"["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".indexOf(c)] || c).join(""),
  (t: string) => t.split("").map(c => "𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻"["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".indexOf(c)] || c).join(""),
  (t: string) => t.split("").map(c => "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣"["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".indexOf(c)] || c).join(""),
  (t: string) => t.split("").map(c => "𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃"["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".indexOf(c)] || c).join(""),
  (t: string) => t.split("").map(c => "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷"["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".indexOf(c)] || c).join(""),
  (t: string) => t.split("").map(c => "𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟"["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".indexOf(c)] || c).join(""),
  (t: string) => t.split("").map(c => "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫"["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".indexOf(c)] || c).join(""),
  (t: string) => [...t].map(c => c + "\u20e3").join(""),
  (t: string) => t.toUpperCase().split("").join(" "),
  (t: string) => t.split("").map(c => ({ a:"ᴀ",b:"ʙ",c:"ᴄ",d:"ᴅ",e:"ᴇ",f:"ꜰ",g:"ɢ",h:"ʜ",i:"ɪ",j:"ᴊ",k:"ᴋ",l:"ʟ",m:"ᴍ",n:"ɴ",o:"ᴏ",p:"ᴘ",q:"Q",r:"ʀ",s:"s",t:"ᴛ",u:"ᴜ",v:"ᴠ",w:"ᴡ",x:"x",y:"ʏ",z:"ᴢ" }[c.toLowerCase()] || c)).join(""),
  (t: string) => t.split("").map(c => "ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ"["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c)] || c).join(""),
  (t: string) => "꧁༺ " + t + " ༻꧂",
  (t: string) => "∙̣̇" + t.split("").join("∙") + "∙̣̇",
  (t: string) => "『 " + t + " 』",
  (t: string) => "「 " + t + " 」",
  (t: string) => "【 " + t + " 】",
  (t: string) => "✦ " + t.split("").join(" ") + " ✦",
  (t: string) => t.split("").map((c,i) => i%2===0 ? c.toUpperCase() : c.toLowerCase()).join(""),
  (t: string) => t.split("").reverse().join(""),
  (t: string) => "🌸 " + t.split("").join(" 🌸 ") + " 🌸",
];

const SOCIALS = [
  "Instagram addict 📸","Twitter main character 🐦","TikTok dancer 💃",
  "Discord lurker 👁️","Twitch streamer 🎮","Reddit philosopher 🤔",
];

const DUALITIES = [
  "Soft-spoken but will fight you 🥊","Introvert online, extrovert with friends",
  "Says 'I don't care' but cares deeply","Looks mean, is actually soft","Quiet in real life, chaotic online",
];

const SKILLS = [
  "Professional overthinker","Master of saying 'I'll do it later'",
  "Expert at pretending to be busy","PhD in sleeping through alarms",
  "Certified snack locator","World champion at avoiding conflict",
];

const GENS = [
  "You were definitely a cat in a past life 🐱",
  "Your vibe screams main character energy ✨",
  "You have the energy of someone who's seen too much 👁️",
  "You're 90% internet and 10% real world",
  "Your personality is literally a mood board",
];

export async function handleFun(ctx: CommandContext): Promise<void> {
  const { from, sender, args, command: cmd, msg, sock } = ctx;
  const name = sender.split("@")[0];
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  await sendText(from, loadingText(cmd), [sender]);

  if (cmd === "gay") {
    const targetId = getFunTarget(ctx);
    const targetName = targetId.split("@")[0];
    const pct = Math.floor(Math.random() * 101);
    await sock.sendMessage(from, {
      text: analysisResult("𝗚𝗮𝘆", targetName, pct),
      mentions: [targetId],
    });
    return;
  }

  if (cmd === "lesbian") {
    const targetId = getFunTarget(ctx);
    const targetName = targetId.split("@")[0];
    const pct = Math.floor(Math.random() * 101);
    await sock.sendMessage(from, {
      text: analysisResult("𝗟𝗲𝘀𝗯𝗶𝗮𝗻", targetName, pct),
      mentions: [targetId],
    });
    return;
  }

  if (cmd === "simp") {
    const target = mentioned ? `@${mentioned.split("@")[0]}` : "someone";
    const pct = Math.floor(Math.random() * 101);
    await sock.sendMessage(from, {
      text: `😩 @${name} is *${pct}% simp* for ${target}!`,
      mentions: [sender, ...(mentioned ? [mentioned] : [])],
    });
    return;
  }

  if (cmd === "match") {
    if (!mentioned) { await sendText(from, "❌ Mention someone to match with!"); return; }
    const pct = Math.floor(Math.random() * 101);
    const rating = pct >= 80 ? "💍 Perfect match!" : pct >= 60 ? "💕 Good match!" : pct >= 40 ? "🤝 Decent match." : "💔 Not meant to be.";
    await sock.sendMessage(from, {
      text: `💘 @${name} + @${mentioned.split("@")[0]} = *${pct}%* match\n${rating}`,
      mentions: [sender, mentioned],
    });
    return;
  }

  if (cmd === "ship") {
    if (!mentioned) { await sendText(from, "❌ Mention someone to ship with!"); return; }
    const n1 = name;
    const n2 = mentioned.split("@")[0];
    const ship = n1.slice(0, Math.ceil(n1.length / 2)) + n2.slice(Math.floor(n2.length / 2));
    await sock.sendMessage(from, {
      text: `💑 Ship name: *${ship}* 💕`,
      mentions: [sender, mentioned],
    });
    return;
  }

  if (cmd === "character") {
    const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    await sendText(from, `🎭 @${name}'s anime character is:\n*${char}*`, [sender]);
    return;
  }

  if (cmd === "psize" || cmd === "pp") {
    const size = Math.floor(Math.random() * 25);
    const bar = "8" + "=".repeat(size) + "D";
    await sendText(from, `📏 @${name}'s size: ${size}cm\n${bar}`, [sender]);
    return;
  }

  if (cmd === "skill") {
    const s = SKILLS[Math.floor(Math.random() * SKILLS.length)];
    await sendText(from, `🎯 @${name}'s special skill:\n*${s}*`, [sender]);
    return;
  }

  if (cmd === "duality") {
    const d = DUALITIES[Math.floor(Math.random() * DUALITIES.length)];
    await sendText(from, `♎ @${name}'s duality:\n*${d}*`, [sender]);
    return;
  }

  if (cmd === "gen") {
    const g = GENS[Math.floor(Math.random() * GENS.length)];
    await sendText(from, `🔮 ${g}`, [sender]);
    return;
  }

  if (cmd === "pov") {
    const p = POVS[Math.floor(Math.random() * POVS.length)];
    await sendText(from, `📖 *POV:* ${p}`);
    return;
  }

  if (cmd === "social") {
    const s = SOCIALS[Math.floor(Math.random() * SOCIALS.length)];
    await sendText(from, `📱 @${name} gives off:\n*${s}* energy`, [sender]);
    return;
  }

  if (cmd === "relation") {
    if (!mentioned) { await sendText(from, "❌ Mention someone!"); return; }
    const r = RELATIONS[Math.floor(Math.random() * RELATIONS.length)];
    await sock.sendMessage(from, {
      text: `💫 @${name} and @${mentioned.split("@")[0]} are:\n*${r}*`,
      mentions: [sender, mentioned],
    });
    return;
  }

  if (cmd === "wouldyourather" || cmd === "wyr") {
    const q = WYR[Math.floor(Math.random() * WYR.length)];
    await sendText(from, `🤔 *Would You Rather...*\n\n${q}`);
    return;
  }

  if (cmd === "joke") {
    await sendText(from, `😂 ${JOKES[Math.floor(Math.random() * JOKES.length)]}`);
    return;
  }

  if (cmd === "fancy") {
    const styleNum = parseInt(args[0]);
    const text = args.slice(1).join(" ");
    if (!args[0] || isNaN(styleNum) || !text) {
      const preview = FANCY_STYLES.slice(0, 5).map((fn, i) => `${i + 1}. ${fn("Tenku")}`).join("\n");
      await sendText(from,
        `🎭 *Fancy Text Styles*\n\nUsage: .fancy <1-20> <text>\n\nExample:\n.fancy 4 Tenku\n\nStyle previews (1-5):\n${preview}\n\n_Try all 20 styles!_`
      );
      return;
    }
    const idx = Math.max(1, Math.min(20, styleNum)) - 1;
    const styled = FANCY_STYLES[idx](text);
    await sendText(from, `🎭 Style ${styleNum}:\n\n${styled}`);
    return;
  }
}

function loadingText(command: string): string {
  return `┌─⟡ 『 𝗔𝗟𝗣𝗛𝗔 𝗟𝗢𝗔𝗗𝗜𝗡𝗚 』⟡\n║\n║ ➩ Command: .${command}\n║ ➩ Target: calculating...\n║\n└────────────────────`;
}

function getFunTarget(ctx: CommandContext): string {
  const info = getContextInfo(ctx.msg.message);
  const participant = info?.participant || info?.quotedMessage?.key?.participant || info?.quotedMessage?.participant;
  return info?.mentionedJid?.[0] || participant || ctx.sender;
}

function getContextInfo(message: any): any {
  return message?.extendedTextMessage?.contextInfo ||
    message?.imageMessage?.contextInfo ||
    message?.videoMessage?.contextInfo ||
    message?.documentMessage?.contextInfo ||
    message?.stickerMessage?.contextInfo ||
    message?.buttonsResponseMessage?.contextInfo ||
    message?.listResponseMessage?.contextInfo ||
    message?.templateButtonReplyMessage?.contextInfo ||
    {};
}

function analysisResult(label: string, targetName: string, pct: number): string {
  const filled = Math.max(0, Math.min(10, Math.round(pct / 10)));
  const bar = "■".repeat(filled) + "□".repeat(10 - filled);
  return `╔═ ❰ 🌈 𝗔𝗡𝗔𝗟𝗬𝗦𝗜𝗦 𝗥𝗘𝗦𝗨𝗟𝗧 🌈 ❱ ═╗\n` +
    `║\n` +
    `║ 👤 𝗨𝘀𝗲𝗿: @${targetName}\n` +
    `║ 💖 ${label} 𝗟𝗲𝘃𝗲𝗹: ${pct}%\n` +
    `║\n` +
    `║ 📊 𝗦𝘁𝗮𝘁𝘂𝘀: [${bar}]\n` +
    `║\n` +
    `╚═════════════════╝`;
}
