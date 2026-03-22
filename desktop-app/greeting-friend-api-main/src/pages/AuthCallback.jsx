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
    <div className="flex items-center justify-center p-6 bg-[#141c27]">
      <div className="w-full max-w-md rounded-3xl bg-[#1a2536]/90 backdrop-blur-xl  ring-1 ring-black/5 p-8 border border-white/20">
        <div className="text-center space-y-6">
          {status === 'processing' && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin flex items-center justify-center bg-blue-500/20">
                <FiLoader className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold bg-blue-600 bg-clip-text text-transparent mb-2">Elaborazione autenticazione</h3>
                <p className="text-slate-400">Attendere prego...</p>
              </div>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center ">
                <FiCheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold bg-blue-600 bg-clip-text text-transparent mb-2">Autenticazione completata</h3>
                <p className="text-slate-400">Reindirizzamento in corso...</p>
              </div>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center ">
                <FiXCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-2">Errore di autenticazione</h3>
                <p className="text-slate-400">Reindirizzamento al login...</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

