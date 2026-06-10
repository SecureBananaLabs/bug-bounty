export interface CardProps {
  title: string;
}
export const Card = (props: CardProps) => {
  return `Card: ${props.title}`;
};