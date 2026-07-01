import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  User,
  Wallet,
  CheckCircle2,
  Loader2,
  Target,
  Trash2,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import api, { TOKEN_KEY } from '@/services/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// ─── Design tokens ──────────────────────────────────────────────────────────
const B = '#C5A059'; // brass — buttons & active states ONLY
const CARD: React.CSSProperties = {
  background: 'var(--color-obsidian)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  overflow: 'hidden',
};
const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--color-abyss)',
  borderColor: 'var(--color-slate)',
  color: 'var(--color-text-primary)',
  borderRadius: '10px',
  height: '44px',
  fontSize: '0.9rem',
};
const LABEL_STYLE: React.CSSProperties = {
  color: 'var(--color-text-tertiary)',
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  marginBottom: '6px',
  display: 'block',
};

// ─── Validation ────────────────────────────────────────────────────────────
const budgetSchema = z.object({
  budget: z.coerce
    .number({ error: 'Geçerli bir tutar girin' })
    .min(1, 'Bütçe en az ₺1 olmalıdır')
    .max(10_000_000, 'Bütçe çok yüksek'),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;


// ─── Settings ──────────────────────────────────────────────────────────────
export default function Settings() {
  const { userInfo, monthlyBudget, setMonthlyBudget, updateUserInfo, login } = useAuth();
  const [budgetSaved, setBudgetSaved] = useState(false);

  // Initialise from context if already available; the useEffect below handles
  // the async case where userInfo resolves after the first render.
  const [profileUsername, setProfileUsername] = useState(userInfo?.username ?? '');
  const [profileEmail, setProfileEmail] = useState(userInfo?.email ?? '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // ── Change password modal state ──────────────────────────────────
  const [isPwModalOpen, setIsPwModalOpen]       = useState(false);
  const [currentPassword, setCurrentPassword]   = useState('');
  const [newPassword, setNewPassword]           = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [isChangingPw, setIsChangingPw]         = useState(false);
  const [showCurrent, setShowCurrent]           = useState(false);
  const [showNew, setShowNew]                   = useState(false);
  const [showConfirm, setShowConfirm]           = useState(false);

  const closePwModal = () => {
    setIsPwModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim()) { toast.error('Mevcut şifrenizi girin.'); return; }
    if (newPassword.length < 6)  { toast.error('Yeni şifre en az 6 karakter olmalıdır.'); return; }
    if (newPassword !== confirmPassword) { toast.error('Yeni şifreler eşleşmiyor.'); return; }

    setIsChangingPw(true);
    try {
      const token = localStorage.getItem('token');
      await api.post(
        '/api/auth/change-password',
        { CurrentPassword: currentPassword, NewPassword: newPassword },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success('Şifreniz başarıyla güncellendi.');
      closePwModal();
    } catch (err: any) {
      if (err?.response?.status === 400) {
        toast.error('Mevcut şifre yanlış. Lütfen tekrar deneyin.');
      } else {
        toast.error('Şifre değiştirilirken bir hata oluştu.');
      }
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleProfileUpdate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // ── Guard: prevent sending empty strings to the backend ──────────────
    if (!profileUsername.trim()) {
      toast.error('Kullanıcı adı boş bırakılamaz.');
      return;
    }
    if (!profileEmail.trim()) {
      toast.error('E-posta adresi boş bırakılamaz.');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        toast.error('Oturum süresi dolmuş veya geçersiz (Token bulunamadı).');
        return;
      }
      
      const response = await api.put(
        '/api/auth/update-profile',
        {
          UpdatedName: profileUsername,
          UpdatedEmail: profileEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ✅ Backend returned a fresh JWT — persist it and re-decode userInfo
      // from the new token so every component reflects the updated claims
      // immediately, with no page reload required.
      const newToken: string | undefined = response.data?.token;
      if (newToken) {
        // login() writes the token to localStorage via authService.saveTokens
        // AND updates userInfo in context by decoding the fresh JWT payload.
        login({ token: newToken });
      } else {
        // Fallback: backend did not return a token — patch context in-memory.
        updateUserInfo({ username: profileUsername, email: profileEmail });
      }

      toast.success('Profil başarıyla güncellendi');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Profil güncellenirken bir hata oluştu.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // ── Pre-fill form fields ───────────────────────────────────────────────
  // Runs on mount and whenever userInfo changes (e.g. after async hydration).
  // Falls back to decoding the JWT directly so fields are never blank even
  // when AuthContext resolves after the first render.
  useEffect(() => {
    if (userInfo?.username || userInfo?.email) {
      // Context already has the data — use it directly.
      if (userInfo.username) setProfileUsername(userInfo.username);
      if (userInfo.email)    setProfileEmail(userInfo.email);
      return;
    }

    // Fallback: decode the JWT ourselves so the form pre-fills immediately
    // even before the context finishes initialising.
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return;
    try {
      const base64 = raw.split('.')[1];
      const payload: Record<string, unknown> = JSON.parse(
        atob(base64.replace(/-/g, '+').replace(/_/g, '/')),
      );
      const name =
        (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] as string) ??
        (payload['unique_name'] as string) ??
        (payload['sub'] as string) ??
        '';
      const email =
        (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] as string) ??
        (payload['email'] as string) ??
        '';
      if (name)  setProfileUsername(name);
      if (email) setProfileEmail(email);
    } catch {
      // Malformed token — leave fields empty rather than crash.
    }
  }, [userInfo]);

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema) as any,
    defaultValues: { budget: monthlyBudget ?? 0 },
  });

  useEffect(() => {
    if (monthlyBudget !== null) form.setValue('budget', monthlyBudget);
  }, [monthlyBudget, form]);

  const budgetMutation = useMutation({
    mutationFn: async (data: BudgetFormValues) => {
      try {
        await authService.setBudget({ budget: data.budget });
      } catch {
        // Backend may not be available; fall through to localStorage path
      }
      setMonthlyBudget(data.budget);
    },
    onSuccess: () => {
      toast.success('Aylık bütçe güncellendi');
      setBudgetSaved(true);
      setTimeout(() => setBudgetSaved(false), 3000);
    },
    onError: () => { toast.error('Bütçe kaydedilemedi'); },
  });

  const onBudgetSubmit: SubmitHandler<BudgetFormValues> = (values) => {
    budgetMutation.mutate(values);
  };

  const handleClearBudget = () => {
    setMonthlyBudget(null);
    form.setValue('budget', 0);
    toast.success('Bütçe sıfırlandı');
  };

  return (
    <div className="animate-fade-in px-4 md:px-0" style={{ paddingBottom: '2.5rem' }}>

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
          <div style={{ width: '3px', height: '22px', background: `linear-gradient(180deg, ${B} 0%, ${B}44 100%)`, borderRadius: '2px', flexShrink: 0 }} />
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Ayarlar
          </h1>
        </div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', paddingLeft: '1.1875rem', letterSpacing: '0.01em' }}>
          Hesap ve tercihlerinizi yönetin
        </p>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="profile">
        <TabsList style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '4px', gap: '4px' }}>
          <TabsTrigger value="profile" id="settings-tab-profile" style={{ borderRadius: '9px', fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem' }}>
            <User size={14} />
            Profil
          </TabsTrigger>
          <TabsTrigger value="preferences" id="settings-tab-preferences" style={{ borderRadius: '9px', fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem' }}>
            <Wallet size={14} />
            Tercihler
          </TabsTrigger>
        </TabsList>

        {/* ══ Profil Tab ══ */}
        <TabsContent value="profile" style={{ marginTop: '1.5rem' }}>
          <div style={CARD}>
            {/* Card header */}
            <div style={{ padding: '1.5rem 2rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
                Profil Bilgileri
              </h3>
            </div>

            <div style={{ padding: '2rem' }}>
              {/* Avatar banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.375rem',
                  marginBottom: '2rem',
                  paddingBottom: '2rem',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: 'none',
                  }}
                >
                  <User size={28} style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: 'var(--color-text-primary)',
                      letterSpacing: '-0.01em',
                      marginBottom: '3px',
                    }}
                  >
                    {userInfo?.username ?? 'Kullanıcı'}
                  </p>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', color: 'var(--color-text-tertiary)' }}>
                    {userInfo?.email ?? 'E-posta bilgisi yok'}
                  </p>
                </div>
              </div>

              {/* Edit Profile Form */}
              <div className="space-y-6">
                <div>
                  <label style={LABEL_STYLE}>KULLANICI ADI</label>
                  <Input
                    value={profileUsername}
                    onChange={(e) => setProfileUsername(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-zinc-300"
                    style={{ height: '44px', borderRadius: '10px' }}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>E-POSTA ADRESİ</label>
                  <Input
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-zinc-300"
                    style={{ height: '44px', borderRadius: '10px' }}
                  />
                </div>

                {/* Action buttons row */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  {/* Save profile */}
                  <button
                    type="button"
                    disabled={isUpdatingProfile}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 2rem',
                      background: isUpdatingProfile ? '#27272a' : `linear-gradient(135deg, ${B} 0%, #a07828 100%)`,
                      border: 'none',
                      borderRadius: '12px',
                      color: isUpdatingProfile ? '#52525b' : '#0a0a0a',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: isUpdatingProfile ? 'not-allowed' : 'pointer',
                      letterSpacing: '0.02em',
                      boxShadow: isUpdatingProfile ? 'none' : '0 4px 16px rgba(0,0,0,0.4)',
                      transition: 'all 150ms',
                    }}
                    onClick={handleProfileUpdate}
                  >
                    {isUpdatingProfile ? (
                      <><Loader2 size={15} className="animate-spin" /> Kaydediliyor…</>
                    ) : (
                      'Değişiklikleri Kaydet'
                    )}
                  </button>

                  {/* Change password */}
                  <button
                    id="change-password-btn"
                    type="button"
                    onClick={() => setIsPwModalOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '12px',
                      color: 'var(--color-text-secondary)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      letterSpacing: '0.02em',
                      transition: 'all 150ms',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `${B}60`;
                      (e.currentTarget as HTMLButtonElement).style.color = B;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
                    }}
                  >
                    <KeyRound size={14} />
                    Şifremi Değiştir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ══ Change Password Modal ══ */}
        {isPwModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pw-modal-title"
            onClick={(e) => { if (e.target === e.currentTarget) closePwModal(); }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(4px)',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '440px',
                background: '#0E1116',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.75)',
                overflow: 'hidden',
                animation: 'fadeInScale 160ms cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              {/* Modal header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.625rem 1.75rem 1.375rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '36px', height: '36px',
                    borderRadius: '10px',
                    background: `rgba(197,160,89,0.1)`,
                    border: `1px solid rgba(197,160,89,0.2)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Lock size={15} style={{ color: B }} />
                  </div>
                  <h2
                    id="pw-modal-title"
                    style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}
                  >
                    Şifremi Değiştir
                  </h2>
                </div>
                <button
                  onClick={closePwModal}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '32px', height: '32px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-tertiary)',
                    cursor: 'pointer',
                    transition: 'background 140ms, color 140ms',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)'; }}
                  aria-label="Kapat"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal body */}
              <form onSubmit={handleChangePassword} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Mevcut şifre */}
                {([
                  { label: 'MEVCUT ŞİFRE',    value: currentPassword, setter: setCurrentPassword, show: showCurrent, toggleShow: () => setShowCurrent(v => !v), id: 'pw-current' },
                  { label: 'YENİ ŞİFRE',       value: newPassword,     setter: setNewPassword,     show: showNew,     toggleShow: () => setShowNew(v => !v),     id: 'pw-new'     },
                  { label: 'YENİ ŞİFRE TEKRAR', value: confirmPassword,  setter: setConfirmPassword,  show: showConfirm, toggleShow: () => setShowConfirm(v => !v), id: 'pw-confirm'  },
                ] as const).map(({ label, value, setter, show, toggleShow, id }) => (
                  <div key={id}>
                    <label
                      htmlFor={id}
                      style={LABEL_STYLE}
                    >
                      {label}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Input
                        id={id}
                        type={show ? 'text' : 'password'}
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        autoComplete="off"
                        style={{
                          ...INPUT_STYLE,
                          paddingRight: '3rem', // room for eye icon
                        }}
                      />
                      <button
                        type="button"
                        onClick={toggleShow}
                        style={{
                          position: 'absolute',
                          right: '0.875rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-text-tertiary)',
                          display: 'flex',
                          alignItems: 'center',
                          padding: 0,
                          transition: 'color 140ms',
                        }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'}
                        onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)'}
                        aria-label={show ? 'Gizle' : 'Göster'}
                      >
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Password match indicator */}
                {confirmPassword.length > 0 && (
                  <p style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-sans)',
                    color: newPassword === confirmPassword ? '#5DB88A' : '#C06060',
                    marginTop: '-0.5rem',
                  }}>
                    {newPassword === confirmPassword ? '✓ Şifreler eşleşiyor' : '✗ Şifreler eşleşmiyor'}
                  </p>
                )}

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.25rem 0' }} />

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={closePwModal}
                    style={{
                      padding: '0.6875rem 1.375rem',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: 'var(--color-text-tertiary)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    İptal
                  </button>
                  <button
                    id="confirm-change-password-btn"
                    type="submit"
                    disabled={isChangingPw}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6875rem 1.5rem',
                      background: isChangingPw ? '#27272a' : `linear-gradient(135deg, ${B} 0%, #a07828 100%)`,
                      border: 'none',
                      borderRadius: '10px',
                      color: isChangingPw ? '#52525b' : '#0a0a0a',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: isChangingPw ? 'not-allowed' : 'pointer',
                      boxShadow: isChangingPw ? 'none' : '0 4px 16px rgba(0,0,0,0.4)',
                      transition: 'all 150ms',
                    }}
                  >
                    {isChangingPw ? (
                      <><Loader2 size={14} className="animate-spin" /> Güncelleniyor…</>
                    ) : (
                      <><KeyRound size={14} /> Şifreyi Kaydet</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══ Tercihler Tab ══ */}
        <TabsContent value="preferences" style={{ marginTop: '1.5rem' }}>
          <div style={CARD}>
            <div style={{ padding: '1.5rem 2rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Target size={16} style={{ color: B }} />
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
                  Aylık Bütçe
                </h3>
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', color: '#3e3c3a', marginTop: '4px' }}>
                Belirlediğiniz limit kontrol panelinize yansıtılır.
              </p>
            </div>

            <div style={{ padding: '2rem' }}>
              {/* Current budget display */}
              {monthlyBudget !== null && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.5rem',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: '2rem',
                  }}
                >
                  <div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.5625rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '5px', fontWeight: 600 }}>
                      Mevcut Bütçe
                    </p>
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.625rem', fontWeight: 700, color: B, letterSpacing: '-0.02em' }}>
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(monthlyBudget)}
                    </p>
                  </div>
                  <Button
                    id="clear-budget-btn"
                    variant="ghost"
                    size="icon"
                    style={{ color: '#3e3c3a', borderRadius: '10px', width: '36px', height: '36px' }}
                    className="hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                    onClick={handleClearBudget}
                    title="Bütçeyi sıfırla"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Budget form */}
              <Form {...form}>
                <form id="budget-form" onSubmit={form.handleSubmit(onBudgetSubmit)} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={LABEL_STYLE}>
                          {monthlyBudget !== null ? 'Yeni Aylık Bütçe (₺)' : 'Aylık Bütçe (₺)'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="budget-input"
                            type="number"
                            step="1"
                            placeholder="Örn: 10000"
                            style={INPUT_STYLE}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage style={{ color: '#BF6868', fontSize: '0.75rem', marginTop: '4px' }} />
                      </FormItem>
                    )}
                  />

                  <button
                    id="save-budget-btn"
                    type="submit"
                    disabled={budgetMutation.isPending}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 2rem',
                      background: budgetMutation.isPending ? '#27272a' : `linear-gradient(135deg, ${B} 0%, #a07828 100%)`,
                      border: 'none',
                      borderRadius: '12px',
                      color: budgetMutation.isPending ? '#52525b' : '#0a0a0a',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: budgetMutation.isPending ? 'not-allowed' : 'pointer',
                      letterSpacing: '0.02em',
                      boxShadow: budgetMutation.isPending ? 'none' : '0 4px 16px rgba(0,0,0,0.4)',
                      transition: 'all 150ms',
                      alignSelf: 'flex-start',
                    }}
                  >
                    {budgetMutation.isPending ? (
                      <><Loader2 size={15} className="animate-spin" /> Kaydediliyor…</>
                    ) : budgetSaved ? (
                      <><CheckCircle2 size={15} /> Kaydedildi!</>
                    ) : 'Bütçeyi Kaydet'}
                  </button>
                </form>
              </Form>

              {/* Hint */}
              <div
                style={{
                  marginTop: '2rem',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', color: '#5a5652', lineHeight: 1.65 }}>
                  💡 Bütçeniz tarayıcınızda güvenli şekilde saklanır ve Kontrol Paneli'nizdeki
                  bütçe kartları anlık olarak güncellenir.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
