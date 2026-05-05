@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
@import "tailwindcss";

@theme {
  --font-headline: "Plus Jakarta Sans", sans-serif;
  --font-body: "Be Vietnam Pro", sans-serif;

  --color-primary: #6d23f9;
  --color-primary-fixed: #cab6ff;
  --color-primary-container: #cab6ff;
  --color-on-primary: #fcf5ff;
  
  --color-secondary: #0059cb;
  --color-secondary-container: #d9e2ff;
  
  --color-tertiary: #006e35;
  --color-tertiary-container: #3fff8b;
  
  --color-surface: #f7f9fc;
  --color-surface-bright: #f7f9fc;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #f1f4f7;
  --color-surface-container: #eaeef3;
  --color-surface-container-high: #e3e9ee;
  --color-surface-container-highest: #dde3e9;
  
  --color-on-surface: #2d3338;
  --color-on-surface-variant: #596065;
  --color-on-background: #2d3338;

  --radius-lg: 2rem;
  --radius-xl: 3rem;
}

@layer base {
  body {
    @apply font-body bg-surface text-on-background antialiased;
  }
  h1, h2, h3, h4, h5, h6 {
    @apply font-headline;
  }
}

.signature-gradient {
  background: linear-gradient(135deg, #6d23f9 0%, #cab6ff 100%);
}

.glass-panel {
  backdrop-filter: blur(12px);
  background-color: rgba(255, 255, 255, 0.7);
}

.focus-glow {
  filter: drop-shadow(0 0 20px rgba(217, 226, 255, 0.8));
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
