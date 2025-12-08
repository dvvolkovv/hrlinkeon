import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { AIChat } from '../components/AIChat';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

export function VacancyCandidatesChat() {
  const { vacancyId } = useParams<{ vacancyId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    sendInitialMessage();
  }, []);

  const sendInitialMessage = async () => {
    const userId = localStorage.getItem('user_id');

    if (!userId || !vacancyId) {
      addAssistantMessage('Ошибка: не удалось получить данные пользователя или вакансии');
      return;
    }

    setIsProcessing(true);

    try {
      await sendMessageToAPI('Привет! Помоги мне выбрать лучших кандидатов для этой вакансии.', userId, vacancyId);
    } catch (error) {
      addAssistantMessage('Произошла ошибка при инициализации чата. Попробуйте обновить страницу.');
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
    const apiUrl = `https://nomira-ai-test.up.railway.app/webhook/82aa583e-af84-4dde-87ce-1b924752ff1e/api/vacancies/${vacancyId}/ai-candidates-chat`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        message: message,
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
    let buffer = '';
    let hasReceivedContent = false;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const jsonData = JSON.parse(line);

          if (jsonData.type === 'item' && jsonData.content) {
            assistantMessage += jsonData.content;

            if (!hasReceivedContent && assistantMessage.trim()) {
              hasReceivedContent = true;
              setIsProcessing(false);
            }
          } else if (jsonData.type === 'begin') {
            continue;
          }
        } catch (e) {
          console.warn('Failed to parse JSON line:', line);
        }
      }

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
    } catch (error) {
      addAssistantMessage('Произошла ошибка при отправке сообщения. Попробуйте еще раз.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate(`/vacancy/${vacancyId}`)}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к вакансии
        </Button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI-советник по кандидатам
              </h1>
              <p className="text-sm text-gray-600">
                Получите рекомендации по выбору лучших кандидатов
              </p>
            </div>
          </div>
        </div>

        <Card className="h-[600px] flex flex-col">
          <AIChat
            messages={messages}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            placeholder="Например: Кого посоветуешь рассмотреть первым и почему?"
          />
        </Card>
      </div>
    </div>
  );
}
