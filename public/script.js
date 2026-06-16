// ===== Notification Helpers =====
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

function sendNotification(title, options = {}) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛺</text></svg>',
      ...options
    });

    // If they click the native push notification, focus the browser tab
    notification.onclick = function() {
      window.focus();
      this.close();
    };
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
const API_BASE_URL ='https://totoapp.onrender.com/api';

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
  'সাইন আপ করুন': 'Sign Up',
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
  'সহজে টোটো বুক করুন': 'Book Toto Easily',
  'সুলভ, নিরাপদ ও বিশ্বস্ত পরিষেবা': 'Affordable, Safe, Reliable',
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
  'টোটো খোঁজা হচ্ছে...': 'Looking for Toto...',
  'চালকের জন্য অপেক্ষা করুন': 'Wait for Driver',
  'অপেক্ষা করুন...': 'Please wait...',
  'সেভ করুন': 'Save',
  'বাতিল': 'Cancel',
  'আপনার ট্রিপটি সফলভাবে সম্পন্ন হয়েছে। ধন্যবাদ!': 'Trip completed successfully!',
  'আপনার একটি রাইড ইতিমধ্যে খোঁজা হচ্ছে।': 'A ride is already searching.',
  'দয়া করে প্রথমে আপনার শুরুর স্থান (পিকআপ) নির্বাচন করুন।': 'Please select pickup location.',
  'শুরুর স্থান এবং গন্তব্য একই হতে পারে না।': 'Pickup and dropoff must differ.',
  'আপনার টোটো বুকিং অনুরোধটি চালকদের পাঠানো হয়েছে।': 'Booking request sent to drivers.',
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
  'কাছাকাছি একটি টোটো খুঁজে বের করা হচ্ছে...': 'Finding a nearby Toto...',
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
  '📌 স্থলচিহ্ন:': '📌 Landmark:',
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
  'টোটোটি চালু করুন': 'Verify & Start',
  'ভুল পিন (Invalid OTP)': 'Invalid OTP',
  'পিন প্রয়োজন': 'PIN Required',
  'দয়া করে যাত্রীর পিন নম্বর লিখুন।': 'Please enter passenger PIN.',
  'আপনার পিন (Your PIN)': 'Your PIN',
  'পিন (PIN)': 'PIN',
  'আপনার টোটো বাইরে অপেক্ষা করছে!': 'Your Toto is waiting outside!',
  'আমি পৌঁছেছি': 'I Have Arrived',
  'আপডেট করতে সমস্যা হয়েছে।': 'Failed to update.',
  'বেশি ভাড়া লাগবে সন্ধ্যা ৬টা থেকে সকাল ৬টা পর্যন্ত': 'Higher fares will apply from 6 PM to 6 AM.',
  'নেভিগেট': 'Navigate',
  'লোকেশন চেক করা হচ্ছে...': 'Getting location...',
  'যোগ করা হয়নি': 'Not Added',
  'ট্রিপ বাতিল করুন': 'Cancel Trip',
  'আপনি কি ট্রিপটি বাতিল করতে চান?': 'Are you sure you want to cancel?',
  'পেনাল্টি বাকি আছে': 'Penalty Due',
  'Penalty Due: আপনার আগের একটি বাতিল রাইডের জন্য ₹২০ ফি বাকি আছে।': 'Penalty Due: You have an unpaid ₹20 fee for a previous cancelled ride.',
  'আমি পেমেন্ট করেছি': 'I Have Paid',
  'বন্ধ করুন': 'Close',
  'চালকের কনফার্মেশনের জন্য অপেক্ষা করা হচ্ছে...': 'Waiting for driver confirmation...',
  'হ্যাঁ, আমি ₹20 পেয়েছি': 'Yes, I received ₹20',
  'আপনার অনুরোধ চালকের কাছে পাঠানো হয়েছে। চালক নিশ্চিত করলে আপনি নতুন রাইড বুক করতে পারবেন।': 'Request sent to driver. Once confirmed, you can book a new ride.',
  '💳 এখনই পে করুন (Pay Now)': '💳 Pay Now'
};

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
  'করাটিয়া': 'Karatia',
  'গুসকরা': 'Guskara',
  'শিমুলগ্রাম': 'Shimulgram',
  'আউশগ্রাম': 'Ausgram',
  'বননবগ্রাম': 'Bonnabgram',
  'করটিয়া': 'Karatia',
  'বননবগ্ৰাম': 'Bonnabgram'
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

