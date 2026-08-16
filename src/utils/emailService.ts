/**
 * Official Email Dispatch Service Utility
 * Official Gmail Account: qabulmadinah@gmail.com
 */

export const OFFICIAL_SENDER_EMAIL = 'qabulmadinah@gmail.com';

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  triggerReason?: string;
}

export interface SendEmailResponse {
  success: boolean;
  sender?: string;
  recipient?: string;
  messageId?: string;
  message?: string;
  error?: string;
}

/**
 * Sends an email using the server's official Gmail account (qabulmadinah@gmail.com)
 */
export async function sendOfficialEmail(payload: SendEmailPayload): Promise<SendEmailResponse> {
  try {
    const adminApiKey = typeof window !== 'undefined' ? localStorage.getItem('admin_api_key') : null;
    
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminApiKey && { 'X-Admin-API-Key': adminApiKey })
      },
      body: JSON.stringify({
        to: payload.to,
        subject: payload.subject,
        bodyText: payload.bodyText,
        bodyHtml: payload.bodyHtml,
        triggerReason: payload.triggerReason
      })
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.error('Failed to dispatch email via official account:', err);
    return {
      success: false,
      sender: OFFICIAL_SENDER_EMAIL,
      error: err?.message || 'شبكة غير متصلة أو يتعذر الوصول لخادم البريد.'
    };
  }
}
