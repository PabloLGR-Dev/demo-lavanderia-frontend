import { API_ENDPOINTS } from '@/lib/api';
import { ForgotPasswordDto, ValidateResetTokenDto, ResetPasswordDto } from '@/types';

export const passwordRecoveryService = {
    async requestPasswordReset(email: string): Promise<{ message: string }> {
        const response = await fetch(API_ENDPOINTS.FORGOT_PASSWORD, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email } as ForgotPasswordDto),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al solicitar recuperación de contraseña');
        }

        return response.json();
    },

    async validateResetToken(email: string, token: string): Promise<{ message: string; valid: boolean }> {
        const response = await fetch(API_ENDPOINTS.VALIDATE_RESET_TOKEN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, token } as ValidateResetTokenDto),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Token inválido o expirado');
        }

        return response.json();
    },

    async resetPassword(data: ResetPasswordDto): Promise<{ message: string }> {
        const response = await fetch(API_ENDPOINTS.RESET_PASSWORD, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al restablecer contraseña');
        }

        return response.json();
    },
};