// Splash screen handler - show only if user not logged in
window.addEventListener('load', () => {
  applyTranslations();
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
      const err = new Error(data.message || 'API Error');
      err.data = data;
      throw err;
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
const adminDashboard = document.getElementById('adminDashboard');
const profilePage = document.getElementById('profilePage');
const rideHistoryPage = document.getElementById('rideHistoryPage');
const favoriteRidesPage = document.getElementById('favoriteRidesPage');
const helpSupportPage = document.getElementById('helpSupportPage');
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
const pickupVillageSelect = document.getElementById('pickupVillage');
const pickupStoppageSelect = document.getElementById('pickupStoppage');
const dropoffVillageSelect = document.getElementById('dropoffVillage');
const dropoffStoppageSelect = document.getElementById('dropoffStoppage');
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
const rideRequestsContainer = document.getElementById('rideRequests');
const requestCountBadge = document.getElementById('requestCountBadge');
const driverAcceptedRideCard = document.getElementById('driverAcceptedRideCard');
const driverCancelRideBtn = document.getElementById('driverCancelRideBtn');

// Admin workflow targets
const adminUsersTabBtn = document.getElementById('adminUsersTabBtn');
const adminLocationsTabBtn = document.getElementById('adminLocationsTabBtn');
const adminFeedbackTabBtn = document.getElementById('adminFeedbackTabBtn');
const adminUsersPanel = document.getElementById('adminUsersPanel');
const adminLocationsPanel = document.getElementById('adminLocationsPanel');
const adminFeedbackPanel = document.getElementById('adminFeedbackPanel');

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

// Feedback targets
const feedbackForm = document.getElementById('feedbackForm');
const feedbackText = document.getElementById('feedbackText');
const feedbackSubmitBtn = document.getElementById('feedbackSubmitBtn');

const FARE_PER_KM = 10;
const BASE_FARE = 10;
let locationData = [];

// --- Global State & Listeners ---
let currentUser = JSON.parse(localStorage.getItem('toto_active_user')) || null;
let activeRideId = localStorage.getItem('toto_active_ride_id') || null;
let pollInterval = null;
let adminPollInterval = null;
let popupCloseCallback = null;
let rejectedRides = {}; // Track rejected rides with timestamp: { rideId: timestamp }
let knownPendingRideIds = new Set(); // Tracks active requests to avoid repeating the sound
let arrivalTimerInterval = null;

// --- Location Helpers ---
function findStoppageInData(stoppageId) {
  for (const village of locationData) {
    const stoppage = village.stoppages.find(s => s.id === stoppageId);
    if (stoppage) return { village, stoppage };
  }
  return null;
}

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

function populateStoppageSelect(selectEl, villageId, placeholder) {
  if (!selectEl) return;
  selectEl.innerHTML = `<option value="">${t(placeholder)}</option>`;

  const village = locationData.find(v => v.id === villageId);
  if (!village) {
    selectEl.disabled = true;
    return;
  }

  village.stoppages.forEach(stoppage => {
    const option = document.createElement('option');
    option.value = stoppage.id;
    option.textContent = t(stoppage.nameBn);
    selectEl.appendChild(option);
  });
  selectEl.disabled = false;
}

function setLocationSelection(villageSelect, stoppageSelect, villageId, stoppageId) {
  if (!villageSelect || !stoppageSelect) return;
  villageSelect.value = villageId;
  populateStoppageSelect(stoppageSelect, villageId, t('স্টপেজ নির্বাচন করুন'));
  stoppageSelect.value = stoppageId;
}

function getSelectedPickupAddress() {
  const villageId = pickupVillageSelect?.value;
  const village = locationData.find(v => v.id === villageId);
  if (!village) return '';
  const landmark = landmarkInput?.value?.trim();
  let address = `${t(village.nameBn)}`;
  if (landmark) address += ` (${landmark})`;
  return address;
}

function getSelectedDropoffAddress() {
  const villageId = dropoffVillageSelect?.value;
  const village = locationData.find(v => v.id === villageId);
  if (!village) return '';
  return `${t(village.nameBn)}`;
}

function calculatePreviewDistance() {
  const pickupId = pickupVillageSelect?.value;
  const dropoffId = dropoffVillageSelect?.value;
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
      
      populateVillageSelect(pickupVillageSelect, t('গ্রাম নির্বাচন করুন'));
      populateVillageSelect(dropoffVillageSelect, t('গ্রাম নির্বাচন করুন'));
      populateVillageSelect(newStoppageVillageSelect, t('গ্রাম নির্বাচন করুন'));
      
      renderPopularPlaces();
      if (typeof favoriteRidesPage !== 'undefined' && !favoriteRidesPage.classList.contains('hidden')) {
        displayFavorites();
      }
}

loadLocations();

// --- Global Notification Alert ---
function showPopup(title, message, icon = '🔔', onClose = null) {
  if (!popupOverlay) return;
  popupTitle.textContent = t(title);
  popupMessage.textContent = t(message);
  popupIcon.textContent = icon;
  popupOverlay.classList.remove('hidden');
  popupOverlay.setAttribute('aria-hidden', 'false');
  popupCloseCallback = onClose;
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
    const upiLink = `upi://pay?pa=${encodeURIComponent(penalty.driverUpiId)}&pn=${encodeURIComponent(penalty.driverName || 'Driver')}&am=${penalty.amount || 20}&cu=INR&tn=TotoBondhu%20Penalty`;
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
  profileRoleEl.textContent = currentUser.userType === 'passenger' ? t('যাত্রী (Passenger)') : (currentUser.userType === 'admin' ? t('অ্যাডমিন (Admin)') : t('টোটো চালক (Driver)'));
  profileAvatarEl.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.firstName}`;

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
  } catch (err) {}
  
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
  document.getElementById('profilePageAvatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.firstName}`;
  
  if (currentUser.userType === 'driver') {
    document.getElementById('vehicleNumberDetail').classList.remove('hidden');
    document.getElementById('profilePageVehicle').textContent = currentUser.vehicleNumber || t('না আছে');
  } else {
    document.getElementById('vehicleNumberDetail').classList.add('hidden');
  }
  
  const ratingDetail = document.getElementById('ratingDetail');
  if (currentUser.userType === 'driver') {
    if (ratingDetail) ratingDetail.classList.remove('hidden');
  } else {
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

window.bookFavorite = function(villageId, stoppageId, stopName) {
  if (activeRideId) {
    showPopup('অপেক্ষা করুন', 'আপনার একটি রাইড ইতিমধ্যে খোঁজা হচ্ছে।', '⏳');
    return;
  }
  
  if (!pickupVillageSelect?.value) {
    showHomePage();
    showPopup('শুরুর স্থান প্রয়োজন', 'দয়া করে প্রথমে আপনার শুরুর স্থান (পিকআপ) নির্বাচন করুন।', '📍');
    return;
  }

  showHomePage();
  dropoffVillageSelect.value = villageId;
  
  if (dropoffColumn) {
    dropoffColumn.classList.remove('hidden');
  }
  updateRidePreview();
  
  showPopup('গন্তব্য সেট হয়েছে', `${stopName} গন্তব্য হিসেবে সেট করা হয়েছে। ভাড়া চেক করে টোটো খুঁজুন।`, '✅');
}

// --- Admin Logic ---
function setupAdminDashboard() {
  loadAdminUsers();
  loadAdminStats();

  if (adminPollInterval) clearInterval(adminPollInterval);
  adminPollInterval = setInterval(() => {
    loadAdminStats();
    if (document.getElementById('adminUsersPanel') && !document.getElementById('adminUsersPanel').classList.contains('hidden')) {
      loadAdminUsers();
    }
    if (document.getElementById('adminFeedbackPanel') && !document.getElementById('adminFeedbackPanel').classList.contains('hidden')) {
      loadAdminFeedback();
    }
  }, 16000);
}

async function loadAdminStats() {
  try {
    const res = await apiCall('/admin/stats');
    if (res.success) {
      const countEl = document.getElementById('adminOnlineDriversCount');
      if (countEl) countEl.textContent = `🛺 ${res.onlineDriversCount}`;
    }
  } catch (error) {
    console.error('Failed to load admin stats:', error);
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

async function loadAdminUsers() {
  const list = document.getElementById('adminUsersList');
  if (!list) return;
  list.innerHTML = `<p class="muted-text center-block">${t('লোড হচ্ছে...')}</p>`;
  try {
    const res = await apiCall('/admin/users');
    if (res.success && res.users.length > 0) {
      list.innerHTML = res.users.map(u => `
        <div class="request-item" style="margin-bottom: 10px;">
          <p>👤 <strong>${u.firstName} ${u.lastName}</strong> <span class="badge" style="float:right;">${t(u.userType === 'driver' ? 'চালক' : u.userType === 'admin' ? 'অ্যাডমিন' : 'যাত্রী')}</span></p>
          <p>📱 ${u.phone}</p>
          ${u.vehicleNumber ? `<p>🔢 ${u.vehicleNumber}</p>` : ''}
          <div style="text-align: right; margin-top: 8px;">
            <button class="button danger" style="padding: 6px 12px; font-size: 0.8rem;" onclick="deleteAdminUser('${u._id}')">🗑️ ${t('ডিলিট')}</button>
          </div>
        </div>
      `).join('');
    } else {
      list.innerHTML = `<p class="muted-text center-block">${t('কোনো ব্যবহারকারী পাওয়া যায়নি')}</p>`;
    }
  } catch (error) {
    list.innerHTML = `<p class="muted-text center-block">${t('লোড করতে সমস্যা হয়েছে')}</p>`;
  }
}

window.deleteAdminUser = async function(userId) {
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
  if (currentUser?.userType === 'driver') updateOnlineStatus(false);
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
  if(pickupVillageSelect) populateVillageSelect(pickupVillageSelect, 'গ্রাম নির্বাচন করুন');
  if(dropoffVillageSelect) populateVillageSelect(dropoffVillageSelect, 'গ্রাম নির্বাচন করুন');
  if(newStoppageVillageSelect) populateVillageSelect(newStoppageVillageSelect, 'গ্রাম নির্বাচন করুন');
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

// Logout button in profile page
document.getElementById('logoutProfileBtn')?.addEventListener('click', () => {
  if (currentUser?.userType === 'driver') updateOnlineStatus(false);
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
          <div>
            <label style="font-size:0.9rem;color:var(--text-muted, #666);">ইউপিআই আইডি (UPI ID)</label>
            <input type="text" id="editUpiId" placeholder="যেমন: 9876543210@ybl" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-top:5px;font-size:1rem;">
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
      currentUser.upiId = document.getElementById('editUpiId').value.trim();
      localStorage.setItem('toto_active_user', JSON.stringify(currentUser));
      
      try { await apiCall('/auth/profile', 'PUT', { firstName: currentUser.firstName, lastName: currentUser.lastName, upiId: currentUser.upiId }); } catch (err) { /* Optional fallback */ }

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
  
  authMessage.textContent = t('অ্যাকাউন্ট তৈরি হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...');
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
      localStorage.removeItem('toto_active_ride_id');
      activeRideId = null;
      resetCustomerUI();
      
      // Check if passenger got penalized (e.g. from 5-min auto cancel)
      try {
        const userRes = await apiCall('/auth/profile');
        if (userRes.success && userRes.user.activePenalty && userRes.user.activePenalty.amount > 0) {
          showPenaltyModal(userRes.user.activePenalty);
        } else {
          showPopup('বাতিল', 'আপনার ট্রিপটি বাতিল হয়েছে।', '⚠️');
        }
      } catch (e) {
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
                customerWaitMsg.innerHTML = `${t('আপনার টোটো বাইরে অপেক্ষা করছে!')}<br><span style="color: var(--danger-color); font-size: 1.1rem; font-weight: 800;">⏳ 0:00</span>`;
                if (arrivalTimerInterval) clearInterval(arrivalTimerInterval);
              } else {
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                customerWaitMsg.innerHTML = `${t('আপনার টোটো বাইরে অপেক্ষা করছে!')}<br><span style="color: var(--danger-color); font-size: 1.1rem; font-weight: 800;">⏳ ${minutes}:${seconds < 10 ? '0' : ''}${seconds}</span>`;
              }
            };
            updateTimer();
            arrivalTimerInterval = setInterval(updateTimer, 1000);
          }
        } else {
          customerWaitMsg.textContent = t('আপনার টোটো বাইরে অপেক্ষা করছে!');
        }
        
        customerWaitMsg.classList.remove('hidden');
        if (cancelRideBtn) cancelRideBtn.classList.remove('hidden');
        
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
      <p class="muted-text">${t('কাছাকাছি একটি টোটো খুঁজে বের করা হচ্ছে...')}</p>
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
window.callDriver = function() {
  const btn = document.getElementById('driverCallBtn');
  const phone = btn.href.replace('tel:', '');
  window.location.href = `tel:${phone}`;
};

window.callCustomer = function() {
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
  rideSubmitBtn.textContent = t('টোটো খুঁজুন');
  rideSubmitBtn.style.opacity = "1";
  if (pickupVillageSelect) pickupVillageSelect.value = '';
  
  if (pickupColumn) pickupColumn.classList.remove('hidden');
  if (pickupSummary) pickupSummary.classList.add('hidden');
  if (dropoffColumn) dropoffColumn.classList.add('hidden');
  
  if (dropoffVillageSelect) dropoffVillageSelect.value = '';
  if (landmarkInput) landmarkInput.value = '';
  pricePreviewCard.classList.add('hidden');

  if (pickupStoppageSelect) {
    pickupStoppageSelect.style.display = 'none';
    if (pickupStoppageSelect.previousElementSibling) pickupStoppageSelect.previousElementSibling.style.display = 'none';
  }
  if (dropoffStoppageSelect) {
    dropoffStoppageSelect.style.display = 'none';
    if (dropoffStoppageSelect.previousElementSibling) dropoffStoppageSelect.previousElementSibling.style.display = 'none';
  }
}

rideRequestForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (activeRideId) return;

  const pickupVillageId = pickupVillageSelect?.value;
  const dropoffVillageId = dropoffVillageSelect?.value;
  const landmark = landmarkInput?.value?.trim() || '';

  if (!pickupVillageId || !dropoffVillageId) {
    showPopup('ত্রুটি', 'গ্রাম নির্বাচন করুন।', '❌');
    return;
  }

  const pickupAddress = getSelectedPickupAddress();
  const dropoffAddress = getSelectedDropoffAddress();
  const distance = calculatePreviewDistance();
  
  // Calculate exact fare requested so it syncs perfectly with driver dashboard
  let fare = Math.max(BASE_FARE, distance * FARE_PER_KM);
  const hour = new Date().getHours();
  if (hour >= 18 || hour < 6) {
    fare = Math.ceil(fare * 1.20);
  }
  
  rideSubmitBtn.disabled = true;
  rideSubmitBtn.textContent = t('লোকেশন চেক করা হচ্ছে...');

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

  // Provide valid stoppage IDs for the live backend fallback
  const pVillage = locationData.find(v => v.id === pickupVillageId);
  const dVillage = locationData.find(v => v.id === dropoffVillageId);
  const pickupStoppageId = pVillage?.stoppages?.[0]?.id || pickupVillageId;
  const dropoffStoppageId = dVillage?.stoppages?.[0]?.id || dropoffVillageId;

  try {
    const response = await apiCall('/rides/request', 'POST', {
      pickupVillageId,
      dropoffVillageId,
      pickupStoppageId,
      dropoffStoppageId,
      landmark,           // For your new backend
      fare,               // Pass explicit calculated fare
      pickupLat,          // Explicit exact location
      pickupLng,          // Explicit exact location
      
      // Fallback for your current live Render backend:
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
      distance: Number(distance.toFixed(1)),
      fare: fare
    });

    if (response.success) {
      activeRideId = response.ride._id;
      localStorage.setItem('toto_active_ride_id', activeRideId);
      
      if (cancelRideBtn) cancelRideBtn.classList.remove('hidden');
      
      // Start polling - every 16 seconds for real-time updates
      if (pollInterval) clearInterval(pollInterval);
      pollCustomerRide(); // Initial call
      pollInterval = setInterval(pollCustomerRide, 16000);
      
      // Notify all drivers of new ride request
      notifyDriversOfRide(activeRideId, pickupAddress, response.ride.fare);
      
      showPopup('অনুরোধ পাঠানো হয়েছে', 'আপনার টোটো বুকিং অনুরোধটি চালকদের পাঠানো হয়েছে।', '✅');
    }
  } catch (error) {
    console.error("Booking error:", error);
    if (error.message === 'PENALTY_DUE') {
      if (error.data && error.data.penalty) {
        showPenaltyModal(error.data.penalty);
      } else {
        showPopup('পেনাল্টি বাকি আছে', 'Penalty Due: আপনার আগের একটি বাতিল রাইডের জন্য ₹২০ ফি বাকি আছে।', '⛔');
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
      } catch(e) {
        showPopup('পেনাল্টি বাকি আছে', 'Penalty Due: আপনার আগের একটি বাতিল রাইডের জন্য ₹২০ ফি বাকি আছে।', '⛔');
      }
    } else {
      showPopup('সফল', 'ট্রিপ বাতিল করা হয়েছে।', '✅');
    }
  } catch (err) {
    showPopup('ত্রুটি', 'বাতিল করতে সমস্যা হয়েছে।', '❌');
  } finally {
    cancelRideBtn.disabled = false;
    cancelRideBtn.textContent = t('ট্রিপ বাতিল করুন');
  }
});

// --- Preview & Calculation ---
function updateRidePreview() {
  const pickup = pickupVillageSelect?.value;
  const drop = dropoffVillageSelect?.value;
  if (!pickup || !drop) { pricePreviewCard.classList.add('hidden'); return; }
  const distance = calculatePreviewDistance();
  let fare = Math.max(BASE_FARE, distance * FARE_PER_KM);
  
  // Apply 20% night surge to preview based on user's local phone time
  const hour = new Date().getHours();
  if (hour >= 18 || hour < 6) {
    fare = Math.ceil(fare * 1.20);
  }
  
  distanceInfoInput.value = `${distance} km`;
  fareInfoInput.value = `₹${fare}`;
  pricePreviewCard.classList.remove('hidden');
}

pickupVillageSelect?.addEventListener('change', () => {
  if (pickupVillageSelect.value && dropoffColumn) {
    dropoffColumn.classList.remove('hidden');
  } else if (!pickupVillageSelect.value && dropoffColumn) {
    dropoffColumn.classList.add('hidden');
    if (dropoffVillageSelect) dropoffVillageSelect.value = '';
  }
  updateRidePreview();
});

dropoffVillageSelect?.addEventListener('change', () => {
  updateRidePreview();
});

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
    
    if (guskara) popularPlaces.push({ name: 'গুসকরা', villageId: guskara.id });
    if (ausgram) popularPlaces.push({ name: 'আউশগ্রাম', villageId: ausgram.id });
    if (bonnabgram) popularPlaces.push({ name: 'বননবগ্রাম', villageId: bonnabgram.id });
    if (karatia) popularPlaces.push({ name: 'করটিয়া', villageId: karatia.id });
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
    `<div class="stop-chip" data-village-id="${place.villageId}">${t(place.name)}</div>`
  ).join('');

  document.querySelectorAll('.stop-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      if (activeRideId) { showPopup('অপেক্ষা করুন', 'আপনার একটি রাইড ইতিমধ্যে খোঁজা হচ্ছে।', '⏳'); return; }
      if (!pickupVillageSelect?.value) { showPopup('শুরুর স্থান প্রয়োজন', 'দয়া করে প্রথমে আপনার শুরুর স্থান (পিকআপ) নির্বাচন করুন।', '📍'); return; }

      const villageId = e.target.dataset.villageId;

      dropoffVillageSelect.value = villageId;
      
      if (dropoffColumn) {
        dropoffColumn.classList.remove('hidden');
      }
      updateRidePreview();
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
  if (!currentUser || currentUser.userType !== 'driver') return;
  try {
    await apiCall('/auth/online-status', 'PUT', { isOnline });
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
  } catch (err) {}

  const isAvailable = localStorage.getItem('toto_driver_online') === 'true';
  availabilityToggleCheckbox.checked = isAvailable;
  toggleDriverStatus(isAvailable);
  updateOnlineStatus(isAvailable);
  if (activeRideId) {
    listenToDriverActiveRide();
  }
  // Update daily stats display
  updateStatsDisplay();
}

availabilityToggleCheckbox.addEventListener('change', () => {
  const isAvailable = availabilityToggleCheckbox.checked;
  
  // Request native push notification permission when driver goes online
  if (isAvailable && "Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
  }
  
  localStorage.setItem('toto_driver_online', isAvailable);
  toggleDriverStatus(isAvailable);
  updateOnlineStatus(isAvailable);
});

function toggleDriverStatus(isAvailable) {
  toggleStatusLabel.textContent = isAvailable ? t('অনলাইন') : t('অফলাইন');
  toggleStatusLabel.style.color = isAvailable ? 'var(--primary-brand)' : 'var(--text-muted)';

  if (isAvailable) {
    // Start polling when going online - every 16 seconds
    if (pollInterval) clearInterval(pollInterval);
    listenToPendingQueue(); // Initial call
    pollInterval = setInterval(listenToPendingQueue, 16000);
  } else {
    if (pollInterval) clearInterval(pollInterval);
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
          <p style="margin: 0 0 10px 0;">যাত্রী <strong>${p.firstName} ${p.lastName}</strong> (${p.phone}) জানিয়েছেন যে তিনি আপনার বাতিল রাইডের <strong>₹20</strong> পেনাল্টি পরিশোধ করেছেন।</p>
          <button class="button primary full-width" onclick="confirmPenaltyPayment('${p._id}')" style="background:#f57c00; border:none;">হ্যাঁ, আমি ₹20 পেয়েছি</button>
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

window.confirmPenaltyPayment = async function(passengerId) {
  try {
    const res = await apiCall(`/rides/driver/confirm-penalty/${passengerId}`, 'POST');
    if (res.success) { showPopup('সফল', 'পেনাল্টি পেমেন্ট নিশ্চিত করা হয়েছে!', '✅'); fetchPendingPenalties(); }
  } catch (e) { showPopup('ত্রুটি', 'নিশ্চিত করতে সমস্যা হয়েছে।', '❌'); }
};

async function listenToPendingQueue() {
  if (activeRideId) return;

  fetchPendingPenalties();

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
      
      if (ride.offers && ride.offers.length > 0) {
        const myOffer = ride.offers.find(o => (o.driverId && o.driverId._id === currentUser._id) || o.driverId === currentUser._id);
        if (myOffer) return false;
      }

      return true;
    });

    // Check for newly arrived rides to trigger the sound alert
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
    knownPendingRideIds = currentIds; // Update the known list for the next poll

    requestCountBadge.textContent = rides.length.toString();
    
    if (rides.length === 0) {
      rideRequestsContainer.innerHTML = `<p class="muted-text center-block">${t('এই মুহূর্তে কোনো বুকিং অনুরোধ নেই।')}</p>`;
      stopNotificationSound();
      return;
    }

    rideRequestsContainer.innerHTML = '';
    rides.forEach((ride) => {
      const item = document.createElement('div');
      item.className = 'request-item';
      item.innerHTML = `
        <p>👤 <strong>${ride.passengerId.firstName} ${ride.passengerId.lastName}</strong></p>
        <p>📍 ${t('পিকআপ:')} ${t(ride.pickupLocation.villageName)}</p>
        ${ride.pickupLocation.landmark ? `<p>${t('📌 স্থলচিহ্ন:')} ${ride.pickupLocation.landmark}</p>` : ''}
        <p>🏁 ${t('গন্তব্য:')} ${t(ride.dropoffLocation.villageName)}</p>
        <p>💰 ${t('ভাড়া:')} <span class="text-green">₹${ride.fare}</span> (${ride.distance} km)</p>
        <div class="request-actions" style="flex-wrap: wrap;">
          <button class="button primary accept-btn" data-id="${ride._id}" data-fare="${ride.fare}">${t('গ্রহণ করুন')}</button>
          <button class="button secondary negotiate-btn" data-id="${ride._id}" data-fare="${ride.fare}">${t('ভাড়া বাড়ান')}</button>
          <button class="button danger reject-pending-btn" data-id="${ride._id}" style="width: 100%; margin-top: 5px; background: #e0e0e0; color: #333;">${t('প্রত্যাখ্যান করুন')}</button>
        </div>
      `;
      rideRequestsContainer.appendChild(item);
    });

    document.querySelectorAll('.accept-btn').forEach(btn => {
      btn.addEventListener('click', (e) => submitOffer(e.target.dataset.id, e.target.dataset.fare));
    });

    document.querySelectorAll('.negotiate-btn').forEach(btn => {
      btn.addEventListener('click', (e) => showNegotiatePopup(e.target.dataset.id, e.target.dataset.fare));
    });
    
    document.querySelectorAll('.reject-pending-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rideId = e.target.dataset.id;
        rejectedRides[rideId] = Date.now() + 60000; // Hide for 60 seconds
        stopNotificationSound();
        listenToPendingQueue(); // Re-render immediately
      });
    });

    // Poll for updates every 16 seconds for real-time updates
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(listenToPendingQueue, 16000);
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
    showPopup('ত্রুটি', 'রাইডটি ইতিমধ্যে অন্য কেউ নিয়ে নিয়েছে অথবা বাতিল হয়েছে।', '⚠️');
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
      }
      
      showPopup('ট্রিপ শেষ', ride.rideStatus === 'completed' ? 'যাত্রী ট্রিপটি সমাপ্ত করেছেন।' : 'ট্রিপটি বাতিল হয়েছে।', ride.rideStatus === 'completed' ? '✅' : '⚠️');
      
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
        actionBtn.textContent = t('টোটোটি চালু করুন');
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
    await apiCall(`/rides/cancel/${activeRideId}`, 'POST');
    localStorage.removeItem('toto_active_ride_id');
    activeRideId = null;
    document.getElementById('driverAcceptedRideCard').classList.add('hidden');
    showPopup('সফল', 'ট্রিপ বাতিল করা হয়েছে।', '✅');
    
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
window.addEventListener('load', () => {
  renderApp();
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
        try { await apiCall(`/rides/rate/${modal.dataset.rideId}`, 'POST', { rating: selectedRating, feedback }); } catch(e) {}
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
