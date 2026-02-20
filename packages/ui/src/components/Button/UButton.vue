<script setup lang="ts">
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

function handleClick(event: MouseEvent) {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :class="['u-button', `u-button--${variant}`, `u-button--${size}`]"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<style scoped>
.u-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s;
  border: 1px solid transparent;
}

.u-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sizes */
.u-button--sm {
  padding: 4px 12px;
  font-size: 14px;
}

.u-button--md {
  padding: 8px 16px;
  font-size: 16px;
}

.u-button--lg {
  padding: 12px 24px;
  font-size: 18px;
}

/* Variants */
.u-button--primary {
  background-color: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.u-button--primary:hover:not(:disabled) {
  background-color: #2563eb;
  border-color: #2563eb;
}

.u-button--secondary {
  background-color: #6b7280;
  color: #fff;
  border-color: #6b7280;
}

.u-button--secondary:hover:not(:disabled) {
  background-color: #4b5563;
  border-color: #4b5563;
}

.u-button--outline {
  background-color: transparent;
  color: #3b82f6;
  border-color: #3b82f6;
}

.u-button--outline:hover:not(:disabled) {
  background-color: #eff6ff;
}
</style>
