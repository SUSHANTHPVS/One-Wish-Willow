import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordInputProps = Omit<ComponentProps<'input'>, 'type'> & {
  visibilityLabel?: string;
};

export default function PasswordInput({ visibilityLabel = 'password', ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="password-field">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        className="password-toggle"
        type="button"
        aria-label={`${visible ? 'Hide' : 'Show'} ${visibilityLabel}`}
        aria-pressed={visible}
        title={`${visible ? 'Hide' : 'Show'} ${visibilityLabel}`}
        disabled={props.disabled}
        onClick={() => setVisible(current => !current)}
      >
        {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </span>
  );
}