import { ref, reactive } from 'vue';

// Central modal configuration
const isVisible = ref(false);
const config = reactive({
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  type: 'primary', // primary, danger, warning, success
  onConfirm: null,
  onCancel: null,
  width: '340px',
  hideCancel: false
});

// Open modal with custom options
export function openConfirmDialog(options = {}) {
  // Override default values with provided options
  Object.assign(config, {
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'primary',
    onConfirm: null,
    onCancel: null,
    width: '340px',
    hideCancel: false
  }, options);
  
  isVisible.value = true;
  
  // Optional: Return promise for await syntax
  return new Promise((resolve) => {
    config.resolvePromise = resolve;
  });
}

// Confirmations for common actions
export function confirmDelete({
  title = 'Confirm Deletion',
  message = 'Do you really want to delete this item? This action cannot be undone.',
  confirmText = 'Delete',
  onConfirm,
  onCancel,
  itemName = ''
} = {}) {
  return openConfirmDialog({
    title,
    message: itemName ? `Do you really want to delete "${itemName}"? This action cannot be undone.` : message,
    confirmText,
    type: 'danger',
    onConfirm,
    onCancel
  });
}

export function confirmDiscard({
  title = 'Discard Changes',
  message = 'Do you really want to discard your changes?',
  confirmText = 'Discard',
  onConfirm,
  onCancel
} = {}) {
  return openConfirmDialog({
    title,
    message,
    confirmText,
    type: 'warning',
    onConfirm,
    onCancel
  });
}

// Perform confirmation
export function confirmAction() {
  if (config.onConfirm) {
    config.onConfirm();
  }
  
  if (config.resolvePromise) {
    config.resolvePromise(true);
  }
  
  isVisible.value = false;
}

// Cancel
export function cancelAction() {
  if (config.onCancel) {
    config.onCancel();
  }
  
  if (config.resolvePromise) {
    config.resolvePromise(false);
  }
  
  isVisible.value = false;
}

// Expose Modal state and config
export function useAppConfirm() {
  return {
    isVisible,
    config,
    openConfirmDialog,
    confirmDelete,
    confirmDiscard,
    confirmAction,
    cancelAction
  };
}

export default useAppConfirm; 