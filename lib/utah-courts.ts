export type UtahCourt = {
  courthouseCity: string;
  county: string;
  district: string;
};

export const utahCourts: UtahCourt[] = [
  { courthouseCity: "Brigham City", county: "Box Elder", district: "First" },
  { courthouseCity: "Logan", county: "Cache", district: "First" },
  { courthouseCity: "Randolph", county: "Rich", district: "First" },
  { courthouseCity: "Farmington", county: "Davis", district: "Second" },
  { courthouseCity: "Morgan", county: "Morgan", district: "Second" },
  { courthouseCity: "Ogden", county: "Weber", district: "Second" },
  { courthouseCity: "Park City", county: "Summit", district: "Third" },
  { courthouseCity: "Salt Lake City", county: "Salt Lake", district: "Third" },
  { courthouseCity: "West Jordan", county: "Salt Lake", district: "Third" },
  { courthouseCity: "Tooele", county: "Tooele", district: "Third" },
  { courthouseCity: "Provo", county: "Utah", district: "Fourth" },
  { courthouseCity: "American Fork", county: "Utah", district: "Fourth" },
  { courthouseCity: "Heber", county: "Wasatch", district: "Fourth" },
  { courthouseCity: "Nephi", county: "Juab", district: "Fourth" },
  { courthouseCity: "Fillmore", county: "Millard", district: "Fourth" },
  { courthouseCity: "Beaver", county: "Beaver", district: "Fifth" },
  { courthouseCity: "Cedar City", county: "Iron", district: "Fifth" },
  { courthouseCity: "St. George", county: "Washington", district: "Fifth" },
  { courthouseCity: "Junction", county: "Piute", district: "Sixth" },
  { courthouseCity: "Kanab", county: "Kane", district: "Sixth" },
  { courthouseCity: "Loa", county: "Wayne", district: "Sixth" },
  { courthouseCity: "Manti", county: "Sanpete", district: "Sixth" },
  { courthouseCity: "Panguitch", county: "Garfield", district: "Sixth" },
  { courthouseCity: "Richfield", county: "Sevier", district: "Sixth" },
  { courthouseCity: "Castle Dale", county: "Emery", district: "Seventh" },
  { courthouseCity: "Moab", county: "Grand", district: "Seventh" },
  { courthouseCity: "Monticello", county: "San Juan", district: "Seventh" },
  { courthouseCity: "Price", county: "Carbon", district: "Seventh" },
  { courthouseCity: "Duchesne", county: "Duchesne", district: "Eighth" },
  { courthouseCity: "Manila", county: "Daggett", district: "Eighth" },
  { courthouseCity: "Roosevelt", county: "Duchesne", district: "Eighth" },
  { courthouseCity: "Vernal", county: "Uintah", district: "Eighth" }
];

export const utahCourtOptions = utahCourts.map((court) => court.courthouseCity);

export function findUtahCourt(courthouseCity: string) {
  return utahCourts.find((court) => court.courthouseCity === courthouseCity);
}
