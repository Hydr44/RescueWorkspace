// src/examples/AnimationsExample.jsx
import { useState } from 'react';
import { FiPlus, FiEdit, FiTrash, FiCheck } from 'react-icons/fi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import LoadingButton from '@/components/ui/LoadingButton';
import AnimatedCard from '@/components/ui/AnimatedCard';
import ProgressBar from '@/components/ui/ProgressBar';
import NotificationBadge from '@/components/ui/NotificationBadge';
import Skeleton from '@/components/ui/Skeleton';

const AnimationsExample = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notifications, setNotifications] = useState(5);

  const handleLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  const handleProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 animate-slide-up">
          🎨 Sistema di Animazioni
        </h1>
        <p className="text-gray-600 dark:text-gray-400 animate-fade-in">
          Esempi di animazioni e micro-interazioni professionali
        </p>
      </div>

      {/* Pulsanti Animati */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Pulsanti con Micro-interazioni</h2>
        <div className="flex gap-4 flex-wrap">
          <button className="btn btn-primary animate-bounce-in">
            <FiPlus className="h-4 w-4" />
            Pulsante Primario
          </button>
          <button className="btn btn-outline animate-fade-in">
            <FiEdit className="h-4 w-4" />
            Pulsante Outline
          </button>
          <LoadingButton 
            loading={loading} 
            onClick={handleLoading}
            className="animate-scale-in"
          >
            <FiCheck className="h-4 w-4" />
            Caricamento
          </LoadingButton>
        </div>
      </section>

      {/* Card Animate */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Card con Hover Effects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <AnimatedCard 
              key={item}
              hoverEffect={true}
              className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900"
              onClick={() => console.log(`Card ${item} clicked`)}
            >
              <div className="space-y-2">
                <h3 className="font-semibold">Card {item}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Hover per vedere l'effetto di animazione
                </p>
                <div className="flex items-center gap-2">
                  <NotificationBadge count={item * 2} />
                  <span className="text-xs text-gray-500">Notifiche</span>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* Loading States */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Stati di Caricamento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium">Spinner</h3>
            <div className="flex gap-4">
              <LoadingSpinner size="sm" color="primary" />
              <LoadingSpinner size="md" color="success" text="Caricamento..." />
              <LoadingSpinner size="lg" color="danger" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-medium">Skeleton Loading</h3>
            <div className="space-y-2">
              <Skeleton variant="title" />
              <Skeleton variant="text" lines={3} />
              <Skeleton variant="button" width="w-24" />
            </div>
          </div>
        </div>
      </section>

      {/* Progress Bar */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Barra di Progresso</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Progresso: {progress}%</h3>
            <ProgressBar 
              value={progress} 
              max={100} 
              color="primary" 
              animated={true}
              showLabel={true}
            />
          </div>
          <button 
            className="btn btn-outline"
            onClick={handleProgress}
          >
            Avvia Progresso
          </button>
        </div>
      </section>

      {/* Stagger Animation */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Animazioni Stagger</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div
              key={item}
              className="stagger-item p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-center"
              style={{ animationDelay: `${item * 50}ms` }}
            >
              <div className="text-2xl mb-2">📦</div>
              <div className="text-sm font-medium">Item {item}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Notification Badges */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Badge di Notifica</h2>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <FiPlus className="h-6 w-6" />
            <NotificationBadge count={notifications} />
          </div>
          <div className="relative">
            <FiEdit className="h-6 w-6" />
            <NotificationBadge count={2} color="success" />
          </div>
          <div className="relative">
            <FiTrash className="h-6 w-6" />
            <NotificationBadge count={99} color="danger" />
          </div>
          <button 
            className="btn btn-sm btn-outline"
            onClick={() => setNotifications(prev => prev + 1)}
          >
            Aggiungi Notifica
          </button>
        </div>
      </section>
    </div>
  );
};

export default AnimationsExample;
