import type { Client } from '../types';

/**
 * Simulates sending a WhatsApp message to a client.
 * In a real application, this would make an API call to a backend service
 * which then interfaces with the WhatsApp Business API (e.g., Twilio, Meta).
 *
 * @param client - The client object containing the phone number.
 * @param message - The message string to be sent.
 * @returns A promise that resolves to an object indicating success.
 */
export const sendWhatsAppMessage = (
  client: Client,
  message: string
): Promise<{ success: boolean; messageId: string }> => {
  return new Promise((resolve, reject) => {
    console.log('--- SIMULATING WHATSAPP MESSAGE ---');
    console.log(`To: ${client.name} (${client.phone})`);
    console.log(`Message: ${message}`);
    console.log('------------------------------------');

    if (!client.phone) {
      console.error('Simulation failed: No phone number for client.');
      return reject({ success: false, message: 'No phone number' });
    }

    // Simulate network delay
    setTimeout(() => {
      // In a real scenario, you would check the API response. Here, we'll assume success.
      const simulatedMessageId = `wamid.${Date.now()}`;
      resolve({ success: true, messageId: simulatedMessageId });
    }, 1000); // 1-second delay
  });
};
