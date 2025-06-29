import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { validate } from '../utils/validation/schemas';

export const useSecureForm = (schema, defaultValues = {}) => {
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
    reset,
    control,
    watch,
    ...formMethods
  } = useForm({ defaultValues });

  const onSubmit = async (data, onSuccess, onError) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      
      // Validate against the schema
      const { isValid, data: validatedData, errors: validationErrors } = await validate(schema, data);
      
      if (!isValid) {
        // Set form errors for each validation error
        Object.entries(validationErrors).forEach(([field, message]) => {
          setFormError(field, { type: 'manual', message });
        });
        return;
      }

      // If we have a success callback, call it with validated data
      if (typeof onSuccess === 'function') {
        await onSuccess(validatedData);
      }
      
      return { success: true, data: validatedData };
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Handle server validation errors
      if (error.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([field, message]) => {
          setFormError(field, { type: 'server', message });
        });
      } else {
        // Set a generic server error
        setServerError(error.message || 'An error occurred. Please try again.');
        
        // Call error callback if provided
        if (typeof onError === 'function') {
          onError(error);
        }
      }
      
      return { success: false, error };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced register function that includes validation
  const registerField = (name, options = {}) => {
    return register(name, {
      required: schema.fields[name]?.exclusiveTests?.required ? 'This field is required' : false,
      ...options,
    });
  };

  // Handle form submission
  const handleFormSubmit = (onSuccess, onError) => 
    handleSubmit((data) => onSubmit(data, onSuccess, onError));

  return {
    register: registerField,
    handleSubmit: handleFormSubmit,
    errors: {
      ...errors,
      server: serverError,
    },
    isSubmitting,
    reset,
    control,
    watch,
    setError: setFormError,
    setServerError,
    ...formMethods,
  };
};

export default useSecureForm;
