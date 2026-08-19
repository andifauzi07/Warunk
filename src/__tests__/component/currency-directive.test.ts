import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import { vCurrency } from '../../directives/currency';

const TestInput = defineComponent({
  template: `<input v-currency v-model="val" />`,
  setup() {
    const val = ref(0);
    return { val };
  },
});

describe('v-currency directive', () => {
  it('formats initial value with thousand separators', async () => {
    const wrapper = mount(TestInput, {
      global: { directives: { currency: vCurrency } },
    });
    wrapper.vm.val = 170000;
    await wrapper.vm.$nextTick();
    const input = wrapper.find('input');
    expect(input.element.value).toBe('170.000');
  });

  it('formats input on user typing', async () => {
    const wrapper = mount(TestInput, {
      global: { directives: { currency: vCurrency } },
    });
    const input = wrapper.find('input');
    input.element.value = '170000';
    await input.trigger('input');
    expect(input.element.value).toBe('170.000');
  });

  it('handles paste with prefix', async () => {
    const wrapper = mount(TestInput, {
      global: { directives: { currency: vCurrency } },
    });
    const input = wrapper.find('input');
    const pasteEvent = new Event('paste', { bubbles: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { getData: () => 'Rp 170.000' },
    });
    input.element.dispatchEvent(pasteEvent);
    expect(input.element.value).toBe('170.000');
  });

  it('clears zero on focus', async () => {
    const wrapper = mount(TestInput, {
      global: { directives: { currency: vCurrency } },
    });
    const input = wrapper.find('input');
    input.element.value = '0';
    await input.trigger('focus');
    expect(input.element.value).toBe('');
  });
});
