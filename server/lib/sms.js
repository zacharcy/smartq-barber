/**
 * Text.lk SMS Gateway Integration
 * Sends SMS notifications via the Text.lk HTTP API.
 * Compatible with Vercel serverless functions (uses native fetch).
 */

const SMS_API_URL = 'https://app.text.lk/api/http/sms/send';

/**
 * Format a phone number to international format (94XXXXXXXXX)
 */
function formatPhone(phone) {
    if (!phone) return null;
    let cleaned = phone.replace(/[\s\-()]/g, '');
    // Convert local format (07X...) to international (947X...)
    if (cleaned.startsWith('0')) {
        cleaned = '94' + cleaned.slice(1);
    }
    // Strip leading + if present
    if (cleaned.startsWith('+')) {
        cleaned = cleaned.slice(1);
    }
    return cleaned;
}

/**
 * Send an SMS via Text.lk HTTP API.
 * Never throws — returns { success, data?, error? }.
 *
 * @param {string} recipient - Phone number (any format)
 * @param {string} message   - SMS body text
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function sendSMS(recipient, message) {
    const apiToken = process.env.SMS_API_TOKEN;
    const senderId = process.env.SMS_SENDER_ID || 'SmartQ';

    if (!apiToken) {
        console.warn('⚠️ SMS_API_TOKEN not configured — skipping SMS');
        return { success: false, error: 'SMS_API_TOKEN not configured' };
    }

    const formattedPhone = formatPhone(recipient);
    if (!formattedPhone) {
        console.warn('⚠️ SMS skipped — no valid phone number');
        return { success: false, error: 'No valid phone number' };
    }

    try {
        const res = await fetch(SMS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                api_token: apiToken,
                recipient: formattedPhone,
                sender_id: senderId,
                type: 'plain',
                message,
            }),
        });

        const data = await res.json();

        if (data.status === 'success') {
            console.log(`📱 SMS sent to ${formattedPhone}`);
            return { success: true, data };
        } else {
            console.warn(`⚠️ SMS failed for ${formattedPhone}:`, data.message || data);
            return { success: false, error: data.message || 'SMS send failed' };
        }
    } catch (err) {
        console.error(`⚠️ SMS error for ${formattedPhone}:`, err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Send an appointment confirmation SMS.
 * Fire-and-forget — never blocks the booking flow.
 *
 * @param {string} phone - Customer phone number
 * @param {object} details - Appointment details
 * @param {string} [details.clientName] - Customer name for greeting
 * @param {number|string} [details.bookingId] - Appointment/booking ID
 * @param {string} details.businessName
 * @param {string} details.serviceName
 * @param {string} [details.staffName]
 * @param {string} details.startTime - e.g. "2026-02-24 10:00:00"
 */
export function sendAppointmentSMS(phone, { clientName, bookingId, businessName, serviceName, staffName, startTime }) {
    if (!phone) return;

    // Parse the datetime into a readable format
    let dateStr = '';
    let timeStr = '';
    try {
        const dt = new Date(startTime);
        dateStr = dt.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        timeStr = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
        dateStr = startTime;
    }

    const greeting = clientName ? `Hi ${clientName}!` : 'Hi!';
    const lines = [
        `${greeting} Your appointment at ${businessName || 'our salon'} is confirmed.`,
    ];
    if (bookingId) lines.push(`Booking Ref: #${bookingId}`);
    lines.push(`Service: ${serviceName || 'N/A'}`);
    if (staffName) lines.push(`With: ${staffName}`);
    lines.push(`Date: ${dateStr}${timeStr ? ' at ' + timeStr : ''}`);
    lines.push(`Thank you for booking via SmartQ!`);

    const message = lines.join('\n');

    // Fire-and-forget — don't await, never block the booking
    sendSMS(phone, message).catch(() => { /* silently ignore */ });
}
