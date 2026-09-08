"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryPushOutbox = exports.processPushOnCreate = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
const firestore_2 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v2_1 = require("firebase-functions/v2");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
(0, v2_1.setGlobalOptions)({ region: 'southamerica-east1', maxInstances: 1 });
async function sendJob(jobId, job) {
    const db = (0, firestore_1.getFirestore)();
    const ref = db.collection('_pushOutbox').doc(jobId);
    const claimed = await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(ref);
        if (!snap.exists || snap.data()?.status !== 'pending')
            return false;
        transaction.update(ref, { status: 'processing', attempts: firestore_1.FieldValue.increment(1), updatedAt: new Date() });
        return true;
    });
    if (!claimed)
        return;
    try {
        const user = await db.doc(`users/${job.userId}`).get();
        if (user.data()?.notificationPreferences?.pushEnabled === false) {
            await ref.update({ status: 'sent', sent: 0, skipped: true, updatedAt: new Date() });
            return;
        }
        const devices = await db.collection(`users/${job.userId}/pushDevices`).where('enabled', '==', true).get();
        let sent = 0;
        for (const device of devices.docs) {
            try {
                await (0, messaging_1.getMessaging)().send({ token: device.data().token, notification: { title: job.payload.title, body: job.payload.body }, data: Object.fromEntries(Object.entries(job.payload).filter(([, value]) => value != null).map(([key, value]) => [key, String(value)])), webpush: { fcmOptions: job.payload.url ? { link: job.payload.url } : undefined } });
                sent++;
            }
            catch (error) {
                const code = error.code;
                if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token')
                    await device.ref.delete();
                else
                    console.error('FCM delivery failed', { jobId, deviceId: device.id, code });
            }
        }
        await ref.update({ status: sent > 0 ? 'sent' : 'pending', sent, lastError: sent > 0 ? null : 'Nenhum dispositivo FCM ativo recebeu a mensagem', updatedAt: new Date() });
    }
    catch (error) {
        await ref.update({ status: 'pending', lastError: error instanceof Error ? error.message : 'Erro desconhecido', updatedAt: new Date() });
        throw error;
    }
}
exports.processPushOnCreate = (0, firestore_2.onDocumentCreated)('_pushOutbox/{jobId}', async (event) => {
    const job = event.data?.data();
    if (job)
        await sendJob(event.params.jobId, job);
});
exports.retryPushOutbox = (0, scheduler_1.onSchedule)({ schedule: 'every 5 minutes', timeZone: 'America/Sao_Paulo' }, async () => {
    const snapshot = await (0, firestore_1.getFirestore)().collection('_pushOutbox').where('status', '==', 'pending').limit(50).get();
    for (const doc of snapshot.docs)
        await sendJob(doc.id, doc.data());
});
