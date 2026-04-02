import { Ionicons } from '@expo/vector-icons';

export type SuggestionBucket = 'place' | 'tour' | 'food';

export type TravelSuggestionSeed = {
  place: string;
  aliases?: string[];
  area: string;
  items: Array<{
    id: string;
    title: string;
    note: string;
    bucket: SuggestionBucket;
    icon: keyof typeof Ionicons.glyphMap;
  }>;
};

export const TRAVEL_SUGGESTION_SEEDS: TravelSuggestionSeed[] = [
  {
    place: 'Baguio',
    aliases: ['burnham park', 'the mansion', 'botanical garden', 'session road', 'mines view'],
    area: 'Highland city',
    items: [
      { id: 'baguio-burnham', title: 'Burnham Park stroll', note: 'A good first stop for boats, bikes, and an easy feel for central Baguio.', bucket: 'place', icon: 'leaf-outline' },
      { id: 'baguio-mansion', title: 'The Mansion and Wright Park', note: 'A classic Baguio pairing if you want one famous landmark and a nearby walking area.', bucket: 'tour', icon: 'business-outline' },
      { id: 'baguio-food', title: 'Session Road food crawl', note: 'Great for cafes, local meals, pastries, and quick stops between sightseeing.', bucket: 'food', icon: 'cafe-outline' },
      { id: 'baguio-view', title: 'Mines View photo stop', note: 'Works well as a scenic stop when you want something iconic and beginner-friendly.', bucket: 'place', icon: 'image-outline' },
    ],
  },
  {
    place: 'Binondo',
    aliases: ['ongpin'],
    area: 'Chinatown',
    items: [
      { id: 'binondo-place', title: 'Binondo side streets', note: 'A good first walk for temples, old stores, and quick snack stops.', bucket: 'place', icon: 'map-outline' },
      { id: 'binondo-food', title: 'Classic food crawl', note: 'Plan a dumpling, noodle, and dessert run while you are already in the district.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'binondo-tour', title: 'Heritage photo walk', note: 'A low-pressure route if you want a more guided cultural block.', bucket: 'tour', icon: 'camera-outline' },
    ],
  },
  {
    place: 'Intramuros',
    aliases: ['fort santiago'],
    area: 'Historic core',
    items: [
      { id: 'intramuros-place', title: 'Intramuros walk', note: 'Historic streets, forts, and photo spots that work well as a relaxed half-day anchor.', bucket: 'place', icon: 'compass-outline' },
      { id: 'intramuros-tour', title: 'Fort and walls route', note: 'Best when you want one structured history-focused block in the day.', bucket: 'tour', icon: 'trail-sign-outline' },
      { id: 'intramuros-food', title: 'Cafe break nearby', note: 'Easy add-on for coffee, pastries, or a calmer reset before the next stop.', bucket: 'food', icon: 'cafe-outline' },
    ],
  },
  {
    place: 'Poblacion',
    aliases: ['makati poblacion'],
    area: 'Makati district',
    items: [
      { id: 'poblacion-place', title: 'Poblacion walk', note: 'A dense area for cafes, side streets, and evening hangouts.', bucket: 'place', icon: 'location-outline' },
      { id: 'poblacion-food', title: 'Cafe and brunch lane', note: 'Good for a slower morning with coffee, pastries, and nearby design shops.', bucket: 'food', icon: 'cafe-outline' },
      { id: 'poblacion-tour', title: 'Night route', note: 'A simple after-dark block if you want bars, music, and late dinner options.', bucket: 'tour', icon: 'moon-outline' },
    ],
  },
  {
    place: 'Manila Bay',
    aliases: ['baywalk', 'roxas boulevard'],
    area: 'Waterfront',
    items: [
      { id: 'manila-bay-place', title: 'Sunset bay route', note: 'A simple scenic route built around golden-hour timing and lower-pressure movement.', bucket: 'place', icon: 'sunny-outline' },
      { id: 'manila-bay-food', title: 'Seaside snacks', note: 'Quick casual food options that fit before or after sunset.', bucket: 'food', icon: 'fast-food-outline' },
      { id: 'manila-bay-tour', title: 'Scenic evening route', note: 'Works well when you want a lighter walking block instead of a long plan.', bucket: 'tour', icon: 'walk-outline' },
    ],
  },
  {
    place: 'Mercato',
    aliases: ['night market'],
    area: 'Market strip',
    items: [
      { id: 'mercato-place', title: 'Mercato lane', note: 'A strong anchor if your plan is built around dinner and easy group choices.', bucket: 'place', icon: 'storefront-outline' },
      { id: 'mercato-food', title: 'Street food crawl', note: 'Skewers, local snacks, and dessert stops when you want a casual evening block.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'mercato-tour', title: 'Late-night food loop', note: 'Best when the group wants to compare multiple stalls without overplanning.', bucket: 'tour', icon: 'trail-sign-outline' },
    ],
  },
  {
    place: 'Tagaytay',
    aliases: ['taal'],
    area: 'Ridge escape',
    items: [
      { id: 'tagaytay-view', title: 'Taal view deck stop', note: 'A strong first stop if the traveler wants an easy scenic highlight right away.', bucket: 'place', icon: 'eye-outline' },
      { id: 'tagaytay-food', title: 'Bulalo lunch stop', note: 'A simple food anchor that fits well with cool-weather sightseeing.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'tagaytay-tour', title: 'Coffee and ridge route', note: 'A light route for cafes, viewpoints, and low-stress wandering.', bucket: 'tour', icon: 'cafe-outline' },
    ],
  },
  {
    place: 'Cebu',
    aliases: ['cebu city', 'magellan', 'colon'],
    area: 'City guide',
    items: [
      { id: 'cebu-heritage', title: 'Heritage starter route', note: 'A practical first route for Magellan landmarks, old churches, and central city history.', bucket: 'tour', icon: 'library-outline' },
      { id: 'cebu-food', title: 'Lechon meal stop', note: 'Good for travelers who want one classic Cebu food experience built into the day.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'cebu-place', title: 'City viewpoint or plaza stop', note: 'Adds an easy visual anchor if the traveler is still getting familiar with Cebu.', bucket: 'place', icon: 'location-outline' },
    ],
  },
  {
    place: 'Vigan',
    aliases: ['calle crisologo'],
    area: 'Heritage town',
    items: [
      { id: 'vigan-street', title: 'Calle Crisologo walk', note: 'The easiest first stop for visitors who want a recognizable Vigan experience.', bucket: 'place', icon: 'albums-outline' },
      { id: 'vigan-food', title: 'Ilocano food stop', note: 'Add local empanada or longganisa so the itinerary feels rooted in the place.', bucket: 'food', icon: 'fast-food-outline' },
      { id: 'vigan-tour', title: 'Kalesa heritage route', note: 'A relaxed cultural route for travelers who want a slower historic overview.', bucket: 'tour', icon: 'trail-sign-outline' },
    ],
  },
  {
    place: 'Boracay',
    aliases: ['white beach'],
    area: 'Island guide',
    items: [
      { id: 'boracay-beach', title: 'White Beach start', note: 'A simple anchor for first-time visitors who want the most recognizable stretch first.', bucket: 'place', icon: 'sunny-outline' },
      { id: 'boracay-food', title: 'Beachfront dinner stop', note: 'Fits well after sunset and keeps the day easy for tourists unfamiliar with the island.', bucket: 'food', icon: 'wine-outline' },
      { id: 'boracay-tour', title: 'Sunset and station walk', note: 'A beginner-friendly route for seeing more of the island without overplanning.', bucket: 'tour', icon: 'walk-outline' },
    ],
  },
  {
    place: 'Palawan',
    aliases: ['el nido', 'coron', 'puerto princesa'],
    area: 'Island province',
    items: [
      { id: 'palawan-place', title: 'Scenic island anchor stop', note: 'Start with one iconic beach, lagoon, or viewpoint so the trip has a clear first highlight.', bucket: 'place', icon: 'boat-outline' },
      { id: 'palawan-food', title: 'Seafood meal stop', note: 'A reliable way to add something local and practical between tours.', bucket: 'food', icon: 'fish-outline' },
      { id: 'palawan-tour', title: 'Boat or nature route', note: 'Ideal for travelers who want a memorable activity even without knowing the area well.', bucket: 'tour', icon: 'compass-outline' },
    ],
  },
  {
    place: 'Bonifacio Global City',
    aliases: ['bgc', 'high street', 'bonifacio high street', 'taguig'],
    area: 'Modern city district',
    items: [
      { id: 'bgc-highstreet', title: 'Bonifacio High Street walk', note: 'A simple starting point for first-time visitors who want shops, cafes, and an easy walking route.', bucket: 'place', icon: 'walk-outline' },
      { id: 'bgc-food', title: 'BGC cafe and dinner strip', note: 'Easy for travelers who want food options without needing deep local knowledge.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'bgc-art', title: 'Museum and mural route', note: 'A light city route if you want public art, photo spots, and indoor backups.', bucket: 'tour', icon: 'color-palette-outline' },
    ],
  },
  {
    place: 'Makati',
    aliases: ['ayala', 'greenbelt', 'glorietta', 'salcedo', 'legazpi'],
    area: 'Business and lifestyle district',
    items: [
      { id: 'makati-ayala', title: 'Ayala triangle and mall route', note: 'A practical first route for visitors who want a polished and easy central Makati experience.', bucket: 'place', icon: 'business-outline' },
      { id: 'makati-food', title: 'Greenbelt meal stop', note: 'Useful when you want familiar food choices and a comfortable break between walks.', bucket: 'food', icon: 'cafe-outline' },
      { id: 'makati-tour', title: 'Salcedo-Legazpi neighborhood walk', note: 'A calmer route for cafes, side streets, and a more local city pace.', bucket: 'tour', icon: 'map-outline' },
    ],
  },
  {
    place: 'Quezon City',
    aliases: ['qc', 'timog', 'maginhawa', 'up diliman', 'upd', 'katipunan'],
    area: 'Metro Manila city guide',
    items: [
      { id: 'qc-campus', title: 'UP Diliman oval stop', note: 'A good open-air anchor for travelers who want a greener side of Metro Manila.', bucket: 'place', icon: 'bicycle-outline' },
      { id: 'qc-food', title: 'Maginhawa food run', note: 'A beginner-friendly area for casual meals, desserts, and affordable cafe stops.', bucket: 'food', icon: 'fast-food-outline' },
      { id: 'qc-tour', title: 'Katipunan and Timog city route', note: 'Works well when you want a student-and-nightlife mix without overplanning.', bucket: 'tour', icon: 'trail-sign-outline' },
    ],
  },
  {
    place: 'Pasay',
    aliases: ['moa', 'mall of asia', 'star city', 'cultural center', 'ccp'],
    area: 'Bay area gateway',
    items: [
      { id: 'pasay-moa', title: 'Mall of Asia bay route', note: 'A familiar first stop if the traveler wants a simple indoor-outdoor combination.', bucket: 'place', icon: 'storefront-outline' },
      { id: 'pasay-food', title: 'Bay area dinner stop', note: 'Easy to fit around concerts, events, or sunset plans in Pasay.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'pasay-tour', title: 'CCP and bay activity route', note: 'Good for travelers who want entertainment, culture, or family-friendly add-ons nearby.', bucket: 'tour', icon: 'musical-notes-outline' },
    ],
  },
  {
    place: 'Mall of Asia',
    aliases: ['sm moa', 'moa complex'],
    area: 'Pasay bay complex',
    items: [
      { id: 'moa-place', title: 'MOA seaside walk', note: 'A simple first stop for shopping, photos, and a recognizable bay-side atmosphere.', bucket: 'place', icon: 'walk-outline' },
      { id: 'moa-food', title: 'Dinner by the bay', note: 'Useful when you want many food choices without having to know the area well.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'moa-tour', title: 'MOA to seaside route', note: 'An easy route for tourists who want a stress-free afternoon or evening plan.', bucket: 'tour', icon: 'compass-outline' },
    ],
  },
  {
    place: 'Rizal Park',
    aliases: ['luneta', 'luneta park'],
    area: 'Historic park',
    items: [
      { id: 'rizal-place', title: 'Luneta monument and grounds', note: 'A strong first stop for visitors who want one of Manila\'s most recognizable landmarks.', bucket: 'place', icon: 'flag-outline' },
      { id: 'rizal-food', title: 'Cafe stop near the park', note: 'Best added before or after museum time so the day has a relaxed pause.', bucket: 'food', icon: 'cafe-outline' },
      { id: 'rizal-tour', title: 'Park to museum route', note: 'A simple culture-heavy block for travelers who are new to old Manila.', bucket: 'tour', icon: 'library-outline' },
    ],
  },
  {
    place: 'Quiapo',
    aliases: ['quiapo church', 'carriedo'],
    area: 'Old Manila district',
    items: [
      { id: 'quiapo-place', title: 'Quiapo church stop', note: 'A practical landmark for travelers interested in faith, street life, and old city energy.', bucket: 'place', icon: 'business-outline' },
      { id: 'quiapo-food', title: 'Local snack stop nearby', note: 'Add a quick food break if you want to balance out the busy pace of the district.', bucket: 'food', icon: 'fast-food-outline' },
      { id: 'quiapo-tour', title: 'Old Manila market route', note: 'A stronger fit for curious travelers who want a more local, active city walk.', bucket: 'tour', icon: 'trail-sign-outline' },
    ],
  },
  {
    place: 'Ortigas',
    aliases: ['shaw', 'megamall', 'podium', 'estancia'],
    area: 'Commercial center',
    items: [
      { id: 'ortigas-place', title: 'Ortigas central walk', note: 'Useful as a simple city anchor if you are meeting people or exploring around the malls.', bucket: 'place', icon: 'location-outline' },
      { id: 'ortigas-food', title: 'Megamall and Podium meal stop', note: 'Easy when you want familiar dining choices and an indoor rest point.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'ortigas-tour', title: 'Shaw to Capitol Commons route', note: 'A low-stress route for cafes, errands, and evening city energy.', bucket: 'tour', icon: 'walk-outline' },
    ],
  },
  {
    place: 'Antipolo',
    aliases: ['hinulugang taktak', 'cloud 9', 'pinto art'],
    area: 'Rizal hillside city',
    items: [
      { id: 'antipolo-place', title: 'Pinto Art and garden stop', note: 'A strong first choice if you want a scenic and beginner-friendly Antipolo experience.', bucket: 'place', icon: 'image-outline' },
      { id: 'antipolo-food', title: 'View deck meal stop', note: 'Good for travelers who want food plus a city view without needing a packed schedule.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'antipolo-tour', title: 'Church and nature route', note: 'Works well if you want a light pilgrimage-and-viewpoint mix in one day.', bucket: 'tour', icon: 'trail-sign-outline' },
    ],
  },
  {
    place: 'Alabang',
    aliases: ['molito', 'festival mall', 'filinvest'],
    area: 'South Metro lifestyle district',
    items: [
      { id: 'alabang-place', title: 'Filinvest leisure walk', note: 'A relaxed first stop if you want a cleaner, easier-paced Metro Manila area.', bucket: 'place', icon: 'leaf-outline' },
      { id: 'alabang-food', title: 'Molito dining stop', note: 'Good when the group wants flexible casual dining and cafe options.', bucket: 'food', icon: 'cafe-outline' },
      { id: 'alabang-tour', title: 'Festival to Molito route', note: 'A light city route that works well for half-day wandering.', bucket: 'tour', icon: 'walk-outline' },
    ],
  },
  {
    place: 'Marikina',
    aliases: ['riverbanks', 'marikina river park'],
    area: 'East Metro local guide',
    items: [
      { id: 'marikina-place', title: 'River park walk', note: 'A calmer first stop for travelers who want open space and a neighborhood feel.', bucket: 'place', icon: 'water-outline' },
      { id: 'marikina-food', title: 'Local cafe and meal stop', note: 'A practical add-on if you want a slower, more local day in Marikina.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'marikina-tour', title: 'Heritage and shoe district route', note: 'Useful for visitors who want a distinct Marikina identity beyond malls.', bucket: 'tour', icon: 'shirt-outline' },
    ],
  },
  {
    place: 'Pasig',
    aliases: ['kapitolyo', 'capitol commons'],
    area: 'City and food hub',
    items: [
      { id: 'pasig-place', title: 'Capitol Commons starter stop', note: 'A modern and easy first stop if you want an organized city hangout area.', bucket: 'place', icon: 'business-outline' },
      { id: 'pasig-food', title: 'Kapitolyo food lane', note: 'A strong area for travelers who want to build the day around food choices.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'pasig-tour', title: 'Pasig cafe route', note: 'Best for a lighter city day with short transfers and plenty of backup options.', bucket: 'tour', icon: 'cafe-outline' },
    ],
  },
  {
    place: 'Las Pinas',
    aliases: ['bamboo organ'],
    area: 'South Metro heritage stop',
    items: [
      { id: 'lp-place', title: 'Bamboo Organ church visit', note: 'A useful heritage anchor if the traveler wants something distinctive and local.', bucket: 'place', icon: 'musical-note-outline' },
      { id: 'lp-food', title: 'South Metro meal break', note: 'Easy to pair with a short heritage visit or a wider southbound itinerary.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'lp-tour', title: 'Heritage side route', note: 'A light add-on route when you want one cultural stop without overloading the day.', bucket: 'tour', icon: 'trail-sign-outline' },
    ],
  },
  {
    place: 'Subic',
    aliases: ['olongapo', 'subic bay'],
    area: 'Bay and leisure zone',
    items: [
      { id: 'subic-place', title: 'Subic boardwalk start', note: 'A simple entry point for first-time visitors who want an easy waterfront feel.', bucket: 'place', icon: 'boat-outline' },
      { id: 'subic-food', title: 'Harbor-side meal stop', note: 'Good for keeping the day practical while still feeling like a getaway.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'subic-tour', title: 'Bay and adventure route', note: 'Works well if you want to mix one scenic block with one activity stop.', bucket: 'tour', icon: 'compass-outline' },
    ],
  },
  {
    place: 'La Union',
    aliases: ['elyu', 'san juan la union'],
    area: 'Surf coast',
    items: [
      { id: 'lu-place', title: 'Beachfront starter stop', note: 'A clear first move for travelers who want a recognizable and low-stress coast experience.', bucket: 'place', icon: 'sunny-outline' },
      { id: 'lu-food', title: 'Surf town brunch stop', note: 'Works well for cafe mornings, quick resets, and easy group choices.', bucket: 'food', icon: 'cafe-outline' },
      { id: 'lu-tour', title: 'Sunset and surf route', note: 'A relaxed route for visitors who want photos, waves, and a manageable evening plan.', bucket: 'tour', icon: 'walk-outline' },
    ],
  },
  {
    place: 'Batangas',
    aliases: ['nasugbu', 'anilao', 'laiya'],
    area: 'Beach province',
    items: [
      { id: 'batangas-place', title: 'Beach or cove anchor stop', note: 'A good first suggestion when the traveler wants the trip centered on water and views.', bucket: 'place', icon: 'water-outline' },
      { id: 'batangas-food', title: 'Seafood or roadside meal stop', note: 'Easy to fit into a drive-heavy itinerary so the day does not feel rushed.', bucket: 'food', icon: 'fish-outline' },
      { id: 'batangas-tour', title: 'Viewpoint and beach route', note: 'Useful when you want one scenic stop beyond just staying at the resort.', bucket: 'tour', icon: 'trail-sign-outline' },
    ],
  },
  {
    place: 'Bohol',
    aliases: ['panglao', 'chocolate hills', 'loboc'],
    area: 'Island province',
    items: [
      { id: 'bohol-place', title: 'Chocolate Hills or Panglao anchor', note: 'A familiar first highlight for travelers who want the classic Bohol experience quickly.', bucket: 'place', icon: 'earth-outline' },
      { id: 'bohol-food', title: 'Riverside or island meal stop', note: 'Helps balance transfers with one easy and scenic food break.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'bohol-tour', title: 'Countryside route', note: 'Best for visitors who want one well-rounded day with nature, landmarks, and relaxed pacing.', bucket: 'tour', icon: 'map-outline' },
    ],
  },
  {
    place: 'Siargao',
    aliases: ['general luna', 'cloud 9 siargao'],
    area: 'Surf island',
    items: [
      { id: 'siargao-place', title: 'Cloud 9 starter stop', note: 'A recognizable first stop for visitors who want the easy iconic route.', bucket: 'place', icon: 'sunny-outline' },
      { id: 'siargao-food', title: 'General Luna food stop', note: 'Good for fitting meals into a beach day without too much planning.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'siargao-tour', title: 'Island-hopping or sunset route', note: 'A reliable add-on for tourists who want one memorable activity block.', bucket: 'tour', icon: 'boat-outline' },
    ],
  },
  {
    place: 'Davao',
    aliases: ['samal', 'eden nature park', 'people\'s park'],
    area: 'Southern city guide',
    items: [
      { id: 'davao-place', title: 'City park or viewpoint stop', note: 'A beginner-friendly first move for travelers who want to ease into Davao.', bucket: 'place', icon: 'leaf-outline' },
      { id: 'davao-food', title: 'Local fruit or grilled meal stop', note: 'A practical way to make the trip feel rooted in Davao without heavy planning.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'davao-tour', title: 'Samal or city route', note: 'Works well if you want to choose between nature and city comfort on the same trip.', bucket: 'tour', icon: 'compass-outline' },
    ],
  },
  {
    place: 'Iloilo',
    aliases: ['iloilo city', 'esplanade'],
    area: 'Heritage city',
    items: [
      { id: 'iloilo-place', title: 'Esplanade and old town start', note: 'A simple first route if the traveler wants an approachable Iloilo overview.', bucket: 'place', icon: 'walk-outline' },
      { id: 'iloilo-food', title: 'Batchoy or local food stop', note: 'Useful if you want one clearly local meal as part of the itinerary.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'iloilo-tour', title: 'Church and heritage route', note: 'A light culture route that works well for first-time visitors.', bucket: 'tour', icon: 'library-outline' },
    ],
  },
  {
    place: 'Bacolod',
    aliases: ['the ruins', 'lacson'],
    area: 'City and heritage guide',
    items: [
      { id: 'bacolod-place', title: 'The Ruins photo stop', note: 'A strong first choice if the traveler wants an iconic Bacolod landmark.', bucket: 'place', icon: 'image-outline' },
      { id: 'bacolod-food', title: 'Chicken inasal meal stop', note: 'A straightforward Bacolod food experience that fits almost any schedule.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'bacolod-tour', title: 'Lacson evening route', note: 'Good for visitors who want a city evening with easy food and hangout options.', bucket: 'tour', icon: 'moon-outline' },
    ],
  },
  {
    place: 'Pampanga',
    aliases: ['clark', 'angeles', 'san fernando'],
    area: 'Food and leisure province',
    items: [
      { id: 'pampanga-place', title: 'Clark leisure anchor', note: 'An easy first stop if you want a structured and traveler-friendly Pampanga base.', bucket: 'place', icon: 'airplane-outline' },
      { id: 'pampanga-food', title: 'Kapampangan meal stop', note: 'A must if the traveler wants to experience why Pampanga is known for food.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'pampanga-tour', title: 'Clark to Angeles route', note: 'Useful for balancing food plans with one wider sightseeing block.', bucket: 'tour', icon: 'map-outline' },
    ],
  },
  {
    place: 'Sagada',
    aliases: ['echo valley', 'hanging coffins'],
    area: 'Mountain town',
    items: [
      { id: 'sagada-place', title: 'Echo Valley or town center start', note: 'A safe first route for travelers who want a recognizable Sagada anchor.', bucket: 'place', icon: 'leaf-outline' },
      { id: 'sagada-food', title: 'Cozy cafe meal stop', note: 'A good fit for cool weather and the slower pace of mountain travel.', bucket: 'food', icon: 'cafe-outline' },
      { id: 'sagada-tour', title: 'Nature and culture route', note: 'Best when you want one flexible block for caves, views, or local walks.', bucket: 'tour', icon: 'trail-sign-outline' },
    ],
  },
  {
    place: 'Banaue',
    aliases: ['rice terraces', 'batad'],
    area: 'Cordillera highlands',
    items: [
      { id: 'banaue-place', title: 'Rice terraces viewpoint stop', note: 'The easiest first move for visitors who want the classic Banaue image right away.', bucket: 'place', icon: 'image-outline' },
      { id: 'banaue-food', title: 'Viewpoint meal break', note: 'A practical pause for long drives and mountain weather.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'banaue-tour', title: 'Terraces and village route', note: 'Works well if you want one meaningful cultural-and-scenic block.', bucket: 'tour', icon: 'map-outline' },
    ],
  },
  {
    place: 'Dumaguete',
    aliases: ['rizal boulevard', 'dumaguete city'],
    area: 'University and seaside city',
    items: [
      { id: 'dumaguete-place', title: 'Rizal Boulevard walk', note: 'A clear first stop for travelers who want an easy and friendly city introduction.', bucket: 'place', icon: 'walk-outline' },
      { id: 'dumaguete-food', title: 'Cafe and local dessert stop', note: 'Good for slowing down the pace and enjoying the city atmosphere.', bucket: 'food', icon: 'cafe-outline' },
      { id: 'dumaguete-tour', title: 'City to day-trip route', note: 'Useful when the traveler wants to keep Dumaguete as a calm base for nearby spots.', bucket: 'tour', icon: 'compass-outline' },
    ],
  },
  {
    place: 'Mandaluyong',
    aliases: ['shaw boulevard', 'greenfield', 'wack wack'],
    area: 'Central Metro connector',
    items: [
      { id: 'manda-place', title: 'Greenfield district stop', note: 'A practical first stop if you want a simple urban hangout area with easy transfers.', bucket: 'place', icon: 'business-outline' },
      { id: 'manda-food', title: 'Shaw meal and cafe stop', note: 'Works well when you want flexible food choices without traveling far.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'manda-tour', title: 'Greenfield to Ortigas route', note: 'A manageable city route for travelers who want movement without overplanning.', bucket: 'tour', icon: 'walk-outline' },
    ],
  },
  {
    place: 'San Juan',
    aliases: ['greenhills', 'greenhills shopping center'],
    area: 'Shopping district',
    items: [
      { id: 'sj-place', title: 'Greenhills shopping stop', note: 'A familiar first stop for visitors who want a practical Metro Manila shopping day.', bucket: 'place', icon: 'storefront-outline' },
      { id: 'sj-food', title: 'Greenhills dining break', note: 'Useful for travelers who want a food stop built into a shopping-heavy itinerary.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'sj-tour', title: 'Greenhills casual route', note: 'A low-stress route when the day is more about browsing and light city wandering.', bucket: 'tour', icon: 'map-outline' },
    ],
  },
  {
    place: 'Paranaque',
    aliases: ['okada', 'solaire', 'aseana', 'city of dreams'],
    area: 'Entertainment bay area',
    items: [
      { id: 'paranaque-place', title: 'Bay entertainment stop', note: 'A simple first anchor for visitors focused on shows, hotels, or nightlife nearby.', bucket: 'place', icon: 'sparkles-outline' },
      { id: 'paranaque-food', title: 'Resort dining stop', note: 'Good if you want one comfortable meal option in a more polished setting.', bucket: 'food', icon: 'wine-outline' },
      { id: 'paranaque-tour', title: 'Aseana evening route', note: 'Best for a more relaxed city evening with easy transport access.', bucket: 'tour', icon: 'moon-outline' },
    ],
  },
  {
    place: 'Navotas',
    aliases: ['fish port'],
    area: 'Coastal city',
    items: [
      { id: 'navotas-place', title: 'Coastal local stop', note: 'A useful anchor if you want a more local and working-city side of Metro Manila.', bucket: 'place', icon: 'boat-outline' },
      { id: 'navotas-food', title: 'Seafood meal stop', note: 'Adds a practical local food angle to a lesser-known city visit.', bucket: 'food', icon: 'fish-outline' },
      { id: 'navotas-tour', title: 'Coastal neighborhood route', note: 'Good for travelers who want something less polished and more local in feel.', bucket: 'tour', icon: 'trail-sign-outline' },
    ],
  },
  {
    place: 'Manila',
    aliases: ['ermita', 'malate', 'manila city', 'national museum'],
    area: 'Capital city guide',
    items: [
      { id: 'manila-place', title: 'National Museum and old Manila stop', note: 'A strong first route if the traveler wants a cultural overview without guessing where to begin.', bucket: 'place', icon: 'library-outline' },
      { id: 'manila-food', title: 'Ermita or Malate meal stop', note: 'Useful for resting between museums, parks, and bay-side plans.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'manila-tour', title: 'Museum to bay route', note: 'A balanced city route for history, open-air time, and a manageable walking plan.', bucket: 'tour', icon: 'map-outline' },
    ],
  },
  {
    place: 'Clark',
    aliases: ['clark freeport', 'clark pampanga'],
    area: 'Leisure and airport zone',
    items: [
      { id: 'clark-place', title: 'Clark central leisure stop', note: 'An easy first stop if you want a clean, low-stress base for the day.', bucket: 'place', icon: 'airplane-outline' },
      { id: 'clark-food', title: 'Clark cafe and dinner stop', note: 'Good for travelers who want comfort and familiar options while in transit or on a short trip.', bucket: 'food', icon: 'cafe-outline' },
      { id: 'clark-tour', title: 'Clark activity route', note: 'Works well when you want to mix one attraction with one relaxed city block.', bucket: 'tour', icon: 'compass-outline' },
    ],
  },
  {
    place: 'Angeles',
    aliases: ['walking street', 'balibago'],
    area: 'City nightlife and food zone',
    items: [
      { id: 'angeles-place', title: 'City center starter stop', note: 'A practical first anchor for visitors who want an accessible city base.', bucket: 'place', icon: 'location-outline' },
      { id: 'angeles-food', title: 'Local and late-night food stop', note: 'Good when the group wants to build the day around easy food choices.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'angeles-tour', title: 'Balibago city route', note: 'Useful for a lighter evening-focused plan without too many transfers.', bucket: 'tour', icon: 'moon-outline' },
    ],
  },
  {
    place: 'Puerto Princesa',
    aliases: ['underground river', 'honda bay'],
    area: 'Palawan city gateway',
    items: [
      { id: 'pp-place', title: 'City and bay starter stop', note: 'An easy first move before locking into bigger Palawan day trips.', bucket: 'place', icon: 'boat-outline' },
      { id: 'pp-food', title: 'Seafood dinner stop', note: 'A practical way to add something local to the itinerary without complicating the day.', bucket: 'food', icon: 'fish-outline' },
      { id: 'pp-tour', title: 'Underground river route', note: 'A strong classic option for travelers who want one well-known Palawan activity.', bucket: 'tour', icon: 'compass-outline' },
    ],
  },
  {
    place: 'El Nido',
    aliases: ['bacuit', 'nacpan'],
    area: 'Palawan island town',
    items: [
      { id: 'elnido-place', title: 'Town and beachfront anchor', note: 'A simple first stop for travelers who want a recognizable El Nido start before tours.', bucket: 'place', icon: 'sunny-outline' },
      { id: 'elnido-food', title: 'Beachfront dinner stop', note: 'Useful after island tours when the group wants an easy evening option.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'elnido-tour', title: 'Island-hopping route', note: 'A reliable signature activity for visitors unfamiliar with the area.', bucket: 'tour', icon: 'boat-outline' },
    ],
  },
  {
    place: 'Coron',
    aliases: ['kayangan lake', 'mt tapyas'],
    area: 'Palawan island town',
    items: [
      { id: 'coron-place', title: 'Town proper and viewpoint stop', note: 'A good first anchor for travelers easing into Coron before a bigger activity day.', bucket: 'place', icon: 'image-outline' },
      { id: 'coron-food', title: 'Post-tour meal stop', note: 'Best added after island hopping so the day still feels balanced and easy.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'coron-tour', title: 'Lake and island route', note: 'A classic Coron plan for visitors who want one memorable signature experience.', bucket: 'tour', icon: 'boat-outline' },
    ],
  },
  {
    place: 'General Luna',
    aliases: ['cloud 9', 'siargao general luna'],
    area: 'Siargao town guide',
    items: [
      { id: 'gl-place', title: 'Cloud 9 and town start', note: 'A clear first stop for tourists who want the most familiar Siargao area right away.', bucket: 'place', icon: 'sunny-outline' },
      { id: 'gl-food', title: 'Town cafe and dinner stop', note: 'Makes the day easier for visitors still learning where to eat on the island.', bucket: 'food', icon: 'cafe-outline' },
      { id: 'gl-tour', title: 'Sunset and surf route', note: 'A light route for first-time visitors who want the island vibe without a packed plan.', bucket: 'tour', icon: 'walk-outline' },
    ],
  },
  {
    place: 'Cagayan de Oro',
    aliases: ['cdo', 'divisoria cdo'],
    area: 'Northern Mindanao city',
    items: [
      { id: 'cdo-place', title: 'City center starter stop', note: 'A practical first anchor for travelers who want a simple urban base before activities.', bucket: 'place', icon: 'business-outline' },
      { id: 'cdo-food', title: 'City food stop', note: 'Useful for making the trip feel more local while keeping logistics easy.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'cdo-tour', title: 'Adventure side route', note: 'A good fit for visitors who want one energetic activity tied to the city stay.', bucket: 'tour', icon: 'trail-sign-outline' },
    ],
  },
  {
    place: 'Camiguin',
    aliases: ['white island', 'sunken cemetery'],
    area: 'Island escape',
    items: [
      { id: 'camiguin-place', title: 'White Island anchor stop', note: 'A strong first suggestion for travelers who want the most recognizable Camiguin image.', bucket: 'place', icon: 'sunny-outline' },
      { id: 'camiguin-food', title: 'Island meal stop', note: 'A practical break between scenic stops and transfers around the island.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'camiguin-tour', title: 'Island loop route', note: 'Works well for visitors who want a manageable whole-day overview.', bucket: 'tour', icon: 'map-outline' },
    ],
  },
  {
    place: 'Baler',
    aliases: ['sablayan', 'diguisit'],
    area: 'Surf town',
    items: [
      { id: 'baler-place', title: 'Surf beach starter stop', note: 'A simple anchor if the traveler wants the classic Baler introduction first.', bucket: 'place', icon: 'water-outline' },
      { id: 'baler-food', title: 'Beach town meal stop', note: 'Good for an easy food break while keeping the itinerary relaxed.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'baler-tour', title: 'Beach and viewpoint route', note: 'A light route for visitors who want one signature beach block plus scenery.', bucket: 'tour', icon: 'trail-sign-outline' },
    ],
  },
  {
    place: 'Zambales',
    aliases: ['liwliwa', 'san antonio zambales'],
    area: 'West coast escape',
    items: [
      { id: 'zambales-place', title: 'Beach anchor stop', note: 'A practical start for travelers who want to keep the trip centered on the coast.', bucket: 'place', icon: 'sunny-outline' },
      { id: 'zambales-food', title: 'Seaside meal stop', note: 'Useful for keeping the itinerary simple and comfortable between beach blocks.', bucket: 'food', icon: 'fish-outline' },
      { id: 'zambales-tour', title: 'Beach and sunset route', note: 'A relaxed route for first-time visitors who want a recognizable west-coast vibe.', bucket: 'tour', icon: 'walk-outline' },
    ],
  },
  {
    place: 'Bicol',
    aliases: ['legazpi', 'mayon', 'albay'],
    area: 'Volcano region',
    items: [
      { id: 'bicol-place', title: 'Mayon viewpoint stop', note: 'A strong first highlight for tourists who want the region\'s iconic landmark.', bucket: 'place', icon: 'triangle-outline' },
      { id: 'bicol-food', title: 'Bicol food stop', note: 'A simple way to work local flavor into the itinerary without extra planning.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'bicol-tour', title: 'Legazpi scenic route', note: 'Useful when you want one route that balances views, landmarks, and manageable travel time.', bucket: 'tour', icon: 'map-outline' },
    ],
  },
  {
    place: 'Legazpi',
    aliases: ['mayon volcano', 'cagsawa'],
    area: 'Albay city guide',
    items: [
      { id: 'legazpi-place', title: 'Cagsawa and Mayon anchor', note: 'A clear first route for visitors who want the classic Legazpi image immediately.', bucket: 'place', icon: 'image-outline' },
      { id: 'legazpi-food', title: 'Local meal with view stop', note: 'Useful after scenic stops so the day still feels relaxed and practical.', bucket: 'food', icon: 'restaurant-outline' },
      { id: 'legazpi-tour', title: 'Viewpoint and heritage route', note: 'A balanced route for first-time visitors who want more than just one photo stop.', bucket: 'tour', icon: 'trail-sign-outline' },
    ],
  },
];
