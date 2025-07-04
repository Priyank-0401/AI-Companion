import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import ejs from 'ejs';
import config from '../config/index.js';
import { logger } from './logger.js';
import AppError from './AppError.js';
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
    user: config.email.username,
    pass: config.email.password,
  },
});

// Verify connection configuration
transporter.verify((error) => {
  if (error) {
    logger.error('Error verifying email transporter:', error);
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
  try {
    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      'emails',
      `${templateName}.ejs`
    );
    
    const template = await fs.readFile(templatePath, 'utf-8');
    return ejs.render(template, { ...data, config });
  } catch (error) {
    logger.error('Error compiling email template:', error);
    throw new AppError(
      'Error compiling email template',
      httpStatus.INTERNAL_SERVER_ERROR
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
    // Compile the email template
    const html = await compileTemplate(template, data);

    // Setup email data
    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
      to,
      subject,
      html,
      attachments,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw new AppError('Error sending email', httpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Send verification email
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} token - Verification token
 * @returns {Promise<Object>} Email info
 */
const sendVerificationEmail = (to, name, token) => {
  const verificationUrl = `${config.app.clientUrl}/verify-email?token=${token}`;
  
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
const sendPasswordResetEmail = (to, name, token) => {
  const resetUrl = `${config.app.clientUrl}/reset-password?token=${token}`;
  
  return sendEmail({
    to,
    subject: 'Reset Your Password',
    template: 'password-reset',
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
const sendWelcomeEmail = (to, name) => {
  return sendEmail({
    to,
    subject: 'Welcome to AI Companion!',
    template: 'welcome',
    data: {
      name,
      supportEmail: config.email.supportEmail,
    },
  });
};

export {
  transporter,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  compileTemplate,
};
