import type { ReactNode } from "react";

type RuleProps = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
};

export function Rule({ icon, title, children }: RuleProps) {
  return (
    <article className="rule">
      <span>{icon}</span>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </article>
  );
}
