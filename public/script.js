
// At the top of script.js
import { apiCall } from './api.js'; // Assuming you create api.js

const DRIVER_SERVICE_OPTIONS = [
  { value: 'TOTO_SHARING', label: '🛺 টোটো শেয়ারিং — ১ 👤' },
  { value: 'TOTO_PERSONAL', label: '🛺 টোটো পার্সোনাল — ৫ 👤' },
  { value: 'TOTO_GOODS', label: '🛺 টোটো মালগাড়ি — ২ টন' },
  { value: 'BIKE', label: '🏍️ বাইক — ১ 👤' },
  { value: 'MARUTI_FULL', label: '🚗 মারুতি (ফুল) — ৭ 👤' },
  { value: 'MOTORVAN_FULL', label: '🚐 মটরভ্যান (ফুল) — ৭ 👤' }
];

function getDriverServiceTypes(user) {
  if (!user) return [];
  if (Array.isArray(user.serviceTypes) && user.serviceTypes.length > 0) {
    return user.serviceTypes;
  }
  const legacyMap = { toto: 'TOTO_PERSONAL', bike: 'BIKE', maruti: 'MARUTI_FULL', motorvan: 'MOTORVAN_FULL' };
  return legacyMap[user.rideType] ? [legacyMap[user.rideType]] : [];
}

function getCheckedDriverServiceTypes() {
  return [...document.querySelectorAll('input[name="signupServiceType"]:checked')].map(input => input.value);
}

function updateServicePickerSummary(picker) {
  if (!picker) return;
  const selected = picker.querySelectorAll('input[type="checkbox"]:checked').length;
  const summary = picker.querySelector('[data-service-picker-summary]');
  if (summary) {
    summary.textContent = selected ? `${selected}টি নির্বাচন করা হয়েছে` : 'নির্বাচন করুন';
  }
}

document.addEventListener('change', event => {
  const picker = event.target.closest?.('[data-service-picker]');
  if (picker && event.target.matches('input[type="checkbox"]')) {
    updateServicePickerSummary(picker);
  }
});

// ===== Notification Helpers =====
// import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
// import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js";

let currentNotificationAudio = null;

function playNotificationSound() {
  try {
    if (currentNotificationAudio) {
      currentNotificationAudio.pause();
      currentNotificationAudio.currentTime = 0;
    }
    currentNotificationAudio = new Audio('image/totobook.mp3');
    currentNotificationAudio.loop = true;
    currentNotificationAudio.play().catch(e => console.warn('Browser blocked audio playback:', e));
  } catch (err) {
    console.error('Error playing sound:', err);
  }
}

function stopNotificationSound() {
  if (currentNotificationAudio) {
    currentNotificationAudio.pause();
    currentNotificationAudio.currentTime = 0;
    currentNotificationAudio = null;
  }
}

function sendNotification(title, options = {}, playSound = true) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛺</text></svg>',
      // Fallback icon if the SVG data URI is not supported or preferred
      // icon: '/image/toto_icon.png',
      ...options
    });

    if (playSound) playNotificationSound();

    // If they click the native push notification, focus the browser tab (optional)
    notification.onclick = function () {
      window.focus();
      this.close();
    };
  }
}

function notifyDriversOfRide(rideId, pickupLocation, fare) { // This function is for Socket.IO, FCM is handled by backend
  sendNotification('নতুন রাইড অনুরোধ', {
    body: `${pickupLocation} থেকে - ₹${fare} ভাড়া`,
    tag: `ride-${rideId}`,
    requireInteraction: true
  }, true); // Play sound for new ride requests
}

function notifyCustomerRideAccepted(driverName, driverPhone) {
  sendNotification('চালক গ্রহণ করেছেন', {
    body: `${driverName} আপনার রাইড গ্রহণ করেছেন`,
    tag: 'ride-accepted',
    requireInteraction: false // No sound for accepted ride, just a visual notification
  });
}

// ===== FCM Integration =====
// FCM functionality removed as per request.

// Your Firebase project configuration (from Firebase Console -> Project settings -> Your apps -> Web app -> Config)
// const firebaseConfig = {
//   apiKey: "AIzaSyCR2UerdaLcrpE_HYYdHCb0Blrh42pnUKA",
//   authDomain: "totobhandhu.firebaseapp.com",
//   projectId: "totobhandhu",
//   storageBucket: "totobhandhu.firebasestorage.app",
//   messagingSenderId: "410190429747",
//   appId: "1:410190429747:web:d877b934d1d56bd26c2d46",
//   measurementId: "G-RT1WQ9SMHF"
// };

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const messaging = getMessaging(app);

async function registerFCMToken() {
  console.log('FCM registration has been disabled.');
  // if (!currentUser || currentUser.userType !== 'driver') return;
  // if (!("Notification" in window)) {
  //   showPopup('ত্রুটি', 'এই ব্রাউজারে পুশ নোটিফিকেশন সাপোর্ট করে না।', '❌');
  //   return;
  // }

  // // Explicitly register the service worker first
  // let serviceWorkerRegistration;

  // try {

  //   // Register Service Worker
  //   await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  //   // Wait until it becomes ACTIVE
  //   serviceWorkerRegistration = await navigator.serviceWorker.ready;

  //   console.log("✅ Service Worker Ready:", serviceWorkerRegistration);
  //   console.log("Controller:", navigator.serviceWorker.controller);

  //   // If still no controller, reload once
  //   if (!navigator.serviceWorker.controller) {

  //       console.log("Reloading page because SW is not controlling...");

  //       window.location.reload();

  //       return;

  //   }

  // } catch (swError) {
  //   console.error('Service Worker registration failed:', swError);
  //   showPopup('ত্রুটি', 'নোটিফিকেশন সার্ভিস চালু করতে সমস্যা হয়েছে।', '❌');
  //   return;
  // }

  // // Check if permission is already denied and show a helpful message.
  // if (Notification.permission === 'denied') {
  //   showPopup(
  //     'নোটিফিকেশন ব্লক করা আছে',
  //     'আপনি নোটিফিকেশন ব্লক করে রেখেছেন। রাইডের অ্যালার্ট পেতে, অনুগ্রহ করে আপনার ব্রাউজার সেটিংসে গিয়ে এই সাইটের জন্য নোটিফিকেশন চালু করুন।',
  //     '🔕'
  //   );
  //   return;
  // }

  // try {
  //   // This will prompt the user if permission is 'default', or resolve immediately if 'granted'.
  //   const permission = await Notification.requestPermission();
  //   if (permission === 'granted') {
  //     // IMPORTANT: Replace 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE' with your actual VAPID key!
  //     const currentToken = await getToken(messaging, { vapidKey: 'BNgpoA0CaBulxjWb3WvTS0TTzGs1lg9bzuzIrwojtn1AXvcfLwtEIxACPntQ-BHen8K3yxfT_kGKEpan4cpoH4w', serviceWorkerRegistration });
  //     if (currentToken) {
  //       console.log(
  //         "SW Controller:",
  //         navigator.serviceWorker.controller
  //       );
  //       console.log('FCM registration token:', currentToken);
  //       // Send the token to your backend to associate it with the driver
  //       await apiCall('/drivers/register-fcm-token', 'POST', { fcmToken: currentToken });
  //     } else {
  //       // This can happen if the service worker isn't registered correctly.
  //       console.warn('No FCM registration token available. Check service worker registration.');
  //       showPopup('ত্রুটি', 'নোটিফিকেশন সেট আপ করতে সমস্যা হয়েছে।', '❌');
  //     }
  //   } else {
  //     console.warn('Notification permission denied.');
  //     // User either denied or dismissed the prompt. No action needed, they will be prompted again next time.
  //     console.warn('Notification permission was not granted.');
  //   }
  // } catch (error) {
  //   console.error('An error occurred while retrieving FCM token:', error);
  //   showPopup('ত্রুটি', 'নোটিফিকেশন সেট আপ করতে একটি ত্রুটি হয়েছে।', '❌');
  // }
}

// Handle incoming messages when app is in foreground
// onMessage(messaging, (payload) => {
//   console.log('Foreground message received:', payload);
//   // You can display a custom in-app notification here if needed
//   sendNotification(payload.notification.title, { body: payload.notification.body }, true);
// });
// onMessage(messaging, (payload) => {
//     console.log("Foreground Payload:", payload);

//     new Notification(
//         payload.notification.title,
//         {
//             body: payload.notification.body,
//             icon: "/image/toto_icon.png"
//         }
//     );
//       playNotificationSound();
// });
// ===== API Configuration =====
const API_BASE_URL = 'https://totoapp.onrender.com/api';

// ===== Localization =====
const uiTranslations = {
  'টোটোবন্ধু': 'TotoBondhu',
  'টোটো': 'Toto',
  'বন্ধু': 'Bondhu',
  'আপনার পথচলার সাথী': 'Your Travel Companion',
  'সহজ বুকিং': 'Easy Booking',
  'মাত্র দুটি ক্লিকে আপনার গন্তব্য নির্বাচন করুন': 'Choose destination in two clicks',
  'নিরাপদ যাত্রা': 'Safe Journey',
  'সকল চালক যাচাইকৃত এবং রেটিং প্রাপ্ত': 'Verified and rated drivers',
  'স্বচ্ছ মূল্য': 'Transparent Pricing',
  'কোনো লুকানো খরচ নেই, সবকিছু স্পষ্ট': 'No hidden costs, very clear',
  'বিশ্বস্ত সেবা': 'Trusted Service',
  'সর্বোত্তম গ্রাহক সেবা এবং সহায়তা': 'Best support and service',
  'লোড হচ্ছে...': 'Loading...',
  '🏠 হোম': '🏠 Home',
  '📅 আমার রাইড ইতিহাস': '📅 My Ride History',
  '❤️ প্রিয় স্থান (Favorites)': '❤️ Favorite Places',
  '❓ সাহায্য ও সাপোর্ট': '❓ Help & Support',
  '⚙️ সেটিংস': '⚙️ Settings',
  'লগআউট করুন': 'Logout',
  'লগইন করুন': 'Login',
  'খাতা খোলো': 'Sign Up',
  'ফোন নম্বর লিখুন': 'Enter phone number',
  'পাসওয়ার্ড দিন': 'Enter password',
  'আপনি কী?': 'What are you?',
  'যাত্রী': 'Passenger',
  'ড্রাইভার': 'Driver',
  'মোবাইল নম্বর': 'Mobile Number',
  'নামের প্রথমাংশ': 'First Name',
  'পদবী': 'Last Name',
  'নতুন পাসওয়ার্ড': 'New Password',
  'গাড়ির নম্বর (যেমন: WB54T1234)': 'Vehicle No (e.g. WB54)',
  'অ্যাকাউন্ট তৈরি করুন': 'Create Account',
  'সহজে গাড়ি বুক করুন': 'Book Toto Easily',
  'সুলভ, নিরাপদ ও বিশ্বস্ত পরিষেবা': 'Affordable, Safe, Reliable',
  'এখনই বুক': 'Book Now',
  'আগে থেকে বুক': 'Schedule Booking',
  'যাত্রার তারিখ': 'Date',
  'যাত্রার সময়': 'Time',
  'আগে থেকে বুক করুন': 'Schedule Booking',
  'আগাম রাইড': 'Scheduled Ride',
  'কোনো আগাম রাইড নেই।': 'No scheduled rides.',
  'আপনার আগাম রাইডের অনুরোধটি চালকদের পাঠানো হয়েছে।': 'Your scheduled ride request has been sent to drivers.',
  'তারিখ এবং সময় নির্বাচন করুন।': 'Please select a date and time.',
  'সিডিউল করা রাইডের জন্য ভবিষ্যৎ সময় নির্বাচন করুন।': 'Please select a future time for the scheduled ride.',
  'আগাম রাইডের জন্য কমপক্ষে ২ ঘণ্টা সময় প্রয়োজন।': 'A scheduled ride needs at least 2 hours.',
  'দয়া করে একটি বৈধ ভাড়া লিখুন (ন্যূনতম ₹100)।': 'Please enter a valid fare (minimum ₹100).',
  '✅ চালক আপনার আগাম রাইড গ্রহণ করেছেন': '✅ Driver has accepted your scheduled ride.',
  '❌ কোনো চালক এই রাইডটি গ্রহণ করেননি': '❌ No driver accepted this scheduled ride.',
  'তুমি কোথা থেকে যাবে?': 'Select Pickup',
  'গ্রামের নাম লিখুন।': 'Village',
  'গ্রাম নির্বাচন করুন': 'Select Village',
  'স্টপেজ': 'Stoppage',
  'স্টপেজ নির্বাচন করুন': 'Select Stoppage',
  'তুমি কোথায় যাবে?': 'Select Destination',
  'মোট দূরত্ব:': 'Total Distance:',
  'ভাড়া উক্তি:': 'Fare Quote:',
  'কাছাকাছি স্থানের নাম লিখুন': 'Landmark (Optional)',
  'যেমন: বড় বটগাছের পাশে': 'e.g. near banyan tree',
  'টোটো খুঁজুন': 'Find Ride',
  'জনপ্রিয় স্থান (তাত্ক্ষণিক বুকিং)': 'Popular Places',
  'প্রথমে শুরুর স্থান সেট করুন, তারপর গন্তব্যে ক্লিক করুন।': 'First select pickup, then drop.',
  'নতুন স্টপেজ যোগ করুন': 'Add New Stoppage',
  'নতুন গ্রাম যোগ করুন': 'Add New Village',
  'গ্রামের নাম': 'Village Name',
  'যেমন: নতুন গ্রাম': 'e.g. New Village',
  'নতুন গ্রাম যোগ করা হয়েছে।': 'New village added.',
  'গ্রাম যোগ করতে সমস্যা হয়েছে।': 'Error adding village.',
  'গ্রামের নাম লিখুন।': 'Enter village name.',
  'স্টপেজের নাম': 'Stoppage Name',
  'যেমন: করাটিয়া মন্দির': 'e.g. Karatia Temple',
  'যোগ করুন': 'Add',
  'ড্রাইভার প্যানেল': 'Driver Panel',
  'স্বাগতম': 'Welcome',
  'অফলাইন': 'Offline',
  'অনলাইন': 'Online',
  'আজকের রাইড': 'Today\'s Rides',
  'আজকের আয়': 'Today\'s Income',
  'রেটিং': 'Rating',
  'নতুন রাইড অনুরোধ': 'New Ride Requests',
  'অনলাইন যান এবং নতুন রাইড রিকোয়েস্টের জন্য অপেক্ষা করুন।': 'Go online for ride requests.',
  'চলতি ট্রিপ প্রগতিশীল': 'Trip in Progress',
  'গ্রাহকের নাম': 'Customer Name',
  'আমার প্রোফাইল': 'My Profile',
  '✉️ ইমেইল:': '✉️ Email:',
  '📱 ফোন:': '📱 Phone:',
  '🔢 গাড়ির নম্বর:': '🔢 Vehicle No:',
  '📊 মোট রাইড:': '📊 Total Rides:',
  '⭐ রেটিং:': '⭐ Rating:',
  'প্রোফাইল এডিট করুন': 'Edit Profile',
  'লগআউট': 'Logout',
  'রাইড হিস্টরি': 'Ride History',
  'কোনো রাইড নেই': 'No rides',
  'প্রিয় স্থান': 'Favorite Places',
  'কোনো প্রিয় স্থান নেই': 'No favorite places',
  'হোম': 'Home',
  'প্রিয়': 'Favorites',
  'রাইড': 'Rides',
  'প্রোফাইল': 'Profile',
  'রিফ্রেশ': 'Refresh',
  'বিজ্ঞপ্তি': 'Notification',
  'ঠিক আছে': 'OK',
  'রাইড চলছে...': 'Ride in Progress...',
  'চালকের নাম': 'Driver Name',
  '📞 কল করুন': '📞 Call',
  'পিকআপ:': 'Pickup:',
  'গন্তব্য:': 'Dropoff:',
  'দূরত্ব:': 'Distance:',
  'ভাড়া:': 'Fare:',
  'ট্রিপ সমাপ্ত করুন': 'End Trip',
  'ট্রিপ শুরু করুন': 'Start Trip',
  'চালকের ট্রিপ শুরু করার অপেক্ষায়...': 'Waiting for driver to start...',
  'আপনার ট্রিপ চলছে...': 'Your trip is going on...',
  'ট্রিপ শুরু করতে সমস্যা হয়েছে।': 'Failed to start trip.',
  'গাড়ি খোঁজা হচ্ছে...': 'Looking for Toto...',
  'চালকের জন্য অপেক্ষা করুন': 'Wait for Driver',
  'অপেক্ষা করুন...': 'Please wait...',
  'সেভ করুন': 'Save',
  'বাতিল': 'Cancel',
  'আপনার ট্রিপটি সফলভাবে সম্পন্ন হয়েছে। ধন্যবাদ!': 'Trip completed successfully!',
  'আপনার একটি রাইড ইতিমধ্যে খোঁজা হচ্ছে।': 'A ride is already searching.',
  'দয়া করে প্রথমে আপনার শুরুর স্থান (পিকআপ) নির্বাচন করুন।': 'Please select pickup location.',
  'শুরুর স্থান এবং গন্তব্য একই হতে পারে না।': 'Pickup and dropoff must differ.',
  'আপনার বুকিং অনুরোধটি চালকদের পাঠানো হয়েছে।': 'Booking request sent to drivers.',
  'বুকিং করতে সমস্যা হচ্ছে, আবার চেষ্টা করুন।': 'Booking failed, please try again.',
  'রাইড শেষ করা হয়েছে।': 'Ride ended.',
  'রাইড শেষ করতে সমস্যা হয়েছে।': 'Error ending ride.',
  'নতুন স্টপেজ যোগ করা হয়েছে।': 'Stoppage added.',
  'স্টপেজ যোগ করতে সমস্যা হয়েছে।': 'Error adding stoppage.',
  'গ্রাম এবং নতুন স্টপেজের নাম লিখুন।': 'Enter village and stoppage.',
  'আপনার একটি ট্রিপ চলমান রয়েছে।': 'You have an active trip.',
  'উপলব্ধ রাইড খুঁজছি...': 'Searching for rides...',
  'এই মুহূর্তে কোনো বুকিং অনুরোধ নেই।': 'No requests currently.',
  'গ্রহণ করুন': 'Accept',
  'প্রত্যাখ্যান করুন': 'Reject',
  'যাত্রীর অনুমোদনের জন্য অপেক্ষা করা হচ্ছে...': 'Waiting for passenger approval...',
  'রাইডটি ইতিমধ্যে অন্য কেউ নিয়ে নিয়েছে অথবা বাতিল হয়েছে।': 'Ride taken or cancelled.',
  'রাইড প্রত্যাখ্যান করা হয়েছে।': 'Ride rejected.',
  'যাত্রী ট্রিপটি সমাপ্ত করেছেন।': 'Passenger ended trip.',
  'ট্রিপ শেষ': 'Trip Ended',
  'ত্রুটি': 'Error',
  'সফলতা': 'Success',
  'সফল': 'Success',
  'অনুরোধ পাঠানো হয়েছে': 'Request Sent',
  'অপেক্ষা করুন': 'Please Wait',
  'শুরুর স্থান প্রয়োজন': 'Pickup Needed',
  'গন্তব্য সেট হয়েছে': 'Destination Set',
  'আপনার ট্রিপটি বাতিল হয়েছে।': 'Trip was cancelled.',
  'আমরা আপনার জন্য খুঁজছি': 'We are looking for you',
  'কাছাকাছি একটি গাড়ি খুঁজে বের করা হচ্ছে...': 'Finding a nearby Toto...',
  'নিযুক্ত হচ্ছে...': 'Assigning...',
  'যাত্রী (Passenger)': 'Passenger',
  'টোটো চালক (Driver)': 'Driver',
  'প্রোফাইল এডিট': 'Edit Profile',
  'নাম (First Name)': 'First Name',
  'পদবি (Last Name)': 'Last Name',
  'ফোন নম্বর (পরিবর্তনযোগ্য নয়)': 'Phone (Fixed)',
  'গাড়ির নম্বর (পরিবর্তনযোগ্য নয়)': 'Vehicle No (Fixed)',
  'প্রোফাইল সফলভাবে আপডেট করা হয়েছে।': 'Profile updated.',
  'আপনার চালক': 'Your Driver',
  'কে রেটিং দিন': 'Rate driver',
  'সাবমিট': 'Submit',
  'স্কিপ করুন': 'Skip',
  'আপনার মতামতের জন্য ধন্যবাদ!': 'Thanks for feedback!',
  'ধন্যবাদ': 'Thank you',
  'ট্রিপ সম্পন্ন হয়েছে! 🎉': 'Trip Completed! 🎉',
  'অ্যাকাউন্ট তৈরি হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...': 'Creating account...',
  'ফোন নম্বর ১০ অঙ্কের হতে হবে।': 'Phone must be 10 digits.',
  'গাড়ির নম্বর প্রয়োজনীয়।': 'Vehicle number required.',
  'লগইন করা হচ্ছে...': 'Logging in...',
  'লগইন ব্যর্থ হয়েছে।': 'Login failed.',
  'সাইন আপ ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।': 'Signup failed.',
  'আপনি অফলাইনে আছেন। রাইড পেতে অনলাইন মোড চালু করুন।': 'You are offline. Go online to receive rides.',
  'সেটিংস (Settings)': 'Settings',
  'ভাষা (Language)': 'Language',
  '⏳ চলমান': '⏳ Ongoing',
  '✅ সম্পূর্ণ': '✅ Completed',
  '❌ বাতিল': '❌ Cancelled',
  'অজানা': 'Unknown',
  'খোঁজা হচ্ছে...': 'Searching...',
  'গাড়ি:': 'Vehicle:',
  'বুক করুন': 'Book',
  'আপনার কোনো রাইড হিস্টরি নেই': 'You have no ride history',
  'হিস্টরি লোড করতে সমস্যা হয়েছে।': 'Error loading history.',
  'নতুন রাইড অনুরোধ': 'New Ride Request',
  'চালক গ্রহণ করেছেন': 'Driver Accepted',
  '📌 নিকটবর্তী জায়গা :': '📌 Landmark:',
  'অ্যাডমিন': 'Admin',
  'অ্যাডমিন (Admin)': 'Admin',
  'অ্যাডমিন প্যানেল (Admin Panel)': 'Admin Panel',
  'ব্যবহারকারী (Users)': 'Users',
  'সকল রাইড (Rides)': 'All Rides',
  'লোকেশন (Locations)': 'Locations',
  'কোনো ব্যবহারকারী পাওয়া যায়নি': 'No users found',
  'কোনো রাইড পাওয়া যায়নি': 'No rides found',
  'ডিলিট': 'Delete',
  'আপনি কি নিশ্চিত যে আপনি এই ব্যবহারকারীকে মুছে ফেলতে চান?': 'Are you sure you want to delete this user?',
  'ব্যবহারকারী মুছে ফেলা হয়েছে।': 'User deleted.',
  'মুছে ফেলতে সমস্যা হয়েছে।': 'Error deleting user.',
  'আমরা কীভাবে সাহায্য করতে পারি?': 'How can we help?',
  'যে কোনো সমস্যা বা প্রশ্নের জন্য আমাদের সাথে যোগাযোগ করুন।': 'Contact us for any issues or queries.',
  'কল করুন': 'Call',
  'সময়: 10Am - 10Pm': 'Time: 10Am - 10Pm',
  'ইমেইল করুন': 'Email',
  'ইমেইল পাঠান': 'Send Email',
  'সাহায্য ও সাপোর্ট': 'Help & Support',
  'মতামত (Feedback)': 'Feedback',
  'মতামত দিন (Feedback)': 'Give Feedback',
  'অ্যাপটি উন্নত করতে আপনার মূল্যবান মতামত বা পরামর্শ দিন।': 'Give your valuable feedback or suggestions to improve the app.',
  'এখানে লিখুন...': 'Write here...',
  'আপনার মতামত সফলভাবে জমা হয়েছে। ধন্যবাদ!': 'Your feedback has been submitted successfully. Thank you!',
  'মতামত জমা দিতে সমস্যা হয়েছে।': 'Failed to submit feedback.',
  'কোনো মতামত পাওয়া যায়নি': 'No feedback found',
  '🏪 করাটিয়া বাজার': '🏪 Karatia Bazar',
  '🎓 গুসকরা কলেজ': '🎓 Guskara College',
  '🛣️ গুসকরা মোড়': '🛣️ Guskara More',
  '🚌 শিমুলগ্রাম বাস স্ট্যান্ড': '🚌 Shimulgram Bus Stand',
  '🏪 গুসকরা': '🏪 Guskara',
  '🎓 আউশগ্রাম': '🎓 Ausgram',
  '🛣️ বননবগ্রাম': '🛣️ Bonnabgram',
  '🚌 করটিয়া': '🚌 Karatia',
  'গুসকরা': 'Guskara',
  'আউশগ্রাম': 'Ausgram',
  'বননবগ্রাম': 'Bonnabgram',
  'করটিয়া': 'Karatia',
  '🛣️ বননবগ্ৰাম': '🛣️ Bonnabgram',
  'বননবগ্ৰাম': 'Bonnabgram',
  'গাড়ি চালু করুন': 'Verify & Start',
  'ভুল পিন (Invalid OTP)': 'Invalid OTP',
  'পিন প্রয়োজন': 'PIN Required',
  'দয়া করে যাত্রীর পিন নম্বর লিখুন।': 'Please enter passenger PIN.',
  'আপনার পিন (Your PIN)': 'Your PIN',
  'পিন (PIN)': 'PIN',
  'আপনার গাড়ি বাইরে অপেক্ষা করছে!': 'Your car is waiting outside!',
  'আমি পৌঁছেছি': 'I Have Arrived',
  'আপডেট করতে সমস্যা হয়েছে।': 'Failed to update.',
  'সন্ধ্যা ৬টা থেকে সকাল ৬টা পর্যন্ত ₹10 অতিরিক্ত ভাড়া লাগবে।': '₹10 extra will be charged from 6 PM to 6 AM.',
  'নেভিগেট': 'Navigate',
  'লোকেশন চেক করা হচ্ছে...': 'Getting location...',
  'যোগ করা হয়নি': 'Not Added',
  'ট্রিপ বাতিল করুন': 'Cancel Trip',
  'আপনি কি ট্রিপটি বাতিল করতে চান?': 'Are you sure you want to cancel?',
  'পেনাল্টি বাকি আছে': 'Penalty Due',
  'Penalty Due: আপনার আগের একটি বাতিল রাইডের জন্য ₹30 ফি বাকি আছে।': 'Penalty Due: You have an unpaid ₹30 fee for a previous cancelled ride.',
  'আমি পেমেন্ট করেছি': 'I Have Paid',
  'বন্ধ করুন': 'Close',
  'চালকের কনফার্মেশনের জন্য অপেক্ষা করা হচ্ছে...': 'Waiting for driver confirmation...',
  'হ্যাঁ, আমি ₹30 পেয়েছি': 'Yes, I received ₹30',
  'আপনার অনুরোধ চালকের কাছে পাঠানো হয়েছে। চালক নিশ্চিত করলে আপনি নতুন রাইড বুক করতে পারবেন।': 'Request sent to driver. Once confirmed, you can book a new ride.',
  '💳 এখনই পে করুন (Pay Now)': '💳 Pay Now',
  '৫ মিনিট পার হওয়ায় ট্রিপ বাতিল হয়েছে এবং যাত্রীকে ₹30 পেনাল্টি দেওয়া হয়েছে।': 'Ride cancelled due to 5 min timeout, and a ₹30 penalty applied to the passenger.',
  '📜 শর্তাবলী (Terms)': '📜 Terms & Conditions',
  '🔒 গোপনীয়তা (Privacy)': '🔒 Privacy Policy',
  'রুট ম্যানেজমেন্ট (Routes)': 'Route Management',
  'নতুন রুট যোগ করুন': 'Add New Route',
  'রুটের নাম': 'Route Name',
  'যেমন: গুসকরা - আউশগ্রাম লাইন': 'e.g. Guskara - Ausgram Line',
  'এই রুটের গ্রামগুলি (ক্রমানুসারে নির্বাচন করুন)': 'Villages in this route (select and order)',
  'রুট যোগ করুন': 'Add Route',
  'রুট আপডেট করুন': 'Update Route',
  'রুট মুছে ফেলা হয়েছে।': 'Route deleted.',
  'রুট যোগ করা হয়েছে।': 'Route added.',
  'রুট আপডেট করা হয়েছে।': 'Route updated.',
  'আপনি কি নিশ্চিত যে আপনি এই রুটটি মুছে ফেলতে চান?': 'Are you sure you want to delete this route?',
  'টিপে ধরে টেনে এনে সাজান (Drag to reorder)': 'Drag to reorder',
  'আজকের রুট (Today\'s Route)': 'Today\'s Route',
  'রুট নির্বাচন করুন...': 'Select Route...',
  'অনলাইন হওয়ার আগে আজকের রুট নির্বাচন করুন।': 'Please select today\'s route before going online.',
  '📥 এক্সেল ডাউনলোড (Download Backup)': '📥 Download Excel Backup',
  'এক্সেল ফাইল ডাউনলোড সফল হয়েছে।': 'Excel file downloaded successfully.',
  'ফাইল ডাউনলোড করতে সমস্যা হয়েছে।': 'Failed to download file.',
  'গোশালা মোড়': 'Goshala More',
  'পুলগোড়া ট্যাক্সি স্ট্যান্ড': 'Pulgora Taxi Stand',
  'আউশগ্রাম বাসস্ট্যান্ড': 'Ausgram Bus Stand',
  'আউশগ্রাম হাসপাতাল': 'Ausgram Hospital',
  'আউশগ্রাম থানা': 'Ausgram Police Station',
  'করাটিয়া মোড়': 'Karatia More',
  'করাটিয়া হাই স্কুল': 'Karatia High School',
  'নোটিফিকেশন ব্লক করা আছে': 'Notifications Blocked',
  'আপনি নোটিফিকেশন ব্লক করে রেখেছেন। রাইডের অ্যালার্ট পেতে, অনুগ্রহ করে আপনার ব্রাউজার সেটিংসে গিয়ে এই সাইটের জন্য নোটিফিকেশন চালু করুন।': 'You have blocked notifications. To receive ride alerts, please enable notifications for this site in your browser settings.',
  'এই ব্রাউজারে পুশ নোটিফিকেশন সাপোর্ট করে না।': 'Push notifications are not supported in this browser.',
  'নোটিফিকেশন সেট আপ করতে সমস্যা হয়েছে।': 'Problem setting up notifications.',
  'নোটিফিকেশন সেট আপ করতে একটি ত্রুটি হয়েছে।': 'An error occurred while setting up notifications.',
  'নোটিফিকেশন সার্ভিস চালু করতে সমস্যা হয়েছে।': 'Problem starting notification service.',
  'করাটিয়া হাই স্কুল': 'Karatia High School',
  'করাটিয়া বাজার': 'Karatia Bazar',
  'করাটিয়া স্বাস্থ্যকেন্দ্র': 'Karatia Health Centre',
  'গুসকরা': 'Guskara',
  'আউশগ্রাম': 'Ausgram',
  'করাটিয়া': 'Karatia',
  'ইনস্টল অ্যাপ': 'Install App',
  'Add TotoBondhu to your home screen for quick access!': 'Add TotoBondhu to your home screen for quick access!',
  'Install': 'Install',
  'No Thanks': 'No Thanks',
  'Installed!': 'Installed!',
  'TotoBondhu has been added to your home screen.': 'TotoBondhu has been added to your home screen.',
  'Installation Cancelled': 'Installation Cancelled',
  'You can install the app later from your browser menu.': 'You can install the app later from your browser menu.'
};
uiTranslations['কোন পরিষেবা দেবেন?:'] = 'Vehicle Type:';
uiTranslations['অ্যাপ'] = 'Download App';

