import * as yup from 'yup';
import DOMPurify from 'dompurify';

// Common validators
export const sanitizeInput = (value) => {
  if (!value) return '';
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
};

// Journal Entry Schema
export const journalEntrySchema = yup.object().shape({
  title: yup
    .string()
    .required('Title is required')
    .max(100, 'Title must be less than 100 characters')
    .transform(sanitizeInput),
  content: yup
    .string()
    .required('Content is required')
    .max(5000, 'Content must be less than 5000 characters')
    .transform(sanitizeInput),
  mood: yup
    .number()
    .min(1, 'Mood is required')
    .max(5, 'Invalid mood value'),
  tags: yup
    .array()
    .of(
      yup.string()
        .matches(/^[a-zA-Z0-9\s-]+$/, 'Tag contains invalid characters')
        .max(20, 'Tag must be less than 20 characters')
    )
    .max(5, 'Maximum 5 tags allowed')
});

// Chat Message Schema
export const chatMessageSchema = yup.object().shape({
  content: yup
    .string()
    .required('Message cannot be empty')
    .max(2000, 'Message too long')
    .transform(sanitizeInput),
  metadata: yup.object({
    emotion: yup.string().optional(),
    timestamp: yup.date().default(() => new Date())
  })
});

// User Profile Schema
export const userProfileSchema = yup.object().shape({
  displayName: yup
    .string()
    .required('Display name is required')
    .max(50, 'Name too long')
    .transform(sanitizeInput),
  bio: yup
    .string()
    .max(500, 'Bio too long')
    .transform(sanitizeInput),
  preferences: yup.object({
    theme: yup.string().oneOf(['light', 'dark', 'system']),
    notifications: yup.boolean().default(true)
  })
});

// Validation helper function
export const validate = async (schema, data) => {
  try {
    const validatedData = await schema.validate(data, { abortEarly: false });
    return { isValid: true, data: validatedData, errors: null };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors = error.inner.reduce((acc, curr) => {
        acc[curr.path] = curr.message;
        return acc;
      }, {});
      return { isValid: false, data: null, errors };
    }
    throw error;
  }
};
