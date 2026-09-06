const SERVICE_TYPES = Object.freeze({
  TOTO_PERSONAL: 'TOTO_PERSONAL',
  TOTO_SHARING: 'TOTO_SHARING',
  TOTO_GOODS: 'TOTO_GOODS',
  BIKE: 'BIKE',
  MARUTI_FULL: 'MARUTI_FULL',
  MOTORVAN_FULL: 'MOTORVAN_FULL'
});

const SERVICE_TYPE_OPTIONS = Object.freeze([
  { value: SERVICE_TYPES.TOTO_PERSONAL, label: '🛺 টোটো পার্সোনাল — ১ 👤', capacity: 1 },
  { value: SERVICE_TYPES.TOTO_SHARING, label: '🛺 টোটো শেয়ারিং — ৫ 👤', capacity: 5 },
  { value: SERVICE_TYPES.TOTO_GOODS, label: '🛺 টোটো মালগাড়ি — ৩০ কেজি', maxWeightKg: 30 },
  { value: SERVICE_TYPES.BIKE, label: '🏍️ বাইক — ১ 👤', capacity: 1 },
  { value: SERVICE_TYPES.MARUTI_FULL, label: '🚗 মারুতি (ফুল) — ৭ 👤', capacity: 7 },
  { value: SERVICE_TYPES.MOTORVAN_FULL, label: '🚐 মটরভ্যান (ফুল) — ৭ 👤', capacity: 7 }
]);

const LEGACY_RIDE_TYPE_TO_SERVICE_TYPE = Object.freeze({
  toto: SERVICE_TYPES.TOTO_PERSONAL,
  bike: SERVICE_TYPES.BIKE,
  maruti: SERVICE_TYPES.MARUTI_FULL,
  motorvan: SERVICE_TYPES.MOTORVAN_FULL
});

const SERVICE_TYPE_TO_LEGACY_RIDE_TYPE = Object.freeze({
  [SERVICE_TYPES.TOTO_PERSONAL]: 'toto',
  [SERVICE_TYPES.TOTO_SHARING]: 'toto',
  [SERVICE_TYPES.TOTO_GOODS]: 'toto',
  [SERVICE_TYPES.BIKE]: 'bike',
  [SERVICE_TYPES.MARUTI_FULL]: 'maruti',
  [SERVICE_TYPES.MOTORVAN_FULL]: 'motorvan'
});

function normalizeServiceTypes(user) {
  if (!user) return [];
  const stored = Array.isArray(user.serviceTypes) ? user.serviceTypes : [];
  const normalized = stored.filter(value => SERVICE_TYPE_OPTIONS.some(option => option.value === value));
  if (normalized.length > 0) return [...new Set(normalized)];

  const legacyType = LEGACY_RIDE_TYPE_TO_SERVICE_TYPE[user.rideType];
  return legacyType ? [legacyType] : [];
}

function rideTypeMatchesService(rideType, serviceTypes) {
  if (!Array.isArray(serviceTypes)) return false;
  if (!rideType) return serviceTypes.includes(SERVICE_TYPES.TOTO_PERSONAL);
  const requestedType = String(rideType).toUpperCase();
  const requestedServiceType = SERVICE_TYPES[requestedType] || LEGACY_RIDE_TYPE_TO_SERVICE_TYPE[String(rideType).toLowerCase()];
  return Boolean(requestedServiceType && serviceTypes.includes(requestedServiceType));
}

module.exports = {
  SERVICE_TYPES,
  SERVICE_TYPE_OPTIONS,
  LEGACY_RIDE_TYPE_TO_SERVICE_TYPE,
  SERVICE_TYPE_TO_LEGACY_RIDE_TYPE,
  normalizeServiceTypes,
  rideTypeMatchesService
};
