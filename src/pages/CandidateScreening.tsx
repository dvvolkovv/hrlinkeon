import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { AIChat } from '../components/AIChat';
import { Button } from '../components/ui/Button';
import { CheckCircle, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types/database';

const SCREENING_QUESTIONS = [
  'Расскажите, что вас мотивирует в работе? Что для вас важно в профессии?',
  'Опишите ваш последний проект или задачу, которой вы гордитесь. Что именно делали вы?',
  'Как вы обычно справляетесь с конфликтами в команде?',
  'В какой рабочей среде вы наиболее продуктивны? Опишите идеальные условия.',
  'Почему вы решили уйти с предыдущего места работы?',
  'Какие ваши сильные стороны могут помочь в этой роли?',
  'Что для вас означает профессиональный рост?',
];

export function CandidateScreening() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    loadConversation();
  }, [candidateId]);

  const loadConversation = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setConversationId(`mock-conversation-${candidateId}`);

      addAssistantMessage(
        'Здравствуйте! Я AI-ассистент компании. Задам несколько вопросов, чтобы лучше понять ваш опыт и подход к работе. Это займет всего 5-7 минут.'
      );
      setTimeout(() => {
        addAssistantMessage(SCREENING_QUESTIONS[0]);
      }, 1500);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const addAssistantMessage = (content: string) => {
    const newMessage: ChatMessage = {
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const saveMessages = async (updatedMessages: ChatMessage[], completed: boolean = false) => {
    if (!conversationId) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('Mock: Saving messages', { conversationId, messagesCount: updatedMessages.length, completed });
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      role: 'candidate',
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsProcessing(true);

    await saveMessages(updatedMessages);

    setTimeout(async () => {
      const nextQuestion = currentQuestion + 1;

      if (nextQuestion < SCREENING_QUESTIONS.length) {
        addAssistantMessage('Спасибо за ответ!');

        setTimeout(() => {
          const nextMsg: ChatMessage = {
            role: 'assistant',
            content: SCREENING_QUESTIONS[nextQuestion],
            timestamp: new Date().toISOString(),
          };
          const newMessages = [...updatedMessages,
            { role: 'assistant', content: 'Спасибо за ответ!', timestamp: new Date().toISOString() } as ChatMessage,
            nextMsg
          ];
          setMessages(newMessages);
          setCurrentQuestion(nextQuestion);
          setIsProcessing(false);
          saveMessages(newMessages);
        }, 1500);
      } else {
        const finalMessage: ChatMessage = {
          role: 'assistant',
          content: 'Отлично! Спасибо за уделенное время. Я проанализирую ваши ответы и передам результаты HR-специалисту. Они свяжутся с вами в ближайшее время!',
          timestamp: new Date().toISOString(),
        };
        const finalMessages = [...updatedMessages, finalMessage];
        setMessages(finalMessages);

        setTimeout(async () => {
          await saveMessages(finalMessages, true);
          setIsCompleted(true);
          setIsProcessing(false);
        }, 2000);
      }
    }, 2000);
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-warm-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-primary-600" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Скрининг завершен!
              </h2>

              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                Спасибо за ваше время. AI-система проанализирует ваши ответы и сформирует профиль.
                HR-специалист получит уведомление и свяжется с вами.
              </p>

              <div className="inline-flex items-center gap-2 px-6 py-3 bg-forest-50 rounded-lg mb-8">
                <Sparkles className="w-5 h-5 text-forest-600" />
                <span className="text-sm font-medium text-forest-700">
                  Ваш профиль формируется...
                </span>
              </div>

              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/')}
              >
                Вернуться на главную
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
            <h1 className="text-2xl font-bold text-gray-900">AI-скрининг кандидата</h1>
            <span className="text-sm text-gray-600">
              Вопрос {currentQuestion + 1} из {SCREENING_QUESTIONS.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${((currentQuestion + 1) / SCREENING_QUESTIONS.length) * 100}%`,
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
