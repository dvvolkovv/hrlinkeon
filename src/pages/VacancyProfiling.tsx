import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { AIChat } from '../components/AIChat';
import { Button } from '../components/ui/Button';
import { Check, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

interface VacancyProfileData {
  company: any;
  role_context: any;
  responsibilities: any[];
  hard_skills: any[];
  soft_skills: any[];
  values: any[];
  motivation_profile: any;
  anti_profile: any;
  conditions: any;
  hiring_process: any;
  pitch: string;
}

export function VacancyProfiling() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [vacancyProfile, setVacancyProfile] = useState<VacancyProfileData | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const isInitialized = useRef(false);

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

  const saveVacancyProfile = async (profileData: VacancyProfileData, vacancyId: string) => {
    try {
      const { data: existingProfile } = await supabase
        .from('vacancy_profiles')
        .select('id')
        .eq('vacancy_id', vacancyId)
        .maybeSingle();

      const profilePayload = {
        vacancy_id: vacancyId,
        full_profile_data: profileData,
        pitch: profileData.pitch || '',
        hard_skills: profileData.hard_skills || [],
        soft_skills: profileData.soft_skills || [],
        values: profileData.values || [],
        red_flags: profileData.anti_profile || {},
        updated_at: new Date().toISOString(),
      };

      if (existingProfile) {
        const { error } = await supabase
          .from('vacancy_profiles')
          .update(profilePayload)
          .eq('vacancy_id', vacancyId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vacancy_profiles')
          .insert(profilePayload);

        if (error) throw error;
      }

      const { error: vacancyError } = await supabase
        .from('vacancies')
        .update({ status: 'published' })
        .eq('id', vacancyId);

      if (vacancyError) throw vacancyError;
    } catch (error) {
      console.error('Error saving vacancy profile:', error);
      throw error;
    }
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

          if (jsonData.type === 'vacancy_profile' && jsonData.is_ready && jsonData.vacancy) {
            setVacancyProfile(jsonData.vacancy);
            setProfileReady(true);

            try {
              await saveVacancyProfile(jsonData.vacancy, vacancyId);
              setTimeout(() => {
                setIsCompleted(true);
              }, 1000);
            } catch (error) {
              console.error('Error saving profile:', error);
            }
            continue;
          }

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

    const trimmedMessage = assistantMessage.trim();
    if (trimmedMessage.startsWith('{') && trimmedMessage.endsWith('}')) {
      try {
        const jsonData = JSON.parse(trimmedMessage);

        if (jsonData.type === 'vacancy_profile' && jsonData.is_ready && jsonData.vacancy) {
          setVacancyProfile(jsonData.vacancy);
          setProfileReady(true);

          try {
            await saveVacancyProfile(jsonData.vacancy, vacancyId);
            setTimeout(() => {
              setIsCompleted(true);
            }, 1000);
          } catch (error) {
            console.error('Error saving profile:', error);
          }
        }
      } catch (e) {
        console.warn('Failed to parse assistant message as JSON:', e);
      }
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
    } catch (error) {
      addAssistantMessage('Произошла ошибка при отправке сообщения. Попробуйте еще раз.');
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    if (id) {
      navigate(`/vacancy/${id}/dashboard`);
    }
  };

  if (isCompleted && vacancyProfile) {
    const profileComponents = [];

    if (vacancyProfile.role_context) profileComponents.push('Контекст роли и KPI');
    if (vacancyProfile.hard_skills?.length > 0) profileComponents.push(`Hard skills (${vacancyProfile.hard_skills.length})`);
    if (vacancyProfile.soft_skills?.length > 0) profileComponents.push(`Soft skills (${vacancyProfile.soft_skills.length})`);
    if (vacancyProfile.values?.length > 0) profileComponents.push(`Ценности (${vacancyProfile.values.length})`);
    if (vacancyProfile.motivation_profile) profileComponents.push('Профиль мотивации');
    if (vacancyProfile.anti_profile) profileComponents.push('Красные флаги');

    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Профиль вакансии создан!
              </h2>

              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                AI-ассистент проанализировал ваши ответы и создал детальный профиль идеального
                кандидата со следующими компонентами:
              </p>

              {vacancyProfile.pitch && (
                <div className="mb-8 p-4 bg-forest-50 rounded-lg max-w-2xl mx-auto">
                  <p className="text-sm text-gray-700 italic">{vacancyProfile.pitch}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto text-left">
                {profileComponents.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-forest-50 rounded-lg">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              <Button size="lg" onClick={handleFinish} className="gap-2">
                <Sparkles className="w-5 h-5" />
                Перейти к вакансии
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
        {!profileReady && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Профилирование вакансии
            </h1>
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
