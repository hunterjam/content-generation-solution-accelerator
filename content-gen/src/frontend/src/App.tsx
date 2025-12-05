import { useState, useCallback } from 'react';
import {
  Avatar,
  Button,
  ToggleButton,
  ToolbarDivider,
} from '@fluentui/react-components';
import {
  Sparkle20Filled,
} from '@fluentui/react-icons';

import CoralShellColumn from './components/Layout/CoralShellColumn';
import CoralShellRow from './components/Layout/CoralShellRow';
import Header from './components/Header/Header';
import HeaderTools from './components/Header/HeaderTools';
import PanelRightToggles from './components/Header/PanelRightToggles';
import Content from './components/Content/Content';

import Chat from './modules/Chat';

import { ChatProvider, useChatContext } from './contexts/ChatContext';
import { useTheme } from './contexts/ThemeContext';

import PanelRightHistory from './panels/PanelRightHistory';

import {
  History,
  WeatherMoon,
  WeatherSunny,
} from './imports/bundleicons';

import type { CreativeBrief, Product, GeneratedContent, AgentResponse } from './types';

const AppContent: React.FC = () => {
  const [userId] = useState<string>('demo-user');
  const [isLoading, setIsLoading] = useState(false);
  
  const [pendingBrief, setPendingBrief] = useState<CreativeBrief | null>(null);
  const [confirmedBrief, setConfirmedBrief] = useState<CreativeBrief | null>(null);
  const [selectedProducts] = useState<Product[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  const { 
    selectedConversationId, 
    setSelectedConversationId, 
    setIsNewChat
  } = useChatContext();

  const { isDarkMode, toggleTheme } = useTheme();

  const handleSendMessage = useCallback(async function* (
    input: string,
    _history: { role: string; content: string }[]
  ): AsyncGenerator<AgentResponse> {
    try {
      console.log('[App] Sending message:', { input, conversationId: selectedConversationId });
      
      const briefKeywords = ['campaign', 'marketing', 'target audience', 'objective', 'deliverable'];
      const isBriefLike = briefKeywords.some(kw => input.toLowerCase().includes(kw));
      
      if (isBriefLike && !confirmedBrief) {
        const { parseBrief } = await import('./api');
        const parsed = await parseBrief(input);
        setPendingBrief(parsed.brief);
        
        // Store the conversation ID from the parsed response
        if (parsed.conversation_id) {
          setSelectedConversationId(parsed.conversation_id);
        }
        
        yield {
          type: 'agent_response',
          agent: 'PlanningAgent',
          content: 'I\'ve parsed your creative brief. Please review and confirm the details below to proceed with content generation.',
          is_final: true,
        };
        return;
      }
      
      const { streamChat } = await import('./api');
      
      for await (const response of streamChat(input, selectedConversationId || undefined, userId)) {
        yield response;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      yield {
        type: 'error',
        content: 'Sorry, there was an error processing your request. Please try again.',
        is_final: true,
      };
    }
  }, [selectedConversationId, userId, confirmedBrief]);

  const handleBriefConfirm = useCallback(async (brief: CreativeBrief) => {
    try {
      const { confirmBrief } = await import('./api');
      const confirmResult = await confirmBrief(brief, selectedConversationId || undefined, userId);
      setConfirmedBrief(brief);
      setPendingBrief(null);
      
      // Use the conversation ID from the confirm response, or the existing one
      const conversationId = confirmResult.conversation_id || selectedConversationId;
      
      // Update the selected conversation ID if we got one from the response
      if (confirmResult.conversation_id && confirmResult.conversation_id !== selectedConversationId) {
        setSelectedConversationId(confirmResult.conversation_id);
      }
      
      setIsLoading(true);
      try {
        const { streamGenerateContent } = await import('./api');
        
        let receivedResponse = false;
        
        for await (const response of streamGenerateContent(
          brief,
          selectedProducts,
          true,
          conversationId || undefined
        )) {
          console.log('[App] Received stream response:', response);
          
          // Handle error responses
          if (response.type === 'error') {
            console.error('[App] Error from backend:', response.content);
            alert(`Error generating content: ${response.content}`);
            continue;
          }
          
          // Handle status updates
          if (response.type === 'status') {
            console.log('[App] Status:', response.content);
            continue;
          }
          
          if (response.is_final && response.type !== 'error') {
            receivedResponse = true;
            try {
              const rawContent = JSON.parse(response.content);
              console.log('[App] Parsed content:', Object.keys(rawContent));
              
              let textContent = rawContent.text_content;
              if (typeof textContent === 'string') {
                try {
                  textContent = JSON.parse(textContent);
                } catch {
                  // Keep as string if not valid JSON
                }
              }
              
              let imageUrl: string | undefined;
              if (rawContent.image_base64) {
                imageUrl = `data:image/png;base64,${rawContent.image_base64}`;
                console.log('[App] Using base64 image');
              } else if (rawContent.image_url) {
                imageUrl = rawContent.image_url;
                console.log('[App] Using image URL:', imageUrl);
              }
              
              const content: GeneratedContent = {
                text_content: typeof textContent === 'object' ? {
                  headline: textContent?.headline,
                  body: textContent?.body,
                  cta_text: textContent?.cta,
                  tagline: textContent?.tagline,
                } : undefined,
                image_content: (imageUrl || rawContent.image_prompt) ? {
                  image_url: imageUrl,
                  prompt_used: rawContent.image_prompt,
                  alt_text: rawContent.image_revised_prompt || 'Generated marketing image',
                } : undefined,
                violations: rawContent.violations || [],
                requires_modification: rawContent.requires_modification || false,
              };
              console.log('[App] Setting generated content:', content);
              setGeneratedContent(content);
            } catch (parseError) {
              console.error('[App] Error parsing generated content:', parseError, response.content);
            }
          }
        }
        
        if (!receivedResponse) {
          console.error('[App] No valid response received from content generation');
        }
      } catch (streamError) {
        console.error('[App] Stream error:', streamError);
        alert(`Error during content generation: ${streamError}`);
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error confirming brief:', error);
    }
  }, [selectedConversationId, userId, selectedProducts]);

  const handleBriefCancel = useCallback(() => {
    setPendingBrief(null);
  }, []);

  const handleBriefLoaded = useCallback((brief: CreativeBrief, isConfirmed: boolean) => {
    if (isConfirmed) {
      setConfirmedBrief(brief);
      setPendingBrief(null);
    } else {
      setPendingBrief(brief);
      setConfirmedBrief(null);
    }
  }, []);

  const handleGeneratedContentLoaded = useCallback((content: GeneratedContent) => {
    setGeneratedContent(content);
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (!confirmedBrief) return;
    
    setGeneratedContent(null);
    setIsLoading(true);
    try {
      const { streamGenerateContent } = await import('./api');
      
      for await (const response of streamGenerateContent(
        confirmedBrief,
        selectedProducts,
        true,
        selectedConversationId || undefined
      )) {
        if (response.is_final && response.type !== 'error') {
          try {
            const rawContent = JSON.parse(response.content);
            
            let textContent = rawContent.text_content;
            if (typeof textContent === 'string') {
              try {
                textContent = JSON.parse(textContent);
              } catch {
              }
            }
            
            let imageUrl: string | undefined;
            if (rawContent.image_base64) {
              imageUrl = `data:image/png;base64,${rawContent.image_base64}`;
            } else if (rawContent.image_url) {
              imageUrl = rawContent.image_url;
            }
            
            const content: GeneratedContent = {
              text_content: typeof textContent === 'object' ? {
                headline: textContent?.headline,
                body: textContent?.body,
                cta_text: textContent?.cta,
                tagline: textContent?.tagline,
              } : undefined,
              image_content: (imageUrl || rawContent.image_prompt) ? {
                image_url: imageUrl,
                prompt_used: rawContent.image_prompt,
                alt_text: rawContent.image_revised_prompt || 'Generated marketing image',
              } : undefined,
              violations: rawContent.violations || [],
              requires_modification: rawContent.requires_modification || false,
            };
            setGeneratedContent(content);
          } catch (parseError) {
            console.error('Error parsing generated content:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [confirmedBrief, selectedProducts, selectedConversationId]);

  const handleNewConversation = useCallback(() => {
    setSelectedConversationId(null);
    setIsNewChat(true);
    setPendingBrief(null);
    setConfirmedBrief(null);
    setGeneratedContent(null);
  }, [setSelectedConversationId, setIsNewChat]);

  return (
    <CoralShellColumn>
      <Header
        title="Content Generation"
        subtitle="AI-powered marketing content"
        logo={<Sparkle20Filled />}
      >
        <HeaderTools>
          <Button
            appearance="subtle"
            icon={isDarkMode ? <WeatherSunny /> : <WeatherMoon />}
            onClick={toggleTheme}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          />
          <ToolbarDivider />
          <Avatar />
          <ToolbarDivider />
          <PanelRightToggles>
            <ToggleButton appearance="subtle" icon={<History />} title="Chat History" />
          </PanelRightToggles>
        </HeaderTools>
      </Header>

      <CoralShellRow>
        <Content>
          <Chat
            userId={userId}
            onSendMessage={handleSendMessage}
            pendingBrief={pendingBrief}
            onBriefConfirm={handleBriefConfirm}
            onBriefCancel={handleBriefCancel}
            onBriefEdit={(brief) => {
              setPendingBrief(brief);
              setConfirmedBrief(null);
            }}
            onBriefLoaded={handleBriefLoaded}
            generatedContent={generatedContent}
            onRegenerate={handleRegenerate}
            onGeneratedContentLoaded={handleGeneratedContentLoaded}
            isGenerating={isLoading}
          />
        </Content>

        <PanelRightHistory />
      </CoralShellRow>
    </CoralShellColumn>
  );
};

const App: React.FC = () => {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
};

export default App;

