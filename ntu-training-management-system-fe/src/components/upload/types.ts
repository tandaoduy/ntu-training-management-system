import type { InputHTMLAttributes } from 'react';

export interface UploadProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  error?: string;
  browseText?: string;
  containerClassName?: string;
}
