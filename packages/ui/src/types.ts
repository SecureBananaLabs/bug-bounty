export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
}