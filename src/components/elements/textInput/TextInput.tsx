import React, { ChangeEvent } from 'react';
import './TextInput.css';

interface TextInputProps {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TextInput: React.FC<TextInputProps> = ({value, onChange, placeholder, type, onKeyDown }) => {
  
  
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.value);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (onKeyDown) {
            onKeyDown(event);
        }
    };

    return (
        <>
            <input type={type} className="rounded-border" value={value} onChange={handleChange} placeholder={placeholder} onKeyDown={handleKeyDown}/>
        </>
  );
};

export default TextInput;