let currentLang = localStorage.getItem('toto_lang') || 'bn';

const locationTranslations = {
  'করাটিয়া বাজার': 'Karatia Bazar',
  'করাটিয়া স্কুল মোড়': 'Karatia School More',
  'করাটিয়া মোড়': 'Karatia More',
  'গুসকরা কলেজ': 'Guskara College',
  'গুসকরা মোড়': 'Guskara More',
  'শিমুলগ্রাম বাস স্ট্যান্ড': 'Shimulgram Bus Stand',
  'শিমুলগ্রাম পেট্রোল পাম্প': 'Shimulgram Petrol Pump',
  'হাসপাতাল মোড়': 'Hospital More',
  'স্টেশন রোড': 'Station Road',
  'বাজার ঘাট': 'Bazar Ghat',
  'স্কুল মোড়': 'School More',
  'করাপাড়া মোড়': 'Korapara More',
  'গোশালা মোড়': 'Goshala More',
  'পুলগোড়া ট্যাক্সি স্ট্যান্ড': 'Pulgora Taxi Stand',
  'আউশগ্রাম বাসস্ট্যান্ড': 'Ausgram Bus Stand',
  'আউশগ্রাম হাসপাতাল': 'Ausgram Hospital',
  'আউশগ্রাম থানা': 'Ausgram Police Station',
  'করাটিয়া মোড়': 'Karatia More',
  'করাটিয়া হাই স্কুল': 'Karatia High School',
  'করাটিয়া বাজার': 'Karatia Bazar',
  'করাটিয়া স্বাস্থ্যকেন্দ্র': 'Karatia Health Centre',
  'করাটিয়া': 'Karatia',
  'গুসকরা': 'Guskara',
  'শিমুলগ্রাম': 'Shimulgram',
  'আউশগ্রাম': 'Ausgram',
  'বননবগ্রাম': 'Bonnabgram',
  'করটিয়া': 'Karatia',
  'বননবগ্ৰাম': 'Bonnabgram',
  'পোস্ট অফিস মোড়': 'Post Office More',
  "গাড়ি খানা": "Gari Khana",
  "পুলগোড়া": "Pulgora",
  "ট্যাক্সি স্ট্যান্ড": "Taxi Stand",
  "কোর্ট মোড়": "Court More",
  "আলুটিয়া": "Alutia",
  "সোমাইপুর": "Somaipur",
  "বসন্তপুর": "Basantapur",
  "আলেফনগর": "Alefnagar",
  "ওয়ারিশপুর": "Warishpur",
  "দোখলগঞ্জ্": "Dokhalganj ",
  "আলেফনগর": "Alefnagar",
  "হাড়গোড়িয়াডাঙা": "Hargoriadanga",
  "রাধামোহনপুর": "Radhamohanpur",
  "গোপালপাোতা": "Gopalpota",
  "গোপীনাথপুর": "Gopinathpur",
  "সুকান্তপল্লী": "Sukantapally",
  "শোকাডাঙা ": "Sokadanga",
  "বসতপুর": "Boshotpur",
  "ধনকোরা": "Dhonkora",
  "ছোড়া": "Chhora",
  "ভুয়েরা": "Bhuyera",
  "পান্ডুক": "Panduk",
  "কুড়ুমবা": "Kurumba",
  "যাদবগঞ্জ": "Jadabganj",
  "কুমারগঞ্জ": "Kumarganj",
  "সামন্তপাড়া": "Samantapara",
  "সুয়াতা": "Suata",
  "অভিরামপুর": "Abhirampur",
  "আমরাগড়": "Amrargar",
  "মানকার": "Mankar",
  "রামনগর": "Ramnagar",
  "দিঘা": "Digha",
"গোবিন্দপুর": "Gobindapur",
"পিচকুরি" : "Pichkuri",
"বটগ্রাম " : "Batagram",
"ফতেপুর" : "Fotepur",
"ভেদিয়া" : "Bhedia",
"সুপুর" : "Supur",
"রায়পুর" : "Raipur",
"বোলপুর" : "Bolpur",
"সারঙ্গপুর" : "Sarongpur",
"সরুলিয়া" : "Soruliya",
"উজিরপুর" : "Ujirpur",
"জলপাড়া" : "Jalpara",
"চানাক" : "Chanak",
"কাশেমনগর" : "kasemnagar",
"দোনাইপুর" : "Donaipur",
"শিবডা" : "Shibda",
"ঝর্ণা" : "Jharna",
"অর্গ্রাম" : "Orgram",
"রামচন্দ্রপুর" : "Ramchandrapur",
"দৌড়াডাঙা" : "Dauradanga",
"মাহাতা" : "Mahata",
"রামপুর" : "Rampur",
"শিলুট" : "Silut",
"নবগ্রাম" : "Nabagram",
"বেলুটি" : "Beluti",
"জয়কৃষ্ণপুর" : "Jaykrishnapur",
"বেরান্দা" : "Beranda",
"পুবার" : "Pubar",
"উত্তর রামনগর" : "Uttar Ramnagar",
"মোড়বাঁধ" : "Morbandh",
"বাগরাই" : "Bagrai",
"গেঁড়াই" : "Genrai",
"বলরামবাটি" : "Balarambati",
"ভাতকুন্দা" : "Bhatkunda",
"বাহামানপুর" : "Bahamanpur",
"প্রতাপপুর" : "Pratappur",
"কুড়ুমবা" : "Kurumba",
"পিচকুরি" : "Pichkuri",
"বেরান্দা" : "Beranda",
"উক্তা" : "Ukta",
"বুদবুদ" : "Budbud",
"মারো" : "Maro",
"আদুড়িয়া" : "Aduria",
"পড়িশা" : "Parisha",
"দেবসালা" : "Debsala",
"বসুধা" : "Basudha",
"ইলামবাজার" : "Illambazar",
"নামখানা" : "Namkhana",
"হুজুরের খেয়া ঘাট" : "Hujuter Kheya Ghat",
"পাতিবুনিয়া বলিয়াড়া ফেরি ঘাট" : "Patibunia Balikara Ferry Ghat",
"বাগদাঙা ফেরি ঘাট" : "Bagdanga Ferry Ghat",



};

function t(bengaliString) {
  if (!bengaliString) return bengaliString;
  const trimmed = bengaliString.trim();
  if (currentLang === 'en' && uiTranslations[trimmed]) {
    return bengaliString.replace(trimmed, uiTranslations[trimmed]);
  }
  if (currentLang === 'en') {
    let translated = trimmed;
    for (const [bn, en] of Object.entries(locationTranslations)) {
      translated = translated.replace(new RegExp(bn, 'g'), en);
    }
    if (translated !== trimmed) {
      return bengaliString.replace(trimmed, translated);
    }
  }
  return bengaliString;
}

function translateNode(node) {
  if (node.nodeType === 3) { // Text node
    const original = node._origText || node.nodeValue;
    const trimmed = original.trim();
    if (trimmed) {
      if (!node._origText) node._origText = original;

      let translated = trimmed;
      if (currentLang === 'en') {
        translated = uiTranslations[trimmed] || trimmed;

        // Force exact English spelling regardless of HTML typos!
        const lower = trimmed.toLowerCase();
        if (lower === 'totobondhu' || lower === 'totobhandhu' || lower === 'toto bondhu' || lower === 'toto bhandhu' || trimmed === 'টোটোবন্ধু') {
          translated = 'TotoBondhu';
        } else if (lower === 'toto' || trimmed === 'টোটো') {
          translated = 'Toto';
        } else if (lower === 'bondhu' || lower === 'bhandhu' || trimmed === 'বন্ধু') {
          translated = 'Bondhu';
        }
      } else { // 'bn'
        const bnKey = Object.keys(uiTranslations).find(key => uiTranslations[key] === trimmed);
        translated = bnKey || trimmed;

        // Special catch for all spelling variations of TotoBondhu in English!
        const lower = trimmed.toLowerCase();
        if (lower === 'totobondhu' || lower === 'totobhandhu' || lower === 'toto bondhu' || lower === 'toto bhandhu' || trimmed === 'টোটোবন্ধু') {
          translated = 'টোটোবন্ধু';
        } else if (lower === 'toto' || trimmed === 'টোটো') {
          translated = 'টোটো';
        } else if (lower === 'bondhu' || lower === 'bhandhu' || trimmed === 'বন্ধু') {
          translated = 'বন্ধু';
        }
      }

      if (node.nodeValue !== original.replace(trimmed, translated)) {
        node.nodeValue = original.replace(trimmed, translated);
      }
    }
  } else if (node.nodeType === 1) { // Element node
    if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;

    if (node.hasAttribute('placeholder')) {
      const original = node.getAttribute('data-orig-ph') || node.getAttribute('placeholder');
      if (!node.getAttribute('data-orig-ph')) node.setAttribute('data-orig-ph', original);

      let translated = original;
      if (currentLang === 'en') {
        translated = uiTranslations[original] || original;

        // Force exact English spelling regardless of HTML typos!
        const lower = original.toLowerCase();
        if (lower === 'totobondhu' || lower === 'totobhandhu' || lower === 'toto bondhu' || lower === 'toto bhandhu' || original === 'টোটোবন্ধু') {
          translated = 'TotoBondhu';
        } else if (lower === 'toto' || original === 'টোটো') {
          translated = 'Toto';
        } else if (lower === 'bondhu' || lower === 'bhandhu' || original === 'বন্ধু') {
          translated = 'Bondhu';
        }
      } else { // 'bn'
        const bnKey = Object.keys(uiTranslations).find(key => uiTranslations[key] === original);
        translated = bnKey || original;

        // Special catch for all spelling variations of TotoBondhu in placeholders!
        const lower = original.toLowerCase();
        if (lower === 'totobondhu' || lower === 'totobhandhu' || lower === 'toto bondhu' || lower === 'toto bhandhu' || original === 'টোটোবন্ধু') {
          translated = 'টোটোবন্ধু';
        } else if (lower === 'toto' || original === 'টোটো') {
          translated = 'টোটো';
        } else if (lower === 'bondhu' || lower === 'bhandhu' || original === 'বন্ধু') {
          translated = 'বন্ধু';
        }
      }
      node.setAttribute('placeholder', translated);
    }

    node.childNodes.forEach(translateNode);
  }
}

function applyTranslations() {
  translateNode(document.body);

  // Also perfectly handle the Browser Tab Title!
  const titleLower = document.title.toLowerCase();
  if (currentLang === 'bn' && (titleLower.includes('totobondhu') || titleLower.includes('totobhandhu'))) {
    document.title = 'টোটোবন্ধু';
  } else if (currentLang === 'en' && (document.title.includes('টোটোবন্ধু') || titleLower.includes('totobhandhu'))) {
    document.title = 'TotoBondhu';
  }
}

let isForcedLoggedOut = false;
function handleBlockedAccount() {
  if (isForcedLoggedOut) return;
  isForcedLoggedOut = true;
  localStorage.removeItem('toto_active_user');
  localStorage.removeItem('toto_token');
  localStorage.removeItem('toto_active_ride_id');
  currentUser = null;
  activeRideId = null;
  stopNotificationSound();
  clearAllListeners();
  renderApp();
  showPopup('অ্যাকাউন্ট ব্লক করা হয়েছে', 'আপনার অ্যাকাউন্ট ব্লক করা হয়েছে। আপনাকে লগ আউট করা হচ্ছে।', '⛔');
  setTimeout(() => { isForcedLoggedOut = false; }, 5000);
}

// Listen for the custom event dispatched from api.js when an account is blocked
document.addEventListener('account-blocked', handleBlockedAccount);

