export interface ButtonProps {
  label: string;
}
export const Button = (props: ButtonProps) => {
  return `Button: ${props.label}`;
};