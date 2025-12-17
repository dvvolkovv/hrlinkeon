interface HTMLContentProps {
  content: string;
  className?: string;
}

export const HTMLContent = ({ content, className = '' }: HTMLContentProps) => {
  if (!content) return null;

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