// --- DOM Core Declarations ---
const authView = document.getElementById('authView');
const signupPanel = document.getElementById('signupPanel');
const loginPanel = document.getElementById('loginPanel');
const authMessage = document.getElementById('authMessage');
const showSignupBtn = document.getElementById('showSignupBtn');
const showLoginBtn = document.getElementById('showLoginBtn');
const customerDashboard = document.getElementById('customerDashboard');
const driverDashboard = document.getElementById('driverDashboard');
const adminDashboard = document.getElementById('adminDashboard');
const profilePage = document.getElementById('profilePage');
const rideHistoryPage = document.getElementById('rideHistoryPage');
const favoriteRidesPage = document.getElementById('favoriteRidesPage');
const helpSupportPage = document.getElementById('helpSupportPage');
const termsPage = document.getElementById('termsPage');
const privacyPage = document.getElementById('privacyPage');
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
const pickupSearch = document.getElementById('pickupSearch');
const dropoffSearch = document.getElementById('dropoffSearch');
const pickupSearchResults = document.getElementById('pickupSearchResults');
const dropoffSearchResults = document.getElementById('dropoffSearchResults');
const pickupColumn = document.getElementById('pickupColumn');
const dropoffColumn = document.getElementById('dropoffColumn');
const pickupSummary = document.getElementById('pickupSummary');
const pickupSummaryText = document.getElementById('pickupSummaryText');
const landmarkInput = document.getElementById('landmarkInput');
const distanceInfoInput = document.getElementById('distanceInfo');
const fareInfoInput = document.getElementById('fareInfo');
const pricePreviewCard = document.getElementById('pricePreviewCard');
const rideSubmitBtn = document.getElementById('rideSubmitBtn');
const acceptedRideCard = document.getElementById('acceptedRideCard');
const endRideBtn = document.getElementById('endRideBtn');
const cancelRideBtn = document.getElementById('cancelRideBtn');
const stopChips = document.querySelectorAll('.stop-chip');

// New fare input elements
const customerFareInputContainer = document.getElementById('customerFareInputContainer');
const custNegFareInput = document.getElementById('custNegFareInput');
const custNegMinusBtn = document.getElementById('custNegMinusBtn');
const custNegPlusBtn = document.getElementById('custNegPlusBtn');
const scheduledRideDateInput = document.getElementById('scheduledRideDate');
const scheduledRideTimeInput = document.getElementById('scheduledRideTime');
const scheduleBookingFields = document.getElementById('scheduleBookingFields');
const bookingModeTabs = document.querySelectorAll('.booking-mode-tab');
const driverBookingTabs = document.querySelectorAll('.driver-booking-tab');
const normalRideRequestStream = document.getElementById('normalRideRequestStream');
const scheduledRideRequestStream = document.getElementById('scheduledRideRequestStream');
const scheduledRideRequestsContainer = document.getElementById('scheduledRideRequests');
const scheduledRequestCountBadge = document.getElementById('scheduledRequestCountBadge');

// Add Stoppage UI
const newStoppageVillageSelect = document.getElementById('newStoppageVillage');
const newStoppageNameInput = document.getElementById('newStoppageName');
const addStoppageBtn = document.getElementById('addStoppageBtn');

// Add Village UI
const newVillageNameInput = document.getElementById('newVillageName');
const addVillageBtn = document.getElementById('addVillageBtn');

// Drivers workflow targets
const availabilityToggleCheckbox = document.getElementById('availabilityToggleCheckbox');
const toggleStatusLabel = document.getElementById('toggleStatusLabel');
const driverActiveRouteSelect = document.getElementById('driverActiveRouteSelect');
const rideRequestsContainer = document.getElementById('rideRequests');
const requestCountBadge = document.getElementById('requestCountBadge');
const driverAcceptedRideCard = document.getElementById('driverAcceptedRideCard');
const driverCancelRideBtn = document.getElementById('driverCancelRideBtn');

// Admin workflow targets
const adminUsersTabBtn = document.getElementById('adminUsersTabBtn');
const adminLocationsTabBtn = document.getElementById('adminLocationsTabBtn');
const adminFeedbackTabBtn = document.getElementById('adminFeedbackTabBtn');
const adminDownloadExcelBtn = document.getElementById('adminDownloadExcelBtn');
const adminUsersPanel = document.getElementById('adminUsersPanel');
const adminLocationsPanel = document.getElementById('adminLocationsPanel');
const adminFeedbackPanel = document.getElementById('adminFeedbackPanel');
const adminRoutesList = document.getElementById('adminRoutesList');
const addRouteForm = document.getElementById('addRouteForm');
const newRouteName = document.getElementById('newRouteName');
const newRouteVillages = document.getElementById('newRouteVillages');
const addRouteBtn = document.getElementById('addRouteBtn');
const editRouteId = document.getElementById('editRouteId');
const routeFormTitle = document.getElementById('routeFormTitle');
const cancelEditRouteBtn = document.getElementById('cancelEditRouteBtn');

// Modals global references
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const rideRequestForm = document.getElementById('rideRequestForm');
const popupOverlay = document.getElementById('popupOverlay');
const popupTitle = document.getElementById('popupTitle');
const popupMessage = document.getElementById('popupMessage');
const popupIcon = document.getElementById('popupIcon');
const popupCloseBtn = document.getElementById('popupCloseBtn');
const sharingConsentActions = document.getElementById('sharingConsentActions');
const sharingConsentCancelBtn = document.getElementById('sharingConsentCancelBtn');
const sharingConsentAcceptBtn = document.getElementById('sharingConsentAcceptBtn');
const rideTypeSelect = document.getElementById('rideTypeSelect');
const userTypeSelect = document.getElementById('userType');
const vehicleNumberWrapper = document.getElementById('vehicleNumberWrapper');

// Feedback targets
const feedbackForm = document.getElementById('feedbackForm');
const feedbackText = document.getElementById('feedbackText');
const feedbackSubmitBtn = document.getElementById('feedbackSubmitBtn');

const FARE_PER_KM = 10;
const BASE_FARE = 10;
const NIGHT_SURCHARGE = 10;
const NIGHT_SURGE_START = 18; // 6 PM
const NIGHT_SURGE_END = 6; // 6 AM

let locationData = [];
let searchableLocations = [];

// --- Global State & Listeners ---
let currentUser = JSON.parse(localStorage.getItem('toto_active_user')) || null;
let activeRideId = localStorage.getItem('toto_active_ride_id') || null;
let selectedBookingMode = 'normal';
let selectedPickup = null; // { villageId, stoppageId, name }
let selectedDropoff = null; // { villageId, stoppageId, name }
let pollInterval = null;
let adminPollInterval = null;
let popupCloseCallback = null;
let sharingConsentAccepted = false;
let rejectedRides = {}; // Track rejected rides with timestamp: { rideId: timestamp }
let knownPendingRideIds = new Set(); // Tracks active requests to avoid repeating the sound
let arrivalTimerInterval = null;
let deferredPrompt; // Global variable to store the beforeinstallprompt event

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallPrompt();
});

window.addEventListener('appinstalled', () => {
  hideInstallPrompt();
  deferredPrompt = null;
  showPopup(t('Installed!'), t('TotoBondhu has been added to your home screen.'), '✅');
});

// --- Location Helpers ---
function populateVillageSelect(selectEl, placeholder) {
  if (!selectEl) return;
  selectEl.innerHTML = `<option value="">${t(placeholder)}</option>`;
  locationData.forEach(village => {
    const option = document.createElement('option');
    option.value = village.id;
    option.textContent = t(village.nameBn);
    selectEl.appendChild(option);
  });
}

function buildSearchableLocations() {
  searchableLocations = [];
  locationData.forEach(village => {
    const bnName = village.nameBn;
    const enName = locationTranslations[bnName] || bnName;
    searchableLocations.push({
      type: 'village', // This is a village
      villageId: village.id,
      stoppageId: village.stoppages?.[0]?.id || village.id,
      name: bnName, // Always store the original Bengali name
      searchString: `${bnName} ${enName}`.toLowerCase(),
      displayText: `📍 ${bnName}` // Always display original Bengali name
    });
    if (village.stoppages) {
      village.stoppages.forEach(stoppage => {
        const sBnName = stoppage.nameBn;
        const sEnName = locationTranslations[sBnName] || sBnName;
        searchableLocations.push({
          type: 'stoppage', // This is a stoppage
          villageId: village.id,
          stoppageId: stoppage.id,
          name: t(sBnName),
          searchString: `${sBnName} ${sEnName} ${bnName} ${enName}`.toLowerCase(),
          displayText: `🚏 ${sBnName} (${bnName})` // Always display original Bengali name
        });
      });
    }
  });
}

function calculatePreviewDistance() {
  const pickupId = selectedPickup?.villageId;
  const dropoffId = selectedDropoff?.villageId;
  if (!pickupId || !dropoffId) return 0;

  if (pickupId === dropoffId) {
    return 3;
  }

  const pickup = locationData.find(v => v.id === pickupId);
  const dropoff = locationData.find(v => v.id === dropoffId);

  if (pickup && pickup.distances && pickup.distances[dropoffId]) {
    return pickup.distances[dropoffId];
  }

  const villageIds = locationData.map(v => v.id);
  const pickupVillageIdx = villageIds.indexOf(pickupId);
  const dropoffVillageIdx = villageIds.indexOf(dropoffId);

  const indexDiff = Math.abs(pickupVillageIdx - dropoffVillageIdx);
  return Number(Math.max(1, indexDiff * 3).toFixed(1));
}

async function loadLocations() {
  try {
    const response = await apiCall('/locations');
    if (response.success && response.villages) {
      locationData = response.villages;
    } else {
      console.warn('Failed to load locations from API:', response.message);
    }
  } catch (error) {
    console.error('Failed to load locations from API:', error);
  }

  buildSearchableLocations();
  populateVillageSelect(newStoppageVillageSelect, t('গ্রাম নির্বাচন করুন'));

  renderPopularPlaces();
  if (typeof favoriteRidesPage !== 'undefined' && !favoriteRidesPage.classList.contains('hidden')) {
    displayFavorites();
  }
}

loadLocations();

// --- Autocomplete Setup ---
function setupAutocomplete(inputId, resultsId, isPickup) {
  const input = document.getElementById(inputId);
  const results = document.getElementById(resultsId);
  if (!input || !results) return;

  input.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    results.innerHTML = '';
    if (!val) {
      results.classList.add('hidden');
      if (isPickup) selectedPickup = null;
      else selectedDropoff = null;
      updateRidePreview();
      updateRideButtonState();
      return;
    }

    const matches = searchableLocations.filter(loc => loc.searchString.includes(val) || loc.displayText.toLowerCase().includes(val));

    if (matches.length > 0) {
      matches.forEach(match => {
        const div = document.createElement('div');
        div.style.cssText = "padding: 12px 15px; cursor: pointer; border-bottom: 1px solid #eee; color: var(--text-color); font-weight: 500;";
        div.textContent = match.displayText;
        div.addEventListener('click', () => {
          input.value = match.name;
          results.classList.add('hidden');
          if (isPickup) {
            selectedPickup = match;
            if (dropoffColumn) dropoffColumn.classList.remove('hidden');
            updateRideButtonState();
          } else {
            selectedDropoff = match;
            updateRideButtonState();
          }
          updateRidePreview();
        });
        results.appendChild(div);
      });
      results.classList.remove('hidden');
    } else {
      results.classList.add('hidden');
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target !== input && e.target !== results) {
      results.classList.add('hidden');
    }
  });
}

setupAutocomplete('pickupSearch', 'pickupSearchResults', true);
setupAutocomplete('dropoffSearch', 'dropoffSearchResults', false);

custNegMinusBtn?.addEventListener('click', () => {
  const currentFare = parseInt(custNegFareInput.value) || 0;
  custNegFareInput.value = Math.max(10, currentFare - 10);
  updateRideButtonState();
});

custNegPlusBtn?.addEventListener('click', () => {
  const currentFare = parseInt(custNegFareInput.value) || 0;
  custNegFareInput.value = currentFare + 10;
  updateRideButtonState();
});

custNegFareInput?.addEventListener('input', () => {
  updateRideButtonState();
});

scheduledRideDateInput?.addEventListener('input', updateRideButtonState);
scheduledRideTimeInput?.addEventListener('input', updateRideButtonState);

function setBookingMode(mode) {
  selectedBookingMode = mode;
  const isSchedule = mode === 'schedule';

  bookingModeTabs.forEach(tab => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle('active', active);
    tab.style.background = active ? '#0d6b46' : '#fff';
    tab.style.color = active ? '#fff' : '#0f172a';
    tab.style.borderColor = active ? '#0d6b46' : '#ddd';
  });

  if (scheduleBookingFields) {
    scheduleBookingFields.classList.toggle('hidden', !isSchedule);
  }

  if (rideSubmitBtn) {
    rideSubmitBtn.textContent = isSchedule ? t('আগে থেকে বুক করুন') : t('রাইড খুঁজুন');
  }

  if (isSchedule && (!custNegFareInput || Number(custNegFareInput.value) < 100)) {
    if (custNegFareInput) custNegFareInput.value = 100;
  }

  updateRideButtonState();
}

bookingModeTabs.forEach(tab => {
  tab.addEventListener('click', () => setBookingMode(tab.dataset.mode));
});

function setDriverBookingMode(mode) {
  driverBookingTabs.forEach(tab => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle('active', active);
    tab.style.background = active ? '#0d6b46' : '#fff';
    tab.style.color = active ? '#fff' : '#0f172a';
    tab.style.borderColor = active ? '#0d6b46' : '#ddd';
  });
  normalRideRequestStream?.classList.toggle('hidden', mode !== 'normal');
  scheduledRideRequestStream?.classList.toggle('hidden', mode !== 'schedule');
}

function hideScheduledRequestsAfterAction() {
  scheduledRideRequestStream?.classList.add('hidden');
}

driverBookingTabs.forEach(tab => {
  tab.addEventListener('click', () => setDriverBookingMode(tab.dataset.mode));
});

// --- Global Notification Alert ---
function showPopup(title, message, icon = '🔔', onClose = null) {
  if (!popupOverlay) return;
  popupTitle.textContent = t(title);
  popupMessage.textContent = t(message);
  popupIcon.textContent = icon;
  popupCloseBtn?.classList.remove('hidden');
  sharingConsentActions?.classList.add('hidden');
  popupOverlay.classList.remove('hidden');
  popupOverlay.setAttribute('aria-hidden', 'false');
  popupCloseCallback = onClose;
}

function showSharingConsentPopup() {
  if (!popupOverlay) return;
  popupTitle.textContent = '🛺 টোটো শেয়ারিং — ১ 👤';
  popupMessage.textContent = 'এই রাইডটি শেয়ারিং রাইড। চালক আপনার যাত্রাপথে অন্য যাত্রী তুলতে পারেন। আপনার জন্য ১টি আসন বরাদ্দ থাকবে।\n\nআপনি কি এই নিয়মে সম্মত?';
  popupIcon.textContent = '🛺';
  popupCloseBtn?.classList.add('hidden');
  sharingConsentActions?.classList.remove('hidden');
  popupCloseCallback = null;
  popupOverlay.classList.remove('hidden');
  popupOverlay.setAttribute('aria-hidden', 'false');
}

function hidePopup() {
  popupOverlay.classList.add('hidden');
  popupOverlay.setAttribute('aria-hidden', 'true');
  if (typeof popupCloseCallback === 'function') {
    const cb = popupCloseCallback;
    popupCloseCallback = null;
    cb();
  }
}
popupCloseBtn?.addEventListener('click', hidePopup);
sharingConsentCancelBtn?.addEventListener('click', () => {
  sharingConsentAccepted = false;
  hidePopup();
});
sharingConsentAcceptBtn?.addEventListener('click', () => {
  sharingConsentAccepted = true;
  hidePopup();
});

rideTypeSelect?.addEventListener('change', () => {
  const isSharing = rideTypeSelect.value === 'TOTO_SHARING';
  if (!isSharing) {
    sharingConsentAccepted = false;
    return;
  }
  if (!sharingConsentAccepted) showSharingConsentPopup();
});

function showInstallPrompt() {
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (isInstalled || document.getElementById('install-prompt')) {
    return;
  }

  const installPrompt = document.createElement('div');
  installPrompt.id = 'install-prompt';
  installPrompt.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background: var(--surface-color, #fff);
    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
    padding: 15px;
    box-sizing: border-box;
    z-index: 10000;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    border-top: 1px solid var(--border-light, #eee);
  `;

  installPrompt.innerHTML = `
    <div style="display: flex; align-items: center; gap: 15px;">
      <img src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E🛺%3C/text%3E%3C/svg%3E" alt="TotoBondhu" style="width: 40px; height: 40px; border-radius: 8px;">
      <div>
        <strong style="font-size: 1rem; color: var(--text-main);">${t('ইনস্টল অ্যাপ')}</strong>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin: 2px 0 0 0;">${t('Add TotoBondhu to your home screen for quick access!')}</p>
      </div>
    </div>
    <div style="display: flex; gap: 10px;">
      <button id="install-cancel-btn" class="button secondary" style="padding: 8px 16px;">${t('No Thanks')}</button>
      <button id="install-btn" class="button primary" style="padding: 8px 16px;">${t('Install')}</button>
    </div>
  `;

  document.body.appendChild(installPrompt);

  document.getElementById('install-cancel-btn').addEventListener('click', () => {
    installPrompt.remove();
  });

  document.getElementById('install-btn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    installPrompt.remove();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'dismissed') {
      console.log('User dismissed the install prompt');
    }
    deferredPrompt = null;
  });
}

function hideInstallPrompt() {
  const installPrompt = document.getElementById('install-prompt');
  if (installPrompt) installPrompt.remove();
}

// --- Penalty Modal Helpers ---
function showPenaltyModal(penalty) {
  const modal = document.getElementById('penaltyModal');
  if (!modal) return;
  document.getElementById('penaltyDriverName').textContent = penalty.driverName || t('চালক');
  document.getElementById('penaltyDriverPhone').textContent = penalty.driverPhone || t('Not available');
  document.getElementById('penaltyDriverUpi').textContent = penalty.driverUpiId || t('Not Added');

  const payNowBtn = document.getElementById('payNowUpiBtn');
  const btn = document.getElementById('markPenaltyPaidBtn');
  const msg = document.getElementById('penaltyStatusMsg');

  if (penalty.driverUpiId && penalty.status !== 'pending_confirmation') {
    const upiLink = `upi://pay?pa=${encodeURIComponent(penalty.driverUpiId)}&pn=${encodeURIComponent(penalty.driverName || 'Driver')}&am=${penalty.amount || 30}&cu=INR&tn=TotoBondhu%20Penalty`;
    if (payNowBtn) {
      payNowBtn.href = upiLink;
      payNowBtn.classList.remove('hidden');
    }
  } else {
    if (payNowBtn) payNowBtn.classList.add('hidden');
  }

  if (penalty.status === 'pending_confirmation') {
    btn.classList.add('hidden');
    msg.classList.remove('hidden');
  } else {
    btn.classList.remove('hidden');
    msg.classList.add('hidden');
  }

  modal.classList.remove('hidden');
}

document.getElementById('closePenaltyBtn')?.addEventListener('click', () => {
  document.getElementById('penaltyModal').classList.add('hidden');
});

document.getElementById('markPenaltyPaidBtn')?.addEventListener('click', async () => {
  const btn = document.getElementById('markPenaltyPaidBtn');
  btn.disabled = true;
  btn.textContent = t('অপেক্ষা করুন...');
  try {
    const res = await apiCall('/rides/penalty/mark-paid', 'POST');
    if (res.success) {
      btn.classList.add('hidden');
      document.getElementById('penaltyStatusMsg').classList.remove('hidden');
      showPopup('সফল', 'আপনার অনুরোধ চালকের কাছে পাঠানো হয়েছে। চালক নিশ্চিত করলে আপনি নতুন রাইড বুক করতে পারবেন।', '✅');
    }
  } catch (e) {
    showPopup('ত্রুটি', 'পেমেন্ট স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।', '❌');
  } finally {
    btn.disabled = false;
    btn.textContent = t('আমি পেমেন্ট করেছি');
  }
});

// --- Section Routing ---
function showSection(section) {
  if (adminPollInterval) {
    clearInterval(adminPollInterval);
    adminPollInterval = null;
  }
  authView.classList.add('hidden');
  customerDashboard.classList.add('hidden');
  driverDashboard.classList.add('hidden');
  if (adminDashboard) adminDashboard.classList.add('hidden');
  profilePage.classList.add('hidden');
  rideHistoryPage.classList.add('hidden');
  favoriteRidesPage.classList.add('hidden');
  if (helpSupportPage) helpSupportPage.classList.add('hidden');
  if (termsPage) termsPage.classList.add('hidden');
  if (privacyPage) privacyPage.classList.add('hidden');
  section.classList.remove('hidden');
}

function setProfileAvatar(element, user) {
  if (!element) return;
  const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';
  const fallback = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="80" fill="#e8f5ef"/><text x="80" y="105" text-anchor="middle" font-size="76">👤</text></svg>`
  )}`;
  element.onerror = () => {
    element.onerror = null;
    element.src = fallback;
  };
  element.src = user?.profilePhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
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
  profileRoleEl.textContent = currentUser.userType === 'passenger' ? t('যাত্রী (Passenger)') : (currentUser.userType === 'admin' ? t('অ্যাডমিন (Admin)') : t('টোটো চালক (Driver)'));
  setProfileAvatar(profileAvatarEl, currentUser);

  // Hide Favorites Menu for Drivers and Admins
  const navFavBtn = document.getElementById('navFavBtn');
  if (currentUser.userType === 'driver' || currentUser.userType === 'admin') {
    if (navFavBtn) navFavBtn.classList.add('hidden');
    document.querySelectorAll('.menu-item').forEach(item => {
      if (item.textContent.includes('প্রিয়') || item.textContent.includes('Favorite')) {
        item.classList.add('hidden');
      }
    });
  } else {
    if (navFavBtn) navFavBtn.classList.remove('hidden');
    document.querySelectorAll('.menu-item').forEach(item => {
      if (item.textContent.includes('প্রিয়') || item.textContent.includes('Favorite')) {
        item.classList.remove('hidden');
      }
    });
  }

  // Show home dashboard by default
  showHomePage();
}

function clearAllListeners() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  if (adminPollInterval) {
    clearInterval(adminPollInterval);
    adminPollInterval = null;
  }
  if (arrivalTimerInterval) {
    clearInterval(arrivalTimerInterval);
    arrivalTimerInterval = null;
  }
}

// --- Navigation Functions ---
function showHomePage() {
  if (currentUser.userType === 'passenger') {
    showSection(customerDashboard);
    setupCustomerDashboard();
  } else if (currentUser.userType === 'driver') {
    showSection(driverDashboard);
    setupDriverDashboard();
  } else if (currentUser.userType === 'admin') {
    showSection(adminDashboard);
    setupAdminDashboard();
  }
  updateNavButtons('home');
}

