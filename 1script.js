// ===== API Configuration =====
// const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = 'https://totoapp.onrender.com/api';
const API_BASE_URL = 'https://totoapp.onrender.com/api';


// Helper function to make API calls with authorization
async function apiCall(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('toto_token');
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API Error');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// --- DOM Core Declarations ---
const authView = document.getElementById('authView');
const signupPanel = document.getElementById('signupPanel');
const loginPanel = document.getElementById('loginPanel');
const authMessage = document.getElementById('authMessage');
const showSignupBtn = document.getElementById('showSignupBtn');
const showLoginBtn = document.getElementById('showLoginBtn');
const customerDashboard = document.getElementById('customerDashboard');
const driverDashboard = document.getElementById('driverDashboard');
const mainHeader = document.getElementById('mainHeader');
const appBottomNav = document.getElementById('appBottomNav');

// Menu Elements
const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');
const sideMenuOverlay = document.getElementById('sideMenuOverlay');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');

// Profiles Elements
const profileNameEl = document.getElementById('profileName');
const profileRoleEl = document.getElementById('profileRole');
const profileAvatarEl = document.getElementById('profileAvatar');

// Customers workflow targets
const currentLocationInput = document.getElementById('currentLocation');
const destinationInput = document.getElementById('destination');
const distanceInfoInput = document.getElementById('distanceInfo');
const fareInfoInput = document.getElementById('fareInfo');
const pricePreviewCard = document.getElementById('pricePreviewCard');
const rideSubmitBtn = document.getElementById('rideSubmitBtn');
const acceptedRideCard = document.getElementById('acceptedRideCard');
const endRideBtn = document.getElementById('endRideBtn');
const stopChips = document.querySelectorAll('.stop-chip');

// Drivers workflow targets
const availabilityToggleCheckbox = document.getElementById('availabilityToggleCheckbox');
const toggleStatusLabel = document.getElementById('toggleStatusLabel');
const rideRequestsContainer = document.getElementById('rideRequests');
const requestCountBadge = document.getElementById('requestCountBadge');
const driverAcceptedRideCard = document.getElementById('driverAcceptedRideCard');

// Modals global references
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const rideRequestForm = document.getElementById('rideRequestForm');
const popupOverlay = document.getElementById('popupOverlay');
const popupTitle = document.getElementById('popupTitle');
const popupMessage = document.getElementById('popupMessage');
const popupIcon = document.getElementById('popupIcon');
const popupCloseBtn = document.getElementById('popupCloseBtn');

const STOP_DISTANCE_KM = 1; 
const FARE_PER_TRIP_BASE = 10;

// --- Global State & Listeners ---
let currentUser = JSON.parse(localStorage.getItem('toto_active_user')) || null;
let activeRideId = localStorage.getItem('toto_active_ride_id') || null;
let pollInterval = null;

// --- Global Notification Alert ---
function showPopup(title, message, icon = '🔔') {
  if (!popupOverlay) return;
  popupTitle.textContent = title;
  popupMessage.textContent = message;
  popupIcon.textContent = icon;
  popupOverlay.classList.remove('hidden');
  popupOverlay.setAttribute('aria-hidden', 'false');
}

function hidePopup() { 
  popupOverlay.classList.add('hidden'); 
  popupOverlay.setAttribute('aria-hidden', 'true'); 
}
popupCloseBtn?.addEventListener('click', hidePopup);

// --- Section Routing ---
function showSection(section) {
  authView.classList.add('hidden');
  customerDashboard.classList.add('hidden');
  driverDashboard.classList.add('hidden');
  section.classList.remove('hidden');
}

// --- Main App Logic ---
function renderApp() {
  if (!currentUser) {
    showSection(authView);
    mainHeader.classList.add('hidden');
    appBottomNav.classList.add('hidden');
    closeSidebar();
    clearAllListeners();
    return;
  }

  mainHeader.classList.remove('hidden');
  appBottomNav.classList.remove('hidden');
  profileNameEl.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
  profileRoleEl.textContent = currentUser.userType === 'passenger' ? 'যাত্রী (Passenger)' : 'টোটো চালক (Driver)';
  profileAvatarEl.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.firstName}`;

  if (currentUser.userType === 'passenger') {
    showSection(customerDashboard);
    setupCustomerDashboard();
  } else {
    showSection(driverDashboard);
    setupDriverDashboard();
  }
}

function clearAllListeners() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// --- Menu Functions ---
function openSidebar() { sideMenu.classList.add('open'); sideMenuOverlay.classList.remove('hidden'); }
function closeSidebar() { sideMenu.classList.remove('open'); sideMenuOverlay.classList.add('hidden'); }

menuBtn.addEventListener('click', openSidebar);
closeMenuBtn.addEventListener('click', closeSidebar);
sideMenuOverlay.addEventListener('click', closeSidebar);

sidebarLogoutBtn.addEventListener('click', () => {
  localStorage.removeItem('toto_active_user');
  localStorage.removeItem('toto_token');
  localStorage.removeItem('toto_active_ride_id');
  currentUser = null;
  activeRideId = null;
  clearAllListeners();
  renderApp();
});

// --- Auth Event Listeners ---
signupForm.addEventListener('submit', async event => {
  event.preventDefault();
  const phone = document.getElementById('phone').value.trim();
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const password = document.getElementById('password').value;
  const userType = document.getElementById('userType').value || 'passenger';
  
  authMessage.textContent = 'অ্যাকাউন্ট তৈরি হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...';
  authMessage.style.color = '#09663e';
  
  try {
    const response = await apiCall('/auth/signup', 'POST', {
      phone,
      firstName,
      lastName,
      password,
      userType
    });

    if (response.success) {
      currentUser = response.user;
      localStorage.setItem('toto_active_user', JSON.stringify(currentUser));
      localStorage.setItem('toto_token', response.token);
      authMessage.textContent = '';
      renderApp();
    }
  } catch (error) {
    console.error("Signup error:", error);
    authMessage.style.color = 'var(--danger-color)';
    authMessage.textContent = error.message || 'সাইন আপ ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।';
  }
});

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const phone = document.getElementById('loginPhone').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  authMessage.textContent = 'লগইন করা হচ্ছে...';
  authMessage.style.color = '#09663e';
  
  try {
    const response = await apiCall('/auth/login', 'POST', {
      phone,
      password
    });

    if (response.success) {
      currentUser = response.user;
      localStorage.setItem('toto_active_user', JSON.stringify(currentUser));
      localStorage.setItem('toto_token', response.token);
      authMessage.textContent = '';
      renderApp();
    }
  } catch (error) {
    console.error("Login error:", error);
    authMessage.style.color = 'var(--danger-color)';
    authMessage.textContent = error.message || 'লগইন ব্যর্থ হয়েছে।';
  }
});

showSignupBtn.addEventListener('click', () => { 
  signupPanel.classList.remove('hidden'); 
  loginPanel.classList.add('hidden'); 
  showSignupBtn.classList.add('active'); 
  showLoginBtn.classList.remove('active'); 
  authMessage.textContent = '';
});

showLoginBtn.addEventListener('click', () => { 
  loginPanel.classList.remove('hidden'); 
  signupPanel.classList.add('hidden'); 
  showLoginBtn.classList.add('active'); 
  showSignupBtn.classList.remove('active'); 
  authMessage.textContent = '';
});

// --- Customer Logic ---
function setupCustomerDashboard() {
  if (activeRideId) {
    pollCustomerRide();
  } else {
    resetCustomerUI();
  }
}

async function pollCustomerRide() {
  if (!activeRideId) return;

  try {
    const response = await apiCall(`/rides/${activeRideId}`);
    const ride = response.ride;

    if (ride.rideStatus === 'completed' || ride.rideStatus === 'cancelled') {
      localStorage.removeItem('toto_active_ride_id');
      activeRideId = null;
      resetCustomerUI();
      showPopup('সফলতা', 'আপনার ট্রিপটি সফলভাবে সম্পন্ন হয়েছে। ধন্যবাদ!', '🎉');
      return;
    }

    if (ride.rideStatus === 'pending') {
      rideSubmitBtn.disabled = true;
      rideSubmitBtn.textContent = 'টোটো খোঁজা হচ্ছে...';
      rideSubmitBtn.style.opacity = "0.7";
      acceptedRideCard.classList.add('hidden');
    } else if (ride.rideStatus === 'accepted' || ride.rideStatus === 'in_progress') {
      rideSubmitBtn.disabled = true;
      rideSubmitBtn.textContent = 'চালকের জন্য অপেক্ষা করুন';
      
      acceptedRideCard.classList.remove('hidden');
      document.getElementById('acceptedDriverName').textContent = ride.driverId ? `ড্রাইভার #${ride.driverId}` : 'নিযুক্ত হচ্ছে...';
      document.getElementById('acceptedStart').textContent = ride.pickupLocation.address || 'পিকআপ';
      document.getElementById('acceptedEnd').textContent = ride.dropoffLocation.address || 'গন্তব্য';
      document.getElementById('acceptedDistance').textContent = `${ride.distance} km`;
      document.getElementById('acceptedFare').textContent = `₹${ride.fare}`;
    }
  } catch (error) {
    console.error("Error polling ride:", error);
  }
}

