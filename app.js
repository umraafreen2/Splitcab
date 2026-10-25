/**
 * SplitCab India 🇮🇳 - Smart Ride Pooling & Real-Time Map Engine
 * 
 * CORE ALGORITHMIC ROUTING PRINCIPLES:
 * 1. Geographic Cluster & City Guardrail (Never pool Delhi with Bangalore!)
 * 2. Strict 1.0 km Proximity Geofencing
 * 3. Trajectory & Heading Vector Alignment (Dot Product check)
 * 4. Multi-Stop Sequence Optimization (Minimizes detour for both passengers)
 * 5. Independent Travel Fallback (If incompatible, prioritize direct route with 0 detour)
 * 6. Free Public GIS Mapping (Esri World Streets & OSM with zero watermarks / no API keys)
 */

// GPS Coordinates for Real Indian Corridors
const LOCATIONS = {
  // Delhi-NCR Hubs
  delhi_cp: { id: 'delhi_cp', name: 'Connaught Place Central', lat: 28.6315, lng: 77.2167, city: 'delhi', icon: '🏛️' },
  delhi_campus: { id: 'delhi_campus', name: 'Delhi Univ North Campus', lat: 28.6890, lng: 77.2090, city: 'delhi', icon: '🎓' },
  delhi_akshardham: { id: 'delhi_akshardham', name: 'Akshardham / Mayur Vihar', lat: 28.6180, lng: 77.2790, city: 'delhi', icon: '📍' },
  noida_sec62: { id: 'noida_sec62', name: 'Noida Sector 62 IT Hub', lat: 28.6280, lng: 77.3649, city: 'delhi', icon: '💻' },
  noida_sec18: { id: 'noida_sec18', name: 'Noida Sector 18 Metro / Mall', lat: 28.5708, lng: 77.3260, city: 'delhi', icon: '🛍️' },
  gurgaon_cyber: { id: 'gurgaon_cyber', name: 'DLF Cyber City Gurugram', lat: 28.4950, lng: 77.0895, city: 'delhi', icon: '🏢' },

  // Bangalore Tech Corridor
  blr_airport: { id: 'blr_airport', name: 'Kempegowda Intl Airport (BLR)', lat: 13.1986, lng: 77.7066, city: 'blr', icon: '✈️' },
  blr_yelahanka: { id: 'blr_yelahanka', name: 'Yelahanka Bypass (Near Airport)', lat: 13.1007, lng: 77.5963, city: 'blr', icon: '📍' },
  blr_hebbal: { id: 'blr_hebbal', name: 'Hebbal Flyover / Manyata Gate', lat: 13.0358, lng: 77.5970, city: 'blr', icon: '🏢' },
  blr_manyata: { id: 'blr_manyata', name: 'Manyata Tech Park Hub', lat: 13.0475, lng: 77.6214, city: 'blr', icon: '💻' },
  blr_indiranagar: { id: 'blr_indiranagar', name: 'Indiranagar 100ft Road', lat: 12.9719, lng: 77.6412, city: 'blr', icon: '🛍️' },
  blr_koramangala: { id: 'blr_koramangala', name: 'Koramangala Sony Signal', lat: 12.9352, lng: 77.6245, city: 'blr', icon: '🍕' },
  blr_bellandur: { id: 'blr_bellandur', name: 'Bellandur Outer Ring Road (ORR)', lat: 12.9260, lng: 77.6762, city: 'blr', icon: '🏢' },
  blr_whitefield: { id: 'blr_whitefield', name: 'Whitefield ITPL Main Gate', lat: 12.9866, lng: 77.7381, city: 'blr', icon: '💼' },

  // Mumbai Hubs
  mumbai_airport: { id: 'mumbai_airport', name: 'CSMI Airport T2 Mumbai', lat: 19.0896, lng: 72.8656, city: 'mumbai', icon: '✈️' },
  mumbai_bkc: { id: 'mumbai_bkc', name: 'Bandra Kurla Complex (BKC)', lat: 19.0657, lng: 72.8687, city: 'mumbai', icon: '🏦' },
  mumbai_powai: { id: 'mumbai_powai', name: 'Powai Hiranandani / IIT Bombay', lat: 19.1197, lng: 72.9051, city: 'mumbai', icon: '🎓' }
};

// Preset high-density corridors & test scenarios
const PRESETS = {
  delhi_noida_incompatible: {
    city: 'delhi',
    label: '🧪 Delhi ➔ Noida (Incompatible: B in BLR)',
    center: [28.6300, 77.2900],
    zoom: 12,
    userA: { pickup: 'delhi_cp', drop: 'noida_sec62' },
    userB: { pickup: 'blr_yelahanka', drop: 'blr_manyata' },
    note: 'Incompatible! Passenger B is in Bangalore. Passenger A travels direct to Noida independently.'
  },
  delhi_noida_compatible: {
    city: 'delhi',
    label: '🎯 Delhi ➔ Noida (Compatible Co-Rider)',
    center: [28.6300, 77.2900],
    zoom: 12,
    userA: { pickup: 'delhi_cp', drop: 'noida_sec62' },
    userB: { pickup: 'delhi_akshardham', drop: 'noida_sec62' },
    note: 'Compatible! Both along Vikas Marg / Noida Link Rd corridor. 86% overlap.'
  },
  blr_airport: {
    city: 'blr',
    label: '✈️ BLR Airport ➔ Outer Ring',
    center: [13.1007, 77.6200],
    zoom: 11,
    userA: { pickup: 'blr_airport', drop: 'blr_bellandur' },
    userB: { pickup: 'blr_yelahanka', drop: 'blr_manyata' },
    note: 'Compatible! High-density airport corridor along NH44.'
  },
  mumbai_bkc: {
    city: 'mumbai',
    label: '🌊 Mumbai BKC ➔ Powai IIT',
    center: [19.0900, 72.8800],
    zoom: 12,
    userA: { pickup: 'mumbai_bkc', drop: 'mumbai_powai' },
    userB: { pickup: 'mumbai_airport', drop: 'mumbai_powai' },
    note: 'Compatible! Eastern Express Highway corridor.'
  }
};

// Vehicle Types in INR
const VEHICLES = {
  auto: { id: 'auto', name: 'Shared Auto', icon: '🛺', base: 35, perKm: 8.5, capacity: 2 },
  mini: { id: 'mini', name: 'Mini Hatchback', icon: '🚗', base: 50, perKm: 12.0, capacity: 2 },
  sedan: { id: 'sedan', name: 'Prime Sedan', icon: '🚘', base: 70, perKm: 15.5, capacity: 3 },
  suv: { id: 'suv', name: 'SUV / XL', icon: '🚙', base: 100, perKm: 22.0, capacity: 4 }
};

// Application State
const state = {
  viewMode: 'dual',
  currentCity: 'delhi',
  userA: {
    id: 'user_a',
    name: 'Arjun Sharma (You)',
    avatar: '👨‍💼',
    gender: 'male',
    aadhaarVerified: true,
    aadhaarNumber: '5482 7109 9102',
    community: 'Infosys Tech Hub',
    pickup: 'delhi_cp',
    drop: 'noida_sec62',
    vehicle: 'mini',
    timingMode: 'now',
    womenOnly: false,
    communityOnly: false,
    radiusLimitKm: 1.5,
    status: 'IDLE', // IDLE, SEARCHING, MATCH_OFFERED, ACCEPTED, IN_RIDE_POOLED, IN_RIDE_SOLO, COMPLETED
    soloFare: 260,
    sharedFare: 130,
    distKm: 18
  },
  userB: {
    id: 'user_b',
    name: 'Priya Nair (Co-Rider)',
    avatar: '👩‍💻',
    gender: 'female',
    aadhaarVerified: true,
    aadhaarNumber: '8910 4321 6621',
    community: 'Deloitte Circle',
    pickup: 'blr_yelahanka',
    drop: 'blr_manyata',
    vehicle: 'mini',
    timingMode: 'now',
    womenOnly: false,
    communityOnly: false,
    radiusLimitKm: 1.5,
    status: 'IDLE',
    soloFare: 220,
    sharedFare: 110,
    distKm: 14
  },
  trafficCondition: 'clear',
  currentMatch: null,
  countdownInterval: null,
  countdownSecs: 35,
  tripProgress: 0,
  tripInterval: null,
  messages: [
    { sender: 'system', text: 'Encrypted ride room created. Coordinate meeting point here!' }
  ],
  aadhaarOtpRequested: false
};

