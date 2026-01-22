'use client';

import React, { useEffect, useState } from 'react';
import { getToken, saveToken, removeToken } from '../services/authStorage';
import Portfolio from './Portfolio';
import { Panel, PanelHeader, Button, Spinner, Placeholder, Textarea, Banner } from '@telegram-apps/telegram-ui';

/**
 * Minimal AuthGate component
 * - On mount, checks storage for token (awaits the async check)
 * - If token exists -> shows Portfolio placeholder
 * - If no token -> shows Add Token form
 * - If storage read fails -> shows Add Token form and displays an error message
 */
export const AuthGate: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [showPortfolio, setShowPortfolio] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await getToken();
        if (!mounted) return;
        if (token) {
          setShowPortfolio(true);
        }
      } catch (e) {
        // Propagate an explicit flag so UI can show helpful message
        setStorageError((e as Error)?.message || 'storage-error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Panel>
        <Placeholder header="Загрузка..." />
      </Panel>
    );
  }

  if (showPortfolio) {
    return (
      <Panel>
        <PanelHeader
          before={<div />}
          after={
            <Button
              mode="plain"
              onClick={async () => {
                try {
                  await removeToken();
                  setShowPortfolio(false);
                } catch (e) {
                  console.error('Logout failed', e);
                }
              }}
            >
              Выйти
            </Button>
          }
        >
          Портфель
        </PanelHeader>
        <Portfolio />
      </Panel>
    );
  }

  return <AddTokenForm storageError={storageError} onSaved={() => setShowPortfolio(true)} />;
};

/**
 * Small Add Token form used by AuthGate
 * Accepts refresh_token from BCS web interface
 */
const AddTokenForm: React.FC<{ storageError: string | null; onSaved: () => void }> = ({ storageError, onSaved }) => {
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!token || token.trim() === '') {
      setError('Токен не может быть пустым');
      return;
    }
    setSaving(true);
    try {
      // Validate token by attempting authentication
      const response = await fetch('/api/bcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'authenticate',
          refreshToken: token.trim(),
          clientId: 'trade-api-write',
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Ошибка авторизации');
      }
      // Save token only after successful authentication
      await saveToken(token.trim());
      onSaved();
    } catch (e) {
      console.error('Failed to authenticate', e);
      setError((e as Error).message || 'Ошибка авторизации');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <PanelHeader>Добавить токен</PanelHeader>
      <div style={{ padding: '16px' }}>
        <p style={{ marginBottom: '16px', color: 'var(--tgui--hint_color)', textAlign: 'center' }}>
          Введите ваш refresh-токен из веб-версии БКС Мир инвестиций
        </p>
        {storageError && (
          <Banner type="error" style={{ marginBottom: '16px' }}>
            Ошибка хранилища: {storageError}
          </Banner>
        )}
        <Textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Вставьте ваш refresh-токен"
          style={{ marginBottom: '16px', fontFamily: 'monospace', fontSize: '14px' }}
        />
        <Button
          onClick={handleSubmit}
          disabled={saving}
          size="l"
          stretched
        >
          {saving ? 'Проверка...' : 'Войти'}
        </Button>
        {error && (
          <Banner type="error" style={{ marginTop: '16px' }}>
            {error}
          </Banner>
        )}
      </div>
    </Panel>
  );
};

export default AuthGate;
