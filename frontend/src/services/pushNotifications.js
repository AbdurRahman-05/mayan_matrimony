import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { apiFetch } from './api';

export const initPushNotifications = async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
            console.warn('User denied push notification permissions');
            return;
        }

        await PushNotifications.register();

        PushNotifications.addListener('registration', async (token) => {
            console.log('Push registration success, token: ' + token.value);
            try {
                await apiFetch('/settings/fcm-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: token.value })
                });
            } catch (e) {
                console.error('Failed to send FCM token to backend', e);
            }
        });

        PushNotifications.addListener('registrationError', (error) => {
            console.error('Error on registration: ' + JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ', notification);
            // Optionally dispatch custom event to update UI
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push action performed: ', notification);
            // Example: window.location.href = '/chat'
        });

    } catch (e) {
        console.error('Push Notifications Initialization failed: ', e);
    }
};
