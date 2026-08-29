import { useCallback, useEffect } from 'react'

const focusableControlSelector = 'a[href], button, input, select, textarea, [tabindex]'

function getEnabledPopoverControls(popover) {
  return [...popover.querySelectorAll(focusableControlSelector)].filter(
    (element) => !element.hasAttribute('disabled') && element.tabIndex >= 0
  )
}

export function useSettingsPopoverFocus({
  containerRef,
  isOpen,
  popoverRef,
  setIsOpen,
  triggerRef
}) {
  const close = useCallback(
    (restoreFocus) => {
      setIsOpen(false)
      if (restoreFocus) triggerRef.current?.focus()
    },
    [setIsOpen, triggerRef]
  )
  const handleTriggerClick = useCallback(() => {
    setIsOpen((open) => !open)
  }, [setIsOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close(true)
        return
      }
      if (event.key !== 'Tab') return

      const trigger = triggerRef.current
      const popover = popoverRef.current
      if (!trigger || !popover) return

      const scope = [trigger, ...getEnabledPopoverControls(popover)]
      const activeIndex = scope.indexOf(document.activeElement)
      const direction = event.shiftKey ? -1 : 1
      const nextIndex =
        activeIndex === -1
          ? direction === 1
            ? 0
            : scope.length - 1
          : (activeIndex + direction + scope.length) % scope.length

      event.preventDefault()
      scope[nextIndex].focus()
    }
    const handlePointerDown = (event) => {
      if (containerRef.current?.contains(event.target)) return
      close(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('pointerdown', handlePointerDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [close, containerRef, isOpen, popoverRef, triggerRef])

  return { handleTriggerClick }
}
