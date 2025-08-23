/**
 * FILE LOCATION: frontend/src/pages/ChatRichieAI.jsx
 * 
 * Enhanced AI Chat interface with RichieAI financial advisor assistant.
 * Features persistent chat history, client selection, and AI-powered financial recommendations
 * based on complete client financial data and context.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, MessageCircle, RefreshCw, History, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { chatAPI } from '../services/api';

function ChatRichieAI() {
  // State management
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientContext, setClientContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // UI states
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  // Load clients for chat selection
  const loadClients = async () => {
    try {
      setIsLoadingClients(true);
      setError(null);
      
      console.log('🔄 [CHAT UI] Loading clients for chat...');
      
      const response = await chatAPI.getClientsForChat();
      
      if (response.success && response.data?.clients) {
        setClients(response.data.clients);
        console.log('✅ [CHAT UI] Clients loaded:', response.data.clients.length);
      } else {
        console.error('❌ [CHAT UI] Invalid response structure:', response);
        toast.error('Failed to load clients: Invalid response format');
        setClients([]);
      }
    } catch (error) {
      console.error('❌ [CHAT UI] Error loading clients:', error);
      toast.error('Failed to load clients: ' + (error.response?.data?.message || error.message));
      setClients([]);
      setError('Failed to load clients. Please try again.');
    } finally {
      setIsLoadingClients(false);
    }
  };

  // Load client financial context
  const loadClientContext = async (clientId) => {
    try {
      setIsLoadingContext(true);
      
      console.log('🔍 [CHAT UI] Loading client context:', { clientId });
      
      const response = await chatAPI.getClientContext(clientId);
      
      if (response.success && response.data?.clientContext) {
        setClientContext(response.data.clientContext);
        console.log('✅ [CHAT UI] Client context loaded:', {
          clientId,
          hasContext: !!response.data.clientContext,
          monthlyIncome: response.data.clientContext.financialSituation?.monthlyIncome,
          netWorth: response.data.clientContext.netWorth
        });
      } else {
        console.error('❌ [CHAT UI] Failed to load context:', response);
        toast.error('Failed to load client financial context');
      }
    } catch (error) {
      console.error('❌ [CHAT UI] Error loading client context:', error);
      toast.error('Failed to load client context: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoadingContext(false);
    }
  };

  // Load chat history for selected client
  const loadChatHistory = async (clientId) => {
    try {
      setIsLoadingHistory(true);
      
      console.log('📚 [CHAT UI] Loading chat history:', { clientId });
      
      const response = await chatAPI.getChatHistory(clientId, { limit: 5 });
      
      if (response.success && response.data?.conversations) {
        setConversationHistory(response.data.conversations);
        console.log('✅ [CHAT UI] Chat history loaded:', {
          clientId,
          conversationCount: response.data.conversations.length
        });
        
        // If there's an active conversation, load its messages
        if (response.data.conversations.length > 0) {
          const activeConversation = response.data.conversations.find(conv => conv.status === 'active');
          if (activeConversation) {
            await loadConversationMessages(activeConversation.conversationId);
          }
        }
      } else {
        console.log('ℹ️ [CHAT UI] No chat history found for client:', clientId);
        setConversationHistory([]);
      }
    } catch (error) {
      console.error('❌ [CHAT UI] Error loading chat history:', error);
      // Don't show error toast for history loading failures - it's not critical
      setConversationHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load messages for a specific conversation
  const loadConversationMessages = async (conversationId) => {
    try {
      console.log('📖 [CHAT UI] Loading conversation messages:', { conversationId });
      
      const response = await chatAPI.getConversationMessages(conversationId);
      
      if (response.success && response.data?.conversation) {
        const conversation = response.data.conversation;
        setCurrentConversationId(conversationId);
        
        // Convert messages to UI format
        const formattedMessages = conversation.messages
          .filter(msg => msg.role !== 'system') // Filter out system messages
          .map(msg => ({
            type: msg.role === 'advisor' ? 'user' : 'bot',
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            messageId: msg.messageId
          }));
        
        setMessages(formattedMessages);
        console.log('✅ [CHAT UI] Conversation messages loaded:', {
          conversationId,
          messageCount: formattedMessages.length
        });
      }
    } catch (error) {
      console.error('❌ [CHAT UI] Error loading conversation messages:', error);
      toast.error('Failed to load conversation messages');
    }
  };

  // Handle client selection
  const handleClientSelect = async (client) => {
    try {
      console.log('👤 [CHAT UI] Client selected:', {
        clientId: client._id,
        clientName: client.name
      });
      
      setSelectedClient(client);
      setMessages([]);
      setCurrentConversationId(null);
      setError(null);
      
      // Add welcome message
      const welcomeMessage = {
        type: 'bot',
        content: `Hello! I'm RichieAI, your financial advisor assistant. I have access to ${client.name}'s complete financial profile and can provide personalized recommendations. 

I can help you with:
• Investment strategy and portfolio optimization
• Debt management and EMI restructuring
• Goal-based financial planning
• Tax planning and optimization
• Risk assessment and insurance needs
• Emergency fund planning
• Retirement planning strategies

What would you like to discuss about ${client.firstName}'s financial situation?`,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      
      // Load client context and chat history in parallel
      await Promise.all([
        loadClientContext(client._id),
        loadChatHistory(client._id)
      ]);
      
    } catch (error) {
      console.error('❌ [CHAT UI] Error selecting client:', error);
      toast.error('Failed to select client');
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedClient || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      console.log('💬 [CHAT UI] Sending message:', {
        clientId: selectedClient._id,
        conversationId: currentConversationId,
        messageLength: currentMessage.length
      });

      const response = await chatAPI.sendMessage(
        selectedClient._id, 
        currentMessage, 
        currentConversationId
      );
      
      if (response.success && response.data?.response) {
        // Update conversation ID if it's a new conversation
        if (response.data.conversationId && !currentConversationId) {
          setCurrentConversationId(response.data.conversationId);
          console.log('🆕 [CHAT UI] New conversation started:', response.data.conversationId);
        }
        
        const botMessage = {
          type: 'bot',
          content: response.data.response,
          timestamp: new Date(response.data.aiMessage?.timestamp || Date.now()),
          messageId: response.data.aiMessage?.messageId
        };

        setMessages(prev => [...prev, botMessage]);
        
        console.log('✅ [CHAT UI] AI response received:', {
          conversationId: response.data.conversationId,
          responseLength: response.data.response.length,
          tokensUsed: response.data.usage?.total_tokens || 0
        });
        
        // Refresh chat history to show the new conversation
        if (response.data.conversationId !== currentConversationId) {
          loadChatHistory(selectedClient._id);
        }
        
      } else {
        throw new Error(response.message || 'Invalid AI response format');
      }
      
    } catch (error) {
      console.error('❌ [CHAT UI] Error sending message:', error);
      
      const errorMessage = {
        type: 'bot',
        content: 'I apologize, but I encountered an error processing your request. Please try again. If the problem persists, please check your connection or contact support.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get AI response: ' + (error.response?.data?.message || error.message));
      setError('Failed to send message. Please try again.');
      
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press for sending messages
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Start new conversation
  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    
    if (selectedClient) {
      const welcomeMessage = {
        type: 'bot',
        content: `Starting a new conversation about ${selectedClient.name}'s financial planning. How can I help you today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  };

  // Render client financial summary
  const renderClientSummary = () => {
    if (!clientContext || isLoadingContext) return null;

    const { clientInfo, financialSituation, debtPortfolio, investmentPortfolio } = clientContext;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-blue-900 mb-2">Client Financial Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-blue-700 font-medium">Monthly Income</p>
            <p className="text-blue-900">₹{financialSituation.monthlyIncome?.toLocaleString() || '0'}</p>
          </div>
          <div>
            <p className="text-blue-700 font-medium">Monthly Expenses</p>
            <p className="text-blue-900">₹{financialSituation.monthlyExpenses?.toLocaleString() || '0'}</p>
          </div>
          <div>
            <p className="text-blue-700 font-medium">Net Worth</p>
            <p className="text-blue-900">₹{clientContext.netWorth?.toLocaleString() || '0'}</p>
          </div>
          <div>
            <p className="text-blue-700 font-medium">Risk Profile</p>
            <p className="text-blue-900">{clientInfo.riskProfile || 'Not assessed'}</p>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoadingClients) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat with RichieAI</h1>
        <p className="text-gray-600">Get AI-powered financial advice based on your client's complete financial profile</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {!selectedClient ? (
        // Client Selection Screen
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <MessageCircle className="mr-2 h-5 w-5 text-blue-600" />
              Select a Client to Start Chatting
            </h2>
            <button
              onClick={loadClients}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <div
                key={client._id}
                onClick={() => handleClientSelect(client)}
                className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {client.firstName?.[0]}{client.lastName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {client.firstName} {client.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{client.email}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Income:</span>
                    <span className="font-medium">₹{(client.monthlyIncome || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Portfolio Value:</span>
                    <span className="font-medium">₹{(client.portfolioValue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk Profile:</span>
                    <span className="font-medium">{client.riskProfile || 'Not assessed'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {clients.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No clients found. Add some clients first to start chatting.</p>
              <button
                onClick={loadClients}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry Loading
              </button>
            </div>
          )}
        </div>
      ) : (
        // Chat Interface
        <div className="bg-white rounded-lg shadow-md h-[700px] flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {selectedClient.firstName?.[0]}{selectedClient.lastName?.[0]}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedClient.firstName} {selectedClient.lastName}
                </h3>
                <p className="text-sm text-gray-600">
                  {currentConversationId ? 'Active Conversation' : 'Financial Consultation'}
                  {isLoadingContext && ' • Loading context...'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {conversationHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="View chat history"
                >
                  <History className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={startNewConversation}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                New Chat
              </button>
              <button
                onClick={() => {
                  setSelectedClient(null);
                  setMessages([]);
                  setCurrentConversationId(null);
                  setClientContext(null);
                  setConversationHistory([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Client Financial Summary */}
          {renderClientSummary()}

          {/* Chat History Sidebar */}
          {showHistory && conversationHistory.length > 0 && (
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-2">Recent Conversations</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {conversationHistory.map((conv) => (
                  <button
                    key={conv.conversationId}
                    onClick={() => loadConversationMessages(conv.conversationId)}
                    className={`w-full text-left p-2 rounded text-xs hover:bg-white transition-colors ${
                      currentConversationId === conv.conversationId ? 'bg-white border border-blue-200' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">{conv.title}</div>
                    <div className="text-gray-500">{conv.messageCount} messages • {new Date(conv.lastActivity).toLocaleDateString()}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-4xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-2' : 'mr-2'}`}>
                    {message.type === 'user' ? (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div
                    className={`px-4 py-3 rounded-lg max-w-none ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                    <div className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex">
                  <div className="flex-shrink-0 mr-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="bg-gray-100 px-4 py-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      <span className="text-sm text-gray-500">RichieAI is analyzing and responding...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask about ${selectedClient.firstName}'s financial situation, investment strategies, debt management, or goals...`}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                rows="2"
                disabled={isLoading || isLoadingContext}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading || isLoadingContext}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              RichieAI has access to {selectedClient.firstName}'s complete financial profile for personalized advice
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatRichieAI;