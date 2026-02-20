import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'

import UButton from './UButton.vue'

describe('UButton', () => {
  it('renders with default props', () => {
    const wrapper = mount(UButton)
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.classes()).toContain('u-button')
    expect(button.classes()).toContain('u-button--primary')
    expect(button.classes()).toContain('u-button--md')
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('renders slot content', () => {
    const wrapper = mount(UButton, {
      slots: {
        default: 'Click me',
      },
    })
    expect(wrapper.text()).toBe('Click me')
  })

  it('emits click event', async () => {
    const wrapper = mount(UButton)
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    expect(wrapper.emitted('click')![0]![0]).toBeInstanceOf(MouseEvent)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(UButton, {
      props: {
        disabled: true,
      },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
