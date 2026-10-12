/* =========================================================
   بيانات الحروف والكلمات
   l  = الحرف          w = الكلمة          e = الإيموجي
   nm = نطق اسم الحرف (رموز المُصنّع الصوتي)
   wp = نطق الكلمة     (رموز المُصنّع الصوتي)
   n  = صيغ مقبولة عند التعرف على الصوت (اختياري، يحتاج إنترنت)
   ========================================================= */

const AR_LETTERS = [
  { l: 'أ', w: 'أسد',   e: '🦁', nm: "? a l i f", wp: "? a s a d",       n: ['ألف','الف','ا','أ'] },
  { l: 'ب', w: 'بطة',   e: '🦆', nm: "b A",       wp: "b a T a",         n: ['باء','با','ب','بي'] },
  { l: 'ت', w: 'تفاحة', e: '🍎', nm: "t A",       wp: "t u f A H a",     n: ['تاء','تا','ت','تي'] },
  { l: 'ث', w: 'ثعلب',  e: '🦊', nm: "th A",      wp: "th a 3 l a b",    n: ['ثاء','ثا','ث'] },
  { l: 'ج', w: 'جمل',   e: '🐪', nm: "j I m",     wp: "j a m a l",       n: ['جيم','جم','ج'] },
  { l: 'ح', w: 'حصان',  e: '🐴', nm: "H A",       wp: "H i S A n",       n: ['حاء','حا','ح','ها'] },
  { l: 'خ', w: 'خروف',  e: '🐑', nm: "x A",       wp: "x a r U f",       n: ['خاء','خا','خ'] },
  { l: 'د', w: 'دجاجة', e: '🐔', nm: "d A l",     wp: "d a j A j a",     n: ['دال','دل','د'] },
  { l: 'ذ', w: 'ذئب',   e: '🐺', nm: "dh A l",    wp: "dh i ? b",        n: ['ذال','ذل','ذ'] },
  { l: 'ر', w: 'ريشة',  e: '🪶', nm: "r A",       wp: "r I sh a",        n: ['راء','را','ر'] },
  { l: 'ز', w: 'زرافة', e: '🦒', nm: "z A y",     wp: "z a r A f a",     n: ['زاي','زاى','زي','ز','زين'] },
  { l: 'س', w: 'سمكة',  e: '🐟', nm: "s I n",     wp: "s a m a k a",     n: ['سين','سن','س'] },
  { l: 'ش', w: 'شمس',   e: '☀️', nm: "sh I n",    wp: "sh a m s",        n: ['شين','شن','ش'] },
  { l: 'ص', w: 'صقر',   e: '🦅', nm: "S A d",     wp: "S a q a r",       n: ['صاد','صد','ص'] },
  { l: 'ض', w: 'ضفدع',  e: '🐸', nm: "D A d",     wp: "D i f d a 3",     n: ['ضاد','ضد','ض'] },
  { l: 'ط', w: 'طائرة', e: '✈️', nm: "T A",       wp: "T A ? i r a",     n: ['طاء','طا','ط'] },
  { l: 'ظ', w: 'ظرف',   e: '✉️', nm: "Z A",       wp: "Z a r f",         n: ['ظاء','ظا','ظ'] },
  { l: 'ع', w: 'عين',   e: '👁️', nm: "3 a y n",   wp: "3 a y n",         n: ['عين','ع'] },
  { l: 'غ', w: 'غزال',  e: '🦌', nm: "gh a y n",  wp: "gh a z A l",      n: ['غين','غ'] },
  { l: 'ف', w: 'فيل',   e: '🐘', nm: "f A",       wp: "f I l",           n: ['فاء','فا','ف'] },
  { l: 'ق', w: 'قمر',   e: '🌙', nm: "q A f",     wp: "q a m a r",       n: ['قاف','قف','ق'] },
  { l: 'ك', w: 'كتاب',  e: '📚', nm: "k A f",     wp: "k i t A b",       n: ['كاف','كف','ك'] },
  { l: 'ل', w: 'ليمون', e: '🍋', nm: "l A m",     wp: "l a y m U n",     n: ['لام','لم','ل'] },
  { l: 'م', w: 'موز',   e: '🍌', nm: "m I m",     wp: "m a w z",         n: ['ميم','مم','م'] },
  { l: 'ن', w: 'نحلة',  e: '🐝', nm: "n U n",     wp: "n a H l a",       n: ['نون','نن','ن'] },
  { l: 'ه', w: 'هدية',  e: '🎁', nm: "h A",       wp: "h a d I y a",     n: ['هاء','ها','ه'] },
  { l: 'و', w: 'وردة',  e: '🌹', nm: "w A w",     wp: "w a r d a",       n: ['واو','وو','و'] },
  { l: 'ي', w: 'يد',    e: '✋', nm: "y A",       wp: "y a d",           n: ['ياء','يا','ي','ى'] }
];

