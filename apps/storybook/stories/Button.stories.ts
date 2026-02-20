import type { Meta, StoryObj } from '@storybook/vue3-vite'

import { UButton } from '@unicorn/ui/components'

const meta = {
  title: 'Components/Button',
  component: UButton,
  argTypes: {
    variant: { control: 'select' },
    size: { control: 'select' },
  },
} satisfies Meta<typeof UButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    default: 'Button',
  },
}

export const Primary: Story = {
  args: {
    variant: 'primary',
    default: 'Primary',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    default: 'Secondary',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    default: 'Outline',
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
    default: 'Small',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    default: 'Large',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    default: 'Disabled',
  },
}
