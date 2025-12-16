// Firebase Configuration
// TODO: Replace with your actual Firebase project configuration
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (e.g., "plt-ag-admin")
// 3. Enable Firestore Database (start in Test Mode mostly, or Production with rules)
// 4. Enable Authentication (Email/Password provider)
// 5. Enable Storage (for images)
// 6. Go to Project Settings > General > Your apps > Web app > Register app
// 7. Copy the firebaseConfig object below

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCWakhy3b-YPPM_fsrdMPvg6sh9Bz10S-0",
  authDomain: "plt-ag.firebaseapp.com",
  projectId: "plt-ag",
  storageBucket: "plt-ag.firebasestorage.app",
  messagingSenderId: "530262776010",
  appId: "1:530262776010:web:4090ca6b0c4a6d6c02fc33",
  measurementId: "G-7KDTPHEW92"
};

// Initialize Firebase
// Note: We use 'var' or 'window' to ensure it's accessible globally strictly for this static site setup
window.firebaseConfig = firebaseConfig;
