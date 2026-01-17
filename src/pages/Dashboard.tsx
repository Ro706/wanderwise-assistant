import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Sidebar from '@/components/dashboard/Sidebar';
import ChatInterface from '@/components/dashboard/ChatInterface';
import CustomerList from '@/components/dashboard/CustomerList';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { hasSelectedLanguage } = useLanguage();
  const [activeSection, setActiveSection] = useState('chat');
  const [conversationId, setConversationId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasSelectedLanguage) {
    return <Navigate to="/language" replace />;
  }

  const handleNewChat = () => {
    setConversationId(Date.now().toString());
    setActiveSection('chat');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'customers':
        return <CustomerList />;
      case 'chat':
      default:
        return <ChatInterface conversationId={conversationId} />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onNewChat={handleNewChat}
      />
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;