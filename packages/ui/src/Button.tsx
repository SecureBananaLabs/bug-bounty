import React from 'react';

export default function Button({ label }: { label?: string }) {
  return <button>{label || 'Click me'}</button>;
}