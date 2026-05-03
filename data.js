// ===== UNISYNC DATA =====

const IMAGES = {
  events: [
    // 1 Hackathon — developers coding at laptops
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=90',
    // 2 Music Night — live concert stage with crowd
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=90',
    // 3 Cricket — cricket stadium match
    'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=90',
    // 4 AI & Future Tech Seminar
    'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800',
    // 5 Cultural Fest — colourful traditional performance
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=90',
    // 6 Startup Pitch — presenter on stage with slide
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=90',
    // 7 Photography Workshop — DSLR camera close-up
    'https://images.unsplash.com/photo-1452780212441-752ad0a465f3?w=800&q=90',
    // 8 Drama Show — theatrical stage performance
    'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800&q=90',
  ],
};

const EVENTS = [
  { id:1, name:'FAST Hackathon 2026', category:'technical', tag:'Technical', club:'CS Society', clubId:1,
    date:'Mar 25, 2026', time:'9:00 AM – 9:00 PM', location:'CS Block, FAST NUCES',
    desc:'A 12-hour coding marathon open to all FAST students. Build innovative solutions for real-world problems. Compete in teams of 2–4.',
    prize:'Rs 50,000', paid:false, price:0, img:IMAGES.events[0], rsvp:false, saved:false,
    reviews:[{author:'Ali R.',stars:5,text:'Best hackathon on campus, super well-organized!'},{author:'Sara M.',stars:4,text:'Loved the themes. Will come again.'}] },
  { id:2, name:'Annual Music Night', category:'social', tag:'Social', club:'Music Society', clubId:2,
    date:'Apr 3, 2026', time:'7:00 PM – 11:00 PM', location:'Main Auditorium',
    desc:'An evening of live performances by FAST\'s top student bands and solo artists. Food stalls, glow sticks, and great vibes!',
    prize:'', paid:true, price:500, img:IMAGES.events[1], rsvp:false, saved:false,
    reviews:[{author:'Hina K.',stars:5,text:'Absolute blast! The performances were top-tier.'},{author:'Usman T.',stars:4,text:'Great event, just needed better seating.'}] },
  { id:3, name:'Inter-University Cricket League', category:'sports', tag:'Sports', club:'Sports Club', clubId:3,
    date:'Apr 10, 2026', time:'10:00 AM – 5:00 PM', location:'University Sports Ground',
    desc:'FAST\'s biggest cricket tournament. 8 teams competing over 2 days. Open registration for FAST students.',
    prize:'Rs 30,000', paid:false, price:0, img:IMAGES.events[2], rsvp:false, saved:false,
    reviews:[{author:'Fahad S.',stars:5,text:'Amazing atmosphere, really feels like a professional match!'},{author:'Nadia Q.',stars:4,text:'Need more food options but otherwise great.'}] },
  { id:4, name:'AI & Future Tech Seminar', category:'technical', tag:'Technical', club:'CS Society', clubId:1,
    date:'Apr 15, 2026', time:'2:00 PM – 5:00 PM', location:'Lecture Hall C',
    desc:'Industry leaders and academics share insights on the future of AI, machine learning, and automation in Pakistan.',
    prize:'', paid:false, price:0, img:IMAGES.events[3], rsvp:false, saved:false,
    reviews:[] },
  { id:5, name:'Cultural Fest 2026', category:'cultural', tag:'Cultural', club:'Cultural Society', clubId:4,
    date:'Apr 20, 2026', time:'12:00 PM – 8:00 PM', location:'University Courtyard',
    desc:'Celebrate Pakistan\'s rich cultural diversity through dance, music, food, and fashion from across the country.',
    prize:'Rs 15,000', paid:true, price:300, img:IMAGES.events[4], rsvp:false, saved:false,
    reviews:[{author:'Zainab L.',stars:5,text:'Such a wonderful celebration of our culture!'}] },
  { id:6, name:'Startup Pitch Competition', category:'technical', tag:'Workshop', club:'Entrepreneurship Club', clubId:5,
    date:'May 2, 2026', time:'10:00 AM – 4:00 PM', location:'Innovation Hub',
    desc:'Present your startup idea to a panel of investors and win seed funding. Teams of 1–3. Open to all departments.',
    prize:'Rs 100,000 Seed Fund', paid:false, price:0, img:IMAGES.events[5], rsvp:false, saved:false,
    reviews:[] },
  { id:7, name:'Photography Workshop', category:'social', tag:'Workshop', club:'Photography Club', clubId:6,
    date:'May 8, 2026', time:'3:00 PM – 6:00 PM', location:'Media Studio',
    desc:'Learn professional photography techniques from award-winning photographers. Covers composition, lighting, and editing.',
    prize:'', paid:true, price:400, img:IMAGES.events[6], rsvp:false, saved:false,
    reviews:[] },
  { id:8, name:'Drama Society Final Show', category:'cultural', tag:'Cultural', club:'Drama Society', clubId:7,
    date:'May 15, 2026', time:'6:00 PM – 9:00 PM', location:'Main Auditorium',
    desc:'The semester\'s grand finale stage production. This year\'s play: "The Last Signal" – a sci-fi thriller by FAST\'s finest young actors.',
    prize:'', paid:true, price:250, img:IMAGES.events[7], rsvp:false, saved:false,
    reviews:[] },
];

