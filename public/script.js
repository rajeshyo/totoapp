// ===== Notification Helpers =====
function sendNotification(title, options = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '🛺',
      badge: '🛺',
      ...options
    });
  }
}

function notifyDriversOfRide(rideId, pickupLocation, fare) {
  sendNotification('নতুন রাইড অনুরোধ', {
    body: `${pickupLocation} থেকে - ₹${fare} ভাড়া`,
    tag: `ride-${rideId}`,
    requireInteraction: true
  });
}

function notifyCustomerRideAccepted(driverName, driverPhone) {
  sendNotification('চালক গ্রহণ করেছেন', {
    body: `${driverName} আপনার রাইড গ্রহণ করেছেন`,
    tag: 'ride-accepted',
    requireInteraction: false
  });
}

// ===== API Configuration =====
const API_BASE_URL = 'https://totoapp.onrender.com/api';

// Splash screen handler - show only if user not logged in
window.addEventListener('load', () => {
  const currentUser = localStorage.getItem('toto_active_user');
  const splashScreen = document.getElementById('splashScreen');
  
  if (splashScreen && !currentUser) {
    // Show splash screen only if not logged in - 10 seconds
    setTimeout(() => {
      splashScreen.style.display = 'none';
    }, 10000); // 10 seconds
  } else if (splashScreen && currentUser) {
    // Hide splash screen immediately if user is logged in
    splashScreen.style.display = 'none';
  }

  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Register service worker for push notifications
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('Service worker registration failed:', err);
    });
  }
});

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
const profilePage = document.getElementById('profilePage');
const rideHistoryPage = document.getElementById('rideHistoryPage');
const favoriteRidesPage = document.getElementById('favoriteRidesPage');
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
const userTypeSelect = document.getElementById('userType');
const vehicleNumberWrapper = document.getElementById('vehicleNumberWrapper');

const STOP_DISTANCE_KM = 2.4; 
const FARE_PER_TRIP_BASE = 20;

// --- Global State & Listeners ---
let currentUser = JSON.parse(localStorage.getItem('toto_active_user')) || null;
let activeRideId = localStorage.getItem('toto_active_ride_id') || null;
let pollInterval = null;
let rejectedRides = {}; // Track rejected rides with timestamp: { rideId: timestamp }

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
  profilePage.classList.add('hidden');
  rideHistoryPage.classList.add('hidden');
  favoriteRidesPage.classList.add('hidden');
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

  // Show home dashboard by default
  showHomePage();
}

function clearAllListeners() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// --- Navigation Functions ---
function showHomePage() {
  if (currentUser.userType === 'passenger') {
    showSection(customerDashboard);
    setupCustomerDashboard();
  } else {
    showSection(driverDashboard);
    setupDriverDashboard();
  }
  updateNavButtons('home');
}

function showProfilePage() {
  showSection(profilePage);
  updateNavButtons('profile');
  displayProfileInfo();
}

function showRideHistoryPage() {
  showSection(rideHistoryPage);
  updateNavButtons('history');
  displayRideHistory();
}

function showFavoritesPage() {
  showSection(favoriteRidesPage);
  updateNavButtons('favorites');
  displayFavorites();
}

function updateNavButtons(active) {
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  if (active === 'home') document.getElementById('navHomeBtn').classList.add('active');
  if (active === 'profile') document.getElementById('navProfileBtn').classList.add('active');
  if (active === 'history') document.getElementById('navHistoryBtn').classList.add('active');
  if (active === 'favorites') document.getElementById('navFavBtn').classList.add('active');
}

