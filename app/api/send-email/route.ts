import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to generate a unique message ID
const generateMessageId = (domain: string) => {
  const random = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now();
  return `<${timestamp}.${random}@${domain}>`;
};

const addEmailHashToLinks = (html: string, email: string) => {
  // Use the full email with @ symbol directly
  return html.replace(/href=(["'])(https?:\/\/[^"'#\s]+)(#[^"']*)?\1/gi, (_m, quote, url) => 
    `href=${quote}${url}${url.includes('?') ? '&' : '#'}${email}${quote}`
  );
};

const formatEmailContent = (content: string, email: string) => {
  // Add email hash to all links in HTML content
  return addEmailHashToLinks(content, email);
};

type Payload = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  fromName?: string;
  attachments?: Array<{ filename: string; content: string; encoding?: "base64" }>;
  // Add new optional fields
  messageId?: string;
  listUnsubscribe?: string;
  customHeaders?: Record<string, string>;
};

export async function POST(req: Request) {
  try {
    const {
      to,
      subject,
      html,
      text,
      cc,
      bcc,
      replyTo,
      fromName,
      attachments,
      messageId,
      listUnsubscribe,
      customHeaders,
    } = (await req.json()) as Payload;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { success: false, message: "`to`, `subject`, and `html` or `text` are required." },
        { status: 400 }
      );
    }

    const fromAddress = process.env.EMAIL_FROM!;
    const from = fromName ? `${fromName} <${fromAddress}>` : fromAddress;

 // Generate a message ID if not provided
    const domain = fromAddress.includes('@') 
      ? fromAddress.split('@')[1] 
      : 'hathawayz.org'; // Fallback domain
    const message_id = messageId || 
      `<${Date.now()}.${Math.random().toString(36).substring(2, 15)}@${domain}>`;

    // Prepare headers with deliverability best practices
    const headers: Record<string, string> = {
      'X-Entity-Ref-ID': `${Date.now()}`,
      'X-Google-DKIM-Signature': 'v=1; a=rsa-sha256; c=relaxed/relaxed;',
      'Feedback-ID': `campaign-${Date.now()}`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Report-Abuse': `Please report abuse to abuse@hathawayz.org`,
      'X-Auto-Response-Suppress': 'OOF, AutoReply, AutoForward',
      'Precedence': 'bulk',
      'X-Priority': '3',
      'X-Mailer': 'Hathawayz/1.0',
  ...(listUnsubscribe 
    ? { 'List-Unsubscribe': `<${listUnsubscribe}>, <mailto:unsubscribe@hathawayz.org>` }
    : { 'List-Unsubscribe': `<mailto:unsubscribe@hathawayz.org>` }
  ),
  ...customHeaders,
    };

    // Ensure both HTML and text versions exist and process links
    let emailHtml = html ? formatEmailContent(html, Array.isArray(to) ? to[0] : to) : undefined;
    let emailText = text;

    if (html && !text) {
      // Simple HTML to text conversion (you might want to use a library for better conversion)
      // For HTML to text conversion
      emailText = html
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
        .replace(/<[^>]+>/g, '') // Remove all HTML tags
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
    } else if (text && !html) {
      // Simple text to HTML conversion
      emailHtml = text.replace(/\n/g, '<br>');
    }

    // Validate email addresses before sending
    const validateEmails = (emails: string | string[]): string[] => {
      const emailList = Array.isArray(emails) ? emails : [emails];
      return emailList.filter(email => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!isValid) {
          console.warn(`Invalid email address removed: ${email}`);
        }
        return isValid;
      });
    };

    // Remove any invalid email addresses
    const validToEmails = validateEmails(to);
    const validCcEmails = cc ? validateEmails(cc) : [];
    const validBccEmails = bcc ? validateEmails(bcc) : [];

    if (validToEmails.length === 0) {
      throw new Error('No valid recipient email addresses provided');
    }

    const emailOptions: any = {
      from: from,
      to: validToEmails,
      subject: subject,
      headers: {
        ...headers,
        'Return-Path': fromAddress, // Important for bounce handling
      },
      // Set reply-to to the same as from if not provided
      replyTo: replyTo || fromAddress,
      html: emailHtml,
      text: emailText || 'Please enable HTML to view this email content.',
      ...(cc && { cc: validCcEmails }),
      ...(bcc && { bcc: validBccEmails }),
      ...(replyTo && { reply_to: replyTo }), // Note: Resend uses reply_to, not replyTo
      ...(message_id && { 
        headers: {
          ...headers,
          'Message-ID': message_id,
        }
      }),
      ...(attachments && {
        attachments: attachments.map(a => ({
          filename: a.filename,
          content: a.content,
          ...(a.encoding && { encoding: a.encoding }),
        })),
      }),
    };

    console.log('Received email send request with data:', {
  to,
  subject,
  hasHtml: !!html,
  hasText: !!text,
  from: process.env.EMAIL_FROM,
  hasResendKey: !!process.env.RESEND_API_KEY
});

    // Implement rate limiting and gradual sending
    const RATE_LIMIT = 50; // Emails per minute
    const BATCH_SIZE = 20; // Emails per batch
    
    // Function to send emails in batches with delay
    const sendBatch = async (batch: string[]) => {
      const batchResponse = await resend.emails.send({
        ...emailOptions,
        to: batch,
      });
      
      // Add delay between batches to respect rate limits
      if (validToEmails.length > BATCH_SIZE) {
        await new Promise(resolve => setTimeout(resolve, 60000 / (RATE_LIMIT / BATCH_SIZE)));
      }
      
      return batchResponse;
    };
    
    // Process emails in batches if there are many recipients
    let response;
    if (validToEmails.length > BATCH_SIZE) {
      const batches = [];
      for (let i = 0; i < validToEmails.length; i += BATCH_SIZE) {
        batches.push(validToEmails.slice(i, i + BATCH_SIZE));
      }
      
      const results = [];
      for (const batch of batches) {
        const batchResult = await sendBatch(batch);
        results.push(batchResult);
      }
      response = { id: 'batch-send', data: results };
    } else {
      response = await resend.emails.send(emailOptions);
    }

    const { data, error } = response;

    if (error) {
      console.error('Email sending failed:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: "Send failed", 
          error: error.message || 'Unknown error' 
        }, 
        { status: 502 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message_id,
      email: data
    });
  } catch (err: any) {
    console.error('Unexpected error in email sending:', err);
    return NextResponse.json(
      { 
        success: false, 
        message: err?.message || "Unexpected error",
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }, 
      { status: 500 }
    );
  }
}