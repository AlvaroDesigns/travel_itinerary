'use client';

import styles from './SettingsSwitch.module.css';

interface SettingsSwitchProps {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}

export function SettingsSwitch({ checked, disabled = false, label, onCheckedChange }: SettingsSwitchProps) {
  const toggle = () => {
    if (!disabled) onCheckedChange(!checked);
  };

  return (
    <div
      role="switch"
      tabIndex={disabled ? -1 : 0}
      aria-checked={checked}
      aria-disabled={disabled}
      className={styles.root}
      data-checked={checked}
      data-disabled={disabled}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      }}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
    </div>
  );
}