function resetCustomerUI() {
  rideSubmitBtn.disabled = false;
  rideSubmitBtn.textContent = 'রাইড খুঁজুন';
  rideSubmitBtn.style.opacity = "1";
  acceptedRideCard.classList.add('hidden');
  currentLocationInput.value = '';
  destinationInput.value = '';
  pricePreviewCard.classList.add('hidden');
}

rideRequestForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (activeRideId) return;

  const pickupAddress = currentLocationInput.options[currentLocationInput.selectedIndex].text;
  const dropoffAddress = destinationInput.options[destinationInput.selectedIndex].text;

  if (currentLocationInput.value === destinationInput.value) { 
    showPopup('ত্রুটি', 'শুরুর স্থান এবং গন্তব্য একই হতে পারে না।', '❌'); 
    return; 
  }

  const distance = Math.abs(Number(currentLocationInput.value) - Number(destinationInput.value)) * STOP_DISTANCE_KM;
  
  rideSubmitBtn.disabled = true;
  rideSubmitBtn.textContent = 'অপেক্ষা করুন...';

  try {
    const response = await apiCall('/rides/request', 'POST', {
      pickupLocation: {
        address: pickupAddress,
        latitude: 0,
        longitude: 0
      },
      dropoffLocation: {
        address: dropoffAddress,
        latitude: 0,
        longitude: 0
      },
      distance: Number(distance.toFixed(1))
    });

    if (response.success) {
      activeRideId = response.ride._id;
      localStorage.setItem('toto_active_ride_id', activeRideId);
      
      // Start polling
      pollCustomerRide();
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = setInterval(pollCustomerRide, 3000);
      
      showPopup('অনুরোধ পাঠানো হয়েছে', 'আপনার টোটো বুকিং অনুরোধটি চালকদের পাঠানো হয়েছে।', '✅');
    }
  } catch (error) {
    console.error("Booking error:", error);
    showPopup('ত্রুটি', error.message || 'বুকিং করতে সমস্যা হচ্ছে, আবার চেষ্টা করুন।', '❌');
    resetCustomerUI();
  }
});

