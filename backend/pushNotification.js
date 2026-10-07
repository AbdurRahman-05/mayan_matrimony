import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isInitialized = false;

export const initFirebaseAdmin = async () => {
    if (isInitialized) return;
    try {
        const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
        
        // Attempt to load the JSON. This will throw if file is not found (meaning user hasn't set it up yet).
        const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        isInitialized = true;
        console.log('Firebase Admin initialized successfully.');
    } catch (error) {
        console.warn('Firebase Admin NOT initialized. Please ensure firebase-service-account.json exists.', error.message);
    }
};

export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
    if (!fcmToken || !isInitialized) return false;

    const message = {
        notification: {
            title: title,
            body: body
        },
        data: data,
        token: fcmToken
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent push message:', response);
        return true;
    } catch (error) {
        console.error('Error sending push message:', error);
        return false;
    }
};

// Auto-initialize when the file is imported
initFirebaseAdmin();
