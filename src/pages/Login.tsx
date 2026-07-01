import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, ArrowRight, Shield } from 'lucide-react';
import { isAxiosError } from 'axios';
import { authService } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UserLoginDto } from '@/types/auth';

// ─── Design token ──────────────────────────────────────────────────────────
const B = '#C5A059'; // buttons & active states ONLY

// ─── Schema ────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().min(1, 'Email zorunludur').email('Geçerli bir email adresi girin'),
  password: z.string().min(1, 'Şifre zorunludur'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────
const fieldStyle: React.CSSProperties = {
  backgroundColor: '#09090b',
  borderColor: 'rgba(255,255,255,0.10)',
  color: '#f4f4f5',
  borderRadius: '11px',
  height: '48px',
  fontSize: '0.9375rem',
  paddingLeft: '1rem',
};
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: '#71717a',
  display: 'block',
  marginBottom: '8px',
};
const errStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  marginTop: '6px',
  fontSize: '0.75rem',
  color: '#f87171',
};

// ─── Component ─────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const payload: UserLoginDto = { Email: values.email, Password: values.password };
      console.log('Sending login payload:', JSON.stringify(payload));
      const { data } = await authService.login(payload);
      login(data);
      toast.success('Hoş geldiniz!', { description: 'Başarıyla giriş yaptınız.' });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const message: string =
          (err.response?.data as { message?: string })?.message ??
          err.message ??
          'Geçersiz kimlik bilgileri. Lütfen tekrar deneyin.';
        toast.error('Giriş başarısız', { description: message });
      } else {
        toast.error('Giriş başarısız', { description: 'Beklenmeyen bir hata oluştu.' });
      }
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#080808',
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -20%, ${B}09 0%, transparent 60%),
          radial-gradient(ellipse 40% 30% at 15% 80%, ${B}05 0%, transparent 50%)
        `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '360px' }} className="animate-fade-in-up">

        {/* ── Brand ──────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${B}22 0%, ${B}08 100%)`,
              border: `1px solid ${B}30`,
              marginBottom: '1.125rem',
              boxShadow: `0 0 32px ${B}15`,
            }}
          >
            <span style={{ color: B, fontSize: '1.375rem', lineHeight: 1 }}>◆</span>
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.625rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#EAE6DE',
              marginBottom: '0.375rem',
            }}
          >
            GiderTakip
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              color: '#3e3c3a',
              fontSize: '0.6875rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            Finans Sistemi
          </p>
        </div>

        {/* ── Auth Card ─────────────────────────────────────── */}
        <div
          style={{
            background: '#18181b',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '18px',
            padding: '2.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5), 0 16px 64px rgba(0,0,0,0.8)',
          }}
        >
          {/* Card heading */}
          <div style={{ marginBottom: '2rem' }}>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.375rem',
                fontWeight: 700,
                color: '#f4f4f5',
                letterSpacing: '-0.015em',
                marginBottom: '0.375rem',
              }}
            >
              Giriş Yap
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.8125rem',
                color: '#52525b',
                lineHeight: 1.55,
              }}
            >
              Hesabınıza erişmek için bilgilerinizi girin
            </p>
          </div>

          {/* Gray separator */}
          <div
            style={{
              height: '1px',
              background: 'rgba(255,255,255,0.06)',
              marginBottom: '2rem',
            }}
          />

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Email */}
            <div>
              <Label htmlFor="login-email" style={labelStyle}>E-posta Adresi</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="siz@ornek.com"
                aria-invalid={!!errors.email}
                style={fieldStyle}
                {...register('email')}
              />
              {errors.email && <p role="alert" style={errStyle}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <Label htmlFor="login-password" style={{ ...labelStyle, marginBottom: 0 }}>Şifre</Label>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.6875rem',
                    letterSpacing: '0.06em',
                    color: '#52525b',
                    padding: 0,
                    transition: 'color 150ms',
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.color = B)}
                  onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.color = '#52525b')}
                >
                  Şifremi unuttum
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  style={{ ...fieldStyle, paddingRight: '3rem' }}
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  style={{
                    position: 'absolute',
                    right: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#3e3c3a',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    transition: 'color 150ms',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = B)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#3e3c3a')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p role="alert" style={errStyle}>{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.875rem',
                marginTop: '0.25rem',
                background: isSubmitting
                  ? '#2a2826'
                  : `linear-gradient(135deg, ${B} 0%, #c49535 50%, #a87e28 100%)`,
                border: 'none',
                borderRadius: '13px',
                color: isSubmitting ? '#52525b' : '#0a0908',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9375rem',
                fontWeight: 700,
                letterSpacing: '0.015em',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: isSubmitting ? 'none' : '0 4px 20px rgba(0,0,0,0.45)',
                transition: 'all 150ms',
              }}
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Giriş yapılıyor…</>
              ) : (
                <>'Giriş Yap' <ArrowRight size={15} strokeWidth={2.5} /></>
              )}
            </button>
          </form>

          {/* Footer link */}
          <p
            style={{
              marginTop: '1.75rem',
              textAlign: 'center',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8125rem',
              color: '#52525b',
            }}
          >
            Hesabınız yok mu?{' '}
            <Link
              to="/register"
              style={{ color: B, fontWeight: 600, transition: 'color 150ms' }}
            >
              Ücretsiz oluşturun
            </Link>
          </p>
        </div>

        {/* Security note */}
        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Shield size={11} style={{ color: '#3e3c3a' }} />
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.625rem',
              color: '#3e3c3a',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            JWT · TLS Şifreli · Güvenli bağlantı
          </p>
        </div>
      </div>
    </div>
  );
}
