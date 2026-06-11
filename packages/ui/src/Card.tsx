import React from 'react';
import { cn } from './utils.js';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}
