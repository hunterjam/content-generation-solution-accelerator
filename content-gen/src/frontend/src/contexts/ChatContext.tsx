import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ChatMessage } from '../types';

// Define the Conversation type for context
interface ConversationItem {
  id: string;
  title: string;
  date: string;
  updatedAt?: string;
}

interface ChatContextType {
  // Current conversation state
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
  
  // Current chat messages
  currentMessages: ChatMessage[];
  setCurrentMessages: (messages: ChatMessage[]) => void;
  
  // Loading states
  isLoadingConversation: boolean;
  setIsLoadingConversation: (loading: boolean) => void;
  
  // Refresh functions
  refreshChatHistory: () => void;
  triggerHistoryRefresh: number;
  
  // New chat management
  isNewChat: boolean;
  setIsNewChat: (isNew: boolean) => void;
  
  // Conversation list management
  conversations: ConversationItem[];
  setConversations: (conversations: ConversationItem[]) => void;
  addNewConversation: (conversation: ConversationItem) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [triggerHistoryRefresh, setTriggerHistoryRefresh] = useState(0);
  const [isNewChat, setIsNewChat] = useState(true);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  const refreshChatHistory = () => {
    setTriggerHistoryRefresh(prev => prev + 1);
  };

  const handleSetSelectedConversationId = (id: string | null) => {
    console.log('[ChatContext] Selected conversation:', id);
    setSelectedConversationId(id);
    setIsNewChat(id === null);
    
    // Clear current messages when switching conversations
    if (id === null) {
      setCurrentMessages([]);
    }
  };

  const handleSetConversations = (newConversations: ConversationItem[]) => {
    console.log('[ChatContext] Setting conversations:', newConversations.length, 'conversations');
    setConversations(newConversations);
  };

  const addNewConversation = (conversation: ConversationItem) => {
    console.log('[ChatContext] Adding new conversation:', conversation.title);
    setConversations(prev => {
      // Check if conversation already exists to avoid duplicates
      const exists = prev.some(conv => conv.id === conversation.id);
      if (exists) {
        return prev;
      }
      // Add new conversation at the beginning (most recent first)
      const newConversations = [conversation, ...prev];
      return newConversations;
    });
  };

  const value: ChatContextType = {
    selectedConversationId,
    setSelectedConversationId: handleSetSelectedConversationId,
    currentMessages,
    setCurrentMessages,
    isLoadingConversation,
    setIsLoadingConversation,
    refreshChatHistory,
    triggerHistoryRefresh,
    isNewChat,
    setIsNewChat,
    conversations,
    setConversations: handleSetConversations,
    addNewConversation,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};