function displayProfileInfo() {
  document.getElementById('profilePageName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
  document.getElementById('profilePageUserType').textContent = currentUser.userType === 'driver' ? 'টোটো চালক' : 'যাত্রী';
  document.getElementById('profilePagePhone').textContent = `***${currentUser.phone.slice(-4)}`;
  document.getElementById('profilePageEmail').textContent = currentUser.email || 'লেখা নেই';
  document.getElementById('profilePagePhoneFull').textContent = currentUser.phone;
  document.getElementById('profilePageAvatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.firstName}`;
  
  if (currentUser.userType === 'driver') {
    document.getElementById('vehicleNumberDetail').classList.remove('hidden');
    document.getElementById('profilePageVehicle').textContent = currentUser.vehicleNumber || 'না আছে';
  } else {
    document.getElementById('vehicleNumberDetail').classList.add('hidden');
  }
  
  const stats = getOrInitializeDailyStats();
  document.getElementById('profilePageTotalRides').textContent = stats.totalRides;
  document.getElementById('profilePageRating').textContent = '⭐ 4.8 (120 রিভিউ)';
}

function displayRideHistory() {
  // This would fetch from backend in a real app
  // For now, show a placeholder message
  const historyList = document.getElementById('rideHistoryList');
  historyList.innerHTML = '<p class="muted-text center-block">আপনার রাইড হিস্টরি এখানে দেখা যাবে</p>';
}

function displayFavorites() {
  const favoritesList = document.getElementById('favoritesList');
  const popularPlaces = [
    { name: 'স্কুল মোড়', stopId: '1' },
    { name: 'কলেজ মোড়', stopId: '2' },
    { name: 'বাজার হাট', stopId: '3' },
    { name: 'হসপিটাল মোড়', stopId: '4' },
    { name: 'রেল স্টেশন', stopId: '5' },
  ];
  
  if (popularPlaces.length === 0) {
    favoritesList.innerHTML = '<p class="muted-text center-block">কোনো প্রিয় স্থান নেই</p>';
  } else {
    favoritesList.innerHTML = popularPlaces.map(place => `
      <div class="favorite-item">
        <div class="favorite-info">
          <p class="favorite-address">📍 ${place.name}</p>
        </div>
        <div class="favorite-action">
          <button onclick="bookFavorite('${place.stopId}', '${place.name}')">বুক করুন</button>
        </div>
      </div>
    `).join('');
  }
}

function bookFavorite(stopId, stopName) {
  if (activeRideId) {
    showPopup('অপেক্ষা করুন', 'আপনার একটি রাইড ইতিমধ্যে খোঁজা হচ্ছে।', '⏳');
    return;
  }
  showHomePage();
  showPopup('প্রিয় স্থান', `${stopName} এ বুকিং শুরু হয়েছে`, '✅');
  destinationInput.value = stopId;
  if (!currentLocationInput.value || currentLocationInput.value === stopId) {
    currentLocationInput.value = stopId === "1" ? "2" : "1";
  }
  updateRidePreview();
  setTimeout(() => {
    rideRequestForm.dispatchEvent(new Event('submit'));
  }, 300);
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

// Refresh button handler - moved to bottom nav
const navRefreshBtn = document.getElementById('navRefreshBtn');
if (navRefreshBtn) {
  navRefreshBtn.addEventListener('click', () => {
    navRefreshBtn.style.animation = 'spin 0.6s ease-in-out';
    setTimeout(() => {
      navRefreshBtn.style.animation = '';
    }, 600);
    location.reload();
  });
}

// Bottom navigation button handlers
document.getElementById('navHomeBtn')?.addEventListener('click', showHomePage);
document.getElementById('navProfileBtn')?.addEventListener('click', showProfilePage);
document.getElementById('navHistoryBtn')?.addEventListener('click', showRideHistoryPage);
document.getElementById('navFavBtn')?.addEventListener('click', showFavoritesPage);

// Logout button in profile page
document.getElementById('logoutProfileBtn')?.addEventListener('click', () => {
  localStorage.removeItem('toto_active_user');
  localStorage.removeItem('toto_token');
  localStorage.removeItem('toto_active_ride_id');
  currentUser = null;
  activeRideId = null;
  clearAllListeners();
  renderApp();
});

// Edit profile button
document.getElementById('editProfileBtn')?.addEventListener('click', () => {
  let modal = document.getElementById('editProfileModal');
  
  // Create the modal dynamically if it doesn't exist yet
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'editProfileModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;justify-content:center;align-items:center;';
    modal.innerHTML = `
      <div class="card" style="width:90%;max-width:400px;background:var(--surface-color, #fff);padding:20px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.2);">
        <h3 style="margin-top:0;margin-bottom:15px;text-align:center;">প্রোফাইল এডিট</h3>
        <form id="editProfileForm" style="display:flex;flex-direction:column;gap:15px;">
          <div>
            <label style="font-size:0.9rem;color:var(--text-muted, #666);">নাম (First Name)</label>
            <input type="text" id="editFirstName" required style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-top:5px;font-size:1rem;">
          </div>
          <div>
            <label style="font-size:0.9rem;color:var(--text-muted, #666);">পদবি (Last Name)</label>
            <input type="text" id="editLastName" required style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-top:5px;font-size:1rem;">
          </div>
          <div>
            <label style="font-size:0.9rem;color:var(--text-muted, #666);">ফোন নম্বর <small>(পরিবর্তনযোগ্য নয়)</small></label>
            <input type="text" id="editPhone" readonly style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;background:#f5f5f5;color:#888;box-sizing:border-box;margin-top:5px;font-size:1rem;">
          </div>
          <div id="editVehicleWrapper" style="display:none;">
            <label style="font-size:0.9rem;color:var(--text-muted, #666);">গাড়ির নম্বর <small>(পরিবর্তনযোগ্য নয়)</small></label>
            <input type="text" id="editVehicle" readonly style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;background:#f5f5f5;color:#888;box-sizing:border-box;margin-top:5px;font-size:1rem;">
          </div>
          <div style="display:flex;gap:10px;margin-top:10px;">
            <button type="submit" class="button primary" style="flex:1;">সেভ করুন</button>
            <button type="button" id="closeEditProfileBtn" class="button secondary" style="flex:1;background:#e0e0e0;color:#333;">বাতিল</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('closeEditProfileBtn').addEventListener('click', () => modal.style.display = 'none');

    document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.textContent = 'অপেক্ষা করুন...';
      submitBtn.disabled = true;

      // Update user details
      currentUser.firstName = document.getElementById('editFirstName').value.trim();
      currentUser.lastName = document.getElementById('editLastName').value.trim();
      localStorage.setItem('toto_active_user', JSON.stringify(currentUser));
      
      try { await apiCall('/auth/profile', 'PUT', { firstName: currentUser.firstName, lastName: currentUser.lastName }); } catch (err) { /* Optional fallback if backend route isn't strictly defined yet */ }

      displayProfileInfo();
      renderApp();
      
      modal.style.display = 'none';
      submitBtn.textContent = 'সেভ করুন';
      submitBtn.disabled = false;
      showPopup('সফল', 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে।', '✅');
    });
  }

  // Populate current user data
  document.getElementById('editFirstName').value = currentUser.firstName || '';
  document.getElementById('editLastName').value = currentUser.lastName || '';
  document.getElementById('editPhone').value = currentUser.phone || '';
  document.getElementById('editVehicleWrapper').style.display = currentUser.userType === 'driver' ? 'block' : 'none';
  if (currentUser.userType === 'driver') document.getElementById('editVehicle').value = currentUser.vehicleNumber || '';

  modal.style.display = 'flex';
});

// User type selector for signup
document.querySelectorAll('.type-option').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const userType = btn.dataset.type;
    document.getElementById('userType').value = userType;
    
    // Show/hide vehicle number field
    const vehicleWrapper = document.getElementById('vehicleNumberWrapper');
    if (userType === 'driver') {
      vehicleWrapper.classList.remove('hidden');
    } else {
      vehicleWrapper.classList.add('hidden');
    }
  });
});

// Initialize passenger type selector on page load
document.addEventListener('DOMContentLoaded', () => {
  const passengerBtn = document.querySelector('.passenger-type');
  if (passengerBtn && !passengerBtn.classList.contains('active')) {
    passengerBtn.classList.add('active');
  }
  document.getElementById('userType').value = 'passenger';
  const vehicleWrapper = document.getElementById('vehicleNumberWrapper');
  if (vehicleWrapper) {
    vehicleWrapper.classList.add('hidden');
  }
});

// --- Auth Event Listeners ---
signupForm.addEventListener('submit', async event => {
  event.preventDefault();
  const phone = document.getElementById('phone').value.trim();
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const password = document.getElementById('password').value;
  const userType = document.getElementById('userType').value || 'passenger';
  const vehicleNumber = document.getElementById('vehicleNumber').value.trim();
  
  // Validate phone number - must be 10 digits
  if (!/^\d{10}$/.test(phone)) {
    authMessage.style.color = 'var(--danger-color)';
    authMessage.textContent = 'ফোন নম্বর ১০ অঙ্কের হতে হবে।';
    return;
  }
  
  // Validate vehicle number for drivers
  if (userType === 'driver' && !vehicleNumber) {
    authMessage.style.color = 'var(--danger-color)';
    authMessage.textContent = 'গাড়ির নম্বর প্রয়োজনীয়।';
    return;
  }
  
  authMessage.textContent = 'অ্যাকাউন্ট তৈরি হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...';
  authMessage.style.color = '#09663e';
  
  try {
    const response = await apiCall('/auth/signup', 'POST', {
      phone,
      firstName,
      lastName,
      password,
      userType,
      vehicleNumber: userType === 'driver' ? vehicleNumber : undefined
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
  
  // Validate phone number - must be 10 digits
  if (!/^\d{10}$/.test(phone)) {
    authMessage.style.color = 'var(--danger-color)';
    authMessage.textContent = 'ফোন নম্বর ১০ অঙ্কের হতে হবে।';
    return;
  }
  
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

// Toggle vehicle number field visibility based on user type
userTypeSelect?.addEventListener('change', () => {
  if (userTypeSelect.value === 'driver') {
    vehicleNumberWrapper.classList.remove('hidden');
  } else {
    vehicleNumberWrapper.classList.add('hidden');
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
    // Start continuous polling - fast update every 1.5 seconds
    if (pollInterval) clearInterval(pollInterval);
    pollCustomerRide(); // Initial call
    pollInterval = setInterval(pollCustomerRide, 1500);
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

    // Hide booking form and show finding/accepted state
    document.querySelector('.ride-booking-card').classList.add('hidden');
    document.querySelector('.popular-section').classList.add('hidden');

    if (ride.rideStatus === 'pending') {
      // Show finding message
      acceptedRideCard.classList.add('hidden');
      const findingCard = document.getElementById('findingRideCard') || createFindingCard();
      findingCard.classList.remove('hidden');
    } else if (ride.rideStatus === 'accepted' || ride.rideStatus === 'in_progress') {
      // Hide finding message and show accepted ride card
      const findingCard = document.getElementById('findingRideCard');
      if (findingCard) findingCard.classList.add('hidden');
      
      acceptedRideCard.classList.remove('hidden');
      document.getElementById('acceptedDriverName').textContent = ride.driverId ? `${ride.driverId.firstName} ${ride.driverId.lastName}` : 'নিযুক্ত হচ্ছে...';
      document.getElementById('acceptedStart').textContent = ride.pickupLocation.address || 'পিকআপ';
      document.getElementById('acceptedEnd').textContent = ride.dropoffLocation.address || 'গন্তব্য';
      document.getElementById('acceptedDistance').textContent = `${ride.distance} km`;
      document.getElementById('acceptedFare').textContent = `₹${ride.fare}`;
      // Display driver phone number - only last 4 digits
      if (document.getElementById('acceptedDriverPhone') && ride.driverId) {
        const fullPhone = ride.driverId.phone;
        const lastFour = fullPhone.slice(-4);
        document.getElementById('acceptedDriverPhone').textContent = `📞 ****${lastFour}`;
        // Store full phone for call button
        document.getElementById('driverCallBtn').href = `tel:${fullPhone}`;
        // Display vehicle number
        if (ride.driverId.vehicleNumber && document.getElementById('acceptedVehicleNumber')) {
          document.getElementById('acceptedVehicleNumber').textContent = `🔢 ${ride.driverId.vehicleNumber}`;
        }
      }
    }
  } catch (error) {
    console.error("Error polling ride:", error);
  }
}

function createFindingCard() {
  const findingCard = document.createElement('div');
  findingCard.id = 'findingRideCard';
  findingCard.className = 'card info-card state-card';
  findingCard.innerHTML = `
    <div class="state-header green-theme">
      <span class="live-pulse green"></span>
      <h3>আমরা আপনার জন্য খুঁজছি</h3>
    </div>
    <div class="center-block">
      <p class="muted-text">কাছাকাছি একটি টোটো খুঁজে বের করা হচ্ছে...</p>
      <p style="font-size: 2rem; margin: 20px 0;">🔍</p>
    </div>
  `;
  document.querySelector('.dashboard').appendChild(findingCard);
  return findingCard;
}

// Call functions
function callDriver() {
  const btn = document.getElementById('driverCallBtn');
  const phone = btn.href.replace('tel:', '');
  window.location.href = `tel:${phone}`;
}

function callCustomer() {
  const btn = document.getElementById('customerCallBtn');
  const phone = btn.href.replace('tel:', '');
  window.location.href = `tel:${phone}`;
}

// Daily stats tracking
function getOrInitializeDailyStats() {
  const today = new Date().toDateString();
  const stats = JSON.parse(localStorage.getItem('toto_daily_stats')) || {};
  
  if (stats.date !== today) {
    // New day, reset stats
    stats.date = today;
    stats.totalRides = 0;
    stats.totalIncome = 0;
  }
  
  return stats;
}

function updateDailyStats(fareAmount) {
  const stats = getOrInitializeDailyStats();
  stats.totalRides = (stats.totalRides || 0) + 1;
  stats.totalIncome = (stats.totalIncome || 0) + fareAmount;
  localStorage.setItem('toto_daily_stats', JSON.stringify(stats));
  updateStatsDisplay();
}

function updateStatsDisplay() {
  const stats = getOrInitializeDailyStats();
  const ridesEl = document.getElementById('todayRidesCount');
  const incomeEl = document.getElementById('todayIncomeAmount');
  
  if (ridesEl) ridesEl.textContent = stats.totalRides || '0';
  if (incomeEl) incomeEl.textContent = `₹${stats.totalIncome || 0}`;
}

function resetCustomerUI() {
  // Show booking form and popular section
  document.querySelector('.ride-booking-card').classList.remove('hidden');
  document.querySelector('.popular-section').classList.remove('hidden');
  
  // Hide ride status cards
  acceptedRideCard.classList.add('hidden');
  const findingCard = document.getElementById('findingRideCard');
  if (findingCard) findingCard.classList.add('hidden');
  
  // Reset form
  rideSubmitBtn.disabled = false;
  rideSubmitBtn.textContent = 'রাইড খুঁজুন';
  rideSubmitBtn.style.opacity = "1";
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
      
      // Start fast polling - every 1.5 seconds for real-time updates
      if (pollInterval) clearInterval(pollInterval);
      pollCustomerRide(); // Initial call
      pollInterval = setInterval(pollCustomerRide, 1500);
      
      // Notify all drivers of new ride request
      notifyDriversOfRide(activeRideId, pickupAddress, response.ride.fare);
      
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
  const fare = FARE_PER_TRIP_BASE * Math.max(1, Math.floor(distance / 2));
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
  // Update daily stats display
  updateStatsDisplay();
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
    // Start fast polling when going online - every 1.5 seconds
    if (pollInterval) clearInterval(pollInterval);
    listenToPendingQueue(); // Initial call
    pollInterval = setInterval(listenToPendingQueue, 1500);
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
    let rides = response.rides || [];

    // Filter out recently rejected rides (within 60 seconds)
    const now = Date.now();
    rides = rides.filter(ride => {
      if (rejectedRides[ride._id] && rejectedRides[ride._id] > now) {
        return false; // Hide this ride, it was recently rejected
      }
      // Clean up expired rejections
      if (rejectedRides[ride._id] && rejectedRides[ride._id] <= now) {
        delete rejectedRides[ride._id];
      }
      return true;
    });

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
          <button class="button secondary reject-btn" data-id="${ride._id}">প্রত্যাখ্যান করুন</button>
        </div>
      `;
      rideRequestsContainer.appendChild(item);
    });

    document.querySelectorAll('.accept-btn').forEach(btn => {
      btn.addEventListener('click', (e) => acceptRide(e.target.dataset.id));
    });

    document.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', (e) => rejectRide(e.target.dataset.id));
    });

    // Poll for updates every 1.5 seconds for real-time updates
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(listenToPendingQueue, 1500);
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
      
      // Notify customer that ride was accepted
      if (response.ride && response.ride.passengerId) {
        const passengerName = response.ride.passengerId.firstName || 'যাত্রী';
        notifyCustomerRideAccepted('চালক', ''); // Notify customer
      }
      
      rideRequestsContainer.innerHTML = '<p class="muted-text center-block">আপনার একটি ট্রিপ চলমান রয়েছে।</p>';
      requestCountBadge.textContent = '0';
      
      // Start fast polling for active ride - every 1.5 seconds for customer updates
      if (pollInterval) clearInterval(pollInterval);
      listenToDriverActiveRide(); // Initial call
      pollInterval = setInterval(listenToDriverActiveRide, 1500);
    }
  } catch (error) {
    console.error("Accept ride error:", error);
    showPopup('ত্রুটি', 'রাইডটি ইতিমধ্যে অন্য কেউ নিয়ে নিয়েছে অথবা বাতিল হয়েছে।', '⚠️');
  }
}