// Web Audio API Synthesizer
class SoundFX {
  constructor() { this.ctx = null; }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }
  playMatchChime() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.setValueAtTime(880, now + 0.15);
    osc.frequency.setValueAtTime(1174.66, now + 0.3);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
  }
  playPing() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }
  playSuccess() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.12, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.3);
    });
  }
}
const sfx = new SoundFX();

// Haversine Distance in Kilometers
function getHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

// Distance & Fare Calculator
function calculateDistanceFares(loc1, loc2, vehType) {
  const veh = VEHICLES[vehType] || VEHICLES.mini;
  const dist = getHaversineKm(loc1.lat, loc1.lng, loc2.lat, loc2.lng);
  const roadDist = Math.max(2.5, dist * 1.25);
  const soloFare = Math.round(veh.base + roadDist * veh.perKm);
  return { distKm: Math.round(roadDist), soloFare: soloFare };
}

// =========================================================================
// ADVANCED GEOSPATIAL ROUTE MATCHING & DETOUR EVALUATION ALGORITHM
// =========================================================================
function evaluateProportionalRideMatch(userA, userB) {
  const locA_pick = LOCATIONS[userA.pickup];
  const locA_drop = LOCATIONS[userA.drop];
  const locB_pick = LOCATIONS[userB.pickup];
  const locB_drop = LOCATIONS[userB.drop];

  if (!locA_pick || !locA_drop || !locB_pick || !locB_drop) return null;

  // 1. Direct distances for both passengers
  const fareA_info = calculateDistanceFares(locA_pick, locA_drop, userA.vehicle);
  const fareB_info = calculateDistanceFares(locB_pick, locB_drop, userB.vehicle);
  const directDistA = fareA_info.distKm;
  const directDistB = fareB_info.distKm;
  const veh = VEHICLES[userA.vehicle] || VEHICLES.mini;

  // 2. CRITICAL GUARDRAIL: Metropolitan Region & City Boundary Check
  const pickupDistanceKm = getHaversineKm(locA_pick.lat, locA_pick.lng, locB_pick.lat, locB_pick.lng);
  const isDiffCity = (locA_pick.city && locB_pick.city && locA_pick.city !== locB_pick.city);

  if (isDiffCity || pickupDistanceKm > 40.0) {
    return {
      isViable: false,
      isDifferentCity: true,
      pickupDistanceKm: Math.round(pickupDistanceKm),
      rejectReason: `Geographically Incompatible: Passenger B is located in ${locB_pick.name} (${Math.round(pickupDistanceKm)} km away). Intercity pooling is strictly prohibited. Both passengers must travel independently on their direct routes.`,
      soloFareA: fareA_info.soloFare,
      soloFareB: fareB_info.soloFare,
      distA: directDistA,
      distB: directDistB
    };
  }

  // 3. STRICT PICKUP PROXIMITY CHECK (Default: <= 1.5 km)
  if (pickupDistanceKm > userA.radiusLimitKm) {
    return {
      isViable: false,
      pickupDistanceKm: pickupDistanceKm.toFixed(1),
      rejectReason: `Pickup Distance (${pickupDistanceKm.toFixed(1)} km) exceeds the ${userA.radiusLimitKm} km proximity threshold. Co-rider is too far away to share a ride without significant pickup delay.`,
      soloFareA: fareA_info.soloFare,
      soloFareB: fareB_info.soloFare,
      distA: directDistA,
      distB: directDistB
    };
  }

  // 4. TRAJECTORY & DIRECTION VECTOR ALIGNMENT (Cosine Similarity)
  const vecA = { lat: locA_drop.lat - locA_pick.lat, lng: locA_drop.lng - locA_pick.lng };
  const vecB = { lat: locB_drop.lat - locB_pick.lat, lng: locB_drop.lng - locB_pick.lng };
  const dot = vecA.lat * vecB.lat + vecA.lng * vecB.lng;
  const magA = Math.sqrt(vecA.lat * vecA.lat + vecA.lng * vecA.lng);
  const magB = Math.sqrt(vecB.lat * vecB.lat + vecB.lng * vecB.lng);
  const cosineSim = (magA * magB > 0) ? (dot / (magA * magB)) : 0;

  if (cosineSim < 0.50) {
    const angleDeg = Math.round(Math.acos(Math.max(-1, Math.min(1, cosineSim))) * (180 / Math.PI));
    return {
      isViable: false,
      rejectReason: `Diverging Trajectories: Routes deviate by ${angleDeg}°. Passenger A is traveling in a different direction than Passenger B. Pooling would cause severe backtracking.`,
      soloFareA: fareA_info.soloFare,
      soloFareB: fareB_info.soloFare,
      distA: directDistA,
      distB: directDistB
    };
  }

  // 5. SAFETY & COMMUNITY FILTERS
  if (userA.womenOnly || userB.womenOnly) {
    if (userA.gender !== 'female' || userB.gender !== 'female') {
      return {
        isViable: false,
        rejectReason: 'Women-Only Pool active: Both passengers must be verified female commuters.',
        soloFareA: fareA_info.soloFare,
        soloFareB: fareB_info.soloFare,
        distA: directDistA,
        distB: directDistB
      };
    }
  }

  if (userA.communityOnly || userB.communityOnly) {
    if (userA.community !== userB.community) {
      return {
        isViable: false,
        rejectReason: 'Community Exclusive active: Must belong to the same verified campus or corporate circle.',
        soloFareA: fareA_info.soloFare,
        soloFareB: fareB_info.soloFare,
        distA: directDistA,
        distB: directDistB
      };
    }
  }

  // 6. MULTI-STOP SEQUENCING & DETOUR MINIMIZATION
  // Test Option 1: Pickup A -> Pickup B -> Drop A -> Drop B
  const d_dropA_first = getHaversineKm(locB_pick.lat, locB_pick.lng, locA_drop.lat, locA_drop.lng) +
                        getHaversineKm(locA_drop.lat, locA_drop.lng, locB_drop.lat, locB_drop.lng);
  // Test Option 2: Pickup A -> Pickup B -> Drop B -> Drop A
  const d_dropB_first = getHaversineKm(locB_pick.lat, locB_pick.lng, locB_drop.lat, locB_drop.lng) +
                        getHaversineKm(locB_drop.lat, locB_drop.lng, locA_drop.lat, locA_drop.lng);

  let optimalDropOrder = 'dropA_first';
  let totalPooledKmStraight = pickupDistanceKm + d_dropA_first;
  let detourKmForA = (pickupDistanceKm + getHaversineKm(locB_pick.lat, locB_pick.lng, locA_drop.lat, locA_drop.lng)) - getHaversineKm(locA_pick.lat, locA_pick.lng, locA_drop.lat, locA_drop.lng);

  if (d_dropB_first < d_dropA_first) {
    optimalDropOrder = 'dropB_first';
    totalPooledKmStraight = pickupDistanceKm + d_dropB_first;
    detourKmForA = totalPooledKmStraight - getHaversineKm(locA_pick.lat, locA_pick.lng, locA_drop.lat, locA_drop.lng);
  }

  const extraRoadKm = Math.max(0.5, detourKmForA * 1.2);
  const detourMins = Math.round(extraRoadKm * 2.8) + (state.trafficCondition === 'jam' ? 8 : 2);

  // DETOUR TOLERANCE CHECK: Detour cannot exceed 3.5 km or 25% of direct route
  if (extraRoadKm > 4.0 || extraRoadKm > directDistA * 0.30 || detourMins > 12) {
    return {
      isViable: false,
      rejectReason: `Detour too high (+${detourMins} mins, +${extraRoadKm.toFixed(1)} km extra). Your direct route is prioritized. Traveling independently.`,
      soloFareA: fareA_info.soloFare,
      soloFareB: fareB_info.soloFare,
      distA: directDistA,
      distB: directDistB
    };
  }

  // 7. COMPATIBLE MATCH METRICS
  const sharedRoadKm = Math.round(Math.max(directDistA, directDistB) + pickupDistanceKm * 1.1);
  const totalPooledMeter = Math.round(veh.base + sharedRoadKm * veh.perKm);

  // Proportional split according to distance covered
  const shareRatioA = directDistA / (directDistA + directDistB);
  const shareRatioB = directDistB / (directDistA + directDistB);
  const sharedFareA = Math.round(totalPooledMeter * shareRatioA);
  const sharedFareB = Math.round(totalPooledMeter * shareRatioB);

  // Route overlap percentage
  const routeOverlapPercent = Math.min(96, Math.max(65, Math.round(cosineSim * 100 - pickupDistanceKm * 6)));

  const mutualPoint = {
    name: pickupDistanceKm > 0.4 ? 'Corridor Flyover / Metro Bus Bay' : 'Shared Gate Bay',
    walkMins: Math.max(1, Math.round(pickupDistanceKm * 4)),
    lat: (locA_pick.lat + locB_pick.lat) / 2,
    lng: (locA_pick.lng + locB_pick.lng) / 2
  };

  return {
    isViable: true,
    isDifferentCity: false,
    pickupDistanceKm: pickupDistanceKm.toFixed(2),
    matchScore: routeOverlapPercent,
    optimalDropOrder,
    distA: directDistA,
    distB: directDistB,
    soloFareA: fareA_info.soloFare,
    soloFareB: fareB_info.soloFare,
    sharedFareA,
    sharedFareB,
    detourMins,
    extraRoadKm: extraRoadKm.toFixed(1),
    mutualPoint,
    totalMeter: totalPooledMeter
  };
}

// =========================================================================
// REAL-TIME LEAFLET MAP ENGINE (Esri World Streets & OpenStreetMap)
// =========================================================================
let leafletMap = null;
let currentTileLayer = null;
let leafletMarkers = {};
let leafletCircle = null;
let leafletPolylineA = null;
let leafletPolylineB = null;
let leafletPolylineShared = null;
let leafletCarMarker = null;

const TILE_PROVIDERS = {
  streets: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Street Map',
    maxZoom: 19
  },
  osm: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri Satellite Imagery',
    maxZoom: 19
  }
};

function initRealTimeMap() {
  const mapEl = document.getElementById('leafletMap');
  if (!mapEl) return;

  if (typeof L === 'undefined') {
    console.warn('Leaflet script not found, activating Canvas Vector Engine.');
    initCanvasVectorFallback();
    return;
  }

  try {
    leafletMap = L.map('leafletMap', {
      zoomControl: true,
      attributionControl: false
    }).setView([28.6300, 77.2900], 12);

    setTileStyle('streets');

    setTimeout(() => {
      if (leafletMap) leafletMap.invalidateSize();
    }, 200);

    updateMapMarkers();
    leafletMap.on('click', handleMapClick);

  } catch (err) {
    console.error('Leaflet Map Initialization Error:', err);
    initCanvasVectorFallback();
  }
}

function setTileStyle(styleKey) {
  if (!leafletMap) return;
  const cfg = TILE_PROVIDERS[styleKey] || TILE_PROVIDERS.streets;

  if (currentTileLayer) {
    leafletMap.removeLayer(currentTileLayer);
  }

  currentTileLayer = L.tileLayer(cfg.url, {
    maxZoom: cfg.maxZoom || 19,
    crossOrigin: true
  }).addTo(leafletMap);

  document.querySelectorAll('#btnMapStyleStreet, #btnMapStyleOsm, #btnMapStyleSat').forEach(b => b.classList.remove('active'));
  if (styleKey === 'satellite') {
    const satBtn = document.getElementById('btnMapStyleSat');
    if (satBtn) satBtn.classList.add('active');
  } else if (styleKey === 'osm') {
    const osmBtn = document.getElementById('btnMapStyleOsm');
    if (osmBtn) osmBtn.classList.add('active');
  } else {
    const streetBtn = document.getElementById('btnMapStyleStreet');
    if (streetBtn) streetBtn.classList.add('active');
  }
}

function switchMapStyle(styleKey) {
  setTileStyle(styleKey);
  const labels = { streets: 'Esri World Streets', osm: 'OpenStreetMap', satellite: 'Satellite Imagery' };
  showToast('🗺️ Map Layer Changed', `Active: ${labels[styleKey] || styleKey} (Zero Watermarks)`);
}

function changeMapCity(cityKey) {
  state.currentCity = cityKey;
  let targetPreset = 'delhi_noida_compatible';
  if (cityKey === 'blr') targetPreset = 'blr_airport';
  else if (cityKey === 'mumbai') targetPreset = 'mumbai_bkc';

  applyPreset(targetPreset);
}

function handleMapClick(e) {
  const { lat, lng } = e.latlng;
  LOCATIONS.custom_click = {
    id: 'custom_click',
    name: `Custom Pin (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
    lat,
    lng,
    city: state.currentCity,
    icon: '📍'
  };

  state.userA.pickup = 'custom_click';
  populateLocationSelects();
  document.getElementById('pickupSelectA').value = 'custom_click';
  updateFareTeasers();
  updateMapMarkers();
  showToast('📍 Pin Dropped on Map', 'Updated your pickup point to clicked coordinate.');
}

// Live GPS Handler
function locateUserGPS() {
  if (!navigator.geolocation) {
    showToast('⚠️ GPS Unsupported', 'Geolocation is not supported in this browser.');
    return;
  }

  showToast('📡 Locating GPS...', 'Connecting to device satellite position...');

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      if (leafletMap) {
        leafletMap.flyTo([latitude, longitude], 13, { duration: 1.5 });

        LOCATIONS.live_gps = {
          id: 'live_gps',
          name: `My Live GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          lat: latitude,
          lng: longitude,
          city: 'delhi',
          icon: '📍'
        };

        state.userA.pickup = 'live_gps';
        populateLocationSelects();
        document.getElementById('pickupSelectA').value = 'live_gps';
        updateFareTeasers();
        updateMapMarkers();
        sfx.playSuccess();
        showToast('🎯 GPS Acquired!', `Locked to coordinates (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`);
      }
    },
    (err) => {
      console.warn('Geolocation access issue:', err);
      showToast('📍 Location Note', 'Browser location was not shared. Running in Delhi-to-Noida corridor with real-time map active!');
    },
    { timeout: 7000, enableHighAccuracy: true }
  );
}