const EN_LETTERS = [
  { l: 'A', w: 'Apple',      e: '🍎', nm: "e y",          wp: "ae p @ l",              n: ['a','ay','eh','hey'] },
  { l: 'B', w: 'Ball',       e: '⚽', nm: "b I",          wp: "b O l",                 n: ['b','be','bee'] },
  { l: 'C', w: 'Cat',        e: '🐱', nm: "s I",          wp: "k ae t",                n: ['c','see','sea'] },
  { l: 'D', w: 'Dog',        e: '🐶', nm: "d I",          wp: "d O g",                 n: ['d','dee'] },
  { l: 'E', w: 'Elephant',   e: '🐘', nm: "I",            wp: "e l @ f @ n t",         n: ['e','ee'] },
  { l: 'F', w: 'Fish',       e: '🐟', nm: "e f",          wp: "f i sh",                n: ['f','ef','eff'] },
  { l: 'G', w: 'Grapes',     e: '🍇', nm: "j I",          wp: "g R e y p s",           n: ['g','gee','jee'] },
  { l: 'H', w: 'Horse',      e: '🐴', nm: "e y ch",       wp: "h O R s",               n: ['h','aitch','age'] },
  { l: 'I', w: 'Ice Cream',  e: '🍦', nm: "a y",          wp: "a y s k R I m",         n: ['i','eye','ai'] },
  { l: 'J', w: 'Juice',      e: '🧃', nm: "j e y",        wp: "j U s",                 n: ['j','jay'] },
  { l: 'K', w: 'Key',        e: '🔑', nm: "k e y",        wp: "k I",                   n: ['k','kay','okay'] },
  { l: 'L', w: 'Lion',       e: '🦁', nm: "e l",          wp: "l a y @ n",             n: ['l','el','elle'] },
  { l: 'M', w: 'Monkey',     e: '🐵', nm: "e m",          wp: "m uh n k I",            n: ['m','em'] },
  { l: 'N', w: 'Nose',       e: '👃', nm: "e n",          wp: "n o w z",               n: ['n','en','and'] },
  { l: 'O', w: 'Orange',     e: '🍊', nm: "o w",          wp: "O R i n j",             n: ['o','oh','owe'] },
  { l: 'P', w: 'Panda',      e: '🐼', nm: "p I",          wp: "p ae n d @",            n: ['p','pee','pea'] },
  { l: 'Q', w: 'Queen',      e: '👑', nm: "k y U",        wp: "k w I n",               n: ['q','queue','cue'] },
  { l: 'R', w: 'Rabbit',     e: '🐰', nm: "A R",          wp: "R ae b i t",            n: ['r','are','our'] },
  { l: 'S', w: 'Sun',        e: '☀️', nm: "e s",          wp: "s uh n",                n: ['s','es','ess','yes'] },
  { l: 'T', w: 'Tiger',      e: '🐯', nm: "t I",          wp: "t a y g @ R",           n: ['t','tea','tee'] },
  { l: 'U', w: 'Umbrella',   e: '☂️', nm: "y U",          wp: "uh m b R e l @",        n: ['u','you'] },
  { l: 'V', w: 'Violin',     e: '🎻', nm: "v I",          wp: "v a y @ l i n",         n: ['v','vee'] },
  { l: 'W', w: 'Watermelon', e: '🍉', nm: "d uh b l y U", wp: "w O t @ R m e l @ n",   n: ['w','double u','double you'] },
  { l: 'X', w: 'Xylophone',  e: '🎹', nm: "e k s",        wp: "z a y l @ f o w n",     n: ['x','ex'] },
  { l: 'Y', w: 'Yo-Yo',      e: '🪀', nm: "w a y",        wp: "y o w y o w",           n: ['y','why','wine'] },
  { l: 'Z', w: 'Zebra',      e: '🦓', nm: "z I",          wp: "z I b R @",             n: ['z','zee','zed'] }
];

