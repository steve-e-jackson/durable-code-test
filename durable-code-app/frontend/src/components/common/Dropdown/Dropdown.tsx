/**
 * Purpose: Reusable dropdown menu component
 * Scope: Common UI component for dropdown menus
 * Overview: Provides a flexible dropdown menu with keyboard navigation and mobile support
 * Dependencies: React, CSS modules
 * Exports: Dropdown component
 * Props/Interfaces: DropdownProps - trigger, items, align, className, onItemSelect
 * Implementation: Click/hover triggered dropdown with accessibility features
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactElement } from 'react';
import type { DropdownProps } from './Dropdown.types';
import styles from './Dropdown.module.css';

export function Dropdown({
  trigger,
  items,
  align = 'left',
  className = '',
  onItemSelect,
}: DropdownProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    setFocusedIndex(-1);
  }, []);

  const handleItemClick = useCallback(
    (item: DropdownProps['items'][0]) => {
      if (item.onClick) {
        item.onClick();
      }
      if (onItemSelect) {
        onItemSelect(item);
      }
      setIsOpen(false);
      setFocusedIndex(-1);
    },
    [onItemSelect],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!isOpen && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
        return;
      }

      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            handleItemClick(items[focusedIndex]);
          }
          break;
        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setFocusedIndex(items.length - 1);
          break;
        default:
          break;
      }
    },
    [isOpen, items, focusedIndex, handleItemClick],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && menuRef.current) {
      const items = menuRef.current.querySelectorAll('[role="menuitem"]');
      const item = items[focusedIndex] as HTMLElement;
      if (item) {
        item.focus();
      }
    }
  }, [focusedIndex, isOpen]);

  const alignClass =
    align === 'right'
      ? styles.alignRight
      : align === 'center'
        ? styles.alignCenter
        : '';

  return (
    <div
      ref={containerRef}
      className={`${styles.dropdownContainer} ${className}`}
      onKeyDown={handleKeyDown}
    >
      <div
        className={styles.trigger}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      <div
        ref={menuRef}
        className={`${styles.menu} ${alignClass} ${isOpen ? styles.menuOpen : ''}`}
        role="menu"
        aria-hidden={!isOpen}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className={styles.item}
            onClick={() => handleItemClick(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleItemClick(item);
              }
            }}
            role="menuitem"
            tabIndex={isOpen ? 0 : -1}
            data-focused={focusedIndex === index}
          >
            {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
            <div className={styles.itemContent}>
              <div className={styles.itemLabel}>{item.label}</div>
              {item.description && (
                <div className={styles.itemDescription}>{item.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
