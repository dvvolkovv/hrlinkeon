import { useState } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Upload, FileText, CheckCircle, Link as LinkIcon } from 'lucide-react';

interface CandidateApplicationFormProps {
  vacancyId: string;
  publicLink: string;
  onSuccess: (candidateId: string) => void;
  onCancel: () => void;
  onRejected?: (message: string, details?: { explanation?: string }) => void;
}

type ResumeType = 'file' | 'link';

export function CandidateApplicationForm({
  vacancyId,
  publicLink,
  onSuccess,
  onCancel,
  onRejected,
}: CandidateApplicationFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [resumeType, setResumeType] = useState<ResumeType>('file');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeLink, setResumeLink] = useState('');
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
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/rtf',
        'text/rtf',
        'text/plain',
        'text/xml',
        'application/xml',
      ];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['pdf', 'doc', 'docx', 'rtf', 'txt', 'xml'];

      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
        setError('Поддерживаются только PDF, DOC, DOCX, RTF, TXT, XML файлы');
        return;
      }
      setResumeFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUploadProgress(0);

    if (resumeType === 'file' && !resumeFile) {
      setError('Пожалуйста, загрузите резюме');
      setLoading(false);
      return;
    }

    if (resumeType === 'link' && !resumeLink.trim()) {
      setError('Пожалуйста, укажите ссылку на резюме');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      if (phone) formData.append('phone', phone);
      if (githubLink) formData.append('github_link', githubLink);
      if (portfolioLink) formData.append('portfolio_link', portfolioLink);

      if (resumeType === 'file' && resumeFile) {
        formData.append('resume', resumeFile);
      } else if (resumeType === 'link' && resumeLink) {
        formData.append('link', resumeLink);
      }

      setUploadProgress(30);

      const response = await fetch(
        `https://nomira-ai-test.up.railway.app/webhook/hrlinkeon-candidate-apply/public/vacancies/${publicLink}/apply`,
        {
          method: 'POST',
          body: formData,
        }
      );

      setUploadProgress(70);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Ошибка при отправке отклика');
      }

      const data = await response.json();
      setUploadProgress(100);

      if (data.success && data.candidate_id) {
        onSuccess(data.candidate_id);
      } else if (data.rejected) {
        if (onRejected) {
          onRejected(
            data.message || 'К сожалению, ваша заявка не соответствует требованиям вакансии',
            data.details
          );
        }
      } else {
        throw new Error('Не удалось получить ID кандидата');
      }
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
            label="Имя"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Иван Иванов"
            required
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="candidate@example.com"
            required
          />

          <Input
            label="Телефон"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+79991234567"
          />

          <Input
            label="GitHub"
            type="url"
            value={githubLink}
            onChange={(e) => setGithubLink(e.target.value)}
            placeholder="https://github.com/username"
          />

          <Input
            label="Портфолио"
            type="url"
            value={portfolioLink}
            onChange={(e) => setPortfolioLink(e.target.value)}
            placeholder="https://portfolio.example.com"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Резюме <span className="text-red-500">*</span>
            </label>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-forest-500 transition-colors duration-200">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.rtf,.xml,.txt"
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
                    <span className="text-xs text-gray-500">PDF, DOC, DOCX, RTF, TXT, XML до 10 МБ</span>
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
