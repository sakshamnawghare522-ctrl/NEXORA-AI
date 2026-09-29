import React from 'react';
import { NexoraLogo } from './NexoraLogo.tsx';

export const Footer: React.FC = () => {
  return (
    <footer className="radar-footer" role="contentinfo">
      <div className="radar-footer-inner">
        {/* Left: Brand & Tagline */}
        <div className="radar-footer-left">
          <NexoraLogo size={20} />
          <p className="radar-footer-tagline">
            Know what your competitors changed. Know why it matters. Know what to say next.
          </p>
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--radar-gray-400)' }}>
            &copy; {new Date().getFullYear()} Nexora Inc. All rights reserved.
          </div>
        </div>

        {/* Right: Architectural Pipeline Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
          <div className="radar-footer-status">
            <span className="radar-live-status-dot" aria-hidden="true" />
            <span>Bright Data + NEXORA Integration Active</span>
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--radar-gray-600)' }}>
            <a href="#hero" className="hover:underline">Back to top</a>
            <span>·</span>
            <a href="#see-how-it-works" className="hover:underline">Pipeline Demo</a>
            <span>·</span>
            <span style={{ color: 'var(--radar-gray-400)' }}>Phase 1 Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
