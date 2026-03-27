// src/app/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { passwordRecoveryService } from '@/services/passwordRecoveryService';

type Step = 'email' | 'token' | 'password' | 'success';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Paso 1: Solicitar código
    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await passwordRecoveryService.requestPasswordReset(email);
            setSuccessMessage(result.message);
            setCurrentStep('token');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al enviar el código');
        } finally {
            setIsLoading(false);
        }
    };

    // Paso 2: Validar código
    const handleValidateToken = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await passwordRecoveryService.validateResetToken(email, token);
            setCurrentStep('password');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Código inválido o expirado');
        } finally {
            setIsLoading(false);
        }
    };

    // Paso 3: Cambiar contraseña
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        setIsLoading(true);

        try {
            const result = await passwordRecoveryService.resetPassword({
                email,
                token,
                newPassword,
                confirmPassword,
            });
            setSuccessMessage(result.message);
            setCurrentStep('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        router.push('/login');
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{
                background: 'linear-gradient(90deg, rgba(0, 123, 255, 1) 0%, rgba(31, 191, 255, 1) 50%, rgba(135, 221, 255, 1) 100%)',
            }}
        >
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[580px] md:min-h-[620px]">
                {/* Lado izquierdo - Bienvenida */}
                <div
                    className="w-full md:w-1/2 p-10 md:p-12 flex flex-col justify-center items-center relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, rgba(0, 123, 255, 1) 0%, rgba(31, 191, 255, 1) 100%)',
                    }}
                >
                    {/* Círculos decorativos */}
                    <div className="absolute top-12 right-12 w-32 h-32 rounded-full border-4 border-white/20"></div>
                    <div className="absolute bottom-16 left-12 w-24 h-24 rounded-full border-4 border-white/20"></div>
                    <div className="absolute top-1/3 left-1/5 w-16 h-16 rounded-full bg-white/10"></div>

                    <div className="relative z-10 text-center">
                        <h1 className="text-white text-2xl md:text-3xl font-light mb-8 tracking-wider uppercase">
                            Recupera tu acceso
                        </h1>

                        {/* Logo */}
                        <div className="mb-8 md:mb-10">
                            <div className="w-40 h-40 md:w-48 md:h-48 mx-auto rounded-full border-4 border-white/30 flex items-center justify-center backdrop-blur-sm bg-white/10 shadow-lg">
                                <Image
                                    src="/Logo.jpeg"
                                    alt="Lavandería Rodríguez #2"
                                    width={140}
                                    height={140}
                                    priority
                                    className="rounded-full object-cover shadow-inner"
                                />
                            </div>
                        </div>

                        <h2 className="text-white text-4xl md:text-5xl font-bold mb-5 tracking-tight">
                            Lavandería Rodríguez #2
                        </h2>

                        <p className="text-white/85 text-base md:text-lg max-w-xs md:max-w-sm mx-auto leading-relaxed">
                            No te preocupes, te ayudamos a recuperar tu cuenta rápidamente.
                        </p>
                    </div>
                </div>

                {/* Lado derecho - Formulario */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-gray-50 to-white">
                    <div className="max-w-md mx-auto w-full">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                                {currentStep === 'email' && 'Recuperar Contraseña'}
                                {currentStep === 'token' && 'Verificar Código'}
                                {currentStep === 'password' && 'Nueva Contraseña'}
                                {currentStep === 'success' && '¡Listo!'}
                            </h2>
                            <p className="text-gray-500 mt-3 text-base">
                                {currentStep === 'email' && 'Ingresa tu correo electrónico asociado'}
                                {currentStep === 'token' && 'Ingresa el código que te enviamos'}
                                {currentStep === 'password' && 'Crea una nueva contraseña segura'}
                                {currentStep === 'success' && 'Tu contraseña ha sido actualizada'}
                            </p>
                        </div>

                        {/* Indicador de pasos */}
                        <div className="flex justify-center items-center space-x-3 mb-8">
                            <div className={`h-2.5 w-14 rounded-full ${currentStep === 'email' || currentStep === 'token' || currentStep === 'password' || currentStep === 'success' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                            <div className={`h-2.5 w-14 rounded-full ${currentStep === 'token' || currentStep === 'password' || currentStep === 'success' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                            <div className={`h-2.5 w-14 rounded-full ${currentStep === 'password' || currentStep === 'success' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                            <div className={`h-2.5 w-14 rounded-full ${currentStep === 'success' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                            {error && (
                                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-center text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            {successMessage && currentStep !== 'success' && (
                                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-xl text-center text-sm font-medium">
                                    {successMessage}
                                </div>
                            )}

                            {/* Paso 1: Email */}
                            {currentStep === 'email' && (
                                <form onSubmit={handleRequestCode} className="space-y-6">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                            CORREO ELECTRÓNICO
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="email"
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-all bg-white text-gray-800 placeholder-gray-400 shadow-sm"
                                                placeholder="tu@email.com"
                                            />
                                            <svg
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                            >
                                                <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
                                            </svg>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 px-6 text-white font-semibold text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Enviando...' : 'Enviar Código'}
                                    </button>
                                </form>
                            )}

                            {/* Paso 2: Token */}
                            {currentStep === 'token' && (
                                <form onSubmit={handleValidateToken} className="space-y-6">
                                    <div>
                                        <label htmlFor="token" className="block text-sm font-semibold text-gray-700 mb-2">
                                            CÓDIGO DE VERIFICACIÓN
                                        </label>
                                        <input
                                            id="token"
                                            type="text"
                                            required
                                            maxLength={6}
                                            value={token}
                                            onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                                            className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-all bg-white text-gray-800 text-center text-3xl tracking-widest shadow-sm"
                                            placeholder="000000"
                                        />
                                        <p className="mt-3 text-sm text-gray-600 text-center">
                                            Enviamos un código a <strong>{email}</strong>
                                        </p>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep('email')}
                                            className="flex-1 py-4 px-6 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                                        >
                                            Atrás
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading || token.length !== 6}
                                            className="flex-1 py-4 px-6 text-white font-semibold text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? 'Verificando...' : 'Verificar'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Paso 3: Nueva Contraseña */}
                            {currentStep === 'password' && (
                                <form onSubmit={handleResetPassword} className="space-y-6">
                                    <div>
                                        <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                            NUEVA CONTRASEÑA
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="newPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-all bg-white text-gray-800 placeholder-gray-400 shadow-sm"
                                                placeholder="Mínimo 8 caracteres"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xl"
                                            >
                                                {showPassword ? '🙈' : '👁️'}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                            CONFIRMAR CONTRASEÑA
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="confirmPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-all bg-white text-gray-800 placeholder-gray-400 shadow-sm"
                                                placeholder="Repite la contraseña"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 px-6 text-white font-semibold text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
                                    </button>
                                </form>
                            )}

                            {/* Paso 4: Success */}
                            {currentStep === 'success' && (
                                <div className="text-center space-y-8 py-6">
                                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                            ¡Contraseña Restablecida!
                                        </h3>
                                        <p className="text-gray-600 text-lg">
                                            Ahora puedes iniciar sesión con tu nueva contraseña.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleBackToLogin}
                                        className="w-full py-4 px-6 text-white font-semibold text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0"
                                    >
                                        Ir a Iniciar Sesión
                                    </button>
                                </div>
                            )}
                        </div>

                        {currentStep !== 'success' && (
                            <div className="mt-8 text-center">
                                <Link
                                    href="/login"
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                                >
                                    ← Volver al inicio de sesión
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}