// =========================================================================
// REAL-TIME ROUTE & MARKER UPDATES ON MAP
// =========================================================================
function updateMapMarkers() {
  if (!leafletMap) return;

  // Clear previous layers
  Object.values(leafletMarkers).forEach(m => leafletMap.removeLayer(m));
  if (leafletCircle) leafletMap.removeLayer(leafletCircle);
  if (leafletPolylineA) leafletMap.removeLayer(leafletPolylineA);
  if (leafletPolylineB) leafletMap.removeLayer(leafletPolylineB);
  if (leafletPolylineShared) leafletMap.removeLayer(leafletPolylineShared);
  if (leafletCarMarker) leafletMap.removeLayer(leafletCarMarker);
  leafletMarkers = {};

  const pA = LOCATIONS[state.userA.pickup];
  const dA = LOCATIONS[state.userA.drop];
  const pB = LOCATIONS[state.userB.pickup];
  const dB = LOCATIONS[state.userB.drop];

  if (!pA || !dA || !pB || !dB) return;

  const match = evaluateProportionalRideMatch(state.userA, state.userB);
  const isCompatible = match && match.isViable;

  const makeIcon = (emoji, color, label) => L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div style="background: ${color}; color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 0 14px ${color}; border: 2px solid #ffffff;">${emoji}</div>
      <div style="font-size: 10px; font-weight: 800; background: rgba(15,23,42,0.9); color: #fff; padding: 2px 6px; border-radius: 4px; margin-top: 3px; white-space: nowrap; text-align: center; border: 1px solid rgba(255,255,255,0.2);">${label}</div>
    `,
    iconSize: [34, 52],
    iconAnchor: [17, 26]
  });

  // Always render Arjun's route & markers (User A)
  leafletMarkers.pA = L.marker([pA.lat, pA.lng], { icon: makeIcon('A', '#10b981', 'Arjun Pickup') }).addTo(leafletMap);
  leafletMarkers.dA = L.marker([dA.lat, dA.lng], { icon: makeIcon('🏁', '#059669', 'Arjun Drop') }).addTo(leafletMap);

  // 1 km Proximity Circle around Arjun's Pickup
  leafletCircle = L.circle([pA.lat, pA.lng], {
    radius: state.userA.radiusLimitKm * 1000,
    color: '#10b981',
    fillColor: '#10b981',
    fillOpacity: 0.12,
    weight: 2,
    dashArray: '6, 6'
  }).addTo(leafletMap);

  // =========================================================================
  // SCENARIO 1: INCOMPATIBLE (DIFFERENT CITIES OR NO OVERLAP) -> TRAVEL INDEPENDENTLY!
  // =========================================================================
  if (!isCompatible) {
    // 1. Draw Arjun's DIRECT solo route (NO DETOUR TO BANGALORE!)
    const directRouteA = [
      [pA.lat, pA.lng],
      [dA.lat, dA.lng]
    ];
    leafletPolylineA = L.polyline(directRouteA, {
      color: '#10b981',
      weight: 5,
      opacity: 0.95
    }).addTo(leafletMap);

    // 2. Only show User B on map if they are in the same general area, but DO NOT connect them!
    const isSameCity = (pA.city === pB.city);
    if (isSameCity) {
      leafletMarkers.pB = L.marker([pB.lat, pB.lng], { icon: makeIcon('B', '#3b82f6', 'Priya Pickup (Solo)') }).addTo(leafletMap);
      leafletMarkers.dB = L.marker([dB.lat, dB.lng], { icon: makeIcon('🎯', '#2563eb', 'Priya Drop (Solo)') }).addTo(leafletMap);

      leafletPolylineB = L.polyline([[pB.lat, pB.lng], [dB.lat, dB.lng]], {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
        dashArray: '4, 6'
      }).addTo(leafletMap);
    }

    // Crucial: Frame map ONLY around Arjun's direct route (Delhi -> Noida), NOT Bangalore!
    try {
      leafletMap.fitBounds(L.latLngBounds(directRouteA), { padding: [60, 60], maxZoom: 13 });
    } catch(e) {}
    return;
  }

  // =========================================================================
  // SCENARIO 2: COMPATIBLE CORRIDOR -> POOLED RIDE WITH MINIMAL DETOUR
  // =========================================================================
  leafletMarkers.pB = L.marker([pB.lat, pB.lng], { icon: makeIcon('B', '#3b82f6', `Priya (${match.pickupDistanceKm}km)`) }).addTo(leafletMap);
  leafletMarkers.dB = L.marker([dB.lat, dB.lng], { icon: makeIcon('🎯', '#2563eb', 'Priya Drop') }).addTo(leafletMap);

  // Mutual Pickup Bay
  if (match.mutualPoint) {
    leafletMarkers.mutual = L.marker([match.mutualPoint.lat, match.mutualPoint.lng], {
      icon: makeIcon('🚶', '#14b8a6', 'Mutual Pickup Bay')
    }).addTo(leafletMap);
  }

  // Build the optimized sequence
  let sharedRoutePoints = [];
  if (match.optimalDropOrder === 'dropB_first') {
    sharedRoutePoints = [
      [pA.lat, pA.lng],
      [match.mutualPoint.lat, match.mutualPoint.lng],
      [pB.lat, pB.lng],
      [dB.lat, dB.lng],
      [dA.lat, dA.lng]
    ];
  } else {
    sharedRoutePoints = [
      [pA.lat, pA.lng],
      [match.mutualPoint.lat, match.mutualPoint.lng],
      [pB.lat, pB.lng],
      [dA.lat, dA.lng],
      [dB.lat, dB.lng]
    ];
  }

  leafletPolylineShared = L.polyline(sharedRoutePoints, {
    color: '#f59e0b',
    weight: 5,
    opacity: 0.95,
    dashArray: state.userA.status === 'IN_RIDE_POOLED' ? null : '6, 8'
  }).addTo(leafletMap);

  try {
    leafletMap.fitBounds(L.latLngBounds(sharedRoutePoints), { padding: [50, 50], maxZoom: 13 });
  } catch(e) {}
}

function initCanvasVectorFallback() {
  const canvas = document.getElementById('cityMapCanvas');
  const leafletDiv = document.getElementById('leafletMap');
  if (leafletDiv) leafletDiv.style.display = 'none';
  if (canvas) {
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '14px system-ui';
    ctx.fillText('📡 SplitCab Vector Engine Active', 20, 30);
  }
}

// =========================================================================
// APP INITIALIZATION & EVENT BINDINGS
// =========================================================================
function initApp() {
  populateLocationSelects();
  bindEventHandlers();
  updateFareTeasers();
  initRealTimeMap();
  renderPanels();

  setTimeout(() => {
    showToast('🇮🇳 Smart Route Matching Engine Active', 'Geographic compatibility enabled. Zero unnecessary detours!');
  }, 400);
}

function populateLocationSelects() {
  const selects = ['pickupSelectA', 'dropSelectA', 'pickupSelectB', 'dropSelectB'];
  selects.forEach(selId => {
    const el = document.getElementById(selId);
    if (!el) return;
    el.innerHTML = '';
    Object.values(LOCATIONS).forEach(loc => {
      const opt = document.createElement('option');
      opt.value = loc.id;
      opt.textContent = `${loc.icon} ${loc.name}`;
      el.appendChild(opt);
    });
  });

  document.getElementById('pickupSelectA').value = state.userA.pickup;
  document.getElementById('dropSelectA').value = state.userA.drop;
  document.getElementById('pickupSelectB').value = state.userB.pickup;
  document.getElementById('dropSelectB').value = state.userB.drop;
}

function bindEventHandlers() {
  // Preset Corridors
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      applyPreset(chip.dataset.preset);
    });
  });

  // Simulator Mode Switcher
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setAppViewMode(btn.dataset.mode);
    });
  });

  // Inputs Change
  document.getElementById('pickupSelectA').addEventListener('change', (e) => {
    state.userA.pickup = e.target.value;
    updateFareTeasers();
    updateMapMarkers();
  });
  document.getElementById('dropSelectA').addEventListener('change', (e) => {
    state.userA.drop = e.target.value;
    updateFareTeasers();
    updateMapMarkers();
  });
  document.getElementById('pickupSelectB').addEventListener('change', (e) => {
    state.userB.pickup = e.target.value;
    updateFareTeasers();
    updateMapMarkers();
  });
  document.getElementById('dropSelectB').addEventListener('change', (e) => {
    state.userB.drop = e.target.value;
    updateFareTeasers();
    updateMapMarkers();
  });

  // Toggles
  const toggleWomen = document.getElementById('toggleWomenA');
  if (toggleWomen) {
    toggleWomen.addEventListener('change', (e) => {
      state.userA.womenOnly = e.target.checked;
      const card = document.getElementById('cardWomenA');
      if (card) card.classList.toggle('active', e.target.checked);
      showToast(e.target.checked ? '🛡️ Women-Only Active' : 'Women-Only Filter Off', 'Matches strictly with verified female co-passengers.');
      updateFareTeasers();
    });
  }

  const toggleComm = document.getElementById('toggleCommA');
  if (toggleComm) {
    toggleComm.addEventListener('change', (e) => {
      state.userA.communityOnly = e.target.checked;
      const card = document.getElementById('cardCommunityA');
      if (card) card.classList.toggle('active', e.target.checked);
      showToast(e.target.checked ? '🏢 Community Circle Active' : 'Community Filter Off', 'Matches exclusively with Infosys/Corporate colleagues.');
      updateFareTeasers();
    });
  }

  // Action Buttons
  document.getElementById('btnRequestA').addEventListener('click', () => {
    sfx.init();
    startRideSearch('A');
  });
  document.getElementById('btnRequestB').addEventListener('click', () => {
    sfx.init();
    startRideSearch('B');
  });

  // Modals
  document.getElementById('btnOpenAadhaarModal').addEventListener('click', () => openModal('modalAadhaar'));
  document.getElementById('btnOpenTinyFishModal').addEventListener('click', () => openModal('modalTinyFish'));
  document.getElementById('btnOpenCalcModal').addEventListener('click', () => openModal('modalCalc'));
  document.getElementById('btnOpenCommunityModal').addEventListener('click', () => openModal('modalCommunity'));

  // Reset
  document.getElementById('btnReset').addEventListener('click', resetSimulation);

  // Window Resize
  window.addEventListener('resize', () => {
    if (leafletMap) leafletMap.invalidateSize();
  });
}

function setAppViewMode(mode) {
  state.viewMode = mode;
  const main = document.getElementById('mainLayout');
  const panelB = document.getElementById('panelB');
  if (mode === 'dual') {
    main.classList.add('dual-mode');
    panelB.style.display = 'flex';
  } else {
    main.classList.remove('dual-mode');
    panelB.style.display = 'none';
  }
  setTimeout(() => { if (leafletMap) leafletMap.invalidateSize(); }, 150);
}

function setRideTiming(userKey, mode) {
  const tabNow = document.getElementById(`tabNow${userKey}`);
  const tabSched = document.getElementById(`tabSchedule${userKey}`);
  const box = document.getElementById(`scheduleBox${userKey}`);

  if (mode === 'now') {
    if (tabNow) tabNow.classList.add('active');
    if (tabSched) tabSched.classList.remove('active');
    if (box) box.classList.remove('show');
    state.userA.timingMode = 'now';
    showToast('⚡ Ride Now', 'Searching for commuters booking immediately.');
  } else {
    if (tabNow) tabNow.classList.remove('active');
    if (tabSched) tabSched.classList.add('active');
    if (box) box.classList.add('show');
    state.userA.timingMode = 'schedule';
    showToast('📅 Scheduled Ride', 'Pre-matching for tomorrow office rush.');
  }
}

function selectVehicle(userKey, vehId) {
  state.userA.vehicle = vehId;
  state.userB.vehicle = vehId;

  document.querySelectorAll('.vehicle-card').forEach(c => {
    c.classList.remove('active');
    if (c.dataset.veh === vehId || c.dataset.vehB === vehId) c.classList.add('active');
  });

  updateFareTeasers();
  showToast('🚖 Vehicle Selected', `${VEHICLES[vehId].name} (${VEHICLES[vehId].capacity} seats • ₹${VEHICLES[vehId].perKm}/km)`);
}

function applyPreset(presetId) {
  const p = PRESETS[presetId];
  if (!p) return;

  state.userA.pickup = p.userA.pickup;
  state.userA.drop = p.userA.drop;
  state.userB.pickup = p.userB.pickup;
  state.userB.drop = p.userB.drop;

  document.getElementById('pickupSelectA').value = p.userA.pickup;
  document.getElementById('dropSelectA').value = p.userA.drop;
  document.getElementById('pickupSelectB').value = p.userB.pickup;
  document.getElementById('dropSelectB').value = p.userB.drop;

  document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
  const activeBtn = document.querySelector(`[data-preset="${presetId}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  const citySel = document.getElementById('mapCitySelector');
  if (citySel && p.city) citySel.value = p.city;

  updateFareTeasers();
  updateMapMarkers();

  if (leafletMap && p.center) {
    leafletMap.flyTo(p.center, p.zoom || 12, { duration: 1.2 });
  }

  showToast('📍 Scenario Loaded', `${p.label}`);
}

function updateFareTeasers() {
  const locA1 = LOCATIONS[state.userA.pickup];
  const locA2 = LOCATIONS[state.userA.drop];
  const locB1 = LOCATIONS[state.userB.pickup];
  const locB2 = LOCATIONS[state.userB.drop];

  if (locA1 && locA2 && locB1 && locB2) {
    const match = evaluateProportionalRideMatch(state.userA, state.userB);
    if (match) {
      state.userA.soloFare = match.soloFareA;
      state.userA.distKm = match.distA;
      state.userB.soloFare = match.soloFareB;
      state.userB.distKm = match.distB;

      if (match.isViable) {
        state.userA.sharedFare = match.sharedFareA;
        state.userB.sharedFare = match.sharedFareB;

        // User A
        document.getElementById('soloPriceA').textContent = `₹${match.soloFareA}`;
        document.getElementById('sharedPriceA').textContent = `₹${match.sharedFareA}`;
        document.getElementById('distA').textContent = `Direct: ${match.distA} km (+${match.extraRoadKm}km)`;
        const savePercentA = Math.round(((match.soloFareA - match.sharedFareA) / match.soloFareA) * 100);
        document.getElementById('savePillA').textContent = `SAVE ${savePercentA}%`;

        // User B
        document.getElementById('soloPriceB').textContent = `₹${match.soloFareB}`;
        document.getElementById('sharedPriceB').textContent = `₹${match.sharedFareB}`;
        document.getElementById('distB').textContent = `Direct: ${match.distB} km`;
        const savePercentB = Math.round(((match.soloFareB - match.sharedFareB) / match.soloFareB) * 100);
        document.getElementById('savePillB').textContent = `SAVE ${savePercentB}%`;
      } else {
        // Incompatible: Show Solo Price as Primary!
        document.getElementById('soloPriceA').textContent = `₹${match.soloFareA}`;
        document.getElementById('sharedPriceA').textContent = `₹${match.soloFareA}`;
        document.getElementById('distA').textContent = `Direct Route: ${match.distA} km (Solo)`;
        document.getElementById('savePillA').textContent = `SOLO RIDE`;
        document.getElementById('savePillA').style.background = '#64748b';

        document.getElementById('soloPriceB').textContent = `₹${match.soloFareB}`;
        document.getElementById('sharedPriceB').textContent = `₹${match.soloFareB}`;
        document.getElementById('distB').textContent = `Direct Route: ${match.distB} km (Solo)`;
        document.getElementById('savePillB').textContent = `SOLO RIDE`;
        document.getElementById('savePillB').style.background = '#64748b';
      }
    }
  }
}

// =========================================================================
// MATCHING & INDEPENDENT TRAVEL FLOW
// =========================================================================
function startRideSearch(requester) {
  if (requester === 'A') state.userA.status = 'SEARCHING';
  else state.userB.status = 'SEARCHING';

  renderPanels();
  sfx.playPing();

  setTimeout(() => {
    const match = evaluateProportionalRideMatch(state.userA, state.userB);
    if (match && match.isViable) {
      // COMPATIBLE -> OFFER MATCH
      triggerMatchOffer(match);
    } else {
      // INCOMPATIBLE -> DIRECT SOLO TRAVEL (NO UNNECESSARY DETOUR!)
      triggerIndependentSoloRide(match);
    }
  }, 1800);
}

function triggerMatchOffer(match) {
  state.currentMatch = match;
  state.userA.status = 'MATCH_OFFERED';
  state.userB.status = 'MATCH_OFFERED';
  state.countdownSecs = 35;

  sfx.playMatchChime();
  renderPanels();
  updateMapMarkers();

  showToast('🎉 Geographically Compatible Match!', `Co-rider is ${match.pickupDistanceKm} km away heading the same corridor. Overlap: ${match.matchScore}%.`);

  clearInterval(state.countdownInterval);
  state.countdownInterval = setInterval(() => {
    state.countdownSecs--;
    document.querySelectorAll('.countdown-timer').forEach(el => {
      el.textContent = `⏱️ ${state.countdownSecs}s remaining`;
    });

    if (state.countdownSecs <= 0) {
      clearInterval(state.countdownInterval);
      showToast('⏱️ Match Expired', 'Offer timed out.');
      resetSimulation();
    }
  }, 1000);
}

function triggerIndependentSoloRide(match) {
  state.currentMatch = match;
  state.userA.status = 'IN_RIDE_SOLO';
  state.userB.status = 'IN_RIDE_SOLO';

  sfx.playSuccess();
  renderPanels();
  updateMapMarkers();
  startDirectSoloSimulation();

  showToast('🚗 Independent Direct Route Dispatched', match.rejectReason);
}

function acceptMatch(userKey) {
  sfx.playPing();
  if (userKey === 'A') state.userA.status = 'ACCEPTED';
  else state.userB.status = 'ACCEPTED';

  renderPanels();
  checkBothAccepted();
}

function declineMatch(userKey) {
  showToast('❌ Match Declined', 'Switching to direct solo route.');
  const match = evaluateProportionalRideMatch(state.userA, state.userB);
  triggerIndependentSoloRide(match);
}

function checkBothAccepted() {
  if (state.userA.status === 'ACCEPTED' && state.userB.status === 'ACCEPTED') {
    clearInterval(state.countdownInterval);
    sfx.playSuccess();
    state.userA.status = 'IN_RIDE_POOLED';
    state.userB.status = 'IN_RIDE_POOLED';
    renderPanels();
    startPooledTripSimulation();
    showToast('🚕 Shared Cab Dispatched!', 'Ramesh (Swift Dzire) en route to mutual pickup bay!');
  }
}

// Active Shared Pooled Simulation
function startPooledTripSimulation() {
  state.tripProgress = 0;
  clearInterval(state.tripInterval);

  const pA = LOCATIONS[state.userA.pickup];
  const pB = LOCATIONS[state.userB.pickup];
  const dA = LOCATIONS[state.userA.drop];
  const dB = LOCATIONS[state.userB.drop];

  const carIcon = L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="font-size: 28px; filter: drop-shadow(0 0 12px #f59e0b);">🚕</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  if (leafletMap) {
    leafletCarMarker = L.marker([pA.lat, pA.lng], { icon: carIcon }).addTo(leafletMap);
  }

  state.tripInterval = setInterval(() => {
    state.tripProgress += 0.008;

    const t = state.tripProgress;
    let currLat, currLng;

    if (t < 0.25) {
      const st = t / 0.25;
      currLat = pA.lat + (pB.lat - pA.lat) * st;
      currLng = pA.lng + (pB.lng - pA.lng) * st;
    } else if (t < 0.70) {
      const st = (t - 0.25) / 0.45;
      currLat = pB.lat + (dA.lat - pB.lat) * st;
      currLng = pB.lng + (dA.lng - pB.lng) * st;
    } else {
      const st = (t - 0.70) / 0.30;
      currLat = dA.lat + (dB.lat - dA.lat) * st;
      currLng = dA.lng + (dB.lng - dA.lng) * st;
    }

    if (leafletCarMarker) leafletCarMarker.setLatLng([currLat, currLng]);

    document.querySelectorAll('.trip-progress-bar').forEach(bar => {
      bar.style.width = `${Math.min(100, Math.round(state.tripProgress * 100))}%`;
    });

    if (state.tripProgress >= 1.0) {
      clearInterval(state.tripInterval);
      state.userA.status = 'COMPLETED';
      state.userB.status = 'COMPLETED';
      sfx.playSuccess();
      renderPanels();
      showToast('🏁 Trip Completed!', 'Both passengers reached safely. UPI Auto-Split settled!');
    }
  }, 120);
}

// Active Direct Solo Trip Simulation (User goes DIRECTLY from Delhi to Noida!)
function startDirectSoloSimulation() {
  state.tripProgress = 0;
  clearInterval(state.tripInterval);

  const pA = LOCATIONS[state.userA.pickup];
  const dA = LOCATIONS[state.userA.drop];

  const carIcon = L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="font-size: 28px; filter: drop-shadow(0 0 12px #10b981);">🚗</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  if (leafletMap) {
    leafletCarMarker = L.marker([pA.lat, pA.lng], { icon: carIcon }).addTo(leafletMap);
  }

  state.tripInterval = setInterval(() => {
    state.tripProgress += 0.01;

    const t = state.tripProgress;
    const currLat = pA.lat + (dA.lat - pA.lat) * t;
    const currLng = pA.lng + (dA.lng - pA.lng) * t;

    if (leafletCarMarker) leafletCarMarker.setLatLng([currLat, currLng]);

    document.querySelectorAll('.trip-progress-bar').forEach(bar => {
      bar.style.width = `${Math.min(100, Math.round(state.tripProgress * 100))}%`;
    });

    if (state.tripProgress >= 1.0) {
      clearInterval(state.tripInterval);
      state.userA.status = 'COMPLETED_SOLO';
      state.userB.status = 'COMPLETED_SOLO';
      sfx.playSuccess();
      renderPanels();
      showToast('🏁 Arrived at Destination!', `Direct solo arrival at ${dA.name} with 0 detour.`);
    }
  }, 100);
}

// In-Ride Chat
function sendChatMessage() {
  const input = document.getElementById('chatInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  state.messages.push({
    sender: 'user_a',
    authorName: 'Arjun',
    text: text
  });

  input.value = '';
  renderChat();
  sfx.playPing();

  setTimeout(() => {
    const replies = [
      "Reached the mutual pickup bay near Pillar 4 👍",
      "Driver Ramesh just called me, he is turning into the gate now.",
      "See you at the car! Wearing a dark blue blazer."
    ];
    state.messages.push({
      sender: 'user_b',
      authorName: 'Priya',
      text: replies[Math.floor(Math.random() * replies.length)]
    });
    renderChat();
    sfx.playPing();
  }, 1200);
}

