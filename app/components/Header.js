'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { daysSince } from '@/lib/practice';
import { useCountUp } from '@/lib/useCountUp';
import SensorToggle from '@/app/components/SensorToggle';
import BottomNav from '@/app/components/BottomNav';
import { IconCoin, IconStar, IconFire, IconCamera } from '@/app/components/Icons';
import { useLang } from '@/lib/LanguageContext';
import { LANGS } from '@/lib/i18n';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Barcha ichki sahifalar uchun umumiy tepa panel: hisob ma'lumotlari,
// amaliyot statistikasi va chiqish tugmasi bitta joyda.
export default function Header({ profile, backHref }){
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const boxRef = useRef(null);
  const fileInputRef = useRef(null);
  const { t, lang, setLang } = useLang();

  useEffect(() => { setAvatarUrl(profile?.avatar_url || ''); }, [profile?.avatar_url]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email || ''));
  }, []);

  useEffect(() => {
    function onDoc(e){ if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function handleLogout(){
    await supabase.auth.signOut();
    router.replace('/');
  }

  async function handleAvatarChange(e){
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !profile?.id) return;
    setAvatarError('');
    const ext = ALLOWED_AVATAR_TYPES[file.type];
    if (!ext) { setAvatarError('Nur JPG, PNG oder WEBP erlaubt.'); return; }
    if (file.size > MAX_AVATAR_BYTES) { setAvatarError('Bild ist zu groß (max. 2 MB).'); return; }

    setUploading(true);
    const path = `${profile.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, cacheControl: '3600' });
    if (upErr) { setAvatarError('Hochladen fehlgeschlagen. Bitte erneut versuchen.'); setUploading(false); return; }

    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = pub.publicUrl + '?t=' + Date.now();
    const { error: dbErr } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id);
    setUploading(false);
    if (dbErr) { setAvatarError('Speichern fehlgeschlagen. Bitte erneut versuchen.'); return; }
    setAvatarUrl(url);
  }

  const coinsDisplay = useCountUp(profile?.coins ?? 0);

  if (!profile) return null;
  const initials = (profile.full_name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const memberDays = daysSince(profile.created_at);
  const practiceDays = profile.practice_days || 0;
  const practicedToday = profile.last_practice_date === new Date().toISOString().slice(0, 10);

  return (
    <>
    <div className="topbar">
      <div className="topbar-inner">
        <a href={backHref || '/home'} className="brand-mark" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {backHref && <span style={{ fontSize: 14 }}>←</span>}
          FSP<span style={{ color: 'var(--brand)' }}>.</span>Trainer
        </a>
        <div className="stats">
          <span className="stat coins" title={t('practiceAccount')}><IconCoin width={15} height={15} /> <b>{coinsDisplay}</b></span>
          <span className="stat level" title={t('level')}><IconStar width={15} height={15} /> <b>{profile.level ?? 1}</b></span>
          <span className="streak-badge" title={t('practicedDaysTitle')}><IconFire width={15} height={15} /> <b>{practiceDays}</b><span className="streak-word">{t('daysUnit')}</span></span>

          <div className="acct" ref={boxRef}>
            <button className="acct-menu-btn" onClick={() => setOpen(o => !o)} aria-label={t('account')}>
              <div className={'acct-ring' + (practicedToday ? ' ring-active' : '')}>
                <div className="acct-avatar">
                  {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
                </div>
              </div>
            </button>
            <div className="acct-info">
              <span className="acct-name">{profile.full_name}</span>
              <span className="acct-email">{email}</span>
            </div>

            {open && (
              <div className="acct-dropdown">
                <div className="acct-dropdown-avatar">
                  <div className="acct-avatar-lg">
                    {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
                    {uploading && <span className="avatar-uploading">…</span>}
                  </div>
                  <button
                    type="button"
                    className="avatar-change-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <IconCamera width={14} height={14} /> {t('changeAvatar')}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                  {avatarError && <span className="error-text" style={{ marginTop: 4 }}>{avatarError}</span>}
                </div>
                <div className="row-item">
                  <span>🌐 Sprache / Til / Язык</span>
                  <select className="lang-select-sm" value={lang} onChange={e => setLang(e.target.value)}>
                    {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </div>
                <div className="row-item"><span>{t('loggedInAs')}</span><b style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</b></div>
                <div className="row-item"><span>{t('memberSince')}</span><b>{memberDays} {t('daysUnit')}</b></div>
                <div className="row-item"><span>{t('practicedOn')}</span><b>{practiceDays} {t('daysUnit2')}</b></div>
                {profile.bundesland && <div className="row-item"><span>{t('targetState')}</span><b>{profile.bundesland}</b></div>}
                <a href="/mistakes" className="row-item" style={{ cursor: 'pointer' }}><span>{t('myMistakes')}</span><b>→</b></a>
                <a href="/daily" className="row-item" style={{ cursor: 'pointer' }}><span>{t('dailyTraining')}</span><b>→</b></a>
                <a href="/coach" className="row-item" style={{ cursor: 'pointer' }}><span>{t('aiCoach')}</span><b>→</b></a>
                <a href="/home" className="row-item" style={{ cursor: 'pointer' }}><span>{t('dashboard')}</span><b>→</b></a>
                <div style={{ marginTop: 10 }}><SensorToggle /></div>
                <button className="logout-btn" style={{ width: '100%', marginTop: 8 }} onClick={handleLogout}>{t('logout')}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    <BottomNav />
    </>
  );
}
