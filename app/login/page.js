'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { PawPrint, Lock, Mail, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg('Credenciales inválidas. Verifica tu correo y contraseña.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-box">
          <PawPrint size={32} color="#10b981" />
        </div>
        <h1>Patitas Felices</h1>
        <p className="subtitle">Acceso exclusivo para el personal de la clínica</p>

        {errorMsg && <div className="error-banner">{errorMsg}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Correo Electrónico</label>
            <div className="input-icon-wrapper">
              <Mail size={18} color="#94a3b8" />
              <input
                type="email"
                required
                placeholder="veterinario@patitasfelices.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-icon-wrapper">
              <Lock size={18} color="#94a3b8" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spinner" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <>
                <span>Ingresar al Dashboard</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top, #0f172a 0%, #020617 100%);
          padding: 20px;
        }

        .login-card {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          width: 100%;
          max-width: 420px;
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .logo-box {
          width: 64px;
          height: 64px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(74, 222, 128, 0.3);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
        }

        h1 {
          font-size: 26px;
          font-weight: 800;
          color: #f8fafc;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .subtitle {
          font-size: 13px;
          color: #94a3b8;
          margin: 6px 0 24px 0;
          text-align: center;
        }

        .error-banner {
          width: 100%;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          padding: 12px;
          border-radius: 12px;
          font-size: 13px;
          text-align: center;
          margin-bottom: 20px;
        }

        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 600;
          color: #cbd5e1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-icon-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0 14px;
          transition: border-color 0.2s;
        }

        .input-icon-wrapper:focus-within {
          border-color: #10b981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }

        .input-icon-wrapper input {
          width: 100%;
          background: none;
          border: none;
          padding: 12px 0;
          color: #f8fafc;
          font-size: 14px;
          outline: none;
        }

        .toggle-password {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
        }

        .submit-btn {
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        :global(.spinner) {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}