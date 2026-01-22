'use client';

import React, { useEffect, useState } from 'react';
import { getToken, saveToken, removeToken } from '../services/authStorage';
import Portfolio from './Portfolio';

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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (showPortfolio) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Портфель</h1>
          <button
            onClick={async () => {
              try {
                await removeToken();
                setShowPortfolio(false);
              } catch (e) {
                console.error('Logout failed', e);
              }
            }}
            className="text-red-500 text-sm"
          >
            Выйти
          </button>
        </div>
        <Portfolio />
      </div>
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
          clientId: 'trade-api-read',
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-center">Добавить токен</h2>
        <p className="text-gray-500 text-center mb-6">
          Введите ваш refresh-токен из веб-версии БКС Мир инвестиций
        </p>
        {storageError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            Ошибка хранилища: {storageError}
          </div>
        )}
        <textarea
          aria-label="refresh-token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Вставьте ваш refresh-токен"
          className="w-full p-3 border rounded-lg mb-4 h-24 resize-none font-mono text-sm"
        />
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {saving ? 'Проверка...' : 'Войти'}
        </button>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mt-4 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthGate;
