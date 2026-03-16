import type { ReactNode } from 'react';
import { sileo, type SileoOptions } from 'sileo';

type ToastMessage = ReactNode | string | null | undefined;

export type ToastOptions = Omit<SileoOptions, 'description' | 'title' | 'type'> & {
    description?: ReactNode | string;
};

type ToastMethod = (message: ToastMessage, options?: ToastOptions) => string;

const toTitle = (message: ToastMessage) => {
    if (typeof message === 'string') {
        return message;
    }

    if (message == null) {
        return '';
    }

    return String(message);
};

const toOptions = (message: ToastMessage, options: ToastOptions = {}): SileoOptions => ({
    ...options,
    title: toTitle(message),
    description: options.description,
});

const createMethod = (method: (options: SileoOptions) => string): ToastMethod => {
    return (message, options) => method(toOptions(message, options));
};

export const toast = {
    success: createMethod(sileo.success),
    error: createMethod(sileo.error),
    warning: createMethod(sileo.warning),
    info: createMethod(sileo.info),
    dismiss: sileo.dismiss,
    clear: sileo.clear,
};
