import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import ejs from 'ejs';
import config from '../config/config.js';
import { logger } from '../middleware/logger.js';
import ApiError from './ApiError.js';
import httpStatus from 'http-status';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

// Verify connection configuration
transporter.verify((error) => {
  if (error) {
    logger.error('Error connecting to email server:', error);
  } else {
    logger.info('Server is ready to take our messages');
  }
});

/**
 * Compile email template
 * @param {string} templateName - Name of the template file (without .ejs extension)
 * @param {Object} data - Data to pass to the template
 * @returns {Promise<string>} Compiled HTML
 */
const compileTemplate = async (templateName, data = {}) => {
  const templatePath = path.join(
    __dirname,
    '..',
    'templates',
    'emails',
    `${templateName}.ejs`
  );

  try {
    const template = await fs.promises.readFile(templatePath, 'utf8');
    return ejs.render(template, {
      ...data,
      appName: config.app.name,
      appUrl: process.env.APP_URL || `http://localhost:${config.app.port}`,
      year: new Date().getFullYear(),
    });
  } catch (error) {
    logger.error(`Error compiling email template ${templateName}:`, error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error generating email template',
      false
    );
  }
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template name (without .ejs extension)
 * @param {Object} options.data - Data to pass to the template
 * @param {Array} options.attachments - Array of attachment objects
 * @returns {Promise<Object>} Email info
 */
const sendEmail = async ({
  to,
  subject,
  template,
  data = {},
  attachments = [],
}) => {
  try {
    if (!to) {
      throw new Error('Recipient email address is required');
    }

    // In test environment, log the email instead of sending it
    if (config.isTest) {
      const html = await compileTemplate(template, data);
      logger.info(`\n===== EMAIL (TEST MODE) =====\nTo: ${to}\nSubject: ${subject}\n${html}\n=======================`);
      return { messageId: 'test-mode-message-id' };
    }

    // In development, don't send real emails unless explicitly enabled
    if (config.isDevelopment && !process.env.SEND_REAL_EMAILS) {
      const html = await compileTemplate(template, data);
      logger.info(`\n===== EMAIL (DEV MODE) =====\nTo: ${to}\nSubject: ${subject}\n${html}\n=======================`);
      return { messageId: 'dev-mode-message-id' };
    }

    // Compile the email template
    const html = await compileTemplate(template, data);

    // Send the email
    const info = await transporter.sendMail({
      from: config.email.from,
      to,
      subject: `${config.app.name} - ${subject}`,
      html,
      attachments,
    });

    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error sending email',
      false,
      error.message
    );
  }
};

/**
 * Send verification email
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} token - Verification token
 * @returns {Promise<Object>} Email info
 */
const sendVerificationEmail = async (to, name, token) => {
  const verificationUrl = `${process.env.APP_URL || `http://localhost:${config.app.port}`}/verify-email?token=${token}`;
  
  return sendEmail({
    to,
    subject: 'Verify Your Email Address',
    template: 'verify-email',
    data: {
      name,
      verificationUrl,
      token,
    },
  });
};

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} token - Reset token
 * @returns {Promise<Object>} Email info
 */
const sendPasswordResetEmail = async (to, name, token) => {
  const resetUrl = `${process.env.APP_URL || `http://localhost:${config.app.port}`}/reset-password?token=${token}`;
  
  return sendEmail({
    to,
    subject: 'Reset Your Password',
    template: 'reset-password',
    data: {
      name,
      resetUrl,
      token,
    },
  });
};

/**
 * Send welcome email
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 * @returns {Promise<Object>} Email info
 */
const sendWelcomeEmail = async (to, name) => {
  const dashboardUrl = `${process.env.APP_URL || `http://localhost:${config.app.port}`}/dashboard`;
  
  return sendEmail({
    to,
    subject: 'Welcome to AI Companion!',
    template: 'welcome',
    data: {
      name,
      dashboardUrl,
    },
  });
};

// Export all email-related functions and the transporter
export {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  transporter,
  compileTemplate
};

// Export default object with all functions for backward compatibility
const emailService = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  transporter,
  compileTemplate
};

export default emailService;
