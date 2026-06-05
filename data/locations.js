/**
 * Dummy village & stoppage data for testing (Bengali labels).
 * distanceIndex is used to estimate fare between stoppages.
 */
const VILLAGES = [
  {
    id: 'karatia',
    nameBn: 'করাটিয়া',
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
  }
];

function getAllVillages() {
  return VILLAGES.map(({ id, nameBn, stoppages }) => ({
    id,
    nameBn,
    stoppages: stoppages.map(({ id, nameBn, distanceIndex }) => ({
      id,
      nameBn,
      distanceIndex
    }))
  }));
}

function findStoppage(stoppageId) {
  for (const village of VILLAGES) {
    const stoppage = village.stoppages.find(s => s.id === stoppageId);
    if (stoppage) {
      return { village, stoppage };
    }
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

function calculateDistanceKm(pickupStoppageId, dropoffStoppageId) {
  const pickup = findStoppage(pickupStoppageId);
  const dropoff = findStoppage(dropoffStoppageId);

  if (!pickup || !dropoff) return 0;

  const indexDiff = Math.abs(pickup.stoppage.distanceIndex - dropoff.stoppage.distanceIndex);
  return Number(Math.max(1, indexDiff).toFixed(1));
}

module.exports = {
  VILLAGES,
  getAllVillages,
  findStoppage,
  formatLocationAddress,
  calculateDistanceKm
};
