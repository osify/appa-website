<script setup lang="ts">
/**
 * The mobile navigation drawer.
 *
 * A Vue island because it is genuinely stateful — open/closed, Escape to close,
 * a focus trap while open, and scroll locking behind it. The desktop navigation
 * is plain server-rendered HTML and ships no JavaScript at all.
 *
 * Everything in this drawer is duplicated in the static footer, so a visitor
 * without JavaScript can still reach every page.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

interface LanguageOption {
  code: string;
  label: string;
  href: string;
  current: boolean;
}

const props = defineProps<{
  items: NavItem[];
  languages: LanguageOption[];
  languageLabel: string;
  ctaLabel: string;
  ctaHref: string;
  openLabel: string;
  closeLabel: string;
  menuLabel: string;
  currentPath: string;
}>();

const open = ref(false);
const panel = ref<HTMLElement | null>(null);
const toggleButton = ref<HTMLButtonElement | null>(null);

/** Flatten parents and their children into one list for the drawer. */
const flatItems = computed(() =>
  props.items.flatMap((item) => [item, ...(item.children ?? []).map((c) => ({ ...c, child: true }))]),
);

function isCurrent(href: string) {
  return props.currentPath === href || props.currentPath === `${href}/`;
}

function close() {
  open.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    close();
    toggleButton.value?.focus();
    return;
  }

  // Keep Tab inside the drawer while it covers the page.
  if (event.key !== 'Tab' || !open.value || !panel.value) return;

  const focusable = panel.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input, select, textarea',
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(open, async (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : '';
  if (isOpen) {
    await nextTick();
    panel.value?.querySelector<HTMLElement>('a, button')?.focus();
  }
});

onMounted(() => document.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <div class="lg:hidden">
    <button
      ref="toggleButton"
      type="button"
      class="nav-link p-2 -mr-2"
      :aria-label="open ? closeLabel : openLabel"
      :aria-expanded="open"
      aria-controls="mobile-menu-panel"
      @click="open = !open"
    >
      <svg
        v-if="!open"
        class="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        aria-hidden="true"
      >
        <path stroke-linecap="round" d="M3 6h18M3 12h18M3 18h18" />
      </svg>
      <svg
        v-else
        class="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        aria-hidden="true"
      >
        <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 top-16 z-40 bg-navy-900/60 backdrop-blur-xs"
        @click="close"
      />
    </Transition>

    <Transition
      enter-active-class="transition duration-250 ease-out"
      enter-from-class="opacity-0 -translate-y-3"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 -translate-y-3"
    >
      <nav
        v-if="open"
        id="mobile-menu-panel"
        ref="panel"
        :aria-label="menuLabel"
        class="fixed inset-x-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/10 bg-navy-900 px-6 py-6"
      >
        <ul class="flex flex-col">
          <li v-for="item in flatItems" :key="item.href">
            <a
              :href="item.href"
              :aria-current="isCurrent(item.href) ? 'page' : undefined"
              class="block border-b border-white/5 py-3 transition-colors hover:text-gold-400"
              :class="[
                (item as { child?: boolean }).child ? 'pl-4 text-sm text-white/60' : 'text-white/85',
                isCurrent(item.href) ? 'text-gold-400' : '',
              ]"
              @click="close"
            >
              {{ item.label }}
            </a>
          </li>
        </ul>

        <a
          :href="ctaHref"
          class="mt-6 block rounded-full bg-gold-500 px-5 py-3 text-center font-semibold text-navy-900 transition hover:bg-gold-400"
          @click="close"
        >
          {{ ctaLabel }}
        </a>

        <div
          v-if="languages.length > 1"
          class="mt-5 flex items-center gap-2"
          role="group"
          :aria-label="languageLabel"
        >
          <a
            v-for="language in languages"
            :key="language.code"
            :href="language.href"
            :lang="language.code"
            :hreflang="language.code"
            :aria-current="language.current ? 'true' : undefined"
            class="lang-btn flex-1 rounded-full border border-white/20 px-4 py-2.5 text-center text-sm font-semibold text-white"
          >
            {{ language.label }}
          </a>
        </div>
      </nav>
    </Transition>
  </div>
</template>
