function getConfig() {
  const brevoApiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.SENDER_EMAIL?.trim() || 'noreply@example.com';
  const senderName = process.env.SENDER_NAME?.trim() || 'Noreply';

  return {
    brevoApiKey,
    senderEmail,
    senderName,
  };
}

export function isMailConfigured() {
  const { brevoApiKey } = getConfig();
  return Boolean(brevoApiKey);
}

function assertValidConfig(config) {
  const { brevoApiKey } = config;
  if (!brevoApiKey) {
    throw new Error(
      'Brevo API key is not configured. Add BREVO_API_KEY to server/.env.',
    );
  }
  if (brevoApiKey === 'your-api-key' || brevoApiKey === 'REPLACE_WITH_YOUR_KEY') {
    throw new Error(
      'BREVO_API_KEY is still a placeholder. Get your API key from Brevo dashboard and add it to server/.env.',
    );
  }
} 

export async function sendEmail({ to, subject, text, html }) {
  const config = getConfig();
  const { brevoApiKey, senderEmail, senderName } = config;

  assertValidConfig(config);

  try {
    console.log('Sending email via Brevo API to:', to);
    
    // Brevo API expects this format
    const payload = {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      textContent: text,
      htmlContent: html,
    };

    console.log('Brevo API Key:', brevoApiKey.substring(0, 10) + '...');
    console.log('Request payload:', JSON.stringify(payload, null, 2));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseText = await response.text();
    console.log('Brevo API response status:', response.status);
    console.log('Brevo API response:', responseText);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(`Brevo API error: ${errorMessage}`);
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      result = { success: true, response: responseText };
    }

    console.log('Email sent via Brevo:', result.messageId || 'success', 'to', to);
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Failed to send email via Brevo:', errorMsg);
    console.error('Error details:', error);
    throw new Error(`Email delivery failed: ${errorMsg}`);
  }
}

// Test function for debugging
export async function testBrevoConnection() {
  const config = getConfig();
  const { brevoApiKey } = config;

  if (!brevoApiKey) {
    console.log('BREVO_API_KEY is not configured');
    return false;
  }

  try {
    console.log('Testing Brevo connection...');
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'api-key': brevoApiKey,
      },
    });
    
    console.log('Health check status:', response.status);
    console.log('Connection test:', response.ok ? 'SUCCESS' : 'FAILED');
    return response.ok;
  } catch (error) {
    console.error('Connection test failed:', error instanceof Error ? error.message : error);
    return false;
  }
}