const CLUBS = [
  { id:1, name:'CS Society', category:'Technology', emoji:'💻', members:320, desc:'The premier tech society at FAST NUCES, organizing hackathons, workshops, and coding competitions all year long.',
    leadership:[{name:'Zainab Ahmed',role:'President',img:'https://ui-avatars.com/api/?name=Zainab+Ahmed&background=1a2b5e&color=c9a227&size=80'},{name:'Ali Hassan',role:'VP',img:'https://ui-avatars.com/api/?name=Ali+Hassan&background=c9a227&color=1a2b5e&size=80'},{name:'Sara Khan',role:'Director Marketing',img:'https://ui-avatars.com/api/?name=Sara+Khan&background=2dd4bf&color=000&size=80'}],
    joined:false, saved:false, announcements:['Hackathon registrations now open!','Workshop on Data Structures this Friday','Team CS Society won the National Coding Cup 🏆'],
    chatId:'cs-society', socials:{ig:'@FAST_CS',linkedin:'FAST CS Society'} },
  { id:2, name:'Music Society', category:'Arts', emoji:'🎵', members:180, desc:'A community of passionate musicians. We host live shows, jam sessions, open mic nights, and music production workshops.',
    leadership:[{name:'Hina Mirza',role:'President',img:'https://ui-avatars.com/api/?name=Hina+Mirza&background=1a2b5e&color=c9a227&size=80'},{name:'Bilal Qureshi',role:'VP',img:'https://ui-avatars.com/api/?name=Bilal+Q&background=c9a227&color=1a2b5e&size=80'}],
    joined:false, saved:false, announcements:['Music Night tickets now available!','Open mic auditions this Sunday at 4 PM'],
    chatId:'music-society', socials:{ig:'@FAST_Music'} },
  { id:3, name:'Sports Club', category:'Sports', emoji:'🏏', members:450, desc:'Representing FAST in inter-university leagues for cricket, football, basketball, and badminton. Open to all fitness enthusiasts.',
    leadership:[{name:'Usman Tariq',role:'Captain',img:'https://ui-avatars.com/api/?name=Usman+Tariq&background=1a2b5e&color=c9a227&size=80'}],
    joined:false, saved:false, announcements:['Cricket trials this Wednesday','Gym facility open 7 AM – 10 PM daily'],
    chatId:'sports-club', socials:{ig:'@FAST_Sports'} },
  { id:4, name:'Cultural Society', category:'Cultural', emoji:'🎭', members:210, desc:'Celebrating the rich mosaic of Pakistani culture through events, performances, and cultural exchange programs.',
    leadership:[{name:'Fatima Noor',role:'President',img:'https://ui-avatars.com/api/?name=Fatima+Noor&background=1a2b5e&color=c9a227&size=80'}],
    joined:false, saved:false, announcements:['Cultural Fest 2026 registrations open!'],
    chatId:'cultural-society', socials:{ig:'@FAST_Culture'} },
  { id:5, name:'Entrepreneurship Club', category:'Business', emoji:'🚀', members:155, desc:'We equip aspiring entrepreneurs with the knowledge, network, and resources to build successful startups.',
    leadership:[{name:'Hamza Shah',role:'President',img:'https://ui-avatars.com/api/?name=Hamza+Shah&background=1a2b5e&color=c9a227&size=80'}],
    joined:false, saved:false, announcements:['Pitch competition registrations closing soon!','Startup mentorship sessions every Saturday'],
    chatId:'e-club', socials:{ig:'@FAST_Entrepreneurship'} },
  { id:6, name:'Photography Club', category:'Arts', emoji:'📸', members:90, desc:'Explore photography from urban street shoots to studio portrait sessions. Annual photo exhibitions and competitions.',
    leadership:[{name:'Nadia Qamar',role:'President',img:'https://ui-avatars.com/api/?name=Nadia+Qamar&background=1a2b5e&color=c9a227&size=80'}],
    joined:false, saved:false, announcements:['Workshop seats almost full – register now!'],
    chatId:'photo-club', socials:{ig:'@FAST_PhotoSociety'} },
  { id:7, name:'Drama Society', category:'Arts', emoji:'🎬', members:120, desc:'FAST\'s celebrated theatre group, staging everything from comedy sketches to full-length dramatic productions each semester.',
    leadership:[{name:'Maryam Rizvi',role:'Director',img:'https://ui-avatars.com/api/?name=Maryam+Rizvi&background=1a2b5e&color=c9a227&size=80'}],
    joined:false, saved:false, announcements:['Final show tickets live – limited seats!','Auditions for next semester open in May'],
    chatId:'drama-society', socials:{ig:'@FAST_Drama'} },
  { id:8, name:'Debating Society', category:'Education', emoji:'🗣️', members:75, desc:'Sharpen your critical thinking and public speaking. We participate in national and international debating circuits.',
    leadership:[{name:'Omar Iqbal',role:'President',img:'https://ui-avatars.com/api/?name=Omar+Iqbal&background=1a2b5e&color=c9a227&size=80'}],
    joined:false, saved:false, announcements:['Practice session every Tuesday at 5 PM'],
    chatId:'debate-society', socials:{ig:'@FAST_Debate'} },
];