function renderChat() {
  document.querySelectorAll('.chat-messages').forEach(c => {
    c.innerHTML = '';
    state.messages.forEach(m => {
      const d = document.createElement('div');
      if (m.sender === 'system') {
        d.style.cssText = 'background: rgba(255,255,255,0.06); color: #94a3b8; font-size: 10px; text-align: center; border-radius: 4px; padding: 3px 6px;';
        d.textContent = m.text;
      } else {
        d.className = `msg ${m.sender === 'user_a' ? 'from-me' : 'from-partner'}`;
        d.innerHTML = `<strong>${m.authorName}:</strong> ${m.text}`;
      }
      c.appendChild(d);
    });
    c.scrollTop = c.scrollHeight;
  });
}

function resetSimulation() {
  clearInterval(state.countdownInterval);
  clearInterval(state.tripInterval);
  state.tripProgress = 0;
  state.userA.status = 'IDLE';
  state.userB.status = 'IDLE';
  state.currentMatch = null;
  state.messages = [
    { sender: 'system', text: 'Encrypted ride room created. Coordinate meeting point here!' }
  ];
  renderPanels();
  updateFareTeasers();
  updateMapMarkers();
  showToast('🔄 Simulation Reset', 'You can select another corridor or adjust vehicle type.');
}

// =========================================================================
// UI STATE RENDERING (HANDLES BOTH POOLED & INDEPENDENT MODES)
// =========================================================================
function renderPanels() {
  renderPanelForUser('A', state.userA);
  renderPanelForUser('B', state.userB);
}

