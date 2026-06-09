const Location = require('../models/Location');

/**
 * Dummy village & stoppage data for testing (Bengali labels).
 * distanceIndex is used to estimate fare between stoppages.
 */
const INITIAL_VILLAGES = [
  {
    id: 'karatia',
    nameBn: 'করাটিয়া',
    distances: {
      'guskara': 10,
      'shimulgram': 15,
      'ausgram': 20,
      'bonnabgram': 25
    },
    stoppages: [
      {
        id: 'karatia-school-more',
        nameBn: 'করাটিয়া স্কুল মোড়',
        distanceIndex: 1,
        latitude: 23.4521,
        longitude: 88.1234
      },
      {
        id: 'karatia-bazar',
        nameBn: 'করাটিয়া বাজার',
        distanceIndex: 2,
        latitude: 23.4589,
        longitude: 88.1298
      }
    ]
  },
  {
    id: 'guskara',
    nameBn: 'গুসকরা',
    distances: {
      'karatia': 10,
      'shimulgram': 8,
      'ausgram': 10,
      'bonnabgram': 12
    },
    stoppages: [
      {
        id: 'guskara-clg',
        nameBn: 'গুসকরা কলেজ',
        distanceIndex: 5,
        latitude: 23.5012,
        longitude: 88.2045
      },
      {
        id: 'guskara-more',
        nameBn: 'গুসকরা মোড়',
        distanceIndex: 6,
        latitude: 23.5087,
        longitude: 88.2110
      }
    ]
  },
  {
    id: 'shimulgram',
    nameBn: 'শিমুলগ্রাম',
    distances: {
      'karatia': 15,
      'guskara': 8,
      'ausgram': 18,
      'bonnabgram': 20
    },
    stoppages: [
      {
        id: 'shimulgram-bus-stand',
        nameBn: 'শিমুলগ্রাম বাস স্ট্যান্ড',
        distanceIndex: 9,
        latitude: 23.5340,
        longitude: 88.2560
      },
      {
        id: 'shimulgram-pump',
        nameBn: 'শিমুলগ্রাম পেট্রোল পাম্প',
        distanceIndex: 10,
        latitude: 23.5395,
        longitude: 88.2612
      }
    ]
  },
  {
    id: 'ausgram',
    nameBn: 'আউশগ্রাম',
    distances: {
      'karatia': 20,
      'guskara': 10,
      'shimulgram': 18,
      'bonnabgram': 5
    },
    stoppages: [
      {
        id: 'ausgram-stand',
        nameBn: 'আউশগ্রাম স্ট্যান্ড',
        distanceIndex: 11,
        latitude: 23.5500,
        longitude: 88.2700
      }
    ]
  },
  {
    id: 'bonnabgram',
    nameBn: 'বননবগ্রাম',
    distances: {
      'karatia': 25,
      'guskara': 12,
      'shimulgram': 20,
      'ausgram': 5
    },
    stoppages: [
      {
        id: 'bonnabgram-stand',
        nameBn: 'বননবগ্রাম স্ট্যান্ড',
        distanceIndex: 12,
        latitude: 23.5600,
        longitude: 88.2800
      }
    ]
  }
];

async function seedLocations() {
  try {
    const count = await Location.countDocuments();
    if (count === 0) {
      await Location.insertMany(INITIAL_VILLAGES);
      console.log('Seeded initial locations to MongoDB');
    }
  } catch (error) {
    console.error('Error seeding locations:', error);
  }
}

async function getAllVillages() {
  const villages = await Location.find().sort({ _id: 1 }).lean();
  return villages.map(({ id, nameBn, stoppages, distances }) => ({
    id,
    nameBn,
    distances: distances || {},
    stoppages: stoppages.map(({ id, nameBn, distanceIndex }) => ({
      id,
      nameBn,
      distanceIndex
    }))
  }));
}