/* نصوص الواجهة بالعربية والإنجليزية */
const I18N = {
  ar: {
    dir: 'rtl', home: '🏠 الرئيسية', back: '→ رجوع', prev: '→ السابق', next: 'التالي ←',
    langName: 'العربية', menuTitle: 'اختر النشاط', menuSub: 'ماذا تريد أن تتعلم اليوم؟',
    learn: 'تعلّم الحروف والكلمات', speak: 'تدرّب على النطق', practice: 'تدريبات ممتعة', quiz: 'اختبار وجمع النجوم',
    tapHint: '👆 اضغط على البطاقة لسماع النطق',
    speakTitle: 'استمع وكرّر', speakInst: 'استمع للحرف ثم انطقه بصوتك',
    listen: '🔊 استمع', iSaidIt: '✅ نطقتُه', tryAgain: '🔁 أعد',
    micIdle: 'اضغط 🎤 وقل الحرف (يحتاج إنترنت)', micListen: '🎙️ أسمعك...', micOk: '🎉 أحسنت! نطقك صحيح',
    micNo: 'حاول مرة أخرى 💪', heard: 'سمعتُ:', micOffline: 'التعرف على الصوت غير متاح الآن — استخدم زر «نطقتُه»',
    qLetterToWord: 'أي كلمة تبدأ بهذا الحرف؟', qWordToLetter: 'بأي حرف تبدأ هذه الكلمة؟', qSoundToLetter: 'استمع... ما هذا الحرف؟',
    right: ['أحسنت! 🎉', 'ممتاز! ⭐', 'رائع! 👏', 'برافو! 🌟'], wrong: 'حاول مرة أخرى 💪', wrongShow: 'الجواب الصحيح:',
    resultTitle: 'انتهى الاختبار! 🎉', again: '🔁 إعادة الاختبار', toMenu: '🏠 القائمة الرئيسية', best: 'أفضل نتيجة',
    msgs: ['واصل التدريب، ستتحسن! 💪', 'جيد جداً! استمر 👍', 'ممتاز! أنت بطل! 🏆', 'مذهل! علامة كاملة! 🌟'],
    offlineReady: '✅ جاهزة للعمل بدون إنترنت', mute: 'كتم الصوت', unmute: 'تشغيل الصوت'
  },
  en: {
    dir: 'ltr', home: '🏠 Home', back: '← Back', prev: '← Previous', next: 'Next →',
    langName: 'English', menuTitle: 'Choose an activity', menuSub: 'What do you want to learn today?',
    learn: 'Learn letters & words', speak: 'Speaking practice', practice: 'Fun practice', quiz: 'Quiz & collect stars',
    tapHint: '👆 Tap a card to hear it',
    speakTitle: 'Listen & repeat', speakInst: 'Listen to the letter, then say it out loud',
    listen: '🔊 Listen', iSaidIt: '✅ I said it', tryAgain: '🔁 Again',
    micIdle: 'Tap 🎤 and say the letter (needs internet)', micListen: '🎙️ Listening...', micOk: '🎉 Great! Correct',
    micNo: 'Try again 💪', heard: 'I heard:', micOffline: 'Voice recognition is unavailable — use the "I said it" button',
    qLetterToWord: 'Which word starts with this letter?', qWordToLetter: 'Which letter does this word start with?', qSoundToLetter: 'Listen... which letter is this?',
    right: ['Great job! 🎉', 'Excellent! ⭐', 'Awesome! 👏', 'Bravo! 🌟'], wrong: 'Try again 💪', wrongShow: 'Correct answer:',
    resultTitle: 'Quiz finished! 🎉', again: '🔁 Play again', toMenu: '🏠 Main menu', best: 'Best score',
    msgs: ['Keep practicing, you will improve! 💪', 'Very good! Keep going 👍', 'Excellent! You are a champion! 🏆', 'Amazing! Perfect score! 🌟'],
    offlineReady: '✅ Ready to work offline', mute: 'Mute', unmute: 'Unmute'
  }
};