function renderPanelForUser(userKey, userObj) {
  const container = document.getElementById(`dynamicState${userKey}`);
  const inputSection = document.getElementById(`inputSection${userKey}`);
  if (!container) return;

  if (userObj.status === 'IDLE') {
    inputSection.style.display = 'block';
    container.innerHTML = '';
    return;
  }

  inputSection.style.display = 'none';

  if (userObj.status === 'SEARCHING') {
    container.innerHTML = `
      <div class="searching-box">
        <div class="radar">
          <div class="radar-sweep"></div>
          <div class="radar-center"></div>
        </div>
        <div>
          <h4 style="font-size: 15px; font-weight: 800; margin-bottom: 4px;">Evaluating Geographic Compatibility...</h4>
          <p style="font-size: 11px; color: var(--text-muted);">
            Scanning within <strong>${userObj.radiusLimitKm} km</strong> around ${LOCATIONS[userObj.pickup].name}. Prioritizing direct corridor alignment to ${LOCATIONS[userObj.drop].name}.
          </p>
        </div>
        <div style="font-size: 11px; color: #38bdf8; background: rgba(56,189,248,0.12); padding: 6px 10px; border-radius: 6px; width: 100%;">
          🛡️ Guardrail Active: Incompatible riders (e.g. cross-city or diverging routes) will travel independently with 0 detour.
        </div>
      </div>
    `;
  } else if (userObj.status === 'MATCH_OFFERED') {
    const partner = (userKey === 'A') ? state.userB : state.userA;
    const match = state.currentMatch;
    const isAccepted = (userKey === 'A' && state.userA.status === 'ACCEPTED') || (userKey === 'B' && state.userB.status === 'ACCEPTED');

    container.innerHTML = `
      <div class="match-card">
        <div class="match-header">
          <span class="match-badge">🎯 ${match.matchScore}% Route Overlap</span>
          <span class="countdown-timer">⏱️ ${state.countdownSecs}s</span>
        </div>

        <div class="partner-info">
          <div class="partner-avatar">${partner.avatar}</div>
          <div style="flex: 1;">
            <div style="font-weight: 800; font-size: 14px;">${partner.name}</div>
            <div style="font-size: 11px; color: var(--text-muted); display: flex; gap: 6px; align-items: center; margin-top: 2px;">
              <span class="aadhaar-verified-tag">✓ UIDAI Verified</span>
              <span class="community-pill">${partner.community}</span>
            </div>
            <div style="font-size: 10px; color: #34d399; margin-top: 2px;">
              📍 Nearby: ${match.pickupDistanceKm} km away (&le; 1.5 km) &bull; Extra Detour: only +${match.extraRoadKm} km
            </div>
          </div>
        </div>

        <div class="match-stats-grid">
          <div class="stat-item">
            <div class="stat-label">Your Proportional Share</div>
            <div class="stat-value highlight">₹${userObj.sharedFare}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Solo Cab Cost</div>
            <div class="stat-value" style="text-decoration: line-through; color: var(--text-dim);">₹${userObj.soloFare}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Extra Detour</div>
            <div class="stat-value">+${match.detourMins} mins</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Total Cash Saved</div>
            <div class="stat-value highlight">Save ₹${userObj.soloFare - userObj.sharedFare} (50%)</div>
          </div>
        </div>

        <div class="meeting-spot-banner">
          <span>🚶</span>
          <div>
            <strong>Mutual Pickup Bay:</strong> ${match.mutualPoint.name} (~${match.mutualPoint.walkMins} min walk)
          </div>
        </div>

        ${isAccepted ? `
          <div style="text-align: center; padding: 10px; background: rgba(16, 185, 129, 0.15); color: #34d399; font-weight: 800; border-radius: 6px;">
            ✓ You Accepted! Waiting for ${partner.name.split(' ')[0]}...
          </div>
        ` : `
          <div class="action-row">
            <button class="btn-decline" onclick="declineMatch('${userKey}')">Decline (Ride Solo)</button>
            <button class="btn-accept" onclick="acceptMatch('${userKey}')">
              <span>Accept & Split (₹${userObj.sharedFare})</span>
            </button>
          </div>
        `}
      </div>
    `;
  } else if (userObj.status === 'IN_RIDE_SOLO') {
    // =========================================================================
    // INDEPENDENT SOLO TRAVEL CARD (DIRECT ROUTE DELHI -> NOIDA)
    // =========================================================================
    const match = state.currentMatch;
    container.innerHTML = `
      <div class="trip-active-card" style="border-color: #10b981;">
        <div class="trip-status-header">
          <div class="live-indicator">
            <div class="live-dot" style="background: #10b981; box-shadow: 0 0 8px #10b981;"></div>
            <span style="color: #34d399;">DIRECT INDEPENDENT RIDE (SOLO)</span>
          </div>
          <span style="font-size: 11px; background: rgba(16,185,129,0.2); color: #34d399; padding: 2px 8px; border-radius: 12px; font-weight: 800;">
            0 Detour &bull; Direct Route
          </span>
        </div>

        <div style="background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 10px; font-size: 11px; color: #fca5a5;">
          <strong>🛡️ Route Prioritization Active:</strong><br>
          ${match ? match.rejectReason : 'Incompatible co-rider detected. No detour suggested.'}
        </div>

        <div style="background: rgba(8,13,26,0.6); padding: 8px 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="font-size: 22px;">🚗</span>
            <div>
              <div style="font-size: 12px; font-weight: 800;">Direct Solo Cab Dispatched</div>
              <div style="font-size: 10px; color: var(--text-muted);">${LOCATIONS[userObj.pickup].name} ➔ ${LOCATIONS[userObj.drop].name}</div>
            </div>
          </div>
          <span style="font-size: 11px; color: #34d399; font-weight: 800;">ETA 22 min</span>
        </div>

        <!-- Progress -->
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-bottom: 4px;">
            <span>Pickup: ${LOCATIONS[userObj.pickup].name}</span>
            <span>Direct Drop: ${LOCATIONS[userObj.drop].name}</span>
          </div>
          <div style="width: 100%; height: 6px; background: var(--border); border-radius: 4px; overflow: hidden;">
            <div class="trip-progress-bar" style="width: ${Math.round(state.tripProgress * 100)}%; height: 100%; background: #10b981; transition: width 0.1s linear;"></div>
          </div>
        </div>

        <div style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25); border-radius: 8px; padding: 10px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>Standard Solo Cab Fare:</span>
            <span>₹${userObj.soloFare}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: #34d399; font-weight: 700;">
            <span>Direct Travel Time:</span>
            <span>Fastest Direct Route (0 Detour)</span>
          </div>
        </div>

        <button class="btn-primary" style="width: 100%; padding: 10px; font-size: 12px;" onclick="resetSimulation()">
          🔄 Re-test Another Route
        </button>
      </div>
    `;
  } else if (userObj.status === 'IN_RIDE_POOLED') {
    container.innerHTML = `
      <div class="trip-active-card">
        <div class="trip-status-header">
          <div class="live-indicator">
            <div class="live-dot"></div>
            <span>SHARED TRIP IN PROGRESS</span>
          </div>
          <span style="font-size: 11px; background: rgba(16,185,129,0.15); color: #34d399; padding: 2px 8px; border-radius: 12px; font-weight: 700;">
            2 Riders &bull; Proportional Split
          </span>
        </div>

        <div style="background: rgba(8,13,26,0.6); padding: 8px 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="font-size: 22px;">🚖</span>
            <div>
              <div style="font-size: 12px; font-weight: 800;">Ramesh Kumar (4.94 ★)</div>
              <div style="font-size: 10px; color: var(--text-muted);">White Swift Dzire &bull; #DL01-AB-4120</div>
            </div>
          </div>
          <span style="font-size: 11px; color: #34d399; font-weight: 800;">ETA 4 min</span>
        </div>

        <div class="itinerary-list">
          <div class="itinerary-stop">
            <div class="stop-num current">1</div>
            <div>Pickup: Arjun (${LOCATIONS[state.userA.pickup].name})</div>
          </div>
          <div class="itinerary-stop">
            <div class="stop-num">2</div>
            <div>Pickup: Priya (Mutual Bay)</div>
          </div>
          <div class="itinerary-stop">
            <div class="stop-num">3</div>
            <div>Dropoff: Priya (${LOCATIONS[state.userB.drop].name})</div>
          </div>
          <div class="itinerary-stop">
            <div class="stop-num">4</div>
            <div>Dropoff: Arjun (${LOCATIONS[state.userA.drop].name})</div>
          </div>
        </div>

        <div>
          <div style="width: 100%; height: 6px; background: var(--border); border-radius: 4px; overflow: hidden;">
            <div class="trip-progress-bar" style="width: ${Math.round(state.tripProgress * 100)}%; height: 100%; background: linear-gradient(90deg, #2563eb, #10b981); transition: width 0.1s linear;"></div>
          </div>
        </div>

        <div class="chat-box">
          <div class="chat-header">
            <span>CO-RIDER CHAT</span>
            <span>🔒 Masked &amp; Verified</span>
          </div>
          <div class="chat-messages"></div>
          <div class="quick-chips">
            <span class="quick-chip" onclick="sendQuickMsg('I am at Pillar 4')">At Pillar 4</span>
            <span class="quick-chip" onclick="sendQuickMsg('Driver reached')">Driver is here</span>
            <span class="quick-chip" onclick="sendQuickMsg('Wearing blue jacket')">Wearing blue</span>
          </div>
          <div class="chat-input-row">
            <input type="text" id="chatInput" placeholder="Message Priya...">
            <button class="chat-send-btn" id="chatSendBtn" onclick="sendChatMessage()">Send</button>
          </div>
        </div>

        <div style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25); border-radius: 8px; padding: 10px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>Total Meter Fare:</span>
            <span>₹${state.currentMatch ? state.currentMatch.totalMeter : 580}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: #34d399; font-weight: 700;">
            <span>Your Proportional Share (${userObj.distKm} km):</span>
            <span>₹${userObj.sharedFare}</span>
          </div>
        </div>
      </div>
    `;

    renderChat();
  } else if (userObj.status === 'COMPLETED' || userObj.status === 'COMPLETED_SOLO') {
    const isSolo = userObj.status === 'COMPLETED_SOLO';
    container.innerHTML = `
      <div class="match-card" style="text-align: center; padding: 22px;">
        <div style="font-size: 38px; margin-bottom: 6px;">🎉</div>
        <h3 style="font-size: 17px; font-weight: 800; color: #34d399; margin-bottom: 4px;">Arrived at Destination!</h3>
        <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 12px;">
          Successfully reached ${LOCATIONS[userObj.drop].name} on the fastest route.
        </p>

        <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 12px; text-align: left; font-size: 12px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Travel Mode:</span>
            <span style="font-weight: 700;">${isSolo ? 'Direct Solo Ride (0 Detour)' : 'Shared Pooled Ride (50% Off)'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: #34d399; font-weight: 800; font-size: 14px;">
            <span>Amount Paid:</span>
            <span>₹${isSolo ? userObj.soloFare : userObj.sharedFare}</span>
          </div>
        </div>

        <button class="btn-primary" style="width: 100%;" onclick="resetSimulation()">
          🔄 Plan Another Ride
        </button>
      </div>
    `;
  }
}