const POSITIONS = [
  { id:1, clubId:1, club:'CS Society', pos:'Director of Marketing', type:'Part-time', deadline:'Mar 30, 2026',
    desc:'Lead the marketing strategy for CS Society. Manage social media, design promotional material, and coordinate with event sponsors.',
    requirements:['Strong communication skills','Experience with Canva / Adobe','Social media savvy','2nd year or above'],
    status:'open' },
  { id:2, clubId:2, club:'Music Society', pos:'Event Coordinator', type:'Volunteer', deadline:'Apr 5, 2026',
    desc:'Coordinate logistics for our Music Night event and future weekly sessions. Liaise with hired artists and venue management.',
    requirements:['Organized and detail-oriented','Previous event experience a plus','Passion for music'],
    status:'open' },
  { id:3, clubId:5, club:'Entrepreneurship Club', pos:'Head of Sponsorships', type:'Part-time', deadline:'Apr 10, 2026',
    desc:'Secure corporate sponsorships for our startup pitch competition and annual summit. Build relationships with industry partners.',
    requirements:['Confident communicator','Basic understanding of business','3rd year or above'],
    status:'open' },
  { id:4, clubId:3, club:'Sports Club', pos:'Team Manager – Cricket', type:'Volunteer', deadline:'Apr 12, 2026',
    desc:'Manage logistics, scheduling, and morale for the FAST cricket team during the inter-university league season.',
    requirements:['Passion for cricket','Availability on match days','Strong organizational skills'],
    status:'open' },
  { id:5, clubId:7, club:'Drama Society', pos:'Stage Designer', type:'Project-based', deadline:'Apr 20, 2026',
    desc:'Design and build the set for our semester production "The Last Signal". Work closely with the director and props team.',
    requirements:['Creative mindset','Basic carpentry or design skills','Available for rehearsals'],
    status:'open' },
  { id:6, clubId:6, club:'Photography Club', pos:'Social Media Manager', type:'Part-time', deadline:'Apr 25, 2026',
    desc:'Run the Photography Club\'s Instagram and manage content calendars, reels, and community engagement.',
    requirements:['Active Instagram presence','Photo editing skills (Lightroom preferred)','Consistent and creative'],
    status:'open' },
];

