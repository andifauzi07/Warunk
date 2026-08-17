import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Stepper from '@/components/Stepper.vue'

describe('Stepper', () => {
  it('menampilkan nilai awal', () => {
    const wrapper = mount(Stepper, { props: { modelValue: 3 } })
    expect(wrapper.text()).toContain('3')
  })

  it('tombol + menambah dan meng-emit update:modelValue', async () => {
    const wrapper = mount(Stepper, { props: { modelValue: 0 } })
    await wrapper.find('button[aria-label="Tambah"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[1]])
  })

  it('tombol − mengurangi dan meng-emit update:modelValue', async () => {
    const wrapper = mount(Stepper, { props: { modelValue: 5 } })
    await wrapper.find('button[aria-label="Kurangi"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[4]])
  })

  it('tidak mengurangi di bawah min (default 0)', async () => {
    const wrapper = mount(Stepper, { props: { modelValue: 0 } })
    const minus = wrapper.find('button[aria-label="Kurangi"]')
    expect(minus.attributes('disabled')).toBeDefined()
    await minus.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('tidak menambah melebihi max', async () => {
    const wrapper = mount(Stepper, { props: { modelValue: 7, max: 7 } })
    const plus = wrapper.find('button[aria-label="Tambah"]')
    expect(plus.attributes('disabled')).toBeDefined()
    await plus.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('min non-default membatasi penurunan', async () => {
    const wrapper = mount(Stepper, { props: { modelValue: 1, min: 1 } })
    expect(wrapper.find('button[aria-label="Kurangi"]').attributes('disabled')).toBeDefined()
  })
})
