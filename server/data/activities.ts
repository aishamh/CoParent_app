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
      "https://cms.leosplay.com/wp-content/uploads/2023/12/playcenter-family.jpg",
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
      "https://www.rushtrampolinepark.no/wp-content/uploads/2025/01/IMG_5498-1-768x512-1.webp",
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
      "https://www.nfkino.no/sites/nfkino.no/files/media-images/2022-12/Drammen%201440x900_0.png",
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
      "https://drammens.museum.no/wp-content/uploads/2021/01/Marienlyst_4.jpg",
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
      "https://www.drammen.kommune.no/globalassets/aktuelt/bilder/2020/1.-kvartal/spiralen-vinter.jpg",
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
      "https://klatreverketdrammen.no/wp-content/uploads/2023/09/IMG_7346_R-1-1024x683.jpg",
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
      "https://cdn.sanity.io/images/jlrwvnbf/commercial/3d74c56080c14b1f6890f71f48a201a5f43684d4-1600x837.jpg",
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
      "https://www.drammen.no/imageresizer/?image=%2Fdmsimgs%2FF1325D4E14E9D633587E86C50F13B3953BAC7D07.jpg&action=ProductDetailProElite",
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
      "https://www.unionscene.no/wp-content/uploads/2024/04/IMG_0406-edited-scaled.jpg",
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
      "https://www.drammenscener.no/wp-content/uploads/2025/03/IMG_9226-scaled.jpg",
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
      "https://lier-bygdetun.no/uploads/gLkEwyz2/768x0_640x0/Stabburet-og-Heg-i-hstfarger-Foto-Svein-Raste.jpg",
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
      "https://images.squarespace-cdn.com/content/v1/5f3138761b5ab209909e5034/1601976510816-92ZG44P1GT2SAV0HBVBQ/Drammen+aktivitetspark+Drone+2.jpg",
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
      "https://henie-onstad.imgix.net/Arkitektur-og-design/Hok_68_fotoleif-ørnelund@2x.jpg?auto=compress%2Cformat&crop=focalpoint&fit=crop&fp-x=0.5&fp-y=0.5&h=630&q=82&w=1200",
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
      "https://tellusdmsmedia.newmindmedia.com/wsimgs/49773659-CFC1-43C0-AD21-137E81347AF1_B_rums_Verk_1727924972.jpeg",
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
      "https://cms.leosplay.com/wp-content/uploads/2023/12/ballcanons.jpg",
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
      "https://www.tusenfryd.no/content/dam/tus/images/home/home-Attractions-fall2023.jpg.jpg",
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
      "https://www.nfkino.no/sites/nfkino.no/files/media-images/2020-01/TinaRekdal_Colosseum-2.jpg",
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
      "https://www.tekniskmuseum.no/images/vitensenter/2024-sommer_GormGaare (49).jpg",
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
      "https://www.frognerparken.no/wp-content/uploads/2025/10/d6a051098f8400822021b7de82f9336b71e69e30.jpg",
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
      "https://barnekunst.no/wp-content/uploads/2023/01/Anton.Antonov.Russia.web_.jpg",
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
      "https://holmenkollen.com/wp-content/uploads/2025/11/Thomas-Ekstrom_Skimuseet_MG_7249_WEB-1024x683.jpg",
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
      "https://images.adsttc.com/media/images/58d4/e3bd/e58e/ce81/8b00/017b/large_jpg/S%C3%B8renga_Utvikling_2895.jpg?1490346933",
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
      "https://www.munch.no/globalassets/foto-munch/eksterior/ik_munch_summer_2025_ext_0021.jpg",
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
      "https://www.skiresort.info/fileadmin/_processed_/28/8e/e5/5b/9a7a2ec976.jpg",
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
      "https://barnekunst.no/wp-content/uploads/2023/01/barnekunst-ukraina-330x330px.jpg",
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
      "https://media.izi.travel/cd9b44b4-d2c6-4ee4-a3ea-9296c8916cff/109f60bd-8d50-401b-a2b1-f8fa2d503a6d_800x600.jpg",
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
      "https://cdn.prod.website-files.com/6037cb15c9bb0d0fa66c51c3/6037cd3c907bb23fb89fe6c1_1920.jpg",
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
      "https://i1.vrs.gd/topcamp/uploads/dam/images-20/20250515041922/bogstad_oppleve_bogstadvannet.jpg",
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
      "https://www.includi.com/wp-content/uploads/2024/02/BIBLO-1-1920x1800.jpg",
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
      "https://images.squarespace-cdn.com/content/v1/5b30020796d45595ed164534/96c4217c-2c0a-4617-8219-58e0038cac71/Hero+bilde+SALT+Art%26Music.png",
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
      "https://www.nfkino.no/sites/nfkino.no/files/media-images/2019-11/TinaRekdal_Ringen-65.jpg",
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
