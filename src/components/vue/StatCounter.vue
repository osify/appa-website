<script setup lang="ts">
/**
 * A statistic that counts up when it scrolls into view.
 *
 * These numbers are claims about the business, so CORRECTNESS BEATS THE
 * ANIMATION every time — the figure must always end on the real value. Three
 * guards exist for that reason, and none of them is optional:
 *
 *   1. `prefers-reduced-motion` → render the final value immediately.
 *   2. A hidden tab → skip the animation entirely. requestAnimationFrame is
 *      paused in background tabs, so a naive loop freezes mid-count and leaves
 *      a WRONG number on screen — "2+ years of experience" instead of "10+".
 *   3. A safety timer that snaps to the target no matter what else happens.
 *
 * The server already renders the final value, so with JavaScript disabled the
 * correct figure is simply there from the start.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    value: number;
    prefix?: string;
    suffix?: string;
    animate?: boolean;
    /** Pre-formatted final value (Khmer numerals, thousands separators…). */
    display: string;
    /** Digits 0–9 in the reader's numeral system, for the in-between frames. */
    digits?: string[];
  }>(),
  { prefix: '', suffix: '', animate: true, digits: () => [] },
);

const DURATION = 1400;

const text = ref(props.display);
const root = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;
let safetyTimer: number | undefined;
let frame: number | undefined;
let done = false;

/** Render an in-between frame in the same numeral system as the final value. */
function format(n: number): string {
  const raw = String(n);
  if (props.digits.length !== 10) return raw;
  return raw.replace(/[0-9]/g, (d) => props.digits[Number(d)]);
}

function finish() {
  done = true;
  text.value = props.display;
  if (safetyTimer) window.clearTimeout(safetyTimer);
  if (frame) cancelAnimationFrame(frame);
}

function run() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!props.animate || reduceMotion || document.hidden || !Number.isFinite(props.value)) {
    finish();
    return;
  }

  const start = performance.now();
  safetyTimer = window.setTimeout(finish, DURATION + 500);

  const tick = (now: number) => {
    if (done) return;
    const progress = Math.min((now - start) / DURATION, 1);
    if (progress < 1) {
      // Ease-out cubic, so it decelerates onto the final figure.
      text.value = format(Math.round(props.value * (1 - Math.pow(1 - progress, 3))));
      frame = requestAnimationFrame(tick);
    } else {
      finish();
    }
  };

  frame = requestAnimationFrame(tick);
}

onMounted(() => {
  if (!('IntersectionObserver' in window) || !root.value) {
    finish();
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      observer?.disconnect();
      text.value = format(0);
      run();
    },
    { threshold: 0.5 },
  );

  observer.observe(root.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  if (safetyTimer) window.clearTimeout(safetyTimer);
  if (frame) cancelAnimationFrame(frame);
});
</script>

<template>
  <span ref="root">{{ prefix }}{{ text }}{{ suffix }}</span>
</template>
