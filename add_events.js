const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addEvents() {
  const events = [
    {
      name: 'Global Tech Summit 2026',
      club: 'Technology Society',
      date: '2026-06-15',
      time: '10:00 AM',
      location: 'Main Auditorium',
      category: 'technical',
      tag: 'Workshop',
      price: 500,
      paid: true,
      img: 'https://images.unsplash.com/photo-1540575861501-7ad0582373f3?auto=format&fit=crop&q=80&w=800'
    },
    {
      name: 'Battle of the Bands',
      club: 'Music Society',
      date: '2026-06-28',
      time: '6:30 PM',
      location: 'Open Air Theater',
      category: 'cultural',
      tag: 'Competition',
      price: 0,
      paid: false,
      img: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=800'
    },
    {
      name: 'Startup Pitch Night',
      club: 'Entrepreneurship Club',
      date: '2026-07-05',
      time: '5:00 PM',
      location: 'Business Wing',
      category: 'business',
      tag: 'Networking',
      price: 0,
      paid: false,
      img: 'https://images.unsplash.com/photo-1475721027187-40aeae77c9d3?auto=format&fit=crop&q=80&w=800'
    },
    {
      name: 'Intra-University Futsal',
      club: 'Sports Club',
      date: '2026-07-20',
      time: '4:00 PM',
      location: 'Futsal Court',
      category: 'sports',
      tag: 'Tournament',
      price: 200,
      paid: true,
      img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800'
    },
    {
      name: 'AI & Ethics Seminar',
      club: 'Technology Society',
      date: '2026-08-12',
      time: '11:00 AM',
      location: 'Hall B',
      category: 'technical',
      tag: 'Seminar',
      price: 0,
      paid: false,
      img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800'
    }
  ];

  for (const ev of events) {
    const { data, error } = await supabase.from('events').insert([ev]);
    if (error) console.error('Error inserting event:', error);
    else console.log('Inserted event:', ev.name);
  }
}

addEvents();
