
// Fix: Explicitly import Buffer to resolve 'Cannot find name Buffer' TypeScript error.
import { Buffer } from 'buffer';
import nodemailer from 'nodemailer';
import { Order } from '../types';

// Use environment variables for sensitive data in production
const ADMIN_EMAIL = 'egserku@gmail.com';

export async function sendOrderEmail(order: Order, pdfBuffer: Buffer) {
  // Configured for Gmail or similar SMTP
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER || 'your-email@gmail.com',
      pass: process.env.SMTP_PASS || 'your-app-password'
    }
  });

  const mailOptions = {
    from: '"PrintMaster Pro System" <system@printmaster.pro>',
    to: ADMIN_EMAIL,
    subject: `Новый заказ: ${order.orderNumber} - ${order.customer.name}`,
    text: `Поступил новый заказ №${order.orderNumber} от ${order.customer.name}.\nДетали во вложении.`,
    attachments: [
      {
        filename: `Order_${order.orderNumber}.pdf`,
        content: pdfBuffer
      }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Order email sent successfully');
  } catch (error) {
    console.error('Failed to send order email:', error);
    // In a real app, you might want to queue this for retry
  }
}