import { useState } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { mockStorage } from '../lib/mockData';

interface CandidateApplicationFormProps {
  vacancyId: string;
  onSuccess: (candidateId: string) => void;
  onCancel: () => void;
}

export function CandidateApplicationForm({
  vacancyId,
  onSuccess,
  onCancel,
}: CandidateApplicationFormProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Размер файла не должен превышать 10 МБ');
        return;
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        setError('Поддерживаются только PDF и DOC/DOCX файлы');
        return;
      }
      setResumeFile(file);
      setError(null);
    }
  };

  const uploadResume = async (file: File): Promise<string> => {
    setUploadProgress(30);
    await new Promise(resolve => setTimeout(resolve, 500));

    setUploadProgress(70);
    await new Promise(resolve => setTimeout(resolve, 300));

    setUploadProgress(100);

    return `mock-resume-url-${Date.now()}-${file.name}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      let resumeUrl = null;

      if (resumeFile) {
        try {
          resumeUrl = await uploadResume(resumeFile);
        } catch (err) {
          console.error('Resume upload error:', err);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 800));

      const candidate = mockStorage.createCandidate({
        vacancy_id: vacancyId,
        email,
        phone: phone || null,
        portfolio_url: portfolioUrl || null,
        resume_url: resumeUrl,
        status: 'new',
      });

      onSuccess(candidate.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при отправке отклика');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-900">Отклик на вакансию</h2>
        <p className="text-sm text-gray-600 mt-1">
          Заполните форму и пройдите короткое AI-интервью
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />

          <Input
            label="Телефон"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (999) 123-45-67"
          />

          <Input
            label="Ссылка на портфолио / GitHub (необязательно)"
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://github.com/username"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Резюме (необязательно)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-forest-500 transition-colors duration-200">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="resume-upload"
                disabled={loading}
              />
              <label
                htmlFor="resume-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {resumeFile ? (
                  <>
                    <FileText className="w-12 h-12 text-forest-600" />
                    <span className="text-sm font-medium text-gray-900">{resumeFile.name}</span>
                    <span className="text-xs text-gray-500">
                      {(resumeFile.size / 1024 / 1024).toFixed(2)} МБ
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      Нажмите для загрузки резюме
                    </span>
                    <span className="text-xs text-gray-500">PDF, DOC, DOCX до 10 МБ</span>
                  </>
                )}
              </label>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-forest-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1 text-center">
                  Загрузка... {uploadProgress}%
                </p>
              </div>
            )}

            {uploadProgress === 100 && (
              <div className="mt-3 flex items-center justify-center gap-2 text-primary-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Файл загружен</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Отправка...' : 'Продолжить к интервью'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Отмена
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
