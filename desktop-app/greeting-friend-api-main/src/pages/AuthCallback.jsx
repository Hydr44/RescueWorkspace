import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { OAuthService } from '@/lib/oauth';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[AuthCallback] Received callback');
        
        // Estrai URL dalla location
        const fullUrl = `${window.location.origin}${location.pathname}${location.search}${location.hash}`;
        console.log('[AuthCallback] Full URL:', fullUrl);

        // Processa callback OAuth
        const tokens = await OAuthService.handleOAuthCallback(fullUrl);
        
        if (tokens) {
          console.log('[AuthCallback] OAuth successful, redirecting...');
          setStatus('success');
          
          // Redirect dopo 1 secondo
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1000);
        } else {
          setStatus('error');
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 2000);
        }
      } catch (error) {
        console.error('[AuthCallback] Error:', error);
        setStatus('error');
        setTimeout(() => {
          navigate('/login?error=oauth_failed', { replace: true });
        }, 2000);
      }
    };

    handleCallback();
  }, [navigate, location]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      background: 'var(--bg-left)',
      padding: '1.5rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '28rem',
        background: 'var(--bg-right)',
        border: '1px solid var(--border-right)',
        padding: '2rem',
        textAlign: 'center'
      }}>
        {status === 'processing' && (
          <>
            <div style={{
              width: '4rem',
              height: '4rem',
              margin: '0 auto 1.5rem',
              border: '4px solid var(--brand-primary)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(37, 99, 235, 0.1)'
            }}>
              <FiLoader style={{ width: '2rem', height: '2rem', color: 'var(--brand-primary)' }} />
            </div>
            <div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 700, 
                color: 'var(--neutral-900)',
                marginBottom: '0.5rem'
              }}>
                Elaborazione autenticazione
              </h3>
              <p style={{ color: 'var(--text-right-muted)' }}>Attendere prego...</p>
            </div>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{
              width: '4rem',
              height: '4rem',
              margin: '0 auto 1.5rem',
              background: 'var(--brand-primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiCheckCircle style={{ width: '2rem', height: '2rem', color: 'white' }} />
            </div>
            <div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 700, 
                color: 'var(--neutral-900)',
                marginBottom: '0.5rem'
              }}>
                Autenticazione completata
              </h3>
              <p style={{ color: 'var(--text-right-muted)' }}>Reindirizzamento in corso...</p>
            </div>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{
              width: '4rem',
              height: '4rem',
              margin: '0 auto 1.5rem',
              background: '#ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiXCircle style={{ width: '2rem', height: '2rem', color: 'white' }} />
            </div>
            <div>
              <h3 style={{ 
                fontSize: '0.875rem', 
                fontWeight: 700, 
                color: '#ef4444',
                marginBottom: '0.5rem'
              }}>
                Errore di autenticazione
              </h3>
              <p style={{ color: 'var(--text-right-muted)' }}>Reindirizzamento al login...</p>
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

