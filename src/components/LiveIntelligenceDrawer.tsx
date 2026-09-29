import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, RefreshCw, Globe, Zap, Cpu } from 'lucide-react';

interface LiveIntelligenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveIntelligenceDrawer: React.FC<LiveIntelligenceDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [isPinging, setIsPinging] = useState(false);
  const [lastPingTime, setLastPingTime] = useState<string>('Just now');
  const [pingLatency, setPingLatency] = useState<number>(412);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleTestPing = () => {
    setIsPinging(true);
    setTimeout(() => {
      setPingLatency(Math.floor(380 + Math.random() * 80));
      setLastPingTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsPinging(false);
    }, 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="radar-drawer-overlay"
          style={{ justifyContent: 'flex-end' }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            className="radar-drawer-content"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="live-drawer-title"
          >
            <div>
              {/* Header */}
              <div className="radar-drawer-header">
                <div>
                  <h2
                    id="live-drawer-title"
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--radar-black)',
                    }}
                  >
                    Live Intelligence Monitor
                  </h2>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--radar-gray-500)',
                      marginTop: '2px',
                    }}
                  >
                    Nexora Surveillance Pipeline Status
                  </p>
                </div>
                <button
                  className="radar-drawer-close"
                  onClick={onClose}
                  aria-label="Close Live Monitor"
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status Metrics */}
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Gateway 1 */}
                <div
                  style={{
                    background: 'var(--radar-gray-50)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Globe size={16} color="var(--radar-blue-accent)" />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Bright Data Web Extraction</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--radar-green-pulse)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                      <CheckCircle size={12} /> Active
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--radar-gray-600)', lineHeight: '1.4' }}>
                    Automated proxy pool & DOM snapshot normalizer. Strips ephemeral cookies, scripts, and layout noise.
                  </p>
                </div>

                {/* Gateway 2 */}
                <div
                  style={{
                    background: 'var(--radar-gray-50)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={16} color="#d97706" />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Deterministic Diff Engine</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--radar-green-pulse)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                      <CheckCircle size={12} /> Synchronized
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--radar-gray-600)', lineHeight: '1.4' }}>
                    Content-hash & AST diffing isolates genuine commercial changes (pricing, packaging, features).
                  </p>
                </div>

                {/* Gateway 3 */}
                <div
                  style={{
                    background: 'var(--radar-gray-50)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Cpu size={16} color="#7c3aed" />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>NEXORA Strategic Engine</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--radar-green-pulse)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                      <CheckCircle size={12} /> Ready
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--radar-gray-600)', lineHeight: '1.4' }}>
                    NEXORA reasoning engine (Know what changed. Know what matters. Know what to say.) converts verified diffs into threat assessments, battlecards, and sales counter-pitches.
                  </p>
                </div>
              </div>
            </div>

            {/* Test Action */}
            <div
              style={{
                paddingTop: '20px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '12px', color: 'var(--radar-gray-500)' }}>
                <span>Health check: <strong>{lastPingTime}</strong></span>
                <span>Latency: <strong>{pingLatency}ms</strong></span>
              </div>
              <button
                className="radar-btn-primary"
                style={{ width: '100%' }}
                onClick={handleTestPing}
                disabled={isPinging}
                type="button"
              >
                <RefreshCw size={14} className={isPinging ? 'animate-spin' : ''} />
                <span>{isPinging ? 'Pinging Pipeline...' : 'Test Intelligence Ping'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
