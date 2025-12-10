import { formatLegalDocument } from '../lib/legalDocuments';

interface LegalDocumentProps {
  content: string;
}

export function LegalDocument({ content }: LegalDocumentProps) {
  const lines = formatLegalDocument(content);

  return (
    <div className="space-y-4">
      {lines.map((line, index) => {
        if (line.match(/^[0-9]+\.|^[0-9]+$/)) {
          return (
            <h3 key={index} className="text-lg font-semibold text-gray-900 mt-6">
              {line}
            </h3>
          );
        }

        if (line.match(/^[А-ЯЁ][а-яё\s]+$/)) {
          return (
            <h2 key={index} className="text-xl font-bold text-gray-900 mt-8 mb-4">
              {line}
            </h2>
          );
        }

        if (line.startsWith('•')) {
          return (
            <li key={index} className="ml-6 text-gray-700">
              {line.substring(1).trim()}
            </li>
          );
        }

        return (
          <p key={index} className="text-gray-700 leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}