endRideBtn?.addEventListener('click', async () => {
  if (activeRideId) {
    try {
      await apiCall(`/rides/end/${activeRideId}`, 'POST');
      showPopup('সফলতা', 'রাইড শেষ করা হয়েছে।', '✅');
    } catch (error) {
      showPopup('ত্রুটি', 'রাইড শেষ করতে সমস্যা হয়েছে।', '❌');
    }
  }
});

// --- Preview & Calculation ---
function updateRidePreview() {
  const pickup = currentLocationInput.value;
  const drop = destinationInput.value;
  if (!pickup || !drop || pickup === drop) { pricePreviewCard.classList.add('hidden'); return; }
  const distance = Number((Math.abs(Number(pickup) - Number(drop)) * STOP_DISTANCE_KM).toFixed(1));
  const fare = FARE_PER_TRIP_BASE * Math.max(1, distance);
  distanceInfoInput.value = `${distance} km`;
  fareInfoInput.value = `₹${fare}`;
  pricePreviewCard.classList.remove('hidden');
}

currentLocationInput.addEventListener('change', updateRidePreview);
destinationInput.addEventListener('change', updateRidePreview);

// Instant Booking (Popular Places)
stopChips.forEach(chip => {
  chip.addEventListener('click', (e) => {
    if (activeRideId) {
      showPopup('অপেক্ষা করুন', 'আপনার একটি রাইড ইতিমধ্যে খোঁজা হচ্ছে।', '⏳');
      return;
    }
    const destId = e.target.dataset.stopId;
    destinationInput.value = destId;
    if (!currentLocationInput.value || currentLocationInput.value === destId) {
      currentLocationInput.value = destId === "1" ? "2" : "1";
    }
    updateRidePreview();
    rideRequestForm.dispatchEvent(new Event('submit'));
  });
});

// --- Driver Logic ---
function setupDriverDashboard() {
  const isAvailable = localStorage.getItem('toto_driver_online') === 'true';
  availabilityToggleCheckbox.checked = isAvailable;
  toggleDriverStatus(isAvailable);
  if (activeRideId) {
    listenToDriverActiveRide();
  }
}

availabilityToggleCheckbox.addEventListener('change', () => {
  const isAvailable = availabilityToggleCheckbox.checked;
  localStorage.setItem('toto_driver_online', isAvailable);
  toggleDriverStatus(isAvailable);
});