async function rejectRide(rideId) {
  try {
    const response = await apiCall(`/rides/reject/${rideId}`, 'POST');

    if (response.success) {
      // Track rejected ride for 60 seconds to avoid showing it again
      rejectedRides[rideId] = Date.now() + (60 * 1000); // 60 seconds from now
      
      showPopup('সফল', 'রাইড প্রত্যাখ্যান করা হয়েছে।', '✅');
      // Refresh the pending rides list
      listenToPendingQueue();
    }
  } catch (error) {
    console.error("Reject ride error:", error);
    showPopup('ত্রুটি', error.message || 'রাইড প্রত্যাখ্যান করতে সমস্যা হয়েছে।', '❌');
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
      
      // Track daily earnings if ride completed (not cancelled)
      if (ride.rideStatus === 'completed') {
        updateDailyStats(ride.fare);
      }
      
      showPopup('ট্রিপ শেষ', 'যাত্রী ট্রিপটি সমাপ্ত করেছেন।', '✅');
      
      // Reset to show available rides again with fast polling
      if (availabilityToggleCheckbox.checked) {
        rideRequestsContainer.innerHTML = '<p class="muted-text center-block">উপলব্ধ রাইড খুঁজছি...</p>';
        requestCountBadge.textContent = '0';
        
        // Immediately restart polling for new rides - fast updates every 1.5 seconds
        if (pollInterval) clearInterval(pollInterval);
        listenToPendingQueue(); // Initial call
        pollInterval = setInterval(listenToPendingQueue, 1500);
      }
      return;
    }

    rideRequestsContainer.innerHTML = '<p class="muted-text center-block">আপনার একটি ট্রিপ চলমান রয়েছে।</p>';
    requestCountBadge.textContent = '0';
    driverAcceptedRideCard.classList.remove('hidden');
    
    document.getElementById('driverAcceptedCustomerName').textContent = `${ride.passengerId.firstName} ${ride.passengerId.lastName}`;
    // Display customer phone - only last 4 digits
    const customerPhone = ride.passengerId.phone;
    const customerLastFour = customerPhone.slice(-4);
    document.getElementById('driverAcceptedCustomerPhone').textContent = `****${customerLastFour}`;
    // Update call button with full phone
    document.getElementById('customerCallBtn').href = `tel:${customerPhone}`;
    
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
