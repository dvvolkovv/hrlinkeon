import { useState, useEffect, useRef } from 'react';
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

export function VacancyProfiling() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const isInitialized = useRef(false);
  const totalQuestions = 7;

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    sendInitialMessage();
  }, []);

  const sendInitialMessage = async () => {
    const userId = localStorage.getItem('user_id');
    const vacancyId = id || localStorage.getItem('current_vacancy_id');

    if (!userId || !vacancyId) {
      addAssistantMessage('Ошибка: не удалось получить данные пользователя или вакансии');
      return;
    }

    setIsProcessing(true);

    try {
      await sendMessageToAPI('Привет!', userId, vacancyId);
    } catch (error) {
      addAssistantMessage('Произошла ошибка при инициализации чата. Попробуйте обновить страницу.');
    } finally {
      setIsProcessing(false);
    }
  };

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

  const sendMessageToAPI = async (message: string, userId: string, vacancyId: string) => {
    const apiUrl = 'https://nomira-ai-test.up.railway.app/webhook/rec/chat';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatInput: message,
        current_vacancy_id: vacancyId,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Ошибка при получении ответа от сервера');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Не удалось получить reader из ответа');
    }

    let assistantMessage = '';
    const assistantMessageIndex = messages.length + 1;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      assistantMessage += chunk;

      setMessages((prev) => {
        const newMessages = [...prev];
        const existingMessageIndex = newMessages.findIndex(
          (msg, idx) => idx === assistantMessageIndex && msg.role === 'assistant'
        );

        if (existingMessageIndex !== -1) {
          newMessages[existingMessageIndex] = {
            ...newMessages[existingMessageIndex],
            content: assistantMessage,
          };
        } else {
          newMessages.push({
            role: 'assistant',
            content: assistantMessage,
            timestamp: new Date().toISOString(),
          });
        }

        return newMessages;
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    const userId = localStorage.getItem('user_id');
    const vacancyId = id || localStorage.getItem('current_vacancy_id');

    if (!userId || !vacancyId) {
      addAssistantMessage('Ошибка: не удалось получить данные пользователя или вакансии');
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      },
    ]);

    setIsProcessing(true);

    try {
      await sendMessageToAPI(content, userId, vacancyId);

      const newQuestionsAnswered = questionsAnswered + 1;
      setQuestionsAnswered(newQuestionsAnswered);

      if (newQuestionsAnswered >= totalQuestions) {
        setTimeout(() => {
          setIsCompleted(true);
        }, 2000);
      }
    } catch (error) {
      addAssistantMessage('Произошла ошибка при отправке сообщения. Попробуйте еще раз.');
    } finally {
      setIsProcessing(false);
    }
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
              Вопрос {questionsAnswered} из {totalQuestions}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-forest-500 to-forest-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${(questionsAnswered / totalQuestions) * 100}%`,
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
