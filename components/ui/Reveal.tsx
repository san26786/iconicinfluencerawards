'use client';

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

// Reveal-on-scroll using ONE module-level IntersectionObserver shared by every
// Reveal on the page. Each <Reveal> just registers/unregisters its element with
// the shared observer + a per-element callback — far lighter than spawning a
// fresh IntersectionObserver per section (which was ~20 observers on the
// homepage and hurt scroll start on mobile).

type Cb = () => void;
let sharedIO: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, Cb>();

function ensureObserver(): IntersectionObserver | null {
  if (sharedIO) return sharedIO;
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return null;
  }
  sharedIO = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const cb = callbacks.get(entry.target);
          if (cb) {
            cb();
            sharedIO!.unobserve(entry.target);
            callbacks.delete(entry.target);
          }
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
  );
  return sharedIO;
}

export function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = ensureObserver();
    if (!io) {
      setInView(true);
      return;
    }
    callbacks.set(el, () => setInView(true));
    io.observe(el);
    return () => {
      io.unobserve(el);
      callbacks.delete(el);
    };
  }, [inView]);

  return { ref, inView };
}

export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'reveal-in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}

// Staggered container for grids/lists — children should be <RevealItem>.
export function RevealGroup({
  children,
  className = '',
  stagger = 0.08,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`${inView ? 'reveal-in' : ''} ${className}`}>
      {Children.map(children, (child, i) =>
        isValidElement(child)
          ? cloneElement(child as ReactElement<{ _delay?: number }>, { _delay: i * stagger })
          : child,
      )}
    </div>
  );
}

export function RevealItem({
  children,
  className = '',
  _delay = 0,
}: {
  children: ReactNode;
  className?: string;
  _delay?: number;
}) {
  return (
    <div
      className={`reveal-stagger ${className}`}
      style={_delay ? { transitionDelay: `${_delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
