import { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageTourStore } from '@/stores/pageTourStore';

const PADDING = 8;
const TOOLTIP_GAP = 12;
const EDGE_MARGIN = 16;

function getRect(target) {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PADDING,
    left: r.left - PADDING,
    width: r.width + PADDING * 2,
    height: r.height + PADDING * 2,
    bottom: r.bottom + PADDING,
    right: r.right + PADDING,
  };
}

function getTooltipStyle(rect, tooltipEl) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Fallback: center on screen
  if (!rect) {
    return {
      top: '50%', left: EDGE_MARGIN, right: EDGE_MARGIN,
      transform: 'translateY(-50%)', placement: 'center',
      arrowLeft: '50%',
    };
  }

  const tooltipHeight = tooltipEl?.offsetHeight || 220;
  const spaceBelow = vh - rect.bottom - TOOLTIP_GAP;
  const spaceAbove = rect.top - TOOLTIP_GAP;

  const placement = spaceBelow >= tooltipHeight + EDGE_MARGIN
    ? 'below'
    : spaceAbove >= tooltipHeight + EDGE_MARGIN
      ? 'above'
      : spaceBelow >= spaceAbove ? 'below' : 'above';

  // Vertical position
  let top;
  if (placement === 'below') {
    top = rect.bottom + TOOLTIP_GAP;
    // Clamp so tooltip doesn't go below viewport
    if (top + tooltipHeight > vh - EDGE_MARGIN) {
      top = vh - EDGE_MARGIN - tooltipHeight;
    }
  } else {
    top = rect.top - TOOLTIP_GAP - tooltipHeight;
    // Clamp so tooltip doesn't go above viewport
    if (top < EDGE_MARGIN) {
      top = EDGE_MARGIN;
    }
  }

  // Arrow points to center of highlighted element
  const targetCenterX = rect.left + rect.width / 2;
  // Arrow position as px from left edge of tooltip (clamped to tooltip bounds)
  const tooltipLeft = EDGE_MARGIN;
  const tooltipWidth = vw - EDGE_MARGIN * 2;
  const arrowLeft = Math.min(Math.max(targetCenterX - tooltipLeft, 24), tooltipWidth - 24);

  return {
    top: `${top}px`,
    left: EDGE_MARGIN,
    right: EDGE_MARGIN,
    transform: 'none',
    placement,
    arrowLeft: `${arrowLeft}px`,
  };
}

export default function PageTour({ pageKey, steps }) {
  const { hasSeenTour, markTourSeen } = usePageTourStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [rect, setRect] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [tooltipRef, setTooltipRef] = useState(null);

  const step = steps?.[currentStep];

  const measure = useCallback(() => {
    if (!step?.target) {
      setRect(null);
      setTooltipStyle(getTooltipStyle(null, tooltipRef));
      return;
    }
    const r = getRect(step.target);
    setRect(r);
    setTooltipStyle(getTooltipStyle(r, tooltipRef));
  }, [step?.target, tooltipRef]);

  useEffect(() => {
    if (!hasSeenTour(pageKey)) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [pageKey, hasSeenTour]);

  // Measure on step change and on scroll/resize
  useLayoutEffect(() => {
    if (!visible) return;
    measure();

    // Scroll the target into view
    if (step?.target) {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        if (r.top < 80 || r.bottom > vh - 80) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(measure, 350);
        }
      }
    }
  }, [visible, currentStep, measure, step?.target]);

  // Re-measure once tooltip renders (so we know its height)
  useLayoutEffect(() => {
    if (tooltipRef && visible) measure();
  }, [tooltipRef, visible, measure]);

  useEffect(() => {
    if (!visible) return;
    const handleUpdate = () => requestAnimationFrame(measure);
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [visible, measure]);

  if (!visible || !steps?.length) return null;

  const isLast = currentStep === steps.length - 1;

  const dismiss = () => {
    setVisible(false);
    markTourSeen(pageKey);
  };

  const next = () => {
    if (isLast) dismiss();
    else setCurrentStep((s) => s + 1);
  };

  const prev = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  return (
    <div className="fixed inset-0 z-[60]" style={{ pointerEvents: 'auto' }}>
      {/* SVG overlay with spotlight cutout */}
      <motion.svg
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 w-full h-full"
        onClick={next}
        style={{ pointerEvents: 'auto' }}
      >
        <defs>
          <mask id="tour-spotlight">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#tour-spotlight)"
        />
      </motion.svg>

      {/* Highlighted element border glow */}
      {rect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute rounded-2xl border-2 border-primary-400 pointer-events-none"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: '0 0 0 4px rgba(0, 122, 255, 0.15)',
          }}
        />
      )}

      {/* Tooltip bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          ref={setTooltipRef}
          initial={{ opacity: 0, y: tooltipStyle.placement === 'above' ? 10 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: tooltipStyle.placement === 'above' ? 10 : -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute z-10"
          style={{
            top: tooltipStyle.top,
            left: tooltipStyle.left,
            right: tooltipStyle.right,
            transform: tooltipStyle.transform,
            pointerEvents: 'auto',
          }}
          onClick={next}
        >
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 sm:p-5 shadow-2xl border border-gray-200 dark:border-gray-700/50 relative">
            {/* Arrow pointing to target */}
            {rect && (
              <div
                className={`absolute w-3 h-3 rotate-45 bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-gray-700/50 ${
                  tooltipStyle.placement === 'below'
                    ? '-top-1.5 border-l border-t'
                    : '-bottom-1.5 border-r border-b'
                }`}
                style={{ left: tooltipStyle.arrowLeft, transform: 'translateX(-50%) rotate(45deg)' }}
              />
            )}

            {/* Skip button */}
            <button
              onClick={(e) => { e.stopPropagation(); dismiss(); }}
              className="absolute top-3 right-3 text-[11px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Skip tour
            </button>

            {/* Step counter */}
            <p className="text-[11px] font-medium text-primary-500 mb-2">
              {currentStep + 1} of {steps.length}
            </p>

            {/* Content */}
            <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-1 pr-14">
              {step.title}
            </h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              {step.description}
            </p>

            {/* Optional custom content */}
            {step.content && <div className="mb-4">{step.content}</div>}

            {/* Progress dots + nav */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1 flex-shrink-0">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? 'w-5 bg-primary-500'
                        : i < currentStep
                          ? 'w-1.5 bg-primary-300'
                          : 'w-1.5 bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {currentStep > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); prev(); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={next}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors"
                >
                  {isLast ? 'Got it' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
