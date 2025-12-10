import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DocumentContent } from '../components/DocumentContent';

export function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-sage-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>На главную</span>
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 prose prose-slate max-w-none">
          <DocumentContent type="privacy" />
        </div>
      </div>
    </div>
  );
}