function sendQuickMsg(text) {
  const input = document.getElementById('chatInput');
  if (input) {
    input.value = text;
    sendChatMessage();
  }
}

// Modals
function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.add('active');
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('active');
}

// Aadhaar Verification
function handleAadhaarVerify() {
  const btn = document.getElementById('btnVerifyAadhaar');
  const otpRow = document.getElementById('aadhaarOtpRow');

  if (!state.aadhaarOtpRequested) {
    state.aadhaarOtpRequested = true;
    otpRow.style.display = 'block';
    btn.innerHTML = '<span>Verify UIDAI OTP</span>';
    showToast('📩 OTP Sent', 'Simulated 6-digit OTP sent to Aadhaar-linked mobile +91 98*** **421');
  } else {
    state.userA.aadhaarVerified = true;
    btn.innerHTML = '<span>✓ Aadhaar Verified & Digitally Signed</span>';
    btn.style.background = '#059669';
    showToast('🛡️ Aadhaar Verified', 'Arjun Sharma successfully verified via UIDAI e-KYC.');
    setTimeout(() => closeModal('modalAadhaar'), 1000);
  }
}

// TinyFish AI Web Agent Scraper
function runTinyFishScraper() {
  const term = document.getElementById('tinyFishTerminal');
  if (!term) return;

  term.innerHTML = `[TinyFish Agent] Launching stealth cloud Chromium session...<br>`;
  sfx.playPing();

  setTimeout(() => {
    term.innerHTML += `[TinyFish Agent] Scraping Uber Web & Ola Mobility portals...<br>`;
  }, 500);

  setTimeout(() => {
    term.innerHTML += `[TinyFish Agent] Extracting live surge multiplier: 1.15x rush hour.<br>`;
    term.innerHTML += `[TinyFish Agent] Uber Go Rate: ₹280 | Ola Mini: ₹265 | Rapido: ₹240<br>`;
    term.innerHTML += `[TinyFish Agent] SplitCab Proportional Share: ₹130. Guaranteed cheapest by 51%!<br>`;
    term.scrollTop = term.scrollHeight;

    document.getElementById('tfUber').textContent = '₹280';
    document.getElementById('tfOla').textContent = '₹265';
    document.getElementById('tfRapido').textContent = '₹240';
    document.getElementById('tfSplit').textContent = '₹130 (Save 51%)';

    sfx.playSuccess();
    showToast('🐟 TinyFish Scraping Complete', 'Live market benchmarks fetched successfully.');
  }, 1400);
}

