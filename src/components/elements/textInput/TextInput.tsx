import React, { ChangeEvent } from 'react';
import './textInput.css';

interface TextInputProps {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TextInput: React.FC<TextInputProps> = ({value, onChange, placeholder, type }) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <>
      <input type={type} className="rounded-border" value={value} onChange={handleChange} placeholder={placeholder}/>
    </>
  );
};

export default TextInput;
