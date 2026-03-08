// ---------------------------------------------------------------------------
// Norwegian family-friendly activities database
// Covers the Drammen / Asker-Baerum / Oslo region with real venues.
// ---------------------------------------------------------------------------

export interface PlaceActivity {
  id: string;
  name: string;
  category:
    | "cinema"
    | "amusement"
    | "play"
    | "museum"
    | "outdoor"
    | "sports"
    | "arts"
    | "swimming";
  rating: number;
  reviewCount: number;
  description: string;
  priceLevel: number; // 0 = Free, 1 = $, 2 = $$, 3 = $$$
  ageRange: string;
  hours: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  tags: string[];
  website?: string;
  imageUrl: string;
}

// ---------------------------------------------------------------------------
// Drammen area
// ---------------------------------------------------------------------------

const DRAMMEN_ACTIVITIES: PlaceActivity[] = [
  {
    id: "leos-lekeland-drammen",
    name: "Leo's Lekeland Drammen",
    category: "play",
    rating: 4.3,
    reviewCount: 876,
    description:
      "Indoor play center with trampolines, ball pits, climbing walls, and slides for children aged 1-12. Separate toddler area and cafe for parents.",
    priceLevel: 2,
    ageRange: "1-12 years",
    hours: "Mon-Fri 10:00-18:00, Sat-Sun 10:00-19:00",
    address: "Engene 1, 3015 Drammen",
    city: "Drammen",
    latitude: 59.7374,
    longitude: 10.2143,
    tags: ["Indoor", "Trampolines", "Ball Pit", "Climbing"],
    website: "https://leoslekeland.no/drammen",
    imageUrl:
      "https://images.unsplash.com/photo-1566454825481-9c31bd88c36f?w=800&h=400&fit=crop",
  },
  {
    id: "rush-trampolinepark-drammen",
    name: "Rush Trampolinepark Drammen",
    category: "play",
    rating: 4.4,
    reviewCount: 1023,
    description:
      "High-energy trampoline park with foam pits, dodgeball courts, slam-dunk zones, and a ninja warrior course for all ages.",
    priceLevel: 2,
    ageRange: "3+ years",
    hours: "Mon-Fri 10:00-20:00, Sat-Sun 10:00-18:00",
    address: "Kobbervikdalen, 3036 Drammen",
    city: "Drammen",
    latitude: 59.752456,
    longitude: 10.1302872,
    tags: ["Indoor", "Trampolines", "Ninja Course", "Foam Pit"],
    website: "https://rushtrampoline.no",
    imageUrl:
      "https://images.unsplash.com/photo-1626248801379-51a0748a5f96?w=800&h=400&fit=crop",
  },
  {
    id: "kino-city-drammen",
    name: "Kino City Drammen",
    category: "cinema",
    rating: 4.2,
    reviewCount: 1450,
    description:
      "Modern multi-screen cinema in Drammen city center showing the latest family films, blockbusters, and Norwegian children's movies.",
    priceLevel: 1,
    ageRange: "3+ years",
    hours: "Daily 11:00-23:00",
    address: "Bragernes Torg 2A, 3017 Drammen",
    city: "Drammen",
    latitude: 59.743997,
    longitude: 10.203385,
    tags: ["Family Movies", "Kids Screenings", "3D"],
    website: "https://www.drammen-kino.no",
    imageUrl:
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&h=400&fit=crop",
  },
  {
    id: "drammens-museum",
    name: "Drammens Museum",
    category: "museum",
    rating: 4.1,
    reviewCount: 534,
    description:
      "Regional museum and gallery showcasing local art, history, and rotating exhibitions. Beautiful manor house grounds with seasonal family activities.",
    priceLevel: 1,
    ageRange: "4+ years",
    hours: "Tue-Sun 11:00-16:00",
    address: "Konnerudgata 7, 3045 Drammen",
    city: "Drammen",
    latitude: 59.7380969,
    longitude: 10.197178,
    tags: ["Art", "History", "Garden", "Exhibitions"],
    website: "https://drfrm.no",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Mine_p%C3%A5_Drammen_museum.jpg/800px-Mine_p%C3%A5_Drammen_museum.jpg",
  },
  {
    id: "spiralen-drammen",
    name: "Spiralen",
    category: "outdoor",
    rating: 4.6,
    reviewCount: 2340,
    description:
      "Famous spiral tunnel road rising to a panoramic viewpoint above Drammen. Playground and picnic area at the summit with breathtaking fjord views.",
    priceLevel: 0,
    ageRange: "All ages",
    hours: "Open 24 hours (tunnel may close in winter)",
    address: "Spiraltoppen, 3016 Drammen",
    city: "Drammen",
    latitude: 59.7510965,
    longitude: 10.1978895,
    tags: ["Free", "Viewpoint", "Playground", "Hiking"],
    website: "https://www.drammen.kommune.no",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Spiralen2.jpg/800px-Spiralen2.jpg",
  },
  {
    id: "klatreverket-drammen",
    name: "Klatreverket Drammen",
    category: "sports",
    rating: 4.5,
    reviewCount: 612,
    description:
      "Indoor climbing center with bouldering walls for all skill levels. Kids' climbing area, introductory courses, and a cozy cafe.",
    priceLevel: 2,
    ageRange: "5+ years",
    hours: "Mon-Fri 10:00-22:00, Sat-Sun 10:00-20:00",
    address: "Havnegata 20, 3012 Drammen",
    city: "Drammen",
    latitude: 59.7306049,
    longitude: 10.2234672,
    tags: ["Climbing", "Bouldering", "Kids Course", "Indoor"],
    website: "https://klatreverket.no",
    imageUrl:
      "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&h=400&fit=crop",
  },
  {
    id: "drammenbadet",
    name: "Drammenbadet",
    category: "swimming",
    rating: 4.3,
    reviewCount: 1890,
    description:
      "Modern swimming center with kids' pools, water slides, wave pool, diving boards, and a wellness area. Perfect family day out.",
    priceLevel: 2,
    ageRange: "All ages",
    hours: "Mon-Fri 06:00-21:00, Sat-Sun 09:00-19:00",
    address: "Bjoernstjerne Bjoernsons gate 44, 3044 Drammen",
    city: "Drammen",
    latitude: 59.7388,
    longitude: 10.2155,
    tags: ["Water Slides", "Wave Pool", "Kids Pool", "Diving"],
    website: "https://drammenbadet.no",
    imageUrl:
      "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800&h=400&fit=crop",
  },
  {
    id: "bragernes-torg-park",
    name: "Bragernes Torg & Park",
    category: "outdoor",
    rating: 4.4,
    reviewCount: 1120,
    description:
      "Drammen's central square and surrounding park area with fountains, green lawns, playground, and seasonal events. Great for picnics and strolls.",
    priceLevel: 0,
    ageRange: "All ages",
    hours: "Open 24 hours",
    address: "Bragernes Torg, 3017 Drammen",
    city: "Drammen",
    latitude: 59.7443,
    longitude: 10.2030,
    tags: ["Free", "Park", "Playground", "Central"],
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Bragernes_Square.jpg/800px-Bragernes_Square.jpg",
  },
  {
    id: "union-scene-drammen",
    name: "Union Scene",
    category: "arts",
    rating: 4.2,
    reviewCount: 478,
    description:
      "Cultural venue in a converted paper factory hosting concerts, theater, kids' shows, and art exhibitions throughout the year.",
    priceLevel: 1,
    ageRange: "3+ years",
    hours: "Event-dependent, box office Mon-Fri 10:00-16:00",
    address: "Groenland 60, 3045 Drammen",
    city: "Drammen",
    latitude: 59.744113,
    longitude: 10.192771,
    tags: ["Theater", "Concerts", "Kids Shows", "Art"],
    website: "https://unionscene.no",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Unionscene.jpg/800px-Unionscene.jpg",
  },
  {
    id: "drammens-teater",
    name: "Drammens Teater",
    category: "arts",
    rating: 4.3,
    reviewCount: 720,
    description:
      "Historic theater offering children's performances, musicals, and family shows in an elegant 19th-century building.",
    priceLevel: 2,
    ageRange: "4+ years",
    hours: "Performance days, box office Mon-Fri 12:00-17:00",
    address: "Bragernes Torg 8, 3017 Drammen",
    city: "Drammen",
    latitude: 59.7445869,
    longitude: 10.200442,
    tags: ["Theater", "Musicals", "Children's Shows", "Historic"],
    website: "https://drammensteater.no",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Drammens_teater_2018_%281%29.jpg/800px-Drammens_teater_2018_%281%29.jpg",
  },
  {
    id: "lier-bygdetun",
    name: "Lier Bygdetun",
    category: "museum",
    rating: 4.0,
    reviewCount: 245,
    description:
      "Open-air museum in Lier near Drammen featuring traditional Norwegian farm buildings, seasonal craft activities, and nature trails.",
    priceLevel: 1,
    ageRange: "All ages",
    hours: "May-Sep: Tue-Sun 11:00-16:00",
    address: "Lierstranda, 3400 Lier",
    city: "Lier",
    latitude: 59.799101,
    longitude: 10.257911,
    tags: ["Open-Air", "History", "Nature", "Crafts"],
    imageUrl:
      "https://images.unsplash.com/photo-1584907797015-7554cd315667?w=800&h=400&fit=crop",
  },
  {
    id: "drammen-aktivitetspark",
    name: "Drammen Aktivitetspark",
    category: "outdoor",
    rating: 4.5,
    reviewCount: 680,
    description:
      "Outdoor activity park with climbing structures, skateboard ramps, zip line, and obstacle courses for children and teenagers.",
    priceLevel: 0,
    ageRange: "5+ years",
    hours: "Open 24 hours (daylight recommended)",
    address: "Marienlyst, 3015 Drammen",
    city: "Drammen",
    latitude: 59.735,
    longitude: 10.208,
    tags: ["Free", "Climbing", "Skateboard", "Zip Line"],
    imageUrl:
      "https://images.unsplash.com/photo-1596997000103-e597b3ca50df?w=800&h=400&fit=crop",
  },
];

