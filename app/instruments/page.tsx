'use client';

import React, { useEffect, useState } from 'react';
import { getToken, removeToken } from '../services/authStorage';
import InstrumentsList from '../components/InstrumentsList';
import AuthGate from '../components/AuthGate';
import { Cell, Button } from '@telegram-apps/telegram-ui';

export default function InstrumentsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        setIsAuthenticated(!!token);
      } catch {
        setIsAuthenticated(false);
      }
    })();
  }, []);

  if (isAuthenticated === null) {
    return null;
  }

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return (
    <div>
      <Cell
        before={<div />}
        after={
          <Button
            mode="plain"
            onClick={async () => {
              try {
                await removeToken();
                setIsAuthenticated(false);
              } catch (e) {
                console.error('Logout failed', e);
              }
            }}
          >
            Выйти
          </Button>
        }
      >
        Инструменты
      </Cell>
      <div style={{ display: 'flex', gap: '8px', padding: '12px', overflowX: 'auto' }}>
        <Button
          mode="outline"
          size="s"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }}
        >
          Портфель
        </Button>
        <Button
          mode="filled"
          size="s"
        >
          Инструменты
        </Button>
      </div>
      <InstrumentsList defaultType="STOCK" />
    </div>
  );
}