function addAdminStyles() {
    if (document.getElementById('admin-styles')) return;
    const style = document.createElement('style');
    style.id = 'admin-styles';
    style.innerHTML = `
        @keyframes item-fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .admin-user-card {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            border-radius: 10px;
            background: var(--surface-color, #fff);
            border: 1px solid var(--border-light, #eee);
            margin-bottom: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.04);
            animation: item-fade-in 0.4s ease-out forwards;
            opacity: 0;
        }

        .admin-user-card.is-blocked {
            background-color: #fff0f0;
            border-left: 4px solid var(--danger-color, #ff3b30);
        }

        .admin-user-info { display: flex; align-items: center; gap: 12px; flex-grow: 1; min-width: 200px; }
        .admin-user-avatar { width: 40px; height: 40px; border-radius: 50%; background-color: var(--surface-dim); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; color: var(--text-main); }
        .admin-user-details p, .admin-user-details div { margin: 0; line-height: 1.3; }
        .admin-user-name { font-weight: 600; font-size: 1rem; color: var(--text-main); }
        .admin-user-meta { font-size: 0.8rem; color: var(--text-muted); display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; margin-top: 2px; }
        .admin-user-meta .badge { font-size: 0.7rem; padding: 2px 7px; border-radius: 10px; font-weight: 600; }
        .admin-user-actions { display: flex; gap: 8px; flex-shrink: 0; }

        @media (max-width: 600px) {
            .admin-user-card { flex-direction: column; align-items: flex-start; }
            .admin-user-actions { width: 100%; justify-content: flex-end; margin-top: 10px; }
        }
    `;
    document.head.appendChild(style);
}

async function setupAdminDashboard() {
  showSection(adminDashboard);
  updateNavButtons('home');
  loadAdminStats(); // Initial load
  addAdminStyles(); // Inject styles for the user list

  if (adminPollInterval) clearInterval(adminPollInterval);
  adminPollInterval = setInterval(() => {
    loadAdminStats();
  }, 16000); // Poll every 16 seconds

  // Replace the admin tabs container for better responsiveness. This finds the
  // container with the rigid, centered layout and replaces it with a flexible,
  // wrapping layout that works better on all screen sizes.
  const adminTabsContainer = adminUsersTabBtn?.parentElement;
  if (adminTabsContainer && adminTabsContainer.style.justifyContent === 'center') {
    const newContainer = document.createElement('div');
    newContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;';
    while (adminTabsContainer.firstChild) {
      newContainer.appendChild(adminTabsContainer.firstChild);
    }
    adminTabsContainer.parentNode.replaceChild(newContainer, adminTabsContainer);
  }

  // Load initial tab by default
  if (adminUsersTabBtn) adminUsersTabBtn.click();
}

async function showProfilePage() {
  showSection(profilePage);
  updateNavButtons('profile');

  // Fetch fresh profile data to get latest ratings
  try {
    const response = await apiCall('/auth/profile');
    if (response.success) {
      currentUser = response.user;
      localStorage.setItem('toto_active_user', JSON.stringify(currentUser));
    }
  } catch (err) {
    // Handle blocked account
    if (err.message === 'ACCOUNT_BLOCKED') {
      showPopup('অ্যাকাউন্ট ব্লক করা হয়েছে', 'আপনার অ্যাকাউন্ট ব্লক করা হয়েছে। আপনাকে লগ আউট করা হচ্ছে।', '⛔', () => {
        sidebarLogoutBtn.click(); // Use existing logout logic
      });
      return; // Stop further execution
    }
  }

  displayProfileInfo();
}

function showRideHistoryPage() {
  showSection(rideHistoryPage);
  updateNavButtons('history');
  const header = document.querySelector('#rideHistoryPage .page-header h2');
  if (header) {
    header.textContent = currentUser.userType === 'admin' ? t('সকল রাইড (Rides)') : t('রাইড হিস্টরি');
  }
  displayRideHistory();

  if (currentUser.userType === 'admin') {
    adminPollInterval = setInterval(() => displayRideHistory(true), 16000);
  }
}

function showFavoritesPage() {
  showSection(favoriteRidesPage);
  updateNavButtons('favorites');
  displayFavorites();
}

function showHelpPage() {
  showSection(helpSupportPage);
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
}

function showTermsPage() {
  showSection(termsPage);
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
}

function showPrivacyPage() {
  showSection(privacyPage);
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
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
  document.getElementById('profilePageUserType').textContent = currentUser.userType === 'driver' ? t('চালক') : (currentUser.userType === 'admin' ? t('অ্যাডমিন') : t('যাত্রী'));
  document.getElementById('profilePagePhone').textContent = `***${currentUser.phone.slice(-4)}`;
  document.getElementById('profilePageEmail').textContent = currentUser.email || t('লেখা নেই');
  document.getElementById('profilePagePhoneFull').textContent = currentUser.phone;
  document.getElementById('profilePageUpi').textContent = currentUser.upiId || t('যোগ করা হয়নি');
  setProfileAvatar(document.getElementById('profilePageAvatar'), currentUser);
 
  const vehicleDetail = document.getElementById('vehicleNumberDetail');
  const rideTypeDetail = document.getElementById('rideTypeDetail');
  const ratingDetail = document.getElementById('ratingDetail');

  if (currentUser.userType === 'driver') {
    vehicleDetail.classList.remove('hidden');
    rideTypeDetail.classList.remove('hidden');
    if (ratingDetail) ratingDetail.classList.remove('hidden');

    document.getElementById('profilePageVehicle').textContent = currentUser.vehicleNumber || t('না আছে');
    const selectedTypes = getDriverServiceTypes(currentUser);
    const labels = selectedTypes
      .map(type => DRIVER_SERVICE_OPTIONS.find(option => option.value === type)?.label || type)
      .filter(Boolean);
    document.getElementById('profilePageRideType').textContent = labels.join('\n') || t('না আছে');

  } else {
    vehicleDetail.classList.add('hidden');
    rideTypeDetail.classList.add('hidden');
    if (ratingDetail) ratingDetail.classList.add('hidden');
  }

  const stats = getOrInitializeDailyStats();
  document.getElementById('profilePageTotalRides').textContent = stats.totalRides;
  const rating = currentUser.averageRating || 0;
  const reviews = currentUser.totalReviews || 0;
  document.getElementById('profilePageRating').textContent = `⭐ ${rating} (${reviews} রিভিউ)`;
}

