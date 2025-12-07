import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { AIChat } from '../components/AIChat';
import { Button } from '../components/ui/Button';
import { ArrowLeft, CheckCircle } from 'lucide-react';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

interface ProfileStatus {
  success: boolean;
  candidate_id: string;
  vacancy_id: string;
  email: string;
  name: string;
  status: string;
  profile: {
    type: string;
    is_ready: boolean;
  };
  message: string;
}

export function CandidateInterviewChat() {
  const { publicLink, candidateId } = useParams<{ publicLink: string; candidateId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    sendInitialMessage();
  }, []);

  const sendInitialMessage = async () => {
    if (!publicLink || !candidateId) {
      addAssistantMessage('Ошибка: не удалось получить данные вакансии или кандидата');
      return;
    }

    setIsProcessing(true);

    try {
      await sendMessageToAPI('Привет! Расскажи о себе.');
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

  const checkProfileStatus = async () => {
    if (!publicLink || !candidateId) return;

    try {
      const statusUrl = `https://nomira-ai-test.up.railway.app/webhook/fb753981-7139-4a49-9bc6-df3e8afc577a/public/vacancies/${publicLink}/candidates/${candidateId}/profile-status`;

      const response = await fetch(statusUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate_id: candidateId,
          public_link: publicLink,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Profile status response:', data);

        if (Array.isArray(data) && data.length > 0) {
          setProfileStatus(data[0]);
        } else if (data && typeof data === 'object' && 'profile' in data) {
          setProfileStatus(data);
        }
      }
    } catch (error) {
      console.error('Error checking profile status:', error);
    }
  };

  const sendMessageToAPI = async (message: string) => {
    const apiUrl = `https://nomira-ai-test.up.railway.app/webhook/82aa583e-af84-4dde-87ce-1b924752ff1e/public/vacancies/${publicLink}/candidates/${candidateId}/chat`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatInput: message,
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
    if (!publicLink || !candidateId) {
      addAssistantMessage('Ошибка: не удалось получить данные вакансии или кандидата');
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
      await sendMessageToAPI(content);
      await checkProfileStatus();
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
          onClick={() => navigate(`/public/vacancies/${publicLink}/candidates/${candidateId}/status`)}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к статусу
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Интервью с AI-ассистентом
          </h1>
          <p className="text-gray-600 mt-2">
            Отвечайте на вопросы AI-ассистента. Это поможет нам лучше понять вашу квалификацию.
          </p>
        </div>

        {profileStatus?.profile?.is_ready && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-900 mb-1">
                Собеседование завершено!
              </h3>
              <p className="text-green-800">
                {profileStatus.message}
              </p>
            </div>
          </div>
        )}

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