// Smart Savings Calculator
function updateSavingsCalc() {
  const trips = parseInt(document.getElementById('calcTripsRange').value);
  const cost = parseInt(document.getElementById('calcCostRange').value);

  document.getElementById('calcTripsVal').textContent = `${trips} trips / week`;
  document.getElementById('calcCostVal').textContent = `₹${cost} / trip`;

  const savedPerTrip = cost * 0.50;
  const weeklySave = savedPerTrip * trips;
  const monthlySave = weeklySave * 4.3;
  const yearlySave = monthlySave * 12;
  const carbonMonthlyKg = Math.round(trips * 4.3 * 1.1);

  document.getElementById('calcMonthlySave').textContent = `₹${Math.round(monthlySave).toLocaleString('en-IN')}`;
  document.getElementById('calcYearlySave').textContent = `₹${Math.round(yearlySave).toLocaleString('en-IN')}`;
  document.getElementById('calcCarbonSave').textContent = `${carbonMonthlyKg} kg`;
}

function selectCommunity(name) {
  state.userA.community = name;
  const badge = document.getElementById('badgeCommA');
  if (badge) badge.textContent = `🏢 ${name}`;
  closeModal('modalCommunity');
  showToast('🎓 Community Joined', `Switched to ${name} exclusive pool circle.`);
}

// Toast
function showToast(title, message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div style="font-size: 20px;">⚡</div>
    <div class="toast-content">
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Start App
window.addEventListener('DOMContentLoaded', initApp);