function toggleDriverStatus(isAvailable) {
  toggleStatusLabel.textContent = isAvailable ? 'অনলাইন' : 'অফলাইন';
  toggleStatusLabel.style.color = isAvailable ? 'var(--primary-brand)' : 'var(--text-muted)';

  if (isAvailable) {
    listenToPendingQueue();
  } else {
    if (pollInterval) clearInterval(pollInterval);
    rideRequestsContainer.innerHTML = '<p class="muted-text center-block">আপনি অফলাইনে আছেন। রাইড পেতে অনলাইন মোড চালু করুন।</p>';
    requestCountBadge.textContent = '0';
  }
}

async function listenToPendingQueue() {
  if (activeRideId) return;

  try {
    const response = await apiCall('/rides/pending');
    const rides = response.rides || [];

    requestCountBadge.textContent = rides.length.toString();
    
    if (rides.length === 0) {
      rideRequestsContainer.innerHTML = '<p class="muted-text center-block">এই মুহূর্তে কোনো বুকিং অনুরোধ নেই।</p>';
      return;
    }

    rideRequestsContainer.innerHTML = '';
    rides.forEach((ride) => {
      const item = document.createElement('div');
      item.className = 'request-item';
      item.innerHTML = `
        <p>👤 <strong>${ride.passengerId.firstName} ${ride.passengerId.lastName}</strong></p>
        <p>📍 পিকআপ: ${ride.pickupLocation.address}</p>
        <p>🏁 গন্তব্য: ${ride.dropoffLocation.address}</p>
        <p>💰 ভাড়া: <span class="text-green">₹${ride.fare}</span> (${ride.distance} km)</p>
        <div class="request-actions">
          <button class="button primary accept-btn" data-id="${ride._id}">গ্রহণ করুন</button>
        </div>
      `;
      rideRequestsContainer.appendChild(item);
    });

    document.querySelectorAll('.accept-btn').forEach(btn => {
      btn.addEventListener('click', (e) => acceptRide(e.target.dataset.id));
    });

    // Poll for updates
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(listenToPendingQueue, 3000);
  } catch (error) {
    console.error("Error fetching pending rides:", error);
  }
}

async function acceptRide(rideId) {
  try {
    const response = await apiCall(`/rides/accept/${rideId}`, 'POST');

    if (response.success) {
      activeRideId = rideId;
      localStorage.setItem('toto_active_ride_id', activeRideId);
      
      rideRequestsContainer.innerHTML = '<p class="muted-text center-block">আপনার একটি ট্রিপ চলমান রয়েছে।</p>';
      requestCountBadge.textContent = '0';
      
      listenToDriverActiveRide();
    }
  } catch (error) {
    console.error("Accept ride error:", error);
    showPopup('ত্রুটি', 'রাইডটি ইতিমধ্যে অন্য কেউ নিয়ে নিয়েছে অথবা বাতিল হয়েছে।', '⚠️');
  }
}

async function listenToDriverActiveRide() {
  if (!activeRideId || currentUser.userType !== 'driver') return;

  try {
    const response = await apiCall(`/rides/${activeRideId}`);
    const ride = response.ride;

    if (ride.rideStatus === 'completed' || ride.rideStatus === 'cancelled') {
      localStorage.removeItem('toto_active_ride_id');
      activeRideId = null;
      driverAcceptedRideCard.classList.add('hidden');
      
      if (availabilityToggleCheckbox.checked) {
        listenToPendingQueue();
      }
      showPopup('ট্রিপ শেষ', 'যাত্রী ট্রিপটি সমাপ্ত করেছেন।', '✅');
      return;
    }

    rideRequestsContainer.innerHTML = '<p class="muted-text center-block">আপনার একটি ট্রিপ চলমান রয়েছে।</p>';
    requestCountBadge.textContent = '0';
    driverAcceptedRideCard.classList.remove('hidden');
    
    document.getElementById('driverAcceptedCustomerName').textContent = `${ride.passengerId.firstName} ${ride.passengerId.lastName}`;
    document.getElementById('driverAcceptedStart').textContent = ride.pickupLocation.address;
    document.getElementById('driverAcceptedEnd').textContent = ride.dropoffLocation.address;
    document.getElementById('driverAcceptedDistance').textContent = `${ride.distance} km`;
    document.getElementById('driverAcceptedFare').textContent = `₹${ride.fare}`;
  } catch (error) {
    console.error("Error getting active ride:", error);
  }
}

// Poll for driver active ride
function startDriverPoll() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(listenToDriverActiveRide, 3000);
}

// Initial boot
window.addEventListener('load', () => {
  renderApp();
  if (currentUser?.userType === 'driver' && activeRideId) {
    startDriverPoll();
  }
});
