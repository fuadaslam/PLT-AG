# Enabling Image Uploads (Firebase Storage)

To allow users to upload images from their computer instead of just pasting a URL, you must enable **Firebase Storage**.

1.  **Go to Firebase Console**: [console.firebase.google.com](https://console.firebase.google.com/)
2.  **Select Project**: Open your `plt-ag` project.
3.  **Enable Storage**:
    *   Click **Build > Storage** in the left sidebar.
    *   Click **Get Started**.
    *   **Start in Production Mode** (recommended) or Test Mode.
    *   **Location**: Choose a location (e.g., `asia-south1` or `us-central1` - just keep the default if unsure).
    *   Click **Done**.
4.  **Set Rules**:
    *   Once enabled, go to the **Rules** tab in Storage.
    *   Update the rules to allow writes by authenticated users:
    ```
    rules_version = '2';
    service firebase.storage {
      match /b/{bucket}/o {
        match /{allPaths=**} {
          allow read: if true;
          allow write: if request.auth != null;
        }
      }
    }
    ```
    *   Click **Publish**.

5.  **CORS Configuration (Important)**:
    *   If you see CORS errors while uploading from `localhost` or your domain, you might need to configure CORS for your bucket. However, for standard Firebase Web SDK uploads, it usually works out of the box for the default bucket. If issues persist, you typically need to run a `gsutil` command to set CORS, but try without it first.

### How to Use
1.  Refresh the Admin Dashboard.
2.  Click **Add Product** or **Edit** one.
3.  You will now see **"Option 1: Upload Image"**.
4.  Select a file and click **Save Product**. The image will be uploaded, and the URL will be saved automatically.