// ---------------------------------------------------------------------------
// Asker / Baerum area (between Drammen and Oslo)
// ---------------------------------------------------------------------------

const ASKER_BAERUM_ACTIVITIES: PlaceActivity[] = [
  {
    id: "henie-onstad-kunstsenter",
    name: "Henie Onstad Kunstsenter",
    category: "arts",
    rating: 4.4,
    reviewCount: 1560,
    description:
      "International art center on the Hoevikodden peninsula with contemporary exhibitions, sculpture park, family workshops, and fjord views.",
    priceLevel: 2,
    ageRange: "4+ years",
    hours: "Tue-Sun 11:00-17:00 (Thu until 20:00)",
    address: "Sonja Henies vei 31, 1311 Hoevikodden",
    city: "Baerum",
    latitude: 59.8889,
    longitude: 10.5541,
    tags: ["Art", "Sculpture Park", "Family Workshops", "Fjord Views"],
    website: "https://hok.no",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Oslo_%E2%80%93_Henie_Onstad_Kunstsenter.jpg/800px-Oslo_%E2%80%93_Henie_Onstad_Kunstsenter.jpg",
  },
  {
    id: "baerums-verk",
    name: "Baerums Verk",
    category: "museum",
    rating: 4.3,
    reviewCount: 890,
    description:
      "Historic ironworks village with artisan shops, restaurants, and a museum. Charming cobblestone streets and seasonal craft markets.",
    priceLevel: 1,
    ageRange: "All ages",
    hours: "Shops Mon-Sat 10:00-17:00, Sun 12:00-16:00",
    address: "Verksgata 15, 1353 Baerums Verk",
    city: "Baerum",
    latitude: 59.909,
    longitude: 10.502,
    tags: ["Historic", "Shopping", "Craft Markets", "Restaurants"],
    website: "https://baerumsverk.no",
    imageUrl:
      "https://images.unsplash.com/photo-1555921015-5532091f6026?w=800&h=400&fit=crop",
  },
];

