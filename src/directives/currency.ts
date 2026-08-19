import type { Directive, DirectiveBinding } from 'vue';
import { formatAngka, parseCurrency } from '@/lib/format';

function countDigits(value: string): number {
  let count = 0;
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch !== undefined && ch >= '0' && ch <= '9') count++;
  }
  return count;
}

function positionCursor(el: HTMLInputElement, digitsBefore: number): void {
  let count = 0;
  for (let i = 0; i < el.value.length; i++) {
    const ch = el.value[i];
    if (ch !== undefined && ch >= '0' && ch <= '9') count++;
    if (count >= digitsBefore) {
      el.setSelectionRange(i + 1, i + 1);
      return;
    }
  }
  el.setSelectionRange(el.value.length, el.value.length);
}

function updateDisplay(el: HTMLInputElement, value: number): void {
  el.value = formatAngka(value);
}

function getUpdateFn(binding: DirectiveBinding): ((value: number) => void) | null {
  const ctx = binding.instance as Record<string, unknown> | null;
  if (!ctx) return null;
  const arg = binding.arg;
  if (arg && typeof ctx[`onUpdate:${arg}`] === 'function') {
    return ctx[`onUpdate:${arg}`] as (value: number) => void;
  }
  if (typeof ctx['onUpdate:modelValue'] === 'function') {
    return ctx['onUpdate:modelValue'] as (value: number) => void;
  }
  return null;
}

export const vCurrency: Directive<HTMLInputElement, unknown> = {
  mounted(el, binding) {
    const raw = el.value;
    const num = parseCurrency(raw);
    updateDisplay(el, num);

    el.addEventListener('input', () => {
      const cursorPos = el.selectionStart ?? el.value.length;
      const digitsBefore = countDigits(el.value.slice(0, cursorPos));
      const num = parseCurrency(el.value);
      updateDisplay(el, num);
      positionCursor(el, digitsBefore);
      const updateFn = getUpdateFn(binding);
      if (updateFn) updateFn(num);
    });

    el.addEventListener('focus', () => {
      if (el.value === '0') {
        el.value = '';
      }
    });

    el.addEventListener('blur', () => {
      const num = parseCurrency(el.value);
      updateDisplay(el, num);
      const updateFn = getUpdateFn(binding);
      if (updateFn) updateFn(num);
    });

    el.addEventListener('paste', (e: Event) => {
      e.preventDefault();
      const text = (e as ClipboardEvent).clipboardData?.getData('text') ?? '';
      const num = parseCurrency(text);
      updateDisplay(el, num);
      const updateFn = getUpdateFn(binding);
      if (updateFn) updateFn(num);
    });

    el.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        const cursorPos = el.selectionStart ?? el.value.length;
        const charBefore = el.value[cursorPos - 1];
        if (charBefore === '.') {
          e.preventDefault();
          el.setSelectionRange(cursorPos - 1, cursorPos - 1);
        }
      }
    });
  },

  updated(el, _binding) {
    const num = parseCurrency(el.value);
    updateDisplay(el, num);
  },
};