async function addVillage(nameBn) {
  const newId = 'village-' + Date.now();
  const newVillage = {
    id: newId,
    nameBn: nameBn,
    stoppages: []
  };
  await Location.create(newVillage);
  return newVillage;
}

async function addStoppageToVillage(villageId, nameBn) {
  const village = await Location.findOne({ id: villageId });
  if (!village) throw new Error('Village not found');

  const newId = villageId + '-' + Date.now();
  const newStoppage = {
    id: newId,
    nameBn: nameBn,
    distanceIndex: village.stoppages.length > 0 ? village.stoppages[village.stoppages.length - 1].distanceIndex + 1 : 1,
    latitude: 0,
    longitude: 0
  };
  village.stoppages.push(newStoppage);
  await village.save();
  return newStoppage;
}

async function findStoppage(stoppageId) {
  const village = await Location.findOne({ 'stoppages.id': stoppageId }).lean();
  if (village) {
    const stoppage = village.stoppages.find(s => s.id === stoppageId);
    if (stoppage) return { village, stoppage };
  }
  return null;
}

function formatLocationAddress(villageBn, stoppageBn, landmark) {
  let address = `${stoppageBn}, ${villageBn}`;
  if (landmark && landmark.trim()) {
    address += ` (${landmark.trim()})`;
  }
  return address;
}

async function calculateDistanceKm(pickupStoppageId, dropoffStoppageId) {
  const pickup = await findStoppage(pickupStoppageId);
  const dropoff = await findStoppage(dropoffStoppageId);

  if (!pickup || !dropoff) return 0;
  
  // If pickup and dropoff are in the exact same village, fix distance to 1 km
  if (pickup.village.id === dropoff.village.id) {
    return 1;
  }

  const allVillages = await Location.find({}, { id: 1 }).sort({ _id: 1 }).lean();
  const villageIds = allVillages.map(v => v.id);
  const pickupVillageIdx = villageIds.indexOf(pickup.village.id);
  const dropoffVillageIdx = villageIds.indexOf(dropoff.village.id);

  const indexDiff = Math.abs(pickupVillageIdx - dropoffVillageIdx);
  return Number(Math.max(1, indexDiff).toFixed(1));
}

async function buildLocationFromVillage(villageId, landmark) {
  const village = await Location.findOne({ id: villageId }).lean();
  if (!village) return null;

  const location = {
    address: village.nameBn + (landmark && landmark.trim() ? ` (${landmark.trim()})` : ''),
    villageId: village.id,
    villageName: village.nameBn,
    stoppageId: village.stoppages?.[0]?.id || village.id,
    stoppageName: village.stoppages?.[0]?.nameBn || village.nameBn,
    latitude: village.stoppages?.[0]?.latitude || 0,
    longitude: village.stoppages?.[0]?.longitude || 0
  };

  if (landmark && landmark.trim()) location.landmark = landmark.trim();
  return location;
}

async function calculateDistanceKmByVillage(pickupVillageId, dropoffVillageId) {
  if (pickupVillageId === dropoffVillageId) return 1;

  const pickupVillage = await Location.findOne({ id: pickupVillageId }).lean();
  if (pickupVillage && pickupVillage.distances && pickupVillage.distances[dropoffVillageId]) {
    return pickupVillage.distances[dropoffVillageId];
  }

  const allVillages = await Location.find({}, { id: 1 }).sort({ _id: 1 }).lean();
  const villageIds = allVillages.map(v => v.id);
  const pickupVillageIdx = villageIds.indexOf(pickupVillageId);
  const dropoffVillageIdx = villageIds.indexOf(dropoffVillageId);

  const indexDiff = Math.abs(pickupVillageIdx - dropoffVillageIdx);
  return Number(Math.max(1, indexDiff * 5).toFixed(1));
}

module.exports = {
  seedLocations,
  getAllVillages,
  addVillage,
  addStoppageToVillage,
  findStoppage,
  formatLocationAddress,
  calculateDistanceKm,
  buildLocationFromVillage,
  calculateDistanceKmByVillage
};