const NOTIFICATIONS = [
  { id:1, icon:'🏆', title:'Application Shortlisted!', text:'You have been shortlisted for Director of Marketing at CS Society. Interview on March 22.', time:'2 hours ago', unread:true },
  { id:2, icon:'🎟', title:'Event Reminder', text:'FAST Hackathon 2026 starts tomorrow at 9 AM. Don\'t forget your student ID!', time:'5 hours ago', unread:true },
  { id:3, icon:'📢', title:'CS Society Announcement', text:'Workshop on Data Structures this Friday at 4 PM in Lab 5.', time:'Yesterday', unread:true },
  { id:4, icon:'🎵', title:'New Event from Music Society', text:'Annual Music Night tickets are now available. Grab yours before they sell out!', time:'2 days ago', unread:false },
  { id:5, icon:'📅', title:'Meeting Reminder', text:'CS Society weekly meeting today at 5:30 PM in Room 201.', time:'3 days ago', unread:false },
  { id:6, icon:'✅', title:'Registration Confirmed', text:'You have successfully registered for AI & Future Tech Seminar.', time:'4 days ago', unread:false },
];

const CATEGORIES = [
  {id:'all', label:'All', emoji:'✨'},
  {id:'technical', label:'Technical', emoji:'💻'},
  {id:'social', label:'Social', emoji:'🎉'},
  {id:'sports', label:'Sports', emoji:'🏆'},
  {id:'cultural', label:'Cultural', emoji:'🎭'},
  {id:'arts', label:'Arts', emoji:'🎨'},
  {id:'business', label:'Business', emoji:'💼'},
  {id:'education', label:'Education', emoji:'📚'},
  {id:'technology', label:'Technology', emoji:'🔬'},
  {id:'community', label:'Community', emoji:'🤝'},
  {id:'music', label:'Music', emoji:'🎵'},
];

const CHAT_MESSAGES = {
  'cs-society': [
    { sender:'Zainab Ahmed', text:'Hey everyone! Hackathon registrations are now OPEN 🚀', time:'10:15 AM', mine:false },
    { sender:'Ali Hassan', text:'Remember teams of 2-4 only. Check the rules doc in the announcement.', time:'10:18 AM', mine:false },
    { sender:'You', text:'Are freshers allowed to participate?', time:'10:22 AM', mine:true },
    { sender:'Zainab Ahmed', text:'Yes absolutely! All years welcome 🙌', time:'10:23 AM', mine:false },
  ],
  'music-society': [
    { sender:'Hina Mirza', text:'Ticket sales for Music Night are live! Get yours before they sell out 🎵', time:'9:00 AM', mine:false },
    { sender:'Bilal Qureshi', text:'Sound check rehearsal on April 2nd at 5 PM. All performers must attend.', time:'11:30 AM', mine:false },
    { sender:'You', text:'Looking forward to the show!', time:'11:35 AM', mine:true },
  ],
  'sports-club': [
    { sender:'Usman Tariq', text:'Cricket trials are THIS Wednesday at 3 PM on the main ground. No prior booking needed.', time:'8:00 AM', mine:false },
    { sender:'Fahad Siddiqui', text:'What equipment do we need to bring?', time:'8:15 AM', mine:false },
    { sender:'Usman Tariq', text:'Just yourselves! Bat, pads, gloves all provided by the club.', time:'8:17 AM', mine:false },
  ],
  'cultural-society': [
    { sender:'Fatima Noor', text:'Cultural Fest 2026 planning starts NOW! All volunteers DM me directly.', time:'2:00 PM', mine:false },
  ],
  'e-club': [
    { sender:'Hamza Shah', text:'Pitch competition deadline is May 2nd! Only 10 teams will make it to the finals.', time:'9:30 AM', mine:false },
    { sender:'You', text:'What format is the pitch?', time:'9:45 AM', mine:true },
    { sender:'Hamza Shah', text:'5-minute pitch + 5-minute Q&A with the investor panel.', time:'9:47 AM', mine:false },
  ],
  'photo-club': [
    { sender:'Nadia Qamar', text:'Workshop seats almost full! Only 5 spots left. Register at the desk today.', time:'3:00 PM', mine:false },
  ],
  'drama-society': [
    { sender:'Maryam Rizvi', text:'Final show tickets are LIVE. This year\'s production is going to blow you away 🎬', time:'11:00 AM', mine:false },
    { sender:'You', text:'Can\'t wait! What\'s the play about?', time:'11:10 AM', mine:true },
    { sender:'Maryam Rizvi', text:'"The Last Signal" — a sci-fi thriller set in 2087. Very ambitious production!', time:'11:12 AM', mine:false },
  ],
  'debate-society': [
    { sender:'Omar Iqbal', text:'Practice session tomorrow at 5 PM. Topic: "AI will replace human creativity" — Debate format.', time:'6:00 PM', mine:false },
  ],
};