// ---------------------------------------------------------------------------
// Oslo area (existing venues from the static data, plus a few extras)
// ---------------------------------------------------------------------------

const OSLO_ACTIVITIES: PlaceActivity[] = [
  {
    id: "leo-lekeland",
    name: "Leo's Lekeland Fornebu",
    category: "play",
    rating: 4.3,
    reviewCount: 1247,
    description:
      "Norway's largest indoor play center with trampolines, climbing walls, ball pits, and slides. Includes a toddler zone and cafe for parents.",
    priceLevel: 2,
    ageRange: "1-12 years",
    hours: "Mon-Fri 10:00-18:00, Sat-Sun 10:00-19:00",
    address: "Snaroyveien 36, 1364 Fornebu",
    city: "Oslo",
    latitude: 59.895,
    longitude: 10.61,
    tags: ["Indoor", "Trampolines", "Birthday Parties"],
    website: "https://leoslekeland.no",
    imageUrl:
      "https://images.unsplash.com/photo-1566454825481-9c31bd88c36f?w=800&h=400&fit=crop",
  },
  {
    id: "tusenfryd",
    name: "TusenFryd",
    category: "amusement",
    rating: 4.1,
    reviewCount: 3589,
    description:
      "Norway's premier amusement park with roller coasters, water rides, and family attractions. Home to SpinSpider and the BadeFryd water park.",
    priceLevel: 3,
    ageRange: "All ages",
    hours: "May-Oct, 10:00-20:00 (varies)",
    address: "Vinterbrovegen 25, 1407 Vinterbro",
    city: "Oslo",
    latitude: 59.72,
    longitude: 10.78,
    tags: ["Roller Coasters", "Water Park", "Seasonal"],
    website: "https://tusenfryd.no",
    imageUrl:
      "https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=800&h=400&fit=crop",
  },
  {
    id: "oslo-kino",
    name: "Oslo Kino - Colosseum",
    category: "cinema",
    rating: 4.5,
    reviewCount: 2890,
    description:
      "Oslo's iconic cinema at Colosseum, one of Europe's largest theaters. Regular family matinees, kids' film festivals, and comfortable seating.",
    priceLevel: 1,
    ageRange: "3+ years",
    hours: "Daily 10:00-23:00",
    address: "Fridtjof Nansens vei 6, 0369 Oslo",
    city: "Oslo",
    latitude: 59.927,
    longitude: 10.722,
    tags: ["Family Movies", "3D", "Candy Bar"],
    website: "https://oslokino.no",
    imageUrl:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop",
  },
  {
    id: "teknisk-museum",
    name: "Norsk Teknisk Museum",
    category: "museum",
    rating: 4.5,
    reviewCount: 2134,
    description:
      "Norway's national museum of science and technology. Hands-on exhibits, interactive science labs, and the Teknoteket maker space.",
    priceLevel: 2,
    ageRange: "4+ years",
    hours: "Tue-Sun 10:00-18:00 (Wed until 20:00)",
    address: "Kjelsasveien 143, 0491 Oslo",
    city: "Oslo",
    latitude: 59.953,
    longitude: 10.779,
    tags: ["Science", "Interactive", "Maker Space"],
    website: "https://tekniskmuseum.no",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Norsk_Teknisk_Museum_TRS_070501_011.jpg/800px-Norsk_Teknisk_Museum_TRS_070501_011.jpg",
  },
  {
    id: "frognerparken",
    name: "Frognerparken & Vigelandsanlegget",
    category: "outdoor",
    rating: 4.7,
    reviewCount: 5672,
    description:
      "Oslo's largest park with over 200 Vigeland sculptures, sprawling lawns, playgrounds, splash pads in summer, and ice skating in winter.",
    priceLevel: 0,
    ageRange: "All ages",
    hours: "Open 24 hours, Playground 07:00-21:00",
    address: "Nobels gate 32, 0268 Oslo",
    city: "Oslo",
    latitude: 59.9272,
    longitude: 10.701,
    tags: ["Free", "Sculptures", "Playground"],
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Frognerparken.jpg/800px-Frognerparken.jpg",
  },
  {
    id: "barnas-kulturhus",
    name: "Barnas Kulturhus",
    category: "arts",
    rating: 4.6,
    reviewCount: 876,
    description:
      "Vibrant cultural center for children with theater performances, art workshops, music classes, and interactive exhibitions.",
    priceLevel: 1,
    ageRange: "2-10 years",
    hours: "Tue-Sun 10:00-16:00",
    address: "Schweigaards gate 14, 0185 Oslo",
    city: "Oslo",
    latitude: 59.911,
    longitude: 10.761,
    tags: ["Theater", "Art Workshops", "Music"],
    imageUrl:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=400&fit=crop",
  },
  {
    id: "holmenkollen",
    name: "Holmenkollen Ski Museum & Jump",
    category: "sports",
    rating: 4.4,
    reviewCount: 3102,
    description:
      "The legendary ski jump and world's oldest ski museum. Includes a zipline from the top with panoramic views of the Oslo fjord.",
    priceLevel: 2,
    ageRange: "5+ years",
    hours: "Daily 10:00-17:00 (May-Sep until 20:00)",
    address: "Kongeveien 5, 0787 Oslo",
    city: "Oslo",
    latitude: 59.964,
    longitude: 10.667,
    tags: ["Ski Jump", "Zipline", "Museum"],
    website: "https://holmenkollen.com",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/New_Holmenkollen_ski_jump.jpg/800px-New_Holmenkollen_ski_jump.jpg",
  },
  {
    id: "sorenga-sjobad",
    name: "Sorenga Sjobad",
    category: "swimming",
    rating: 4.2,
    reviewCount: 1034,
    description:
      "Oslo's urban seawater pool complex at the waterfront. Children's pool, diving boards, floating saunas, and stunning fjord views.",
    priceLevel: 0,
    ageRange: "All ages",
    hours: "Jun-Aug, 07:00-21:00",
    address: "Sorenga 1, 0194 Oslo",
    city: "Oslo",
    latitude: 59.904,
    longitude: 10.752,
    tags: ["Outdoor Pool", "Diving", "Fjord Views"],
    imageUrl:
      "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&h=400&fit=crop",
  },
  {
    id: "munch-museum",
    name: "MUNCH Museum",
    category: "museum",
    rating: 4.3,
    reviewCount: 1789,
    description:
      "Striking waterfront museum with Edvard Munch's masterpieces. Family art workshops on weekends, kids' guided tours, and digital experiences.",
    priceLevel: 2,
    ageRange: "5+ years",
    hours: "Tue-Sun 10:00-18:00 (Thu-Sat until 21:00)",
    address: "Edvard Munchs plass 1, 0194 Oslo",
    city: "Oslo",
    latitude: 59.906,
    longitude: 10.754,
    tags: ["Art", "Kids Workshops", "Architecture"],
    website: "https://munch.no",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/The_new_Munch_Museum_%28white_color_sign%29.jpg/800px-The_new_Munch_Museum_%28white_color_sign%29.jpg",
  },
  {
    id: "oslo-vinterpark",
    name: "Oslo Vinterpark (Tryvann)",
    category: "sports",
    rating: 4.0,
    reviewCount: 1456,
    description:
      "Oslo's closest alpine ski resort with slopes for all levels, children's area with magic carpet lifts, and ski school.",
    priceLevel: 2,
    ageRange: "3+ years",
    hours: "Winter: Mon-Fri 10:00-21:00, Sat-Sun 09:30-17:00",
    address: "Tryvannsveien 64, 0791 Oslo",
    city: "Oslo",
    latitude: 59.983,
    longitude: 10.668,
    tags: ["Skiing", "Kids Slopes", "Ski School"],
    website: "https://oslovinterpark.no",
    imageUrl:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=400&fit=crop",
  },
  {
    id: "barnekunstmuseet",
    name: "Internasjonalt Barnekunstmuseum",
    category: "arts",
    rating: 4.1,
    reviewCount: 423,
    description:
      "The world's only museum dedicated entirely to art created by children. Rotating exhibits, creative workshops, and a global perspective.",
    priceLevel: 1,
    ageRange: "3-15 years",
    hours: "Tue-Sun 11:00-16:00",
    address: "Lille Frens vei 4, 0369 Oslo",
    city: "Oslo",
    latitude: 59.927,
    longitude: 10.715,
    tags: ["Children's Art", "Workshops", "Global"],
    imageUrl:
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=400&fit=crop",
  },
  {
    id: "oslo-reptilpark",
    name: "Oslo Reptilpark",
    category: "museum",
    rating: 4.2,
    reviewCount: 987,
    description:
      "Home to over 100 species of reptiles, amphibians, and insects. Interactive feeding sessions and educational talks for children.",
    priceLevel: 2,
    ageRange: "3+ years",
    hours: "Daily 10:00-18:00",
    address: "St. Halvards gate 1, 0192 Oslo",
    city: "Oslo",
    latitude: 59.909,
    longitude: 10.766,
    tags: ["Animals", "Interactive", "Educational"],
    imageUrl:
      "https://images.unsplash.com/photo-1504450874802-0ba2bcd659e0?w=800&h=400&fit=crop",
  },
  {
    id: "oslo-klatrepark",
    name: "Oslo Klatrepark",
    category: "outdoor",
    rating: 4.5,
    reviewCount: 1523,
    description:
      "Treetop adventure park with climbing courses for all ages and skill levels. Zip lines, rope bridges, and Tarzan swings in the forest.",
    priceLevel: 2,
    ageRange: "5+ years",
    hours: "Apr-Oct, 10:00-18:00 (weekends until 19:00)",
    address: "Sognsvannsvn. 75, 0863 Oslo",
    city: "Oslo",
    latitude: 59.966,
    longitude: 10.73,
    tags: ["Climbing", "Zip Line", "Outdoor"],
    imageUrl:
      "https://images.unsplash.com/photo-1545396924-6cfa1abd34b5?w=800&h=400&fit=crop",
  },
  {
    id: "bogstad-swimming",
    name: "Bogstad Camping & Bad",
    category: "swimming",
    rating: 4.0,
    reviewCount: 634,
    description:
      "Family-friendly lake swimming with sandy beach, water slide, and canoe rental. Beautiful forest setting near Bogstadvannet lake.",
    priceLevel: 1,
    ageRange: "All ages",
    hours: "Jun-Aug, 09:00-20:00",
    address: "Ankerveien 117, 0766 Oslo",
    city: "Oslo",
    latitude: 59.965,
    longitude: 10.649,
    tags: ["Lake", "Beach", "Canoe Rental"],
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop",
  },
  {
    id: "deichman-toyen",
    name: "Deichman Toyen (Kids Section)",
    category: "arts",
    rating: 4.6,
    reviewCount: 512,
    description:
      "Award-winning public library with a fantastic children's section. Story time, maker workshops, gaming area, and free activities year-round.",
    priceLevel: 0,
    ageRange: "0-15 years",
    hours: "Mon-Fri 08:00-19:00, Sat 10:00-16:00",
    address: "Hagegata 22, 0653 Oslo",
    city: "Oslo",
    latitude: 59.915,
    longitude: 10.771,
    tags: ["Free", "Library", "Workshops"],
    imageUrl:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&h=400&fit=crop",
  },
  {
    id: "salt-art-music",
    name: "SALT Art & Music",
    category: "outdoor",
    rating: 4.3,
    reviewCount: 892,
    description:
      "Nomadic art village on the Oslo waterfront. Family concerts, art installations, saunas, and seasonal cultural events in a unique setting.",
    priceLevel: 1,
    ageRange: "All ages",
    hours: "Daily 11:00-23:00 (seasonal)",
    address: "Langkaia 1, 0150 Oslo",
    city: "Oslo",
    latitude: 59.908,
    longitude: 10.748,
    tags: ["Art", "Music", "Waterfront"],
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop",
  },
  {
    id: "oslo-filmfestival-kids",
    name: "Oslo Kino - Ringen",
    category: "cinema",
    rating: 4.2,
    reviewCount: 756,
    description:
      "Modern cinema in Gruenerlokka with dedicated kids' screenings, baby-friendly showings, and a cozy family lounge area.",
    priceLevel: 1,
    ageRange: "0+ years",
    hours: "Daily 10:00-22:00",
    address: "Thorvald Meyers gate 82, 0552 Oslo",
    city: "Oslo",
    latitude: 59.925,
    longitude: 10.759,
    tags: ["Baby Cinema", "Kids Screenings", "Lounge"],
    imageUrl:
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&h=400&fit=crop",
  },
];

// ---------------------------------------------------------------------------
// Combined list
// ---------------------------------------------------------------------------

export const ALL_ACTIVITIES: PlaceActivity[] = [
  ...DRAMMEN_ACTIVITIES,
  ...ASKER_BAERUM_ACTIVITIES,
  ...OSLO_ACTIVITIES,
];