async function displayRideHistory(isPolling = false) {
  const historyList = document.getElementById('rideHistoryList');
  if (!historyList) return;

  if (!isPolling) {
    historyList.innerHTML = `<p class="muted-text center-block">${t('লোড হচ্ছে...')}</p>`;
  }

  try {
    if (currentUser.userType === 'admin') {
      const res = await apiCall('/admin/rides');
      if (res.success && res.rides.length > 0) {
        const dateLocale = currentLang === 'en' ? 'en-US' : 'bn-BD';
        historyList.innerHTML = res.rides.map(r => `
          <div class="request-item" style="margin-bottom: 10px;">
            <p>🕒 ${new Date(r.createdAt).toLocaleString(dateLocale)} <span class="badge" style="float:right;">${t(r.rideStatus)}</span></p>
            <p>👤 ${t('যাত্রী')}: ${r.passengerId ? r.passengerId.firstName + ' ' + r.passengerId.lastName : t('অজানা')}</p>
            <p>🚗 ${t('চালক')}: ${r.driverId ? r.driverId.firstName + ' ' + r.driverId.lastName : t('অজানা')}</p>
            <p>📍 ${t(r.pickupLocation?.address || '')} ➡️ ${t(r.dropoffLocation?.address || '')}</p>
            <p>💰 ₹${r.fare}</p>
            ${r.rating ? `<p>⭐ ${r.rating} ${r.feedback ? '<br>💬 ' + r.feedback : ''}</p>` : ''}
          </div>
        `).join('');
      } else {
        historyList.innerHTML = `<p class="muted-text center-block">${t('কোনো রাইড পাওয়া যায়নি')}</p>`;
      }
      return;
    }

    const response = await apiCall('/rides/user/rides');

    if (!response.success || !response.rides || response.rides.length === 0) {
      historyList.innerHTML = `<p class="muted-text center-block">${t('আপনার কোনো রাইড হিস্টরি নেই')}</p>`;
      return;
    }

    historyList.innerHTML = response.rides.map(ride => {
      const isPassenger = currentUser.userType === 'passenger';
      const otherUser = isPassenger ? ride.driverId : ride.passengerId;
      const otherUserName = otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : (isPassenger ? t('খোঁজা হচ্ছে...') : t('অজানা'));
      const dateLocale = currentLang === 'en' ? 'en-US' : 'bn-BD';
      const rideDate = new Date(ride.createdAt).toLocaleString(dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

      let statusText = t('⏳ চলমান');
      if (ride.rideStatus === 'completed') statusText = t('✅ সম্পূর্ণ');
      else if (ride.rideStatus === 'cancelled') statusText = t('❌ বাতিল');

      return `
        <div class="request-item" style="margin-bottom: 15px;">
          <p>👤 <strong>${isPassenger ? t('চালক') : t('যাত্রী')}: ${otherUserName}</strong> <span class="badge" style="float: right;">${rideDate}</span></p>
          ${ride.driverId && ride.driverId.vehicleNumber ? `<p>🔢 ${t('গাড়ি:')} <strong>${ride.driverId.vehicleNumber}</strong></p>` : ''}
          <p>📍 ${t('পিকআপ:')} ${t(ride.pickupLocation.address)}</p>
          <p>🏁 ${t('গন্তব্য:')} ${t(ride.dropoffLocation.address)}</p>
          <p>💰 ${t('ভাড়া:')} <span class="text-green">₹${ride.fare}</span></p>
          <div class="request-actions" style="margin-top: 10px;">
            <div class="status-badge ${ride.rideStatus}" style="width: 100%; text-align: center; display: block; padding: 10px; background: var(--surface-dim); border-radius: 8px; font-weight: bold;">
              ${statusText}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error("Error loading ride history:", error);
    historyList.innerHTML = `<p class="muted-text center-block">${t('হিস্টরি লোড করতে সমস্যা হয়েছে।')}</p>`;
  }
}

function displayFavorites() {
  const favoritesList = document.getElementById('favoritesList');

  let popularPlaces = [];
  if (locationData && locationData.length > 0) {
    const guskara = locationData.find(v => v.nameBn.includes('গুসকরা'));
    const ausgram = locationData.find(v => v.nameBn.includes('আউশগ্রাম'));
    const bonnabgram = locationData.find(v => v.nameBn.includes('বননবগ্রাম') || v.nameBn.includes('বননবগ্ৰাম'));
    const karatia = locationData.find(v => v.nameBn.includes('করাটিয়া') || v.nameBn.includes('করটিয়া'));

    if (guskara) popularPlaces.push({ name: '🏪 গুসকরা', villageId: guskara.id, stoppageId: guskara.stoppages?.[0]?.id || guskara.id });
    if (ausgram) popularPlaces.push({ name: '🎓 আউশগ্রাম', villageId: ausgram.id, stoppageId: ausgram.stoppages?.[0]?.id || ausgram.id });
    if (bonnabgram) popularPlaces.push({ name: '🛣️ বননবগ্রাম', villageId: bonnabgram.id, stoppageId: bonnabgram.stoppages?.[0]?.id || bonnabgram.id });
    if (karatia) popularPlaces.push({ name: '🚌 করটিয়া', villageId: karatia.id, stoppageId: karatia.stoppages?.[0]?.id || karatia.id });
  }

  if (popularPlaces.length === 0) {
    popularPlaces = [
      { name: '🏪 গুসকরা', villageId: 'guskara', stoppageId: 'guskara-clg' },
      { name: '🎓 আউশগ্রাম', villageId: 'ausgram', stoppageId: 'ausgram-stand' },
      { name: '🛣️ বননবগ্রাম', villageId: 'bonnabgram', stoppageId: 'bonnabgram-stand' },
      { name: '🚌 করটিয়া', villageId: 'karatia', stoppageId: 'karatia-bazar' },
    ];
  }

  if (popularPlaces.length === 0) {
    favoritesList.innerHTML = `<p class="muted-text center-block">${t('কোনো প্রিয় স্থান নেই')}</p>`;
  } else {
    favoritesList.innerHTML = popularPlaces.map(place => `
      <div class="favorite-item">
        <div class="favorite-info">
          <p class="favorite-address" style="font-size: 1.05rem;">${t(place.name)}</p>
        </div>
        <div class="favorite-action">
          <button class="button primary" style="padding: 8px 16px; font-size: 0.85rem;" onclick="bookFavorite('${place.villageId}', '${place.stoppageId}', '${place.name}')">${t('বুক করুন')}</button>
        </div>
      </div>
    `).join('');
  }
}

window.bookFavorite = function (villageId, stoppageId, stopName) {
  if (activeRideId) {
    showPopup('অপেক্ষা করুন', 'আপনার একটি রাইড ইতিমধ্যে খোঁজা হচ্ছে।', '⏳');
    return;
  }

  if (!selectedPickup) {
    showHomePage();
    showPopup('শুরুর স্থান প্রয়োজন', 'দয়া করে প্রথমে আপনার শুরুর স্থান (পিকআপ) নির্বাচন করুন।', '📍');
    return;
  }

  showHomePage();

  selectedDropoff = { type: 'favorite', villageId: villageId, stoppageId: stoppageId, name: t(stopName) };
  if (dropoffSearch) dropoffSearch.value = t(stopName);

  if (dropoffColumn) {
    dropoffColumn.classList.remove('hidden');
  }
  updateRidePreview();
  updateRideButtonState();
}

async function loadAdminStats() {
  try {
    const res = await apiCall('/admin/stats');
    if (res.success) {
      let statsContainer = document.getElementById('adminStatsContainer');
      if (!statsContainer && adminDashboard) {
        statsContainer = document.createElement('div');
        statsContainer.id = 'adminStatsContainer';
        statsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem;';
        adminDashboard.prepend(statsContainer);
      }

      if (statsContainer) {
        const cardsWrapper = document.createElement('div');
        cardsWrapper.style.cssText = 'display: flex; gap: 1rem; flex-wrap: wrap;';
        cardsWrapper.innerHTML = `
          <div class="card info-card" style="flex: 1; min-width: 150px; text-align: center;">
            <h4 style="margin: 0 0 10px 0;">${t('অনলাইন চালক')}</h4>
            <p id="adminOnlineDriversCount" style="font-size: 2rem; font-weight: bold; margin: 0;">
              🛺 ${res.onlineDriversCount}
            </p>
          </div>
          <div class="card info-card" style="flex: 1; min-width: 150px; text-align: center;">
            <h4 style="margin: 0 0 10px 0;">${t('অনলাইন যাত্রী')}</h4>
            <p id="adminOnlineCustomersCount" style="font-size: 2rem; font-weight: bold; margin: 0;">
              👤 ${res.onlineCustomersCount}
            </p>
          </div>
        `;
        statsContainer.innerHTML = '';
        statsContainer.appendChild(cardsWrapper);

        // Find the download button and move it into the new stats container
        const downloadBtn = document.getElementById('adminDownloadExcelBtn');
        if (downloadBtn) {
          statsContainer.appendChild(downloadBtn);
        }
      }
    }
  } catch (error) {
    console.error('Failed to load admin stats:', error);
    // Optional: show an error in the stats container
    let statsContainer = document.getElementById('adminStatsContainer');
    if (statsContainer) {
      statsContainer.innerHTML = `<p class="muted-text">${t('স্ট্যাটাস লোড করতে সমস্যা হয়েছে।')}</p>`;
    }
  }
}

adminUsersTabBtn?.addEventListener('click', () => {
  adminUsersPanel.classList.remove('hidden');
  adminLocationsPanel.classList.add('hidden');
  adminFeedbackPanel.classList.add('hidden');
  adminUsersTabBtn.classList.add('active');
  adminLocationsTabBtn.classList.remove('active');
  adminFeedbackTabBtn.classList.remove('active');
  loadAdminUsers();
});

adminLocationsTabBtn?.addEventListener('click', () => {
  adminLocationsPanel.classList.remove('hidden');
  adminUsersPanel.classList.add('hidden');
  adminFeedbackPanel.classList.add('hidden');
  adminLocationsTabBtn.classList.add('active');
  adminUsersTabBtn.classList.remove('active');
  adminFeedbackTabBtn.classList.remove('active');
  loadAdminRoutes();
});

adminFeedbackTabBtn?.addEventListener('click', () => {
  adminFeedbackPanel.classList.remove('hidden');
  adminUsersPanel.classList.add('hidden');
  adminLocationsPanel.classList.add('hidden');
  adminFeedbackTabBtn.classList.add('active');
  adminUsersTabBtn.classList.remove('active');
  adminLocationsTabBtn.classList.remove('active');
  loadAdminFeedback();
});

adminDownloadExcelBtn?.addEventListener('click', async () => {
  adminDownloadExcelBtn.disabled = true;
  adminDownloadExcelBtn.textContent = t('অপেক্ষা করুন...');
  try {
    // Fetch all data points concurrently
    const [usersRes, ridesRes, routesRes] = await Promise.all([
      apiCall('/admin/users'),
      apiCall('/admin/rides'),
      apiCall('/routes')
    ]);

    if (typeof XLSX === 'undefined') throw new Error("Excel library not loaded");

    // Format Users Data
    const usersData = (usersRes.users || []).map(u => ({
      'ID': u._id,
      'Name': `${u.firstName} ${u.lastName}`,
      'Phone': u.phone,
      'Role': u.userType,
      'Vehicle No': u.vehicleNumber || '',
      'UPI ID': u.upiId || '',
      'Status': u.isBlocked ? 'Blocked' : 'Active',
      'Joined Date': new Date(u.createdAt).toLocaleString('en-IN')
    }));

    // Format Rides Data
    const ridesData = (ridesRes.rides || []).map(r => ({
      'ID': r._id,
      'Date': new Date(r.createdAt).toLocaleString('en-IN'),
      'Status': r.rideStatus,
      'Passenger': r.passengerId ? `${r.passengerId.firstName} ${r.passengerId.lastName} (${r.passengerId.phone})` : 'Unknown',
      'Driver': r.driverId ? `${r.driverId.firstName} ${r.driverId.lastName} (${r.driverId.phone})` : 'Unknown',
      'Pickup': r.pickupLocation ? r.pickupLocation.address : '',
      'Dropoff': r.dropoffLocation ? r.dropoffLocation.address : '',
      'Distance (km)': r.distance,
      'Fare (₹)': r.fare
    }));

    // Format Routes Data
    const routesData = (routesRes.routes || []).map(r => {
      const villageNames = r.villages.map(vId => {
        const loc = locationData.find(l => l.id === vId || l._id === vId);
        return loc ? loc.nameBn : vId;
      }).join(' ➔ ');
      return {
        'Route Name': r.name,
        'Status': r.isActive ? 'Active' : 'Inactive',
        'Villages': villageNames
      };
    });

    // Build and Trigger Download
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usersData), "Users");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ridesData), "Ride History");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(routesData), "Routes");
    XLSX.writeFile(wb, `TotoBondhu_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);

    showPopup('সফল', 'এক্সেল ফাইল ডাউনলোড সফল হয়েছে।', '✅');
  } catch (e) { showPopup('ত্রুটি', 'ফাইল ডাউনলোড করতে সমস্যা হয়েছে।', '❌'); }
  finally { adminDownloadExcelBtn.disabled = false; adminDownloadExcelBtn.textContent = t('📥 এক্সেল ডাউনলোড (Download Backup)'); }
});

async function loadAdminUsers() {
  const list = document.getElementById('adminUsersList');
  if (!list) return;
  list.innerHTML = `<p class="muted-text center-block">${t('লোড হচ্ছে...')}</p>`;
  try {
    const res = await apiCall('/admin/users');
    if (res.success && res.users.length > 0) {
      list.innerHTML = res.users.map((u, index) => {
        const isBlocked = u.isBlocked === true;
        const blockButtonText = isBlocked ? t('আনব্লক করুন') : t('ব্লক করুন');
        const blockButtonClass = isBlocked ? 'secondary' : 'danger';
        const userTypeKey = u.userType === 'driver' ? 'চালক' : u.userType === 'admin' ? 'অ্যাডমিন' : 'যাত্রী';
        const userTypeText = t(userTypeKey);
        const avatarIcon = u.userType === 'driver' ? '🚗' : (u.userType === 'admin' ? '🛡️' : '👤');

        return `
        <div class="admin-user-card ${isBlocked ? 'is-blocked' : ''}" style="animation-delay: ${index * 50}ms;">
          <div class="admin-user-info">
            <div class="admin-user-avatar">${avatarIcon}</div>
            <div class="admin-user-details">
              <p class="admin-user-name">${u.firstName} ${u.lastName}</p>
              <div class="admin-user-meta">
                <span>📱 ${u.phone}</span>
                ${u.vehicleNumber ? `<span>🔢 ${u.vehicleNumber}</span>` : ''}
                <span class="badge">${userTypeText}</span>
                ${isBlocked ? `<span class="badge" style="background: var(--danger-color); color: white;">${t('ব্লকড')}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="admin-user-actions">
            <button class="button ${blockButtonClass}" style="padding: 5px 10px; font-size: 0.75rem;" onclick="toggleUserBlock('${u._id}', ${!isBlocked})">${blockButtonText}</button>
            <button class="button danger" style="padding: 5px 10px; font-size: 0.75rem;" onclick="deleteAdminUser('${u._id}')">🗑️ ${t('ডিলিট')}</button>
          </div>
        </div>
      `}).join('');
    } else {
      list.innerHTML = `<p class="muted-text center-block">${t('কোনো ব্যবহারকারী পাওয়া যায়নি')}</p>`;
    }
  } catch (error) {
    list.innerHTML = `<p class="muted-text center-block">${t('লোড করতে সমস্যা হয়েছে')}</p>`;
  }
}

window.deleteAdminUser = async function (userId) {
  if (!confirm(t('আপনি কি নিশ্চিত যে আপনি এই ব্যবহারকারীকে মুছে ফেলতে চান?'))) return;

  try {
    const res = await apiCall(`/admin/users/${userId}`, 'DELETE');
    if (res.success) {
      showPopup('সফল', 'ব্যবহারকারী মুছে ফেলা হয়েছে।', '✅');
      loadAdminUsers();
    } else {
      showPopup('ত্রুটি', res.message || 'মুছে ফেলতে সমস্যা হয়েছে।', '❌');
    }
  } catch (error) {
    console.error("Delete user error:", error);
    showPopup('ত্রুটি', 'মুছে ফেলতে সমস্যা হয়েছে।', '❌');
  }
};

window.toggleUserBlock = async function (userId, blockStatus) {
  const action = blockStatus ? t('ব্লক') : t('আনব্লক');
  if (!confirm(`আপনি কি এই ব্যবহারকারীকে ${action} করতে নিশ্চিত?`)) return;

  try {
    const res = await apiCall(`/admin/users/${userId}/block`, 'PUT', { isBlocked: blockStatus });
    if (res.success) {
      showPopup('সফল', blockStatus ? t('ব্যবহারকারী ব্লক করা হয়েছে।') : t('ব্যবহারকারী আনব্লক করা হয়েছে।'), '✅');
      loadAdminUsers();
    } else {
      showPopup('ত্রুটি', res.message || t('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।'), '❌');
    }
  } catch (error) {
    console.error("Toggle block error:", error);
    showPopup('ত্রুটি', t('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।'), '❌');
  }
}

async function loadAdminFeedback() {
  const list = document.getElementById('adminFeedbackList');
  if (!list) return;
  list.innerHTML = `<p class="muted-text center-block">${t('লোড হচ্ছে...')}</p>`;
  try {
    const res = await apiCall('/admin/feedback');
    if (res.success && res.feedbacks.length > 0) {
      list.innerHTML = res.feedbacks.map(f => `
        <div class="request-item" style="margin-bottom: 10px;">
          <p>👤 <strong>${f.userId ? f.userId.firstName + ' ' + f.userId.lastName : t('অজানা')}</strong> <span class="badge" style="float:right;">${new Date(f.createdAt).toLocaleString(currentLang === 'en' ? 'en-US' : 'bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></p>
          ${f.userId && f.userId.userType ? `<p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:5px;">(${t(f.userId.userType === 'driver' ? 'চালক' : f.userId.userType === 'passenger' ? 'যাত্রী' : 'অ্যাডমিন')})</p>` : ''}
          <p style="white-space:pre-wrap; background: var(--surface-color); padding: 10px; border-radius: 8px; border: 1px solid var(--border-light);">💬 ${f.message}</p>
        </div>
      `).join('');
    } else {
      list.innerHTML = `<p class="muted-text center-block">${t('কোনো মতামত পাওয়া যায়নি')}</p>`;
    }
  } catch (error) {
    list.innerHTML = `<p class="muted-text center-block">${t('লোড করতে সমস্যা হয়েছে')}</p>`;
  }
}

async function loadAdminRoutes() {
  if (!adminRoutesList) return;
  adminRoutesList.innerHTML = `<p class="muted-text center-block">${t('লোড হচ্ছে...')}</p>`;
  try {
    const res = await apiCall('/routes');
    if (res.success) {
      renderRoutesList(res.routes);
      populateVillageChecklist(locationData);
    }
  } catch (e) {
    adminRoutesList.innerHTML = `<p class="muted-text center-block">${t('লোড করতে সমস্যা হয়েছে')}</p>`;
  }
}

function renderRoutesList(routes) {
  if (!routes || routes.length === 0) {
    adminRoutesList.innerHTML = `<p class="muted-text center-block">কোনো রুট যোগ করা হয়নি।</p>`;
    return;
  }
  adminRoutesList.innerHTML = routes.map(route => `
    <div class="request-item" style="margin-bottom: 10px;">
      <p><strong>${route.name}</strong></p>
      <p class="muted-text text-sm">${route.villages.map(vId => {
    const loc = locationData.find(l => l.id === vId || l._id === vId);
    return loc ? t(loc.nameBn) : vId;
  }).join(' ➔ ')}</p>
      <div style="text-align: right; margin-top: 8px; display: flex; gap: 8px; justify-content: flex-end;">
        <button class="button secondary" style="padding: 6px 12px; font-size: 0.8rem;" onclick='editRoute(${JSON.stringify(route)})'>✏️ ${t('এডিট')}</button>
        <button class="button danger" style="padding: 6px 12px; font-size: 0.8rem;" onclick="deleteRoute('${route._id}')">🗑️ ${t('ডিলিট')}</button>
      </div>
    </div>
  `).join('');
}

function populateVillageChecklist(villages) {
  if (!newRouteVillages) return;
  newRouteVillages.innerHTML = villages.map(v => {
    const idToUse = v.id || v._id;
    const htmlId = `v-${String(idToUse).replace(/[^a-zA-Z0-9]/g, '_')}`;
    return `
      <li data-id="${idToUse}" draggable="true" class="route-village-item" style="padding: 10px; border-bottom: 1px solid #eee; background: white; cursor: grab; display: flex; align-items: center; gap: 10px; transition: all 0.2s ease;">
        <div class="drag-handle" style="cursor: grab; font-size: 1.5rem; color: #aaa; padding: 0 5px;">☰</div>
        <div class="clickable-area" style="flex: 1; display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 5px 0;">
          <input type="checkbox" value="${idToUse}" id="${htmlId}" class="route-checkbox" style="transform: scale(1.5); margin: 0; cursor: pointer;">
          <label for="${htmlId}" style="flex: 1; cursor: pointer; font-weight: 500; margin: 0; font-size: 1.1rem; user-select: none;">${t(v.nameBn)}</label>
        </div>
      </li>
    `;
  }).join('');
  setupDragAndDrop();

  document.querySelectorAll('.route-village-item').forEach(li => {
    const cb = li.querySelector('.route-checkbox');
    const clickableArea = li.querySelector('.clickable-area');

    const updateBg = () => {
      li.style.background = cb.checked ? '#e8f5e9' : 'white';
      li.style.borderLeft = cb.checked ? '4px solid var(--primary-brand, #09663e)' : 'none';
    };

    cb.addEventListener('change', updateBg);

    clickableArea.addEventListener('click', (e) => {
      if (e.target !== cb && e.target.tagName !== 'LABEL') {
        cb.checked = !cb.checked;
        updateBg();
      }
    });

    // Prevent drag issues when interacting with checkboxes
    clickableArea.addEventListener('mousedown', () => li.setAttribute('draggable', 'false'));
    clickableArea.addEventListener('mouseup', () => li.setAttribute('draggable', 'true'));
    clickableArea.addEventListener('mouseleave', () => li.setAttribute('draggable', 'true'));
    clickableArea.addEventListener('touchstart', () => li.setAttribute('draggable', 'false'), { passive: true });
    clickableArea.addEventListener('touchend', () => li.setAttribute('draggable', 'true'), { passive: true });
  });
}

function setupDragAndDrop() {
  let draggedItem = null;
  newRouteVillages.addEventListener('dragstart', e => {
    draggedItem = e.target;
    setTimeout(() => e.target.style.opacity = '0.5', 0);
  });
  newRouteVillages.addEventListener('dragend', e => {
    setTimeout(() => {
      e.target.style.opacity = '1';
      draggedItem = null;
    }, 0);
  });
  newRouteVillages.addEventListener('dragover', e => {
    e.preventDefault();
    const afterElement = getDragAfterElement(newRouteVillages, e.clientY);
    if (afterElement == null) {
      newRouteVillages.appendChild(draggedItem);
    } else {
      newRouteVillages.insertBefore(draggedItem, afterElement);
    }
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

addRouteForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = editRouteId.value;
  const name = newRouteName.value.trim();
  const selectedVillages = [...newRouteVillages.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);

  if (!name || selectedVillages.length < 2) {
    showPopup('ত্রুটি', 'রুটের নাম এবং কমপক্ষে দুটি গ্রাম নির্বাচন করুন।', '❌');
    return;
  }

  addRouteBtn.disabled = true;
  addRouteBtn.textContent = t('অপেক্ষা করুন...');

  try {
    const payload = { name, villages: selectedVillages };
    const res = id
      ? await apiCall(`/routes/${id}`, 'PUT', payload)
      : await apiCall('/routes', 'POST', payload);

    if (res.success) {
      showPopup('সফল', id ? t('রুট আপডেট করা হয়েছে।') : t('রুট যোগ করা হয়েছে।'), '✅');
      resetRouteForm();
      loadAdminRoutes();
    }
  } catch (error) {
    showPopup('ত্রুটি', error.message || (id ? t('আপডেট করতে সমস্যা হয়েছে।') : t('যোগ করতে সমস্যা হয়েছে।')), '❌');
  } finally {
    addRouteBtn.disabled = false;
    addRouteBtn.textContent = id ? t('রুট আপডেট করুন') : t('রুট যোগ করুন');
  }
});

window.editRoute = function (route) {
  resetRouteForm();
  routeFormTitle.textContent = t('রুট এডিট করুন');
  addRouteBtn.textContent = t('রুট আপডেট করুন');
  editRouteId.value = route._id;
  newRouteName.value = route.name;
  cancelEditRouteBtn.classList.remove('hidden');

  const villageIds = route.villages.map(v => typeof v === 'object' && v !== null ? (v.id || v._id) : v);
  // Uncheck all and re-check and re-order
  const villageItems = [...newRouteVillages.querySelectorAll('li')];
  villageItems.forEach(li => {
    const cb = li.querySelector('input');
    if (cb) cb.checked = false;
    li.style.background = 'white';
    li.style.borderLeft = 'none';
  });

  villageIds.reverse().forEach(id => {
    const li = villageItems.find(item => item.dataset.id === id);
    if (li) {
      const cb = li.querySelector('input');
      if (cb) cb.checked = true;
      li.style.background = '#e8f5e9';
      li.style.borderLeft = '4px solid var(--primary-brand, #09663e)';
      newRouteVillages.prepend(li);
    }
  });
  window.scrollTo({ top: document.getElementById('addRouteForm').offsetTop, behavior: 'smooth' });
}

window.deleteRoute = async function (routeId) {
  if (!confirm(t('আপনি কি নিশ্চিত যে আপনি এই রুটটি মুছে ফেলতে চান?'))) return;
  try {
    const res = await apiCall(`/routes/${routeId}`, 'DELETE');
    showPopup('সফল', t('রুট মুছে ফেলা হয়েছে।'), '✅');
    loadAdminRoutes();
  } catch (e) {
    showPopup('ত্রুটি', e.message || t('মুছতে সমস্যা হয়েছে।'), '❌');
  }
}

function resetRouteForm() {
  addRouteForm.reset();
  editRouteId.value = '';
  routeFormTitle.textContent = t('নতুন রুট যোগ করুন');
  addRouteBtn.textContent = t('রুট যোগ করুন');
  cancelEditRouteBtn.classList.add('hidden');
  // Uncheck all boxes
  newRouteVillages.querySelectorAll('li').forEach(li => {
    const cb = li.querySelector('input');
    if (cb) cb.checked = false;
    li.style.background = 'white';
    li.style.borderLeft = 'none';
  });
}

cancelEditRouteBtn?.addEventListener('click', resetRouteForm);

feedbackForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = feedbackText?.value?.trim();
  if (!message) return;

  feedbackSubmitBtn.disabled = true;
  feedbackSubmitBtn.textContent = t('অপেক্ষা করুন...');
  try {
    const response = await apiCall('/admin/feedback', 'POST', { message });
    if (response.success) {
      showPopup('সফল', 'আপনার মতামত সফলভাবে জমা হয়েছে। ধন্যবাদ!', '✅');
      feedbackText.value = '';
    } else {
      showPopup('ত্রুটি', response.message || 'মতামত জমা দিতে সমস্যা হয়েছে।', '❌');
    }
  } catch (error) {
    showPopup('ত্রুটি', 'মতামত জমা দিতে সমস্যা হয়েছে।', '❌');
  } finally {
    feedbackSubmitBtn.disabled = false;
    feedbackSubmitBtn.textContent = t('জমা দিন');
  }
});

// --- Menu Functions ---
function openSidebar() { sideMenu.classList.add('open'); sideMenuOverlay.classList.remove('hidden'); }
function closeSidebar() { sideMenu.classList.remove('open'); sideMenuOverlay.classList.add('hidden'); }

menuBtn.addEventListener('click', openSidebar);
closeMenuBtn.addEventListener('click', closeSidebar);
sideMenuOverlay.addEventListener('click', closeSidebar);

sidebarLogoutBtn.addEventListener('click', () => {
  if (currentUser) updateOnlineStatus(false);
  localStorage.removeItem('toto_active_user');
  localStorage.removeItem('toto_token');
  localStorage.removeItem('toto_active_ride_id');
  currentUser = null;
  activeRideId = null;
  stopNotificationSound();
  clearAllListeners();
  renderApp();
});

// Sidebar menu links
document.getElementById('menuHome')?.addEventListener('click', () => { closeSidebar(); showHomePage(); });
document.getElementById('menuHistory')?.addEventListener('click', () => { closeSidebar(); showRideHistoryPage(); });
document.getElementById('menuFav')?.addEventListener('click', () => { closeSidebar(); showFavoritesPage(); });
document.getElementById('menuHelp')?.addEventListener('click', () => { closeSidebar(); showHelpPage(); });
document.getElementById('menuTerms')?.addEventListener('click', () => { closeSidebar(); showTermsPage(); });
document.getElementById('menuPrivacy')?.addEventListener('click', () => { closeSidebar(); showPrivacyPage(); });

// Settings Modal Logic
document.getElementById('menuSettings')?.addEventListener('click', () => {
  closeSidebar();
  document.getElementById('languageSelect').value = currentLang;
  document.getElementById('settingsModal').classList.remove('hidden');
});

document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
  document.getElementById('settingsModal').classList.add('hidden');
});

document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
  currentLang = document.getElementById('languageSelect').value;
  localStorage.setItem('toto_lang', currentLang);
  applyTranslations();
  buildSearchableLocations();
  if (newStoppageVillageSelect) populateVillageSelect(newStoppageVillageSelect, 'গ্রাম নির্বাচন করুন');
  document.getElementById('settingsModal').classList.add('hidden');

  // Keeps user on their current page instead of returning to Home!
  if (currentUser) {
    if (!rideHistoryPage.classList.contains('hidden')) displayRideHistory();
    else if (!favoriteRidesPage.classList.contains('hidden')) displayFavorites();
    else if (!profilePage.classList.contains('hidden')) displayProfileInfo();
    else renderApp();
  }
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

// Function to add the download app button to the bottom navigation
function addDownloadAppButton() {
  if (!appBottomNav) return;

  const downloadButton = document.createElement('button'); // Changed to button
  downloadButton.id = 'navDownloadAppBtn';
  downloadButton.classList.add('nav-item');
  downloadButton.style.textDecoration = 'none'; // Remove underline (though buttons don't have it by default, good for consistency)

  downloadButton.innerHTML = `
    <span class="nav-icon"><i class="fas fa-download"></i></span>
    <span class="nav-label">${t('অ্যাপ')}</span> <!-- Changed translation key -->
  `;
  appBottomNav.appendChild(downloadButton);

  // Add event listener to trigger download when the button is clicked
  downloadButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = '/Toto Bondhu.apk'; // Path to your APK file
    link.setAttribute('download', 'Toto Bondhu.apk'); // Suggests a filename for download
    document.body.appendChild(link); // Temporarily add to DOM
    link.click(); // Programmatically click the link
    document.body.removeChild(link); // Remove the link
  });
}

// Logout button in profile page
document.getElementById('logoutProfileBtn')?.addEventListener('click', () => {
  if (currentUser) updateOnlineStatus(false);
  localStorage.removeItem('toto_active_user');
  localStorage.removeItem('toto_token');
  localStorage.removeItem('toto_active_ride_id');
  currentUser = null;
  activeRideId = null;
  stopNotificationSound();
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
    modal.className = 'edit-profile-modal';
    modal.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;justify-content:center;align-items:center;';
    modal.innerHTML = `
      <div class="card edit-profile-card">
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
          <div>
            <label style="font-size:0.9rem;color:var(--text-muted, #666);">ইউপিআই আইডি (UPI ID)</label>
            <input type="text" id="editUpiId" placeholder="যেমন: 9876543210@ybl" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-top:5px;font-size:1rem;">
          </div>
          <div id="editVehicleWrapper" style="display:none;">
            <label style="font-size:0.9rem;color:var(--text-muted, #666);">গাড়ির নম্বর <small>(পরিবর্তনযোগ্য নয়)</small></label>
            <input type="text" id="editVehicle" readonly style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;background:#f5f5f5;color:#888;box-sizing:border-box;margin-top:5px;font-size:1rem;">
          </div>
          <div id="editRideTypeWrapper" style="display:none;">
            <details class="service-picker" id="editServiceTypes" data-service-picker>
              <summary><span>কোন পরিষেবা দেবেন?</span><span class="service-picker-summary" data-service-picker-summary>নির্বাচন করুন</span></summary>
              <div class="service-picker-options">
                ${DRIVER_SERVICE_OPTIONS.map(option => `
                  <label><input type="checkbox" name="serviceTypes" value="${option.value}"><span>${option.label}</span></label>
                `).join('')}
              </div>
            </details>
          </div>
          <div class="edit-profile-actions">
            <button type="submit" class="button primary">সেভ করুন</button>
            <button type="button" id="closeEditProfileBtn" class="button secondary">বাতিল</button>
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
      
      const payload = {
        firstName: document.getElementById('editFirstName').value.trim(),
        lastName: document.getElementById('editLastName').value.trim(),
        upiId: document.getElementById('editUpiId').value.trim()
      };

      if (currentUser.userType === 'driver') {
        payload.serviceTypes = [...document.querySelectorAll('#editServiceTypes input[name="serviceTypes"]:checked')]
          .map(input => input.value);
        if (payload.serviceTypes.length === 0) {
          submitBtn.textContent = 'সেভ করুন';
          submitBtn.disabled = false;
          showPopup('ত্রুটি', 'কমপক্ষে একটি গাড়ি/পরিষেবা নির্বাচন করুন।', '❌');
          return;
        }
      }

      try {
        const response = await apiCall('/auth/profile', 'PUT', payload);
        if (!response.success || !response.user) {
          throw new Error(response.message || 'Profile update failed');
        }
        currentUser = response.user;
        localStorage.setItem('toto_active_user', JSON.stringify(currentUser));
      } catch (err) {
        submitBtn.textContent = 'সেভ করুন';
        submitBtn.disabled = false;
        showPopup('ত্রুটি', err.message || 'প্রোফাইল আপডেট করা যায়নি।', '❌');
        return;
      }

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
  document.getElementById('editUpiId').value = currentUser.upiId || '';
  
  const isDriver = currentUser.userType === 'driver';
  document.getElementById('editVehicleWrapper').style.display = isDriver ? 'block' : 'none';
  document.getElementById('editRideTypeWrapper').style.display = isDriver ? 'block' : 'none';
  if (isDriver) {
    document.getElementById('editVehicle').value = currentUser.vehicleNumber || '';
    const selectedTypes = getDriverServiceTypes(currentUser);
    document.querySelectorAll('#editServiceTypes input[name="serviceTypes"]').forEach(input => {
      input.checked = selectedTypes.includes(input.value);
    });
    updateServicePickerSummary(document.getElementById('editServiceTypes'));
  }

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
    const rideTypeWrapper = document.getElementById('rideTypeWrapper');
    if (userType === 'driver') {
      vehicleWrapper.classList.remove('hidden');
      rideTypeWrapper.classList.remove('hidden');
    } else {
      vehicleWrapper.classList.add('hidden');
      rideTypeWrapper.classList.add('hidden');
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
  const rideTypeWrapper = document.getElementById('rideTypeWrapper');
  if (rideTypeWrapper) {
    rideTypeWrapper.classList.add('hidden');
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

  authMessage.textContent = t('অ্যাকাউন্ট তৈরি হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...');
  authMessage.style.color = '#09663e';

  try {
    const payload = {
      phone,
      firstName,
      lastName,
      password,
      userType
    };
    if (userType === 'driver') {
      const serviceTypes = getCheckedDriverServiceTypes();
      if (serviceTypes.length === 0) {
        authMessage.style.color = 'var(--danger-color)';
        authMessage.textContent = 'কমপক্ষে একটি গাড়ি/পরিষেবা নির্বাচন করুন।';
        return;
      }
      payload.vehicleNumber = vehicleNumber;
      payload.serviceTypes = serviceTypes;
      payload.rideType = serviceTypes[0];
    }
    const response = await apiCall('/auth/signup', 'POST', payload);

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
    authMessage.textContent = error.message || t('সাইন আপ ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
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

  authMessage.textContent = t('লগইন করা হচ্ছে...');
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
    authMessage.textContent = error.message || t('লগইন ব্যর্থ হয়েছে।');
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
  if (currentUser?.userType === 'passenger') updateOnlineStatus(true);
  if (activeRideId) {
    // Start continuous polling - every 16 seconds
    if (pollInterval) clearInterval(pollInterval);
    pollCustomerRide(); // Initial call
    pollInterval = setInterval(pollCustomerRide, 16000);
  } else {
    resetCustomerUI();
  }

  appendCustomerFooter();
  renderPopularPlaces();
  checkNightFareWarning();
}

function appendCustomerFooter() {
  if (document.getElementById('totoBondhuFooter')) return;

  const footer = document.createElement('div');
  footer.id = 'totoBondhuFooter';


  // Gradient overlay so text is highly readable over the image
  const overlay = document.createElement('div');

  footer.appendChild(overlay);

  const content = document.createElement('div');

  content.innerHTML = `
    <img src="image/footer.png" alt="Footer Image" class="footer-image" />
  `;

  footer.appendChild(content);
  customerDashboard.appendChild(footer);
}

function checkNightFareWarning() {
  const warningEl = document.getElementById('nightFareWarning');
  if (warningEl) {
    const hour = new Date().getHours();
    // 18 is 6 PM, 6 is 6 AM
    if (hour >= 18 || hour < 6) {
      warningEl.classList.remove('hidden');
    } else {
      warningEl.classList.add('hidden');
    }
  }
}

async function pollCustomerRide() {
  if (!activeRideId) return;

  try {
    const response = await apiCall(`/rides/${activeRideId}`);
    const ride = response.ride;

    if (ride.rideStatus === 'completed') {
      const driverName = ride.driverId ? `${ride.driverId.firstName} ${ride.driverId.lastName}` : 'চালক';
      const rideIdToRate = activeRideId;

      localStorage.removeItem('toto_active_ride_id');
      activeRideId = null;
      resetCustomerUI();

      showRatingPopup(rideIdToRate, driverName);
      return;
    } else if (ride.rideStatus === 'cancelled') {
      const wasPenalized = ride.penaltyApplied;
      localStorage.removeItem('toto_active_ride_id');
      activeRideId = null;
      resetCustomerUI();

      if (ride.bookingType === 'scheduled' && ride.scheduleStatus === 'no_driver') {
        showPopup('❌ কোনো চালক এই রাইডটি গ্রহণ করেননি', '❌ No driver accepted this scheduled ride.', '❌');
      } else if (wasPenalized) {
        try {
          const userRes = await apiCall('/auth/profile');
          if (userRes.success && userRes.user.activePenalty && userRes.user.activePenalty.amount > 0) {
            showPenaltyModal(userRes.user.activePenalty);
          } else {
            showPopup('পেনাল্টি বাকি আছে', 'Penalty Due: আপনার আগের একটি বাতিল রাইডের জন্য ₹30 ফি বাকি আছে।', '⛔');
          }
        } catch (e) {
          showPopup('পেনাল্টি বাকি আছে', 'Penalty Due: আপনার আগের একটি বাতিল রাইডের জন্য ₹30 ফি বাকি আছে।', '⛔');
        }
      } else {
        showPopup('বাতিল', 'আপনার ট্রিপটি বাতিল হয়েছে।', '⚠️');
      }
      return;
    }

    // Hide booking form and show finding/accepted state
    document.querySelector('.ride-booking-card').classList.add('hidden');
    document.querySelector('.popular-section').classList.add('hidden');

    if (ride.rideStatus === 'pending') {
      // Show finding message
      acceptedRideCard.classList.add('hidden');
      document.getElementById('customerOfferCard')?.classList.add('hidden');
      const findingCard = document.getElementById('findingRideCard') || createFindingCard();
      findingCard.classList.remove('hidden');
    } else if (ride.rideStatus === 'driver_offered') {
      const findingCard = document.getElementById('findingRideCard');
      if (findingCard) findingCard.classList.add('hidden');
      acceptedRideCard.classList.add('hidden');

      const offerCard = document.getElementById('customerOfferCard') || createCustomerOfferCard();
      offerCard.classList.remove('hidden');

      const offers = ride.offers || [];
      if (offers.length > 0) {
        offerCard.innerHTML = `<h3 style="margin-bottom: 15px;">${t('চালকদের প্রস্তাবসমূহ')}</h3>`;

        offers.forEach(offer => {
          if (!offer.driverId) return;
          const driver = offer.driverId;
          const offerDiv = document.createElement('div');
          offerDiv.style.cssText = "border: 1px solid var(--border-light); padding: 12px; border-radius: 8px; margin-bottom: 12px; background: var(--surface-dim);";

          offerDiv.innerHTML = `
            <p style="margin: 0 0 5px 0;">👤 <strong>${driver.firstName} ${driver.lastName}</strong></p>
            <p style="margin: 0 0 5px 0; color: var(--text-muted); font-size: 0.9rem;">🔢 ${driver.vehicleNumber || ''} &nbsp;|&nbsp; ⭐ ${driver.averageRating || '0'}</p>
            <p style="margin: 0 0 10px 0;">💰 ${t('ভাড়া:')} <strong class="text-green" style="font-size: 1.2rem;">₹${offer.fare}</strong></p>
            <div style="display: flex; gap: 10px;">
              <button class="button primary accept-offer-btn" style="flex: 1;" data-driver="${driver._id}" data-fare="${offer.fare}">${t('গ্রহণ করুন')}</button>
              <button class="button secondary reject-offer-btn" style="flex: 1;" data-driver="${driver._id}">${t('প্রত্যাখ্যান করুন')}</button>
            </div>
          `;
          offerCard.appendChild(offerDiv);
        });

        document.querySelectorAll('.accept-offer-btn').forEach(btn => {
          btn.onclick = () => acceptDriverOffer(ride._id, btn.dataset.driver, btn.dataset.fare, btn);
        });
        document.querySelectorAll('.reject-offer-btn').forEach(btn => {
          btn.onclick = () => rejectDriverOffer(ride._id, btn.dataset.driver);
        });
      } else {
        offerCard.innerHTML = `<p class="muted-text center-block">${t('অপেক্ষা করুন...')}</p>`;
      }
    } else if (ride.rideStatus === 'accepted' || ride.rideStatus === 'arrived' || ride.rideStatus === 'in_progress') {
      // Hide finding message and show accepted ride card
      const findingCard = document.getElementById('findingRideCard');
      if (findingCard) findingCard.classList.add('hidden');
      document.getElementById('customerOfferCard')?.classList.add('hidden');

      if (ride.bookingType === 'scheduled') {
        showPopup('✅ চালক আপনার আগাম রাইড গ্রহণ করেছেন', '✅ Driver has accepted your scheduled ride.', '✅');
      }

      acceptedRideCard.classList.remove('hidden');
      document.getElementById('acceptedDriverName').textContent = ride.driverId ? `${ride.driverId.firstName} ${ride.driverId.lastName}` : t('নিযুক্ত হচ্ছে...');
      document.getElementById('acceptedStart').textContent = t(ride.pickupLocation.villageName);
      document.getElementById('acceptedEnd').textContent = t(ride.dropoffLocation.villageName);
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

      // Set Customer Navigation link
      const custNavigateBtn = document.getElementById('customerNavigateBtn');
      if (custNavigateBtn) {
        const pickupFullAddress = `${ride.pickupLocation.address}, Purba Bardhaman, West Bengal`;
        const dropoffFullAddress = `${ride.dropoffLocation.address}, Purba Bardhaman, West Bengal`;

        if ((ride.rideStatus === 'accepted' || ride.rideStatus === 'arrived') && ride.driverLocation && ride.driverLocation.coordinates && ride.driverLocation.coordinates.length === 2) {
          // Phase 1: Show route to the driver's current location
          const [lng, lat] = ride.driverLocation.coordinates;
          if (lat !== 0 || lng !== 0) {
            let destination = pickupFullAddress;
            if (ride.pickupLocation.latitude != null && ride.pickupLocation.longitude != null && (ride.pickupLocation.latitude !== 0 || ride.pickupLocation.longitude !== 0)) {
              destination = `${ride.pickupLocation.latitude},${ride.pickupLocation.longitude}`;
            }
            custNavigateBtn.href = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${encodeURIComponent(destination)}`;
          } else {
            custNavigateBtn.href = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupFullAddress)}&destination=${encodeURIComponent(dropoffFullAddress)}`;
          }
        } else {
          // Phase 2 (in_progress or fallback): Show the main trip route
          custNavigateBtn.href = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupFullAddress)}&destination=${encodeURIComponent(dropoffFullAddress)}`;
        }
      }

      let customerWaitMsg = document.getElementById('customerWaitMsg');
      if (!customerWaitMsg) {
        customerWaitMsg = document.createElement('p');
        customerWaitMsg.id = 'customerWaitMsg';
        customerWaitMsg.className = 'muted-text center-block';
        customerWaitMsg.style.fontWeight = 'bold';
        endRideBtn.parentNode.insertBefore(customerWaitMsg, endRideBtn);
      }

      if (ride.rideStatus === 'accepted') {
        endRideBtn.classList.add('hidden');
        customerWaitMsg.textContent = t('চালকের ট্রিপ শুরু করার অপেক্ষায়...');
        customerWaitMsg.classList.remove('hidden');
        if (cancelRideBtn) cancelRideBtn.classList.remove('hidden');

        const otpContainer = document.getElementById('passengerOtpContainer');
        const otpValue = document.getElementById('passengerOtpValue');
        if (otpContainer && otpValue && ride.otp) {
          otpContainer.classList.remove('hidden');
          otpValue.textContent = ride.otp;
        }
      } else if (ride.rideStatus === 'arrived') {
        endRideBtn.classList.add('hidden');

        if (ride.arriveTime) {
          if (!arrivalTimerInterval) {
            const updateTimer = () => {
              const arriveDate = new Date(ride.arriveTime).getTime();
              const cancelTime = arriveDate + 5 * 60 * 1000;
              const now = new Date().getTime();
              const distance = cancelTime - now;

              if (distance < 0) {
                customerWaitMsg.innerHTML = `${t('আপনার গাড়ি বাইরে অপেক্ষা করছে!')}<br><span style="color: var(--danger-color); font-size: 1.1rem; font-weight: 800;">⏳ 0:00</span>`;
                if (arrivalTimerInterval) clearInterval(arrivalTimerInterval);
                if (cancelRideBtn) cancelRideBtn.classList.add('hidden');
              } else {
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                customerWaitMsg.innerHTML = `${t('আপনার গাড়ি বাইরে অপেক্ষা করছে!')}<br><span style="color: var(--danger-color); font-size: 1.1rem; font-weight: 800;">⏳ ${minutes}:${seconds < 10 ? '0' : ''}${seconds}</span>`;
                if (cancelRideBtn) cancelRideBtn.classList.remove('hidden');
              }
            };
            updateTimer();
            arrivalTimerInterval = setInterval(updateTimer, 1000);
          }
        } else {
          customerWaitMsg.textContent = t('আপনার গাড়ি বাইরে অপেক্ষা করছে!');
          if (cancelRideBtn) cancelRideBtn.classList.remove('hidden');
        }

        customerWaitMsg.classList.remove('hidden');

        const otpContainer = document.getElementById('passengerOtpContainer');
        const otpValue = document.getElementById('passengerOtpValue');
        if (otpContainer && otpValue && ride.otp) {
          otpContainer.classList.remove('hidden');
          otpValue.textContent = ride.otp;
        }
      } else if (ride.rideStatus === 'in_progress') {
        if (arrivalTimerInterval) {
          clearInterval(arrivalTimerInterval);
          arrivalTimerInterval = null;
        }
        endRideBtn.classList.add('hidden');
        customerWaitMsg.textContent = t('আপনার ট্রিপ চলছে...');
        customerWaitMsg.classList.remove('hidden');
        if (cancelRideBtn) cancelRideBtn.classList.add('hidden');

        const otpContainer = document.getElementById('passengerOtpContainer');
        if (otpContainer) otpContainer.classList.add('hidden');
      }
    }
  } catch (error) {
    console.error("Error polling ride:", error);
  }
}

function createCustomerOfferCard() {
  const card = document.createElement('div');
  card.id = 'customerOfferCard';
  card.className = 'card info-card';
  document.getElementById('customerDashboard').insertBefore(card, document.getElementById('acceptedRideCard'));
  return card;
}

async function acceptDriverOffer(rideId, driverId, fare, btn) {
  if (btn) {
    btn.disabled = true;
    btn.textContent = t('অপেক্ষা করুন...');
  }
  try {
    let passengerLat = null;
    let passengerLng = null;
    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }));
        passengerLat = pos.coords.latitude;
        passengerLng = pos.coords.longitude;
      } catch (err) {
        console.warn("Could not get exact location", err);
      }
    }

    const payload = { driverId, fare: Number(fare) };
    if (passengerLat != null && passengerLng != null) {
      payload.passengerLat = passengerLat;
      payload.passengerLng = passengerLng;
    }

    const res = await apiCall(`/rides/accept-offer/${rideId}`, 'POST', payload);
    if (res.success) pollCustomerRide();
  } catch (e) {
    showPopup('ত্রুটি', 'গ্রহণ করতে সমস্যা হয়েছে।', '❌');
    if (btn) {
      btn.disabled = false;
      btn.textContent = t('গ্রহণ করুন');
    }
  }
}

async function rejectDriverOffer(rideId, driverId) {
  try {
    const res = await apiCall(`/rides/reject-offer/${rideId}`, 'POST', { driverId });
    if (res.success) pollCustomerRide();
  } catch (e) { showPopup('ত্রুটি', 'প্রত্যাখ্যান করতে সমস্যা হয়েছে।', '❌'); }
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
      <p class="muted-text">${t('কাছাকাছি একটি গাড়ি খুঁজে বের করা হচ্ছে...')}</p>
      <p style="font-size: 2rem; margin: 20px 0;">🔍</p>
    </div>
  `;

  const acceptedCard = document.getElementById('acceptedRideCard');
  if (acceptedCard) {
    acceptedCard.parentNode.insertBefore(findingCard, acceptedCard);
  } else {
    document.getElementById('customerDashboard').appendChild(findingCard);
  }
  return findingCard;
}

// Call functions
window.callDriver = function () {
  const btn = document.getElementById('driverCallBtn');
  const phone = btn.href.replace('tel:', '');
  window.location.href = `tel:${phone}`;
};

window.callCustomer = function () {
  const btn = document.getElementById('customerCallBtn');
  const phone = btn.href.replace('tel:', '');
  window.location.href = `tel:${phone}`;
};

// Daily stats tracking
function getOrInitializeDailyStats() {
  const today = new Date().toDateString();
  // Scope stats to the current user so different drivers don't share stats
  const userId = currentUser ? currentUser._id : 'guest';
  const statsKey = `toto_daily_stats_${userId}`;
  const stats = JSON.parse(localStorage.getItem(statsKey)) || {};

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
  const userId = currentUser ? currentUser._id : 'guest';
  const statsKey = `toto_daily_stats_${userId}`;

  stats.totalRides = (stats.totalRides || 0) + 1;
  stats.totalIncome = (stats.totalIncome || 0) + fareAmount;
  localStorage.setItem(statsKey, JSON.stringify(stats));
  updateStatsDisplay();
}

function updateStatsDisplay() {
  const stats = getOrInitializeDailyStats();
  const ridesEl = document.getElementById('todayRidesCount');
  const incomeEl = document.getElementById('todayIncomeAmount');
  const ratingEl = document.getElementById('driverRatingVal');

  if (ridesEl) ridesEl.textContent = stats.totalRides || '0';
  if (incomeEl) incomeEl.textContent = `₹${stats.totalIncome || 0}`;
  if (ratingEl && currentUser) {
    const rating = currentUser.averageRating || 0;
    ratingEl.textContent = `${rating} ★`;
  }
}

async function recalculateDailyStats() {
  if (!currentUser || currentUser.userType !== 'driver') {
    return;
  }

  try {
    const response = await apiCall('/rides/user/rides');
    if (!response.success || !response.rides) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today in local timezone

    let totalRides = 0;
    let totalIncome = 0;

    response.rides.forEach(ride => {
      const rideCompletionDate = ride.endTime ? new Date(ride.endTime) : null;
      if (ride.rideStatus === 'completed' && rideCompletionDate && rideCompletionDate >= today) {
        totalRides++;
        totalIncome += ride.fare || 0;
      }
    });

    const stats = {
      date: new Date().toDateString(),
      totalRides: totalRides,
      totalIncome: totalIncome
    };

    const userId = currentUser._id;
    const statsKey = `toto_daily_stats_${userId}`;
    localStorage.setItem(statsKey, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to recalculate daily stats:', error);
  }
}

function resetCustomerUI() {
  if (arrivalTimerInterval) {
    clearInterval(arrivalTimerInterval);
    arrivalTimerInterval = null;
  }
  checkNightFareWarning();
  // Show booking form and popular section
  document.querySelector('.ride-booking-card').classList.remove('hidden');
  document.querySelector('.popular-section').classList.remove('hidden');

  // Hide ride status cards
  acceptedRideCard.classList.add('hidden');
  const findingCard = document.getElementById('findingRideCard');
  if (findingCard) findingCard.classList.add('hidden');
  document.getElementById('customerOfferCard')?.classList.add('hidden');

  if (endRideBtn) endRideBtn.classList.remove('hidden');
  if (cancelRideBtn) cancelRideBtn.classList.add('hidden');
  const customerWaitMsg = document.getElementById('customerWaitMsg');
  if (customerWaitMsg) customerWaitMsg.classList.add('hidden');
  const otpContainer = document.getElementById('passengerOtpContainer');
  if (otpContainer) otpContainer.classList.add('hidden');

  // Reset form
  rideSubmitBtn.disabled = false;
  rideSubmitBtn.textContent = t('বুক করুন');
  rideSubmitBtn.style.opacity = "1";

  selectedPickup = null;
  selectedDropoff = null;
  updateRideButtonState();
  if (pickupSearch) pickupSearch.value = '';
  if (dropoffSearch) dropoffSearch.value = '';
  if (scheduledRideDateInput) scheduledRideDateInput.value = '';
  if (scheduledRideTimeInput) scheduledRideTimeInput.value = '';

  if (pickupColumn) pickupColumn.classList.remove('hidden');
  if (pickupSummary) pickupSummary.classList.add('hidden');
  if (dropoffColumn) dropoffColumn.classList.add('hidden');

  if (landmarkInput) landmarkInput.value = '';
  pricePreviewCard.classList.add('hidden');
  if (customerFareInputContainer) customerFareInputContainer.classList.add('hidden');
  if (custNegFareInput) custNegFareInput.value = '';
  sharingConsentAccepted = false;
}

rideRequestForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (activeRideId) return;

  if (rideTypeSelect?.value === 'TOTO_SHARING' && !sharingConsentAccepted) {
    showSharingConsentPopup();
    return;
  }

  const pickupVillageId = selectedPickup?.villageId;
  const dropoffVillageId = selectedDropoff?.villageId;
  const landmark = landmarkInput?.value?.trim() || '';

  if (!pickupVillageId || !dropoffVillageId) {
    showPopup('ত্রুটি', 'দয়া করে পিকআপ এবং গন্তব্য নির্বাচন করুন।', '❌');
    return;
  }

  const fare = parseInt(custNegFareInput.value);
  const isScheduleBooking = selectedBookingMode === 'schedule';
  const minimumFare = isScheduleBooking ? 100 : 10;

  if (!fare || fare < minimumFare) {
    showPopup('ত্রুটি', isScheduleBooking ? 'দয়া করে একটি বৈধ ভাড়া লিখুন (ন্যূনতম ₹100)।' : 'দয়া করে একটি বৈধ ভাড়া লিখুন (ন্যূনতম ₹10)।', '❌');
    return;
  }

  if (isScheduleBooking) {
    const selectedDate = scheduledRideDateInput?.value;
    const selectedTime = scheduledRideTimeInput?.value;
    if (!selectedDate || !selectedTime) {
      showPopup('ত্রুটি', 'তারিখ এবং সময় নির্বাচন করুন।', '❌');
      return;
    }

    const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const now = new Date();
    if (scheduledDateTime <= now) {
      showPopup('ত্রুটি', 'সিডিউল করা রাইডের জন্য ভবিষ্যৎ সময় নির্বাচন করুন।', '❌');
      return;
    }

    const cutoffWindowMs = 2 * 60 * 60 * 1000;
    if (scheduledDateTime.getTime() - now.getTime() < cutoffWindowMs) {
      showPopup('ত্রুটি', 'আগাম রাইডের জন্য কমপক্ষে ২ ঘণ্টা সময় প্রয়োজন।', '❌');
      return;
    }
  }

  const pickupAddress = selectedPickup.name + (landmark ? ` (${landmark})` : '');
  const dropoffAddress = selectedDropoff.name;

  rideSubmitBtn.disabled = true;
  rideSubmitBtn.textContent = isScheduleBooking ? t('অপেক্ষা করুন...') : t('লোকেশন চেক করা হচ্ছে...');

  let pickupLat = 0;
  let pickupLng = 0;
  if (navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      pickupLat = pos.coords.latitude;
      pickupLng = pos.coords.longitude;
    } catch (err) {
      console.warn("Could not get exact location", err);
    }
  }

  rideSubmitBtn.textContent = t('অপেক্ষা করুন...');

  const pickupStoppageId = selectedPickup?.stoppageId || pickupVillageId;
  const dropoffStoppageId = selectedDropoff?.stoppageId || dropoffVillageId;

  try {
    const endpoint = isScheduleBooking ? '/rides/schedule-request' : '/rides/request';
    const payload = {
      pickupVillageId,
      dropoffVillageId,
      pickupStoppageId,
      dropoffStoppageId,
      landmark,
      fare,
      pickupLat,
      pickupLng,
      rideType: document.getElementById('rideTypeSelect')?.value || null,
      pickupLocation: { address: pickupAddress, latitude: 0, longitude: 0 },
      dropoffLocation: { address: dropoffAddress, latitude: 0, longitude: 0 },
      distance: 0,
      fare: fare
    };

    if (isScheduleBooking) {
      payload.scheduledDate = scheduledRideDateInput.value;
      payload.scheduledTime = scheduledRideTimeInput.value;
    }

    const response = await apiCall(endpoint, 'POST', payload);

    if (response.success) {
      activeRideId = response.ride._id;
      localStorage.setItem('toto_active_ride_id', activeRideId);

      if (cancelRideBtn) cancelRideBtn.classList.remove('hidden');

      if (pollInterval) clearInterval(pollInterval);
      pollCustomerRide();
      pollInterval = setInterval(pollCustomerRide, 16000);

      if (!isScheduleBooking) {
        notifyDriversOfRide(activeRideId, pickupAddress, response.ride.fare);
      }

      showPopup('অনুরোধ পাঠানো হয়েছে', isScheduleBooking ? 'আপনার আগাম রাইডের অনুরোধটি চালকদের পাঠানো হয়েছে।' : 'আপনার বুকিং অনুরোধটি চালকদের পাঠানো হয়েছে।', '✅');
    }
  } catch (error) {
    console.error("Booking error:", error);
    if (error.message === 'PENALTY_DUE') {
      if (error.data && error.data.penalty) {
        showPenaltyModal(error.data.penalty);
      } else {
        showPopup('পেনাল্টি বাকি আছে', 'Penalty Due: আপনার আগের একটি বাতিল রাইডের জন্য ₹30 ফি বাকি আছে।', '⛔');
      }
    } else {
      showPopup('ত্রুটি', error.message || 'বুকিং করতে সমস্যা হচ্ছে, আবার চেষ্টা করুন।', '❌');
    }
    resetCustomerUI();
  }
});

endRideBtn?.addEventListener('click', async () => {
  if (activeRideId) {
    const currentRideId = activeRideId;
    const driverNameEl = document.getElementById('acceptedDriverName');
    const driverName = driverNameEl ? driverNameEl.textContent : 'চালক';

    endRideBtn.disabled = true;
    endRideBtn.textContent = t('অপেক্ষা করুন...');

    // Pause polling during the request so it doesn't interrupt the popup flow
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }

    try {
      await apiCall(`/rides/end/${activeRideId}`, 'POST');

      localStorage.removeItem('toto_active_ride_id');
      activeRideId = null;
      resetCustomerUI();

      showPopup('সফলতা', 'রাইড শেষ করা হয়েছে।', '✅', () => {
        showRatingPopup(currentRideId, driverName);
      });
    } catch (error) {
      showPopup('ত্রুটি', 'রাইড শেষ করতে সমস্যা হয়েছে।', '❌');
      endRideBtn.disabled = false;
      endRideBtn.textContent = t('ট্রিপ সমাপ্ত করুন');
      // Restart polling if failed
      pollInterval = setInterval(pollCustomerRide, 16000);
    }
  }
});

cancelRideBtn?.addEventListener('click', async () => {
  if (!activeRideId) return;
  if (!confirm(t('আপনি কি ট্রিপটি বাতিল করতে চান?'))) return;

  cancelRideBtn.disabled = true;
  cancelRideBtn.textContent = t('অপেক্ষা করুন...');

  try {
    const res = await apiCall(`/rides/cancel/${activeRideId}`, 'POST');
    localStorage.removeItem('toto_active_ride_id');
    activeRideId = null;
    resetCustomerUI();
    if (res.penaltyApplied) {
      try {
        const userRes = await apiCall('/auth/profile');
        if (userRes.success && userRes.user.activePenalty && userRes.user.activePenalty.amount > 0) {
          showPenaltyModal(userRes.user.activePenalty);
        }
      } catch (e) {
        showPopup('পেনাল্টি বাকি আছে', 'Penalty Due: আপনার আগের একটি বাতিল রাইডের জন্য ₹30 ফি বাকি আছে।', '⛔');
      }
    } else {
      showPopup('সফল', 'ট্রিপ বাতিল করা হয়েছে।', '✅');
    }
  } catch (err) {
    // If the ride is already gone from the server, it might throw an error.
    // From the user's perspective, the ride is cancelled. Reset the UI.
    localStorage.removeItem('toto_active_ride_id');
    activeRideId = null;
    resetCustomerUI();
    showPopup('সফল', 'ট্রিপ বাতিল করা হয়েছে।', '✅');
  } finally {
    cancelRideBtn.disabled = false;
    cancelRideBtn.textContent = t('ট্রিপ বাতিল করুন');
  }
});

// --- Preview & Calculation ---
function isNightTime() {
  const hour = new Date().getHours();
  return hour >= NIGHT_SURGE_START || hour < NIGHT_SURGE_END;
}

function calculateFareFromDistance(distance) {
  let fare = Math.max(BASE_FARE, distance * FARE_PER_KM);
  if (isNightTime()) fare += NIGHT_SURCHARGE;
  return fare;
}

function updateRidePreview() {
  if (!selectedPickup || !selectedDropoff) {
    if (customerFareInputContainer) customerFareInputContainer.classList.add('hidden');
    updateRideButtonState();
    return;
  }

  // Show the fare input container but do not pre-fill it.
  if (customerFareInputContainer) {
    customerFareInputContainer.classList.remove('hidden');
  }
  pricePreviewCard.classList.add('hidden');
  updateRideButtonState();
}

function updateRideButtonState() {
  if (!rideSubmitBtn) return;
  const fare = custNegFareInput ? parseInt(custNegFareInput.value) : 0;
  const minimumFare = selectedBookingMode === 'schedule' ? 100 : 10;
  const scheduleReady = selectedBookingMode === 'schedule' ? !!scheduledRideDateInput?.value && !!scheduledRideTimeInput?.value : true;
  const canBook = !!selectedPickup && !!selectedDropoff && fare >= minimumFare && scheduleReady;
  rideSubmitBtn.disabled = !canBook;
  rideSubmitBtn.style.opacity = canBook ? '1' : '0.6';
}

// Instant Booking (Popular Places)
function renderPopularPlaces() {
  const grid = document.querySelector('.grid-quick-stops');
  if (!grid) return;

  let popularPlaces = [];
  if (locationData && locationData.length > 0) {
    const guskara = locationData.find(v => v.nameBn.includes('গুসকরা'));
    const ausgram = locationData.find(v => v.nameBn.includes('আউশগ্রাম'));
    const bonnabgram = locationData.find(v => v.nameBn.includes('বননবগ্রাম') || v.nameBn.includes('বননবগ্ৰাম'));
    const karatia = locationData.find(v => v.nameBn.includes('করাটিয়া') || v.nameBn.includes('করটিয়া'));

    if (guskara) popularPlaces.push({ name: 'গুসকরা', villageId: guskara.id, stoppageId: guskara.stoppages?.[0]?.id || guskara.id });
    if (ausgram) popularPlaces.push({ name: 'আউশগ্রাম', villageId: ausgram.id, stoppageId: ausgram.stoppages?.[0]?.id || ausgram.id });
    if (bonnabgram) popularPlaces.push({ name: 'বননবগ্রাম', villageId: bonnabgram.id, stoppageId: bonnabgram.stoppages?.[0]?.id || bonnabgram.id });
    if (karatia) popularPlaces.push({ name: 'করটিয়া', villageId: karatia.id, stoppageId: karatia.stoppages?.[0]?.id || karatia.id });
  }

  if (popularPlaces.length === 0) {
    popularPlaces = [
      { name: 'গুসকরা', villageId: 'guskara' },
      { name: 'আউশগ্রাম', villageId: 'ausgram' },
      { name: 'বননবগ্রাম', villageId: 'bonnabgram' },
      { name: 'করটিয়া', villageId: 'karatia' }
    ];
  }

  grid.innerHTML = popularPlaces.map(place =>
    `<div class="stop-chip" data-village-id="${place.villageId}" data-stoppage-id="${place.stoppageId}">${t(place.name)}</div>`
  ).join('');

  document.querySelectorAll('.stop-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      if (activeRideId) { showPopup('অপেক্ষা করুন', 'আপনার একটি রাইড ইতিমধ্যে খোঁজা হচ্ছে।', '⏳'); return; }
      if (!selectedPickup) { showPopup('শুরুর স্থান প্রয়োজন', 'দয়া করে প্রথমে আপনার শুরুর স্থান (পিকআপ) নির্বাচন করুন।', '📍'); return; }

      const villageId = e.target.dataset.villageId;
      const stoppageId = e.target.dataset.stoppageId || villageId;
      const name = e.target.textContent;

      selectedDropoff = { type: 'popular', villageId: villageId, stoppageId: stoppageId, name: name };
      if (dropoffSearch) dropoffSearch.value = name;

      if (dropoffColumn) {
        dropoffColumn.classList.remove('hidden');
      }
      updateRidePreview();
      updateRideButtonState();
    });
  });
}

// Add New Village Logic
addVillageBtn?.addEventListener('click', async () => {
  const villageName = newVillageNameInput?.value?.trim();

  if (!villageName) {
    showPopup('ত্রুটি', 'গ্রামের নাম লিখুন।', '❌');
    return;
  }

  addVillageBtn.disabled = true;
  addVillageBtn.textContent = t('অপেক্ষা করুন...');

  try {
    const response = await apiCall('/locations/village', 'POST', { nameBn: villageName });
    if (response.success) {
      showPopup('সফল', 'নতুন গ্রাম যোগ করা হয়েছে।', '✅');
      newVillageNameInput.value = '';

      // This automatically updates all dropdowns in both Admin and Customer Dashboards!
      await loadLocations();
      loadAdminRoutes();
    } else {
      showPopup('ত্রুটি', response.message || 'গ্রাম যোগ করতে সমস্যা হয়েছে।', '❌');
    }
  } catch (error) {
    console.error("API add village failed:", error);
    showPopup('ত্রুটি', 'গ্রাম যোগ করতে সমস্যা হয়েছে।', '❌');
  } finally {
    addVillageBtn.disabled = false;
    addVillageBtn.textContent = t('যোগ করুন');
  }
});

// Add New Stoppage Logic
addStoppageBtn?.addEventListener('click', async () => {
  const villageId = newStoppageVillageSelect?.value;
  const stoppageName = newStoppageNameInput?.value?.trim();

  if (!villageId || !stoppageName) {
    showPopup('ত্রুটি', 'গ্রাম এবং নতুন স্টপেজের নাম লিখুন।', '❌');
    return;
  }

  addStoppageBtn.disabled = true;
  addStoppageBtn.textContent = t('অপেক্ষা করুন...');

  try {
    const response = await apiCall('/locations/stoppage', 'POST', { villageId, nameBn: stoppageName });
    if (response.success) {
      showPopup('সফল', 'নতুন স্টপেজ যোগ করা হয়েছে।', '✅');
      newStoppageNameInput.value = '';
      await loadLocations();
    } else {
      showPopup('ত্রুটি', response.message || 'স্টপেজ যোগ করতে সমস্যা হয়েছে।', '❌');
    }
  } catch (error) {
    console.error("API add stoppage failed:", error);
    showPopup('ত্রুটি', 'স্টপেজ যোগ করতে সমস্যা হয়েছে।', '❌');
  } finally {
    addStoppageBtn.disabled = false;
    addStoppageBtn.textContent = t('যোগ করুন');

    // Keep existing selected values and refresh stoppages
    const pV = pickupVillageSelect.value;
    const dV = dropoffVillageSelect.value;
    const pS = pickupStoppageSelect.value;
    const dS = dropoffStoppageSelect.value;
    if (pV) { populateStoppageSelect(pickupStoppageSelect, pV, 'স্টপেজ নির্বাচন করুন'); pickupStoppageSelect.value = pS; }
    if (dV) { populateStoppageSelect(dropoffStoppageSelect, dV, 'স্টপেজ নির্বাচন করুন'); dropoffStoppageSelect.value = dS; }
  }
});

// --- Driver Logic ---
async function updateOnlineStatus(isOnline) {
  if (!currentUser) return;
  try {
    const routeId = driverActiveRouteSelect ? driverActiveRouteSelect.value : null;
    await apiCall('/auth/online-status', 'PUT', { isOnline, routeId });
  } catch (e) {
    console.error('Failed to update online status', e);
  }
}

async function setupDriverDashboard() {
  // Fetch fresh profile data to get latest ratings
  try {
    const response = await apiCall('/auth/profile');
    if (response.success) {
      currentUser = response.user;
      localStorage.setItem('toto_active_user', JSON.stringify(currentUser));
    }
  } catch (err) {
    if (err.message === 'ACCOUNT_BLOCKED') return;
  }

  if (!currentUser) return; // Stop loading if forced out

  await loadDriverRoutes();

  // Recalculate stats from the server every time the dashboard loads
  await recalculateDailyStats();

  const isAvailable = localStorage.getItem('toto_driver_online') === 'true';
  availabilityToggleCheckbox.checked = isAvailable;
  if (driverActiveRouteSelect) driverActiveRouteSelect.disabled = isAvailable;

  toggleDriverStatus(isAvailable);
  // When driver goes online, register FCM token
  if (isAvailable) {
    registerFCMToken();
  }
  updateOnlineStatus(isAvailable);
  // Update daily stats display
  updateStatsDisplay();
}

async function loadDriverRoutes() {
  if (!driverActiveRouteSelect) return;
  try {
    const res = await apiCall('/routes');
    if (res.success) {
      driverActiveRouteSelect.innerHTML = `<option value="">${t('রুট নির্বাচন করুন...')}</option>` +
        res.routes.map(r => `<option value="${r._id}">${r.name}</option>`).join('');

      const savedRoute = localStorage.getItem('toto_driver_route');
      if (savedRoute) driverActiveRouteSelect.value = savedRoute;
    }
  } catch (e) {
    console.error('Failed to load driver routes', e);
  }
}

driverActiveRouteSelect?.addEventListener('change', () => {
  localStorage.setItem('toto_driver_route', driverActiveRouteSelect.value);
});
// FCM: Request native push notification permission when driver goes online
availabilityToggleCheckbox.addEventListener('change', (e) => {
  const isAvailable = availabilityToggleCheckbox.checked;

  // Request native push notification permission when driver goes online
  if (isAvailable && "Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
  }

  if (driverActiveRouteSelect) {
    driverActiveRouteSelect.disabled = isAvailable;
    localStorage.setItem('toto_driver_route', driverActiveRouteSelect.value);
  }

  localStorage.setItem('toto_driver_online', isAvailable);
  // FCM: Register token when driver goes online
  if (isAvailable) {
    // registerFCMToken(); // FCM functionality removed
  }
  toggleDriverStatus(isAvailable);
  updateOnlineStatus(isAvailable);
});

function toggleDriverStatus(isAvailable) {
  toggleStatusLabel.textContent = isAvailable ? t('অনলাইন') : t('অফলাইন');
  toggleStatusLabel.style.color = isAvailable ? 'var(--primary-brand)' : 'var(--text-muted)';

  // Always clear any previously running poll
  if (pollInterval) clearInterval(pollInterval);

  if (isAvailable) {
    if (activeRideId) {
      // If the driver is online but has an active ride, poll that ride's status.
      // This handles cases where the page is reloaded during a trip.
      rideRequestsContainer.innerHTML = `<p class="muted-text center-block">${t('আপনার একটি ট্রিপ চলমান রয়েছে।')}</p>`;
      requestCountBadge.textContent = '0';
      listenToDriverActiveRide();
      pollInterval = setInterval(listenToDriverActiveRide, 16000);
    } else {
      // If the driver is online and free, poll for new ride requests.
      listenToPendingQueue();
      pollInterval = setInterval(listenToPendingQueue, 16000);
    }
  } else {
    // If the driver goes offline, clear the UI and stop any sounds.
    rideRequestsContainer.innerHTML = `<p class="muted-text center-block">${t('আপনি অফলাইনে আছেন। রাইড পেতে অনলাইন মোড চালু করুন।')}</p>`;
    requestCountBadge.textContent = '0';
    stopNotificationSound();
  }
}

async function fetchPendingPenalties() {
  const container = document.getElementById('driverPenaltyNotifications');
  if (!container) return;
  try {
    const res = await apiCall('/rides/driver/pending-penalties');
    if (res.success && res.pending && res.pending.length > 0) {
      container.innerHTML = res.pending.map(p => `
        <div style="background: #fff3e0; border: 1px solid #ffb74d; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
          <h4 style="margin:0 0 10px 0; color:#e65100;">⚠️ পেনাল্টি পেমেন্ট কনফার্মেশন</h4>
          <p style="margin: 0 0 10px 0;">যাত্রী <strong>${p.firstName} ${p.lastName}</strong> (${p.phone}) জানিয়েছেন যে তিনি আপনার বাতিল রাইডের <strong>₹30</strong> পেনাল্টি পরিশোধ করেছেন।</p>
          <button class="button primary full-width" onclick="confirmPenaltyPayment('${p._id}')" style="background:#f57c00; border:none;">হ্যাঁ, আমি ₹30 পেয়েছি</button>
        </div>
      `).join('');
      container.classList.remove('hidden');
    } else {
      container.innerHTML = '';
      container.classList.add('hidden');
    }
  } catch (e) {
    console.error('Error fetching penalties', e);
  }
}

window.confirmPenaltyPayment = async function (passengerId) {
  try {
    const res = await apiCall(`/rides/driver/confirm-penalty/${passengerId}`, 'POST');
    if (res.success) { showPopup('সফল', 'পেনাল্টি পেমেন্ট নিশ্চিত করা হয়েছে!', '✅'); fetchPendingPenalties(); }
  } catch (e) { showPopup('ত্রুটি', 'নিশ্চিত করতে সমস্যা হয়েছে।', '❌'); }
};

function getRideTypeHtml(ride) {
  // Determine type from known fields and map to Bengali label + icon + capacity
  const typeRaw = (ride.rideType || ride.vehicleType || ride.requestedVehicleType || ride.type || '').toString();
  const normalized = typeRaw.toUpperCase();
  const map = {
    'TOTO_PERSONAL': { icon: '🛺', text: 'টোটো পার্সোনাল', cap: '১' },
    'TOTO_SHARING': { icon: '🛺', text: 'টোটো শেয়ারিং', cap: '৫' },
    'TOTO_GOODS': { icon: '🛺', text: 'টোটো মালগাড়ি', cap: '৩০ কেজি' },
    'BIKE': { icon: '🏍️', text: 'বাইক', cap: '১' },
    'MARUTI_FULL': { icon: '🚗', text: 'মারুতি (ফুল)', cap: '৭' },
    'MOTORVAN_FULL': { icon: '🚐', text: 'মটরভ্যান (ফুল)', cap: '৭' },
    'TOTO': { icon: '🛺', text: 'টোটো পার্সোনাল', cap: '১' },
    'BIKE': { icon: '🏍️', text: 'বাইক', cap: '১' },
    'MARUTI': { icon: '🚗', text: 'মারুতি (ফুল)', cap: '৭' },
    'MOTORVAN': { icon: '🚐', text: 'মটরভ্যান (ফুল)', cap: '৭' }
  };
  const entry = map[normalized] || map[typeRaw.toLowerCase()];
  if (!entry) {
    if (!typeRaw) return '';
    return `<p>🚘 ${t(typeRaw)}</p>`;
  }
  return `<p>${entry.icon} ${entry.text} — ${entry.cap} ${entry.cap === '৩০ কেজি' ? '' : '👤'}</p>`;
}

async function listenToPendingQueue() {
  if (activeRideId) return;

  fetchPendingPenalties();

  try {
    const response = await apiCall('/rides/pending');
    let rides = response.rides || [];

    const now = Date.now();
    rides = rides.filter(ride => {
      if (rejectedRides[ride._id] && rejectedRides[ride._id] > now) {
        return false;
      }
      if (rejectedRides[ride._id] && rejectedRides[ride._id] <= now) {
        delete rejectedRides[ride._id];
      }

      if (ride.offers && ride.offers.length > 0) {
        const myOffer = ride.offers.find(o => (o.driverId && o.driverId._id === currentUser._id) || o.driverId === currentUser._id);
        if (myOffer) return false;
      }

      return true;
    });

    const normalRides = rides.filter(ride => ride.bookingType !== 'scheduled');
    const scheduledRides = rides.filter(ride => ride.bookingType === 'scheduled');

    let hasNewRide = false;
    const currentIds = new Set();
    rides.forEach(ride => {
      currentIds.add(ride._id);
      if (!knownPendingRideIds.has(ride._id)) {
        hasNewRide = true;
      }
    });

    if (hasNewRide && rides.length > 0) {
      playNotificationSound();
    }
    knownPendingRideIds = currentIds;

    requestCountBadge.textContent = normalRides.length.toString();
    scheduledRequestCountBadge.textContent = scheduledRides.length.toString();

    if (normalRides.length === 0) {
      rideRequestsContainer.innerHTML = `<p class="muted-text center-block">${t('এই মুহূর্তে কোনো বুকিং অনুরোধ নেই।')}</p>`;
    } else {
      rideRequestsContainer.innerHTML = '';
      normalRides.forEach((ride) => {
        const item = document.createElement('div');
        item.className = 'request-item';
        item.innerHTML = `
          <p>👤 <strong>${ride.passengerId.firstName} ${ride.passengerId.lastName}</strong></p>
          <p><strong>${getRideTypeHtml(ride)}</strong></p>
          <p>📍 ${t('পিকআপ:')} ${t(ride.pickupLocation.villageName)}</p>
          <p>🏁 ${t('গন্তব্য:')} ${t(ride.dropoffLocation.villageName)}</p>
          ${ride.pickupLocation.landmark ? `<p>${t('📌 নিকটবর্তী জায়গা:')} ${ride.pickupLocation.landmark}</p>` : ''}
          <p>💰 ${t('ভাড়া:')} <span class="text-green">₹${ride.fare}</span></p>
          <div class="request-actions" style="flex-wrap: wrap;">
            <button class="button primary accept-btn" data-id="${ride._id}" data-fare="${ride.fare}">${t('গ্রহণ করুন')}</button>
            <button class="button secondary negotiate-btn" data-id="${ride._id}" data-fare="${ride.fare}">${t('ভাড়া বাড়ান')}</button>
            <button class="button danger reject-pending-btn" data-id="${ride._id}" style="width: 100%; margin-top: 5px; background: #e0e0e0; color: #333;">${t('প্রত্যাখ্যান করুন')}</button>
          </div>
        `;
        rideRequestsContainer.appendChild(item);
      });
    }

    if (scheduledRides.length === 0) {
      scheduledRideRequestsContainer.innerHTML = `<p class="muted-text center-block">${t('কোনো আগাম রাইড নেই।')}</p>`;
    } else {
      scheduledRideRequestsContainer.innerHTML = '';
      scheduledRides.forEach((ride) => {
        const item = document.createElement('div');
        item.className = 'request-item';
        const rideDate = ride.scheduledDateTime ? new Date(ride.scheduledDateTime) : new Date(ride.scheduledDate || Date.now());
        const rideDay = rideDate.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
        item.innerHTML = `
          <p>📅 ${rideDay}</p>
          <p>⏰ ${ride.scheduledTime || '—'}</p>
          <p>📍 ${t(ride.pickupLocation.villageName)} → ${t(ride.dropoffLocation.villageName)}</p>
          <p>${getRideTypeHtml(ride)}</p>
          <p>💰 ${t('ভাড়া:')} <span class="text-green">₹${ride.fare}</span></p>
          <div class="request-actions" style="flex-wrap: wrap;">
            <button class="button primary accept-btn" data-id="${ride._id}" data-fare="${ride.fare}">${t('গ্রহণ করুন')}</button>
            <button class="button secondary negotiate-btn" data-id="${ride._id}" data-fare="${ride.fare}">${t('ভাড়া বাড়ান')}</button>
          </div>
        `;
        scheduledRideRequestsContainer.appendChild(item);
      });
    }

    document.querySelectorAll('.accept-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e.target.closest('#scheduledRideRequests')) {
          hideScheduledRequestsAfterAction();
        }
        submitOffer(e.target.dataset.id, e.target.dataset.fare);
      });
    });

    document.querySelectorAll('.negotiate-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e.target.closest('#scheduledRideRequests')) {
          hideScheduledRequestsAfterAction();
        }
        showNegotiatePopup(e.target.dataset.id, e.target.dataset.fare);
      });
    });

    document.querySelectorAll('.reject-pending-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rideId = e.target.dataset.id;
        rejectedRides[rideId] = Date.now() + 60000;
        stopNotificationSound();
        listenToPendingQueue();
      });
    });

    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(listenToPendingQueue, 16000);
    if (normalRides.length === 0 && scheduledRides.length === 0) {
      stopNotificationSound();
    }
  } catch (error) {
    console.error("Error fetching pending rides:", error);
  }
}

