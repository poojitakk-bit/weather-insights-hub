import { LOCATIONS } from "./mock-data";

export interface SearchPlace {
  id: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  covered: boolean;
  /** Nearest modelled city used as a proxy when this place has no direct coverage. */
  proxyId?: string;
  proxyCity?: string;
  proxyKm?: number;
}

/** Extra searchable Indian cities without direct model coverage in this prototype. */
const UNCOVERED: { id: string; city: string; state: string; lat: number; lng: number }[] = [
  { id: "hyderabad", city: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867 },
  { id: "pune", city: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { id: "jaipur", city: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873 },
  { id: "lucknow", city: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
  { id: "bhubaneswar", city: "Bhubaneswar", state: "Odisha", lat: 20.2961, lng: 85.8245 },
  { id: "surat", city: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311 },
  { id: "nagpur", city: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882 },
  { id: "visakhapatnam", city: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185 },
  { id: "dehradun", city: "Dehradun", state: "Uttarakhand", lat: 30.3165, lng: 78.0322 },
  { id: "raipur", city: "Raipur", state: "Chhattisgarh", lat: 21.2514, lng: 81.6296 },
  { id: "shillong", city: "Shillong", state: "Meghalaya", lat: 25.5788, lng: 91.8933 },
  { id: "agartala", city: "Agartala", state: "Tripura", lat: 23.8315, lng: 91.2868 },
  { id: "thiruvananthapuram", city: "Thiruvananthapuram", state: "Kerala", lat: 8.5241, lng: 76.9366 },
  { id: "kozhikode", city: "Kozhikode", state: "Kerala", lat: 11.2588, lng: 75.7804 },
  { id: "thrissur", city: "Thrissur", state: "Kerala", lat: 10.5276, lng: 76.2144 },
  { id: "alappuzha", city: "Alappuzha", state: "Kerala", lat: 9.4981, lng: 76.3388 },
  { id: "madurai", city: "Madurai", state: "Tamil Nadu", lat: 9.9252, lng: 78.1198 },
  { id: "coimbatore", city: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558 },
  { id: "tiruchirappalli", city: "Tiruchirappalli", state: "Tamil Nadu", lat: 10.7905, lng: 78.7047 },
  { id: "cuddalore", city: "Cuddalore", state: "Tamil Nadu", lat: 11.748, lng: 79.7714 },
  { id: "salem", city: "Salem", state: "Tamil Nadu", lat: 11.6643, lng: 78.146 },
  { id: "vellore", city: "Vellore", state: "Tamil Nadu", lat: 12.9165, lng: 79.1325 },
  { id: "mysuru", city: "Mysuru", state: "Karnataka", lat: 12.2958, lng: 76.6394 },
  { id: "mangaluru", city: "Mangaluru", state: "Karnataka", lat: 12.9141, lng: 74.856 },
  { id: "hubballi", city: "Hubballi", state: "Karnataka", lat: 15.3647, lng: 75.124 },
  { id: "belagavi", city: "Belagavi", state: "Karnataka", lat: 15.8497, lng: 74.4977 },
  { id: "vijayawada", city: "Vijayawada", state: "Andhra Pradesh", lat: 16.5062, lng: 80.648 },
  { id: "guntur", city: "Guntur", state: "Andhra Pradesh", lat: 16.3067, lng: 80.4365 },
  { id: "tirupati", city: "Tirupati", state: "Andhra Pradesh", lat: 13.6288, lng: 79.4192 },
  { id: "rajahmundry", city: "Rajahmundry", state: "Andhra Pradesh", lat: 17.0005, lng: 81.804 },
  { id: "nellore", city: "Nellore", state: "Andhra Pradesh", lat: 14.4426, lng: 79.9865 },
  { id: "warangal", city: "Warangal", state: "Telangana", lat: 17.9689, lng: 79.5941 },
  { id: "karimnagar", city: "Karimnagar", state: "Telangana", lat: 18.4386, lng: 79.1288 },
  { id: "nashik", city: "Nashik", state: "Maharashtra", lat: 19.9975, lng: 73.7898 },
  { id: "thane", city: "Thane", state: "Maharashtra", lat: 19.2183, lng: 72.9781 },
  { id: "navi-mumbai", city: "Navi Mumbai", state: "Maharashtra", lat: 19.033, lng: 73.0297 },
  { id: "kolhapur", city: "Kolhapur", state: "Maharashtra", lat: 16.705, lng: 74.2433 },
  { id: "sangli", city: "Sangli", state: "Maharashtra", lat: 16.8524, lng: 74.5815 },
  { id: "aurangabad", city: "Chhatrapati Sambhajinagar", state: "Maharashtra", lat: 19.8762, lng: 75.3433 },
  { id: "solapur", city: "Solapur", state: "Maharashtra", lat: 17.6599, lng: 75.9064 },
  { id: "ratnagiri", city: "Ratnagiri", state: "Maharashtra", lat: 16.9902, lng: 73.312 },
  { id: "panaji", city: "Panaji", state: "Goa", lat: 15.4909, lng: 73.8278 },
  { id: "vadodara", city: "Vadodara", state: "Gujarat", lat: 22.3072, lng: 73.1812 },
  { id: "rajkot", city: "Rajkot", state: "Gujarat", lat: 22.3039, lng: 70.8022 },
  { id: "bhavnagar", city: "Bhavnagar", state: "Gujarat", lat: 21.7645, lng: 72.1519 },
  { id: "jamnagar", city: "Jamnagar", state: "Gujarat", lat: 22.4707, lng: 70.0577 },
  { id: "gandhinagar", city: "Gandhinagar", state: "Gujarat", lat: 23.2156, lng: 72.6369 },
  { id: "bhuj", city: "Bhuj", state: "Gujarat", lat: 23.242, lng: 69.6669 },
  { id: "udaipur", city: "Udaipur", state: "Rajasthan", lat: 24.5854, lng: 73.7125 },
  { id: "jodhpur", city: "Jodhpur", state: "Rajasthan", lat: 26.2389, lng: 73.0243 },
  { id: "kota", city: "Kota", state: "Rajasthan", lat: 25.2138, lng: 75.8648 },
  { id: "ajmer", city: "Ajmer", state: "Rajasthan", lat: 26.4499, lng: 74.6399 },
  { id: "bikaner", city: "Bikaner", state: "Rajasthan", lat: 28.0229, lng: 73.3119 },
  { id: "indore", city: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577 },
  { id: "bhopal", city: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126 },
  { id: "jabalpur", city: "Jabalpur", state: "Madhya Pradesh", lat: 23.1815, lng: 79.9864 },
  { id: "gwalior", city: "Gwalior", state: "Madhya Pradesh", lat: 26.2183, lng: 78.1828 },
  { id: "ujjain", city: "Ujjain", state: "Madhya Pradesh", lat: 23.1793, lng: 75.7849 },
  { id: "bilaspur", city: "Bilaspur", state: "Chhattisgarh", lat: 22.0797, lng: 82.1409 },
  { id: "kanpur", city: "Kanpur", state: "Uttar Pradesh", lat: 26.4499, lng: 80.3319 },
  { id: "varanasi", city: "Varanasi", state: "Uttar Pradesh", lat: 25.3176, lng: 82.9739 },
  { id: "prayagraj", city: "Prayagraj", state: "Uttar Pradesh", lat: 25.4358, lng: 81.8463 },
  { id: "agra", city: "Agra", state: "Uttar Pradesh", lat: 27.1767, lng: 78.0081 },
  { id: "gorakhpur", city: "Gorakhpur", state: "Uttar Pradesh", lat: 26.7606, lng: 83.3732 },
  { id: "meerut", city: "Meerut", state: "Uttar Pradesh", lat: 28.9845, lng: 77.7064 },
  { id: "noida", city: "Noida", state: "Uttar Pradesh", lat: 28.5355, lng: 77.391 },
  { id: "ghaziabad", city: "Ghaziabad", state: "Uttar Pradesh", lat: 28.6692, lng: 77.4538 },
  { id: "bareilly", city: "Bareilly", state: "Uttar Pradesh", lat: 28.367, lng: 79.4304 },
  { id: "ayodhya", city: "Ayodhya", state: "Uttar Pradesh", lat: 26.7922, lng: 82.1998 },
  { id: "muzaffarpur", city: "Muzaffarpur", state: "Bihar", lat: 26.1209, lng: 85.3647 },
  { id: "darbhanga", city: "Darbhanga", state: "Bihar", lat: 26.1542, lng: 85.8918 },
  { id: "bhagalpur", city: "Bhagalpur", state: "Bihar", lat: 25.2425, lng: 86.9842 },
  { id: "gaya", city: "Gaya", state: "Bihar", lat: 24.7955, lng: 85.0002 },
  { id: "ranchi", city: "Ranchi", state: "Jharkhand", lat: 23.3441, lng: 85.3096 },
  { id: "jamshedpur", city: "Jamshedpur", state: "Jharkhand", lat: 22.8046, lng: 86.2029 },
  { id: "dhanbad", city: "Dhanbad", state: "Jharkhand", lat: 23.7957, lng: 86.4304 },
  { id: "cuttack", city: "Cuttack", state: "Odisha", lat: 20.4625, lng: 85.8828 },
  { id: "puri", city: "Puri", state: "Odisha", lat: 19.8135, lng: 85.8312 },
  { id: "balasore", city: "Balasore", state: "Odisha", lat: 21.4934, lng: 86.9335 },
  { id: "sambalpur", city: "Sambalpur", state: "Odisha", lat: 21.4669, lng: 83.9812 },
  { id: "howrah", city: "Howrah", state: "West Bengal", lat: 22.5958, lng: 88.2636 },
  { id: "siliguri", city: "Siliguri", state: "West Bengal", lat: 26.7271, lng: 88.3953 },
  { id: "durgapur", city: "Durgapur", state: "West Bengal", lat: 23.5204, lng: 87.3119 },
  { id: "asansol", city: "Asansol", state: "West Bengal", lat: 23.6739, lng: 86.9524 },
  { id: "malda", city: "Malda", state: "West Bengal", lat: 25.0119, lng: 88.1433 },
  { id: "dibrugarh", city: "Dibrugarh", state: "Assam", lat: 27.4728, lng: 94.912 },
  { id: "silchar", city: "Silchar", state: "Assam", lat: 24.8333, lng: 92.7789 },
  { id: "jorhat", city: "Jorhat", state: "Assam", lat: 26.7509, lng: 94.2037 },
  { id: "imphal", city: "Imphal", state: "Manipur", lat: 24.817, lng: 93.9368 },
  { id: "aizawl", city: "Aizawl", state: "Mizoram", lat: 23.7271, lng: 92.7176 },
  { id: "kohima", city: "Kohima", state: "Nagaland", lat: 25.6751, lng: 94.11 },
  { id: "itanagar", city: "Itanagar", state: "Arunachal Pradesh", lat: 27.0844, lng: 93.6053 },
  { id: "gangtok", city: "Gangtok", state: "Sikkim", lat: 27.3314, lng: 88.6138 },
  { id: "shimla", city: "Shimla", state: "Himachal Pradesh", lat: 31.1048, lng: 77.1734 },
  { id: "mandi", city: "Mandi", state: "Himachal Pradesh", lat: 31.7084, lng: 76.9319 },
  { id: "chandigarh", city: "Chandigarh", state: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { id: "ludhiana", city: "Ludhiana", state: "Punjab", lat: 30.901, lng: 75.8573 },
  { id: "amritsar", city: "Amritsar", state: "Punjab", lat: 31.634, lng: 74.8723 },
  { id: "jalandhar", city: "Jalandhar", state: "Punjab", lat: 31.326, lng: 75.5762 },
  { id: "gurugram", city: "Gurugram", state: "Haryana", lat: 28.4595, lng: 77.0266 },
  { id: "faridabad", city: "Faridabad", state: "Haryana", lat: 28.4089, lng: 77.3178 },
  { id: "hisar", city: "Hisar", state: "Haryana", lat: 29.1492, lng: 75.7217 },
  { id: "haridwar", city: "Haridwar", state: "Uttarakhand", lat: 29.9457, lng: 78.1642 },
  { id: "nainital", city: "Nainital", state: "Uttarakhand", lat: 29.3919, lng: 79.4542 },
  { id: "jammu", city: "Jammu", state: "Jammu and Kashmir", lat: 32.7266, lng: 74.857 },
  { id: "leh", city: "Leh", state: "Ladakh", lat: 34.1526, lng: 77.5771 },
  { id: "port-blair", city: "Port Blair", state: "Andaman & Nicobar", lat: 11.6234, lng: 92.7265 },
  { id: "puducherry", city: "Puducherry", state: "Puducherry", lat: 11.9416, lng: 79.8083 },
];

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Nearest modelled (covered) city to any point in India. */
export function nearestModelled(point: { lat: number; lng: number }) {
  let best = LOCATIONS[0]!;
  let bestKm = Infinity;
  for (const l of LOCATIONS) {
    const km = haversineKm(point, l);
    if (km < bestKm) {
      bestKm = km;
      best = l;
    }
  }
  return { location: best, km: Math.round(bestKm) };
}

export const SEARCH_PLACES: SearchPlace[] = [
  ...LOCATIONS.map((l) => ({
    id: l.id,
    city: l.city,
    state: l.state,
    lat: l.lat,
    lng: l.lng,
    covered: true,
  })),
  ...UNCOVERED.map((p) => {
    const { location, km } = nearestModelled(p);
    return {
      ...p,
      covered: false,
      proxyId: location.id,
      proxyCity: location.city,
      proxyKm: km,
    };
  }),
];

export function searchPlaces(query: string, limit = 8): SearchPlace[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = SEARCH_PLACES.filter(
    (p) => p.city.toLowerCase().includes(q) || p.state.toLowerCase().includes(q),
  ).map((p) => ({
    p,
    rank:
      (p.city.toLowerCase().startsWith(q) ? 0 : p.city.toLowerCase().includes(q) ? 1 : 2) -
      (p.covered ? 0.5 : 0),
  }));
  return scored
    .sort((a, b) => a.rank - b.rank || a.p.city.localeCompare(b.p.city))
    .slice(0, limit)
    .map((s) => s.p);
}
