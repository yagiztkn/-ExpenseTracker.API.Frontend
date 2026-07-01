import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, ArrowRight, Shield } from 'lucide-react';
import { isAxiosError } from 'axios';
import { authService } from '@/services/authService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UserRegisterDto } from '@/types/auth';

// ─── Design token ──────────────────────────────────────────────────────────
const B = '#C5A059';

// ─── Schema ────────────────────────────────────────────────────────────────
const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Kullanıcı adı en az 3 karakter olmalıdır')
      .max(50, 'Kullanıcı adı en fazla 50 karakter olabilir')
      .regex(/^\S+$/, 'Kullanıcı adı boşluk içeremez'),
    email: z.string().min(1, 'Email zorunludur').email('Geçerli bir email adresi girin'),
    password: z
      .string()
      .min(6, 'Şifre en az 6 karakter olmalıdır')
      .max(100, 'Şifre en fazla 100 karakter olabilir'),
    confirmPassword: z.string().min(1, 'Şifrenizi onaylayın'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// ─── Shared styles ──────────────────────────────────────────────────────────
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

// ─── PasswordField helper ──────────────────────────────────────────────────
function PasswordField({
  id,
  placeholder,
  show,
  onToggle,
  error,
  reg,
}: {
  id: string;
  placeholder: string;
  show: boolean;
  onToggle: () => void;
  error?: string;
  reg: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <div>
      <div style={{ position: 'relative' }}>
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          style={{ ...fieldStyle, paddingRight: '3rem' }}
          aria-invalid={!!error}
          {...reg}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Şifreyi gizle' : 'Şifreyi göster'}
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
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p role="alert" style={errStyle}>{error}</p>}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const payload: UserRegisterDto = {
        username: values.username,
        email: values.email,
        password: values.password,
      };
      await authService.register(payload);
      toast.success('Hesap oluşturuldu.', { description: 'Artık giriş yapabilirsiniz.' });
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const message: string =
          (err.response?.data as { message?: string })?.message ??
          err.message ??
          'Kayıt başarısız. Lütfen tekrar deneyin.';
        toast.error('Kayıt başarısız', { description: message });
      } else {
        toast.error('Kayıt başarısız', { description: 'Beklenmeyen bir hata oluştu.' });
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
          radial-gradient(ellipse 40% 30% at 85% 80%, ${B}05 0%, transparent 50%)
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
            background: '#09090b',
            border: '1px solid #27272a',
            borderRadius: '18px',
            padding: '2.5rem',
          }}
        >
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
              Hesap Oluştur
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', color: '#52525b', lineHeight: 1.55 }}>
              GiderTakip'e katılın ve finanslarınızı kontrol altına alın
            </p>
          </div>

          <div style={{ height: '1px', background: '#27272a', marginBottom: '2rem' }} />

          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.375rem' }}>

            {/* Username */}
            <div>
              <Label htmlFor="reg-username" style={labelStyle}>Kullanıcı Adı</Label>
              <Input
                id="reg-username"
                type="text"
                autoComplete="username"
                placeholder="johndoe"
                aria-invalid={!!errors.username}
                style={fieldStyle}
                {...register('username')}
              />
              {errors.username && <p role="alert" style={errStyle}>{errors.username.message}</p>}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="reg-email" style={labelStyle}>E-posta Adresi</Label>
              <Input
                id="reg-email"
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
              <Label htmlFor="reg-password" style={labelStyle}>Şifre</Label>
              <PasswordField
                id="reg-password"
                placeholder="En az 6 karakter"
                show={showPassword}
                onToggle={() => setShowPassword((p) => !p)}
                error={errors.password?.message}
                reg={register('password')}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="reg-confirm" style={labelStyle}>Şifre Tekrar</Label>
              <PasswordField
                id="reg-confirm"
                placeholder="Şifrenizi tekrarlayın"
                show={showConfirm}
                onToggle={() => setShowConfirm((p) => !p)}
                error={errors.confirmPassword?.message}
                reg={register('confirmPassword')}
              />
            </div>

            {/* Submit */}
            <button
              id="register-submit"
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
                <><Loader2 size={16} className="animate-spin" /> Hesap oluşturuluyor…</>
              ) : (
                <>Hesabı Oluştur <ArrowRight size={15} strokeWidth={2.5} /></>
              )}
            </button>
          </form>

          <p
            style={{
              marginTop: '1.75rem',
              textAlign: 'center',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8125rem',
              color: '#52525b',
            }}
          >
            Zaten hesabınız var mı?{' '}
            <Link to="/login" style={{ color: B, fontWeight: 600, transition: 'color 150ms' }}>
              Giriş yapın
            </Link>
          </p>
        </div>

        {/* Security note */}
        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Shield size={11} style={{ color: '#3e3c3a' }} />
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.625rem', color: '#3e3c3a', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            JWT · TLS Şifreli · Güvenli bağlantı
          </p>
        </div>
      </div>
    </div>
  );
}