function showNegotiatePopup(rideId, currentFare) {
  let modal = document.getElementById('negotiateModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'negotiateModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;justify-content:center;align-items:center;';
    modal.innerHTML = `
      <div class="card" style="width:90%;max-width:350px;background:var(--surface-color, #fff);padding:20px;border-radius:12px;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.2);">
        <h3 style="margin-top:0;margin-bottom:10px;">${t('নতুন ভাড়া প্রস্তাব করুন')}</h3>
        <p style="margin-bottom:15px; font-size:1.1rem;">💰 ${t('বর্তমান ভাড়া:')} <strong id="negOriginalFare" class="text-green"></strong></p>
        <div style="display:flex;justify-content:center;align-items:center;gap:15px;margin-bottom:20px;">
          <button id="negMinusBtn" class="button secondary" style="width:50px;height:50px;font-size:1.5rem;border-radius:50%;padding:0;">-</button>
          <input type="number" id="negFareInput" style="width:100px;font-size:1.5rem;text-align:center;padding:10px;border:1px solid #ccc;border-radius:8px;" />
          <button id="negPlusBtn" class="button secondary" style="width:50px;height:50px;font-size:1.5rem;border-radius:50%;padding:0;">+</button>
        </div>
        <div style="display:flex;gap:10px;">
          <button id="negSubmitBtn" class="button primary" style="flex:1;">${t('প্রস্তাব পাঠান')}</button>
          <button id="negCancelBtn" class="button secondary" style="flex:1;">${t('বাতিল')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('negMinusBtn').addEventListener('click', () => {
      const input = document.getElementById('negFareInput');
      input.value = Math.max(10, parseInt(input.value) - 10);
    });

    document.getElementById('negPlusBtn').addEventListener('click', () => {
      const input = document.getElementById('negFareInput');
      input.value = parseInt(input.value) + 10;
    });

    document.getElementById('negCancelBtn').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    document.getElementById('negSubmitBtn').addEventListener('click', () => {
      const newFare = parseInt(document.getElementById('negFareInput').value);
      const rideId = modal.dataset.rideId;
      modal.style.display = 'none';
      submitOffer(rideId, newFare);
    });
  }

  document.getElementById('negOriginalFare').textContent = `₹${currentFare}`;
  document.getElementById('negFareInput').value = currentFare;
  modal.dataset.rideId = rideId;
  modal.style.display = 'flex';
}

async function submitOffer(rideId, fare) {
  stopNotificationSound();
  let driverLat = 0;
  let driverLng = 0;
  if (navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }));
      driverLat = pos.coords.latitude;
      driverLng = pos.coords.longitude;
    } catch (err) {
      console.warn("Could not get driver's exact location for offer", err);
    }
  }

  try {
    const response = await apiCall(`/rides/accept/${rideId}`, 'POST', { fare: Number(fare), driverLat, driverLng });

    if (response.success) {
      activeRideId = rideId;
      localStorage.setItem('toto_active_ride_id', activeRideId);

      rideRequestsContainer.innerHTML = `<p class="muted-text center-block">${t('যাত্রীর অনুমোদনের জন্য অপেক্ষা করা হচ্ছে...')}</p>`;
      requestCountBadge.textContent = '0';

      if (pollInterval) clearInterval(pollInterval);
      listenToDriverActiveRide(); // Initial call
      pollInterval = setInterval(listenToDriverActiveRide, 16000);
    }
  } catch (error) {
    console.error("Offer error:", error);
    const message = error?.data?.message === 'Schedule booking offer time has expired.'
      ? 'Schedule booking offer time has expired.'
      : 'রাইডটি ইতিমধ্যে অন্য কেউ নিয়ে নিয়েছে অথবা বাতিল হয়েছে।';
    showPopup('ত্রুটি', message, '⚠️');
    listenToPendingQueue();
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

      if (ride.rideStatus === 'completed') {
        updateDailyStats(ride.fare);
        showPopup('ট্রিপ শেষ', 'যাত্রী ট্রিপটি সমাপ্ত করেছেন।', '✅');
      } else {
        if (ride.penaltyApplied) {
          showPopup('ট্রিপ শেষ', '৫ মিনিট পার হওয়ায় ট্রিপ বাতিল হয়েছে এবং যাত্রীকে ₹30 পেনাল্টি দেওয়া হয়েছে।', '⚠️');
        } else {
          showPopup('ট্রিপ শেষ', 'ট্রিপটি বাতিল হয়েছে।', '⚠️');
        }
      }

      if (availabilityToggleCheckbox.checked) {
        rideRequestsContainer.innerHTML = `<p class="muted-text center-block">${t('উপলব্ধ রাইড খুঁজছি...')}</p>`;
        requestCountBadge.textContent = '0';

        // Immediately restart polling for new rides - updates every 16 seconds
        if (pollInterval) clearInterval(pollInterval);
        listenToPendingQueue(); // Initial call
        pollInterval = setInterval(listenToPendingQueue, 16000);
      }
      return;
    }

    if (ride.rideStatus === 'driver_offered') {
      const myOffer = (ride.offers || []).find(o => (o.driverId && o.driverId._id === currentUser._id) || o.driverId === currentUser._id);
      if (!myOffer) {
        localStorage.removeItem('toto_active_ride_id');
        activeRideId = null;
        driverAcceptedRideCard.classList.add('hidden');
        showPopup('প্রত্যাখ্যাত', 'যাত্রী আপনার প্রস্তাব প্রত্যাখ্যান করেছেন।', '❌');

        rideRequestsContainer.innerHTML = `<p class="muted-text center-block">${t('উপলব্ধ রাইড খুঁজছি...')}</p>`;
        if (pollInterval) clearInterval(pollInterval);
        listenToPendingQueue();
        pollInterval = setInterval(listenToPendingQueue, 16000);
        return;
      }

      rideRequestsContainer.innerHTML = `<p class="muted-text center-block">${t('যাত্রীর অনুমোদনের জন্য অপেক্ষা করা হচ্ছে...')}</p>`;
      requestCountBadge.textContent = '0';
      driverAcceptedRideCard.classList.add('hidden');
      return;
    }

    if (ride.rideStatus === 'pending') {
      localStorage.removeItem('toto_active_ride_id');
      activeRideId = null;
      driverAcceptedRideCard.classList.add('hidden');
      showPopup('প্রত্যাখ্যাত', 'যাত্রী আপনার প্রস্তাব প্রত্যাখ্যান করেছেন।', '❌');

      rideRequestsContainer.innerHTML = `<p class="muted-text center-block">${t('উপলব্ধ রাইড খুঁজছি...')}</p>`;
      if (pollInterval) clearInterval(pollInterval);
      listenToPendingQueue();
      pollInterval = setInterval(listenToPendingQueue, 16000);
      return;
    }

    if (ride.rideStatus === 'accepted' || ride.rideStatus === 'arrived' || ride.rideStatus === 'in_progress') {
      if (ride.driverId && (ride.driverId._id || ride.driverId) !== currentUser._id) {
        localStorage.removeItem('toto_active_ride_id');
        activeRideId = null;
        driverAcceptedRideCard.classList.add('hidden');
        showPopup('প্রত্যাখ্যাত', 'রাইডটি ইতিমধ্যে অন্য কেউ নিয়ে নিয়েছে।', '⚠️');

        rideRequestsContainer.innerHTML = `<p class="muted-text center-block">${t('উপলব্ধ রাইড খুঁজছি...')}</p>`;
        if (pollInterval) clearInterval(pollInterval);
        listenToPendingQueue();
        pollInterval = setInterval(listenToPendingQueue, 16000);
        return;
      }
    }

    rideRequestsContainer.innerHTML = `<p class="muted-text center-block">${t('আপনার একটি ট্রিপ চলমান রয়েছে।')}</p>`;
    requestCountBadge.textContent = '0';
    driverAcceptedRideCard.classList.remove('hidden');

    document.getElementById('driverAcceptedCustomerName').textContent = `${ride.passengerId.firstName} ${ride.passengerId.lastName}`;
    const customerPhone = ride.passengerId.phone;
    document.getElementById('driverAcceptedCustomerPhone').textContent = `****${customerPhone.slice(-4)}`;
    document.getElementById('customerCallBtn').href = `tel:${customerPhone}`;

    document.getElementById('driverAcceptedStart').textContent = t(ride.pickupLocation.villageName);
    document.getElementById('driverAcceptedEnd').textContent = t(ride.dropoffLocation.villageName);
    document.getElementById('driverAcceptedDistance').textContent = `${ride.distance} km`;
    document.getElementById('driverAcceptedFare').textContent = `₹${ride.fare}`;

    // Dynamically set Navigation Link
    const navigateBtn = document.getElementById('driverNavigateBtn');

    // Add district and state to avoid random locations in Google Maps
    const pickupFullAddress = `${ride.pickupLocation.address}, Purba Bardhaman, West Bengal`;
    const dropoffFullAddress = `${ride.dropoffLocation.address}, Purba Bardhaman, West Bengal`;

    if (ride.rideStatus === 'in_progress') {
      // Once ride starts, show route from Pickup to Dropoff
      navigateBtn.href = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupFullAddress)}&destination=${encodeURIComponent(dropoffFullAddress)}`;
    } else {
      // Before pickup, navigate Driver's current location to Customer's exact GPS (or village fallback)
      let destination = pickupFullAddress;
      if (ride.pickupLocation.latitude != null && ride.pickupLocation.longitude != null && (ride.pickupLocation.latitude !== 0 || ride.pickupLocation.longitude !== 0)) {
        destination = `${ride.pickupLocation.latitude},${ride.pickupLocation.longitude}`;
      }
      navigateBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    }

    let otpInputContainer = document.getElementById('driverOtpContainer');
    let actionBtn = document.getElementById('driverActionBtn');
    let otpInput = document.getElementById('driverOtpInput');

    if (!otpInputContainer) {
      const oldEndBtn = document.getElementById('driverEndTripBtn');
      if (oldEndBtn) oldEndBtn.remove();
      if (actionBtn) actionBtn.remove();

      otpInputContainer = document.createElement('div');
      otpInputContainer.id = 'driverOtpContainer';
      otpInputContainer.style.marginTop = '15px';

      otpInput = document.createElement('input');
      otpInput.id = 'driverOtpInput';
      otpInput.type = 'number';
      otpInput.placeholder = t('পিন (PIN)');
      otpInput.style.width = '100%';
      otpInput.style.padding = '12px';
      otpInput.style.borderRadius = '8px';
      otpInput.style.border = '1px solid #ddd';
      otpInput.style.fontSize = '1.2rem';
      otpInput.style.textAlign = 'center';
      otpInput.style.letterSpacing = '5px';
      otpInput.style.marginBottom = '10px';
      otpInput.style.boxSizing = 'border-box';

      actionBtn = document.createElement('button');
      actionBtn.id = 'driverActionBtn';
      actionBtn.className = 'button primary full-width';

      otpInputContainer.appendChild(otpInput);
      otpInputContainer.appendChild(actionBtn);

      driverAcceptedRideCard.appendChild(otpInputContainer);
    }

    if (ride.rideStatus === 'accepted') {
      otpInput.style.display = 'none';
      actionBtn.className = 'button primary full-width';
      actionBtn.textContent = t('আমি পৌঁছেগেছি');
      actionBtn.disabled = false;
      if (driverCancelRideBtn) driverCancelRideBtn.classList.remove('hidden');
      actionBtn.onclick = () => arriveDriverActiveRide();
    } else if (ride.rideStatus === 'arrived') {
      otpInput.style.display = 'block';
      actionBtn.className = 'button primary full-width';
      actionBtn.textContent = t('গাড়ি চালু করুন');
      actionBtn.disabled = false;
      if (driverCancelRideBtn) driverCancelRideBtn.classList.remove('hidden');
      actionBtn.onclick = () => startDriverActiveRide();
    } else if (ride.rideStatus === 'in_progress') {
      otpInput.style.display = 'none';
      actionBtn.className = 'button danger full-width';
      actionBtn.textContent = t('ট্রিপ সমাপ্ত করুন');
      actionBtn.disabled = false;
      if (driverCancelRideBtn) driverCancelRideBtn.classList.add('hidden');
      actionBtn.onclick = () => endDriverActiveRide();
    }
  } catch (error) {
    console.error("Error getting active ride:", error);
  }
}

async function arriveDriverActiveRide() {
  if (!activeRideId) return;
  const actionBtn = document.getElementById('driverActionBtn');

  if (actionBtn) {
    actionBtn.disabled = true;
    actionBtn.textContent = t('অপেক্ষা করুন...');
  }

  try {
    const res = await apiCall(`/rides/arrive/${activeRideId}`, 'POST');
    if (res.success) {
      listenToDriverActiveRide();
    }
  } catch (error) {
    showPopup('ত্রুটি', error.message || 'আপডেট করতে সমস্যা হয়েছে।', '❌');
    if (actionBtn) {
      actionBtn.disabled = false;
      actionBtn.textContent = t('আমি পৌঁছেগেছি');
    }
  }
}

async function startDriverActiveRide() {
  if (!activeRideId) return;
  const actionBtn = document.getElementById('driverActionBtn');
  const otpInput = document.getElementById('driverOtpInput');
  const otp = otpInput ? otpInput.value.trim() : '';

  if (!otp) {
    showPopup('পিন প্রয়োজন', 'দয়া করে যাত্রীর পিন নম্বর লিখুন।', '⚠️');
    return;
  }

  if (actionBtn) {
    actionBtn.disabled = true;
    actionBtn.textContent = t('অপেক্ষা করুন...');
  }

  try {
    const res = await apiCall(`/rides/start/${activeRideId}`, 'POST', { otp });
    if (res.success) {
      if (otpInput) {
        otpInput.value = '';
        otpInput.style.display = 'none';
      }
      listenToDriverActiveRide();
    }
  } catch (error) {
    showPopup('ত্রুটি', error.message || 'ট্রিপ শুরু করতে সমস্যা হয়েছে।', '❌');
    if (actionBtn) {
      actionBtn.disabled = false;
      actionBtn.textContent = t('Verify & Start');
    }
  }
}

