import { Resend } from 'resend';
import dotenv from 'dotenv';
import config from '../config.ts';

dotenv.config();

export default async (subject: string, message: string, failure: boolean): Promise<void> => {

  if (!process.env.RESEND_KEY || !process.env.MAIL_TO) {
    return;
  }

  if (failure) {
    if (!config.sendMailOnFailure) {
      return;
    }
  } else {
    if (!config.sendMailOnSuccess) {
      return;
    }
  }

  const messageContent = typeof message === 'object'
    ? JSON.stringify(message)
    : message;

  try {
    const resend = new Resend(process.env.RESEND_KEY);

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.MAIL_TO,
      subject,
      html: messageContent,
    });
  } catch (err) {
    console.log('Error sending mail');
    
    console.log(err);
    
  }
}