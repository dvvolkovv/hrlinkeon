import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { AIChat } from '../components/AIChat';
import { Button } from '../components/ui/Button';
import { Check, Sparkles } from 'lucide-react';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

const PROFILING_QUESTIONS = [
  'Расскажите, какую основную проблему должна решить эта позиция?',
  'Что должен сделать сотрудник за первые 90 дней работы?',
  'Опишите стиль руководителя, с которым будет работать сотрудник.',
  'Какие ценности важны в вашей команде?',
  'Какие качества категорически неприемлемы для этой позиции?',
  'Опишите темп работы в компании: размеренный или быстрый?',
  'Были ли конфликты с предыдущими сотрудниками на этой позиции? Если да, в чем причина?',
];

export function VacancyProfiling() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (messages.length === 0) {
      addAssistantMessage(
        'Здравствуйте! Я AI-ассистент HR-Linkeon. Помогу создать глубинный профиль вакансии. Задам несколько вопросов, чтобы понять идеального кандидата для этой позиции.'
      );

      setTimeout(() => {
        addAssistantMessage(PROFILING_QUESTIONS[0]);
      }, 1000);
    }
  }, []);

  const addAssistantMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleSendMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      },
    ]);

    setIsProcessing(true);

    setTimeout(() => {
      const nextQuestion = currentQuestion + 1;

      if (nextQuestion < PROFILING_QUESTIONS.length) {
        addAssistantMessage('Спасибо за ответ!');

        setTimeout(() => {
          addAssistantMessage(PROFILING_QUESTIONS[nextQuestion]);
          setCurrentQuestion(nextQuestion);
          setIsProcessing(false);
        }, 1000);
      } else {
        addAssistantMessage(
          'Отлично! Я собрал всю необходимую информацию. Сейчас создам детальный профиль идеального кандидата...'
        );

        setTimeout(() => {
          setIsCompleted(true);
          setIsProcessing(false);
        }, 2000);
      }
    }, 1500);
  };

  const handleFinish = () => {
    if (id) {
      navigate(`/vacancy/${id}/dashboard`);
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-primary-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Профиль вакансии создан!
              </h2>

              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                AI-ассистент проанализировал ваши ответы и создал детальный профиль идеального
                кандидата со следующими компонентами:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto text-left">
                {[
                  'Миссия роли и KPI',
                  'Hard skills профиль',
                  'Soft skills профиль',
                  'Ценностный профиль',
                  'Поведенческий портрет',
                  'Красные флаги',
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-forest-50 rounded-lg">
                    <Check className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              <Button size="lg" onClick={handleFinish} className="gap-2">
                <Sparkles className="w-5 h-5" />
                Опубликовать вакансию
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Профилирование вакансии
            </h1>
            <span className="text-sm text-gray-600">
              Вопрос {currentQuestion + 1} из {PROFILING_QUESTIONS.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-forest-500 to-forest-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${((currentQuestion + 1) / PROFILING_QUESTIONS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <Card className="h-[600px] flex flex-col">
          <AIChat
            messages={messages}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            placeholder="Введите ваш ответ..."
          />
        </Card>
      </div>
    </div>
  );
}