async function endDriverActiveRide() {
  if (!activeRideId) return;
  const endBtn = document.getElementById('driverActionBtn') || document.getElementById('driverEndTripBtn');
  if (endBtn) {
    endBtn.disabled = true;
    endBtn.textContent = t('অপেক্ষা করুন...');
  }

  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }

  try {
    const res = await apiCall(`/rides/end/${activeRideId}`, 'POST');

    // Update driver's daily stats using the final fare from the completed ride
    if (res.success && res.ride) {
      updateDailyStats(res.ride.fare);
    }

    localStorage.removeItem('toto_active_ride_id');
    activeRideId = null;
    driverAcceptedRideCard.classList.add('hidden');

    showPopup('সফলতা', 'ট্রিপ সম্পন্ন হয়েছে! 🎉', '✅', () => {
      if (availabilityToggleCheckbox.checked) {
        rideRequestsContainer.innerHTML = `<p class="muted-text center-block">${t('উপলব্ধ রাইড খুঁজছি...')}</p>`;
        requestCountBadge.textContent = '0';
        listenToPendingQueue();
        pollInterval = setInterval(listenToPendingQueue, 16000);
      }
    });
  } catch (error) {
    showPopup('ত্রুটি', 'রাইড শেষ করতে সমস্যা হয়েছে।', '❌');
    if (endBtn) {
      endBtn.disabled = false;
      endBtn.textContent = t('ট্রিপ সমাপ্ত করুন');
    }
    pollInterval = setInterval(listenToDriverActiveRide, 16000);
  }
}

driverCancelRideBtn?.addEventListener('click', async () => {
  if (!activeRideId) return;
  if (!confirm(t('আপনি কি ট্রিপটি বাতিল করতে চান?'))) return;

  driverCancelRideBtn.disabled = true;
  driverCancelRideBtn.textContent = t('অপেক্ষা করুন...');

  try {
    const res = await apiCall(`/rides/cancel/${activeRideId}`, 'POST');
    localStorage.removeItem('toto_active_ride_id');
    activeRideId = null;
    document.getElementById('driverAcceptedRideCard').classList.add('hidden');

    if (res.penaltyApplied) {
      showPopup('সফল', '৫ মিনিট পার হওয়ায় ট্রিপ বাতিল হয়েছে এবং যাত্রীকে ₹30 পেনাল্টি দেওয়া হয়েছে।', '✅');
    } else {
      showPopup('সফল', 'ট্রিপ বাতিল করা হয়েছে।', '✅');
    }

    // Restart finding
    if (availabilityToggleCheckbox.checked) {
      listenToPendingQueue();
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = setInterval(listenToPendingQueue, 16000);
    }
  } catch (err) {
    showPopup('ত্রুটি', 'বাতিল করতে সমস্যা হয়েছে।', '❌');
  } finally {
    driverCancelRideBtn.disabled = false;
    driverCancelRideBtn.textContent = t('ট্রিপ বাতিল করুন');
  }
});

// Poll for driver active ride
function startDriverPoll() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(listenToDriverActiveRide, 16000);
}

// Initial boot
window.addEventListener('visibilitychange', () => {
  if (currentUser?.userType === 'passenger') {
    if (document.visibilityState === 'hidden') {
      updateOnlineStatus(false);
    } else {
      updateOnlineStatus(true);
    }
  }
});

// Initial boot
window.addEventListener('load', () => {
  // --- Service Worker and PWA Installability ---
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered successfully with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }

  // --- Translations and Splash Screen ---
  applyTranslations();
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

  // --- App Initialization ---
  addDownloadAppButton(); // Add the download app button to the bottom navigation
  renderApp();

  // --- PWA Installation Check ---
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (isInstalled) {
    console.log('App is already installed (standalone mode).');
    hideInstallPrompt(); // Ensure our prompt is hidden if user installs via other means
  }

  // --- Driver Specific Logic ---
  if (currentUser?.userType === 'driver' && activeRideId) {
    startDriverPoll();
  }
});

// --- Rating Popup UI ---
function showRatingPopup(rideId, driverName) {
  let modal = document.getElementById('ratingModal');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ratingModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;justify-content:center;align-items:center;';
    modal.innerHTML = `
      <div class="card" style="width:90%;max-width:400px;background:var(--surface-color, #fff);padding:20px;border-radius:12px;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.2);">
        <h3 style="margin-top:0;margin-bottom:10px;">ট্রিপ সম্পন্ন হয়েছে! 🎉</h3>
        <p style="color:var(--text-muted);margin-bottom:15px;">আপনার চালক <strong id="ratingDriverName" style="color:var(--text-color);"></strong> কে রেটিং দিন</p>
        <div id="starContainer" style="font-size:2.5rem;margin:15px 0;cursor:pointer;display:flex;justify-content:center;gap:10px;">
          <span class="star" data-val="1">☆</span>
          <span class="star" data-val="2">☆</span>
          <span class="star" data-val="3">☆</span>
          <span class="star" data-val="4">☆</span>
          <span class="star" data-val="5">☆</span>
        </div>
        <textarea id="ratingFeedback" placeholder="আপনার মতামত লিখুন (ঐচ্ছিক)" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-bottom:15px;font-size:1rem;resize:vertical;min-height:80px;"></textarea>
        <button id="submitRatingBtn" class="button primary" style="width:100%;margin-bottom:10px;">সাবমিট</button>
        <button id="skipRatingBtn" class="button secondary" style="width:100%;background:none;color:#888;border:none;">স্কিপ করুন</button>
      </div>
    `;
    document.body.appendChild(modal);

    let selectedRating = 0;
    const stars = modal.querySelectorAll('.star');
    stars.forEach(star => {
      star.addEventListener('click', (e) => {
        selectedRating = parseInt(e.target.dataset.val);
        stars.forEach(s => {
          if (parseInt(s.dataset.val) <= selectedRating) { s.textContent = '★'; s.style.color = '#f5b041'; }
          else { s.textContent = '☆'; s.style.color = '#ccc'; }
        });
      });
    });

    document.getElementById('submitRatingBtn').addEventListener('click', async () => {
      if (selectedRating > 0) {
        const btn = document.getElementById('submitRatingBtn');
        const feedback = document.getElementById('ratingFeedback').value.trim();
        btn.textContent = 'অপেক্ষা করুন...';
        try { await apiCall(`/rides/rate/${modal.dataset.rideId}`, 'POST', { rating: selectedRating, feedback }); } catch (e) { }
        btn.textContent = 'সাবমিট';
      }
      modal.style.display = 'none';
      showPopup('ধন্যবাদ', 'আপনার মতামতের জন্য ধন্যবাদ!', '🎉');
    });

    document.getElementById('skipRatingBtn').addEventListener('click', () => {
      modal.style.display = 'none';
      showPopup('ধন্যবাদ', 'আপনার ট্রিপটি সফলভাবে সম্পন্ন হয়েছে।', '🎉');
    });
  }

  document.getElementById('ratingDriverName').textContent = driverName;
  modal.dataset.rideId = rideId;

  // Reset stars and feedback
  modal.querySelectorAll('.star').forEach(s => { s.textContent = '☆'; s.style.color = '#ccc'; });
  const feedbackInput = document.getElementById('ratingFeedback');
  if (feedbackInput) feedbackInput.value = '';
  modal.style.display = 'flex';
}
