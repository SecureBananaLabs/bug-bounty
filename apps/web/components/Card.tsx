interface CardProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: "section" | "article" | "div";
}

export function Card({ children, as: Tag = "section", ...props }: CardProps) {
  return (
    <Tag className="card" {...props}>
      {children}
    </Tag>
  );
}
