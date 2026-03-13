import React from 'react';

export const SimpsonsLogo: React.FC = () => {
  return (
    <div className="simpsons-logo-container" aria-label="The Simpsons">
      <img
        src="/simpsons-logo.png"
        alt="The Simpsons"
        className="simpsons-logo"
        onError={(e) => {
          // Fallback: show text if image fails
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent && !parent.querySelector('.logo-fallback')) {
            const fallback = document.createElement('span');
            fallback.className = 'logo-fallback';
            fallback.textContent = 'THE SIMPSONS';
            fallback.style.cssText = 'font-weight: 900; font-size: 1.5rem; color: #1a1a1a;';
            parent.appendChild(fallback);
          }
        }}
      />
    </div>
  );
};

