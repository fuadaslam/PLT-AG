# PLT Admin Portal & Dynamic Content System

This website has been upgraded to support a **Product Management Portal** using Firebase (a Google service). This allows you to manage products without editing code.

## 1. Setup (One-Time)

To make the Admin Portal work, you need to set up a free Firebase project.

1.  **Create Project**: Go to [Firebase Console](https://console.firebase.google.com/) and create a new project (e.g., "PLT-AG").
2.  **Enable Firestore**:
    *   Go to **Build > Firestore Database**.
    *   Click **Create Database**.
    *   Choose **Start in production mode** (or test mode if you want easier initial access, but production is safer).
    *   **Rules**: You will need to set rules to allow read/write. For now, you can use:
        ```
        allow read: if true;
        allow write: if request.auth != null;
        ```
3.  **Enable Authentication**:
    *   Go to **Build > Authentication**.
    *   Click **Get Started**.
    *   Enable **Email/Password** provider.
    *   Add a user account (e.g., `admin@plantlabztech.com` with a password). This will be your login.
4.  **Register App**:
    *   Go to **Project Settings** (gear icon).
    *   Scroll down to "Your apps" and click the web icon (`</>`).
    *   Register the app (e.g. "PLT Website").
    *   **Copy the `firebaseConfig` object**.

## 2. Configure the Website

1.  Open the file `assets/js/firebase-config.js` in your project.
2.  Paste the `firebaseConfig` object you copied from the Firebase Console, replacing the placeholder.

## 3. Initial Data Sync

1.  Open the Admin Portal in your browser: `http://localhost:port/admin/` (or `yoursite.com/admin/`).
2.  Log in with the email/password you created in Firebase Authentication.
3.  On the dashboard, if the database is empty, you will see a **"Initialize Data"** button.
4.  Click it to upload all existing products from `products-data.js` to the Firebase Database.

## 4. Usage

*   **Visit `/admin/`** to log in.
*   **Add/Edit Products**: Use the interface to change details.
*   **Live Updates**: Changes made in the portal appear on the website immediately (after a page refresh).
*   **Images**: Currently, you must provide the path to images (e.g., `assets/img/filename.png`). To support uploading new images, you would need to enable Firebase Storage and update the admin script (a more advanced feature).

## Fallback

If Firebase is not configured or fails to load, the website will automatically fall back to the original `assets/js/products-data.js` file, ensuring the site never breaks.
