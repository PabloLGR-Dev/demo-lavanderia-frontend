// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login({ usernameOrEmail, password });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
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
                            Bienvenido a
                        </h1>

                        {/* Logo */}
                        <div className="mb-8 md:mb-10">
                            <div className="w-40 h-40 md:w-48 md:h-48 mx-auto rounded-full border-4 border-white/30 flex items-center justify-center backdrop-blur-sm bg-white/10 shadow-lg">
                                <Image
                                    src="/logo.jpeg"
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
                            Tu ropa limpia y perfecta, siempre a tiempo. Ingresa para gestionar tus servicios.
                        </p>
                    </div>
                </div>

                {/* Lado derecho - Formulario de Login */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-gray-50 to-white">
                    <div className="max-w-md mx-auto w-full">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                                Iniciar Sesión
                            </h2>
                            <p className="text-gray-500 mt-3 text-base">
                                Ingresa tus credenciales para continuar
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-center text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-5">
                                <div>
                                    <label
                                        htmlFor="username"
                                        className="block text-sm font-semibold text-gray-700 mb-2"
                                    >
                                        USUARIO o EMAIL
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="username"
                                            type="text"
                                            autoComplete="username email"
                                            required
                                            value={usernameOrEmail}
                                            onChange={(e) => setUsernameOrEmail(e.target.value)}
                                            className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-all bg-white text-gray-800 placeholder-gray-400 shadow-sm"
                                            placeholder="usuario123 o email@ejemplo.com"
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

                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-semibold text-gray-700 mb-2"
                                    >
                                        CONTRASEÑA
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-all bg-white text-gray-800 placeholder-gray-400 shadow-sm"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 px-6 text-white font-semibold text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-3">
                    <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                      <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                      />
                      <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Iniciando...
                  </span>
                                ) : (
                                    'Iniciar Sesión'
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <Link
                                href="/forgot-password"
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}