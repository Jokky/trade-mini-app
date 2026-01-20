import React, { useEffect, useState } from 'react';
import { getToken, saveToken, removeToken } from '../services/authStorage';

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
    // Prevent flashing wrong UI while async storage read is in progress
    return <div>Loading...</div>;
  }

  if (showPortfolio) {
    return (
      <div>
        <h2>Portfolio</h2>
        <p>(Portfolio UI placeholder)</p>
        <button
          onClick={async () => {
            try {
              await removeToken();
              setShowPortfolio(false);
            } catch (e) {
              // Swallow; in real app surface localized error
              console.error('Logout failed', e);
            }
          }}
        >
          Logout (remove token)
        </button>
      </div>
    );
  }

  return <AddTokenForm storageError={storageError} onSaved={() => setShowPortfolio(true)} />;
};

/**
 * Small Add Token form used by AuthGate
 */
const AddTokenForm: React.FC<{ storageError: string | null; onSaved: () => void }> = ({ storageError, onSaved }) => {
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <h2>Add Token</h2>
      {storageError && <div style={{ color: 'red' }}>Storage error: {storageError}. Falling back to token form.</div>}
      <input
        aria-label="auth-token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Paste your token"
      />
      <button
        onClick={async () => {
          setError(null);
          if (!token || token.trim() === '') {
            setError('Token must be a non-empty string');
            return;
          }
          setSaving(true);
          try {
            await saveToken(token.trim());
            onSaved();
          } catch (e) {
            console.error('Failed to save token', e);
            setError((e as Error).message || 'save-failed');
          } finally {
            setSaving(false);
          }
        }}
        disabled={saving}
      >
        Save
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export default AuthGate;
