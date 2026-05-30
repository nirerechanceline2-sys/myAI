import React, { useState } from 'react';
import { 
  MessageSquare, Search, Trash2, Menu, X, 
  PanelLeftClose, PanelLeft, Sun, Moon, Sparkles, 
  LayoutGrid, SquarePen, Settings, LogOut, Check, Pencil
} from 'lucide-react';
import { Conversation, Theme } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  theme: Theme;
  onToggleTheme: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  theme,
  onToggleTheme,
  isOpen,
  onToggleOpen
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Search filter
  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Grouping algorithms mimicking ChatGPT's historic timeline view
  const groupConversations = (list: Conversation[]) => {
    const now = new Date();
    // Sets start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOfSevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfThirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups: { [key: string]: Conversation[] } = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      Older: []
    };

    list.forEach((chat) => {
      const chatDate = new Date(chat.lastActiveAt || chat.createdAt);
      if (chatDate >= startOfToday) {
        groups['Today'].push(chat);
      } else if (chatDate >= startOfYesterday) {
        groups['Yesterday'].push(chat);
      } else if (chatDate >= startOfSevenDaysAgo) {
        groups['Previous 7 Days'].push(chat);
      } else if (chatDate >= startOfThirtyDaysAgo) {
        groups['Previous 30 Days'].push(chat);
      } else {
        groups['Older'].push(chat);
      }
    });

    const timeline: { label: string; items: Conversation[] }[] = [];
    if (groups['Today'].length > 0) timeline.push({ label: 'Today', items: groups['Today'] });
    if (groups['Yesterday'].length > 0) timeline.push({ label: 'Yesterday', items: groups['Yesterday'] });
    if (groups['Previous 7 Days'].length > 0) timeline.push({ label: 'Previous 7 Days', items: groups['Previous 7 Days'] });
    if (groups['Previous 30 Days'].length > 0) timeline.push({ label: 'Previous 30 Days', items: groups['Previous 30 Days'] });
    if (groups['Older'].length > 0) timeline.push({ label: 'Older', items: groups['Older'] });

    return timeline;
  };

  const timelineGroups = groupConversations(filteredConversations);

  return (
    <>
      {/* Mobile Toggle Drawer Header - Only visible when header or sidebar needs opening on smaller viewports */}
      <div className="md:hidden fixed top-3.5 left-3.5 z-50 select-none" id="mobile-toggle-wrapper">
        <button
          onClick={onToggleOpen}
          id="mobile-sidebar-toggle-btn"
          className="p-2.5 rounded-xl bg-white text-neutral-700 hover:text-neutral-900 border border-neutral-200 transition-all shadow-md focus:outline-none cursor-pointer"
        >
          {isOpen ? <X className="w-5 h-5" strokeWidth={2} /> : <Menu className="w-5 h-5" strokeWidth={2} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        id="sidebar-container"
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col h-full border-r transition-all duration-300 ease-in-out select-none ${
          isOpen ? 'w-[260px] translate-x-0' : 'w-0 -translate-x-full md:w-0'
        } ${
          theme === 'dark' 
            ? 'border-[#2f2f2f]/30 bg-[#171717] text-[#ececec]' 
            : 'border-neutral-200 bg-[#f9f9f9] text-neutral-800'
        }`}
      >
        {/* Header containing Sidebar collapse toggle and New Chat button */}
        <div className="flex items-center justify-between px-3.5 py-4 h-[60px]" id="sidebar-header">
          {/* Sidebar Left collapse triggers */}
          <button
            onClick={onToggleOpen}
            id="desktop-collapse-sidebar-btn"
            className={`p-2 rounded-lg transition-all cursor-pointer focus:outline-none ${
              theme === 'dark' ? 'hover:bg-neutral-800/80 text-neutral-400 hover:text-neutral-200' : 'hover:bg-neutral-200/80 text-neutral-600 hover:text-neutral-900'
            }`}
            title="Close sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>

          {/* New Chat icon on the right (matching ChatGPT style) */}
          <button
            onClick={onNewConversation}
            className={`p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer focus:outline-none ${
              theme === 'dark' ? 'hover:bg-neutral-800/80 text-neutral-400 hover:text-neutral-200' : 'hover:bg-neutral-200/80 text-neutral-600 hover:text-neutral-900'
            }`}
            title="New Chat"
            id="new-chat-btn-top"
          >
            <SquarePen className="w-5 h-5" />
          </button>
        </div>

        {/* Explore GPTs permanent ChatGPT entry row */}
        {isOpen && (
          <div className="px-3 mb-2" id="explore-gpts-shortcut">
            <button
              onClick={onNewConversation}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all focus:outline-none text-left cursor-pointer border border-transparent ${
                theme === 'dark'
                  ? 'hover:bg-neutral-800/60 text-neutral-200'
                  : 'hover:bg-neutral-200/65 text-neutral-800'
              }`}
            >
              <div className={`p-1.5 rounded-full flex items-center justify-center ${
                theme === 'dark' ? 'bg-[#2f2f2f]' : 'bg-neutral-200'
              }`}>
                <LayoutGrid className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
              </div>
              <span className="font-sans font-medium text-[13px]">Explore GPTs</span>
            </button>
          </div>
        )}

        {/* Search Input, stylized nicely */}
        {isOpen && (
          <div className="px-3.5 mb-2.5" id="sidebar-search-box">
            <div className="relative flex items-center" id="search-input-wrapper">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full rounded-lg pl-9 pr-8 py-2 text-xs outline-none focus:outline-none transition-all font-sans ${
                  theme === 'dark'
                    ? 'bg-[#212121] text-[#ececec] placeholder-gray-500 border border-transparent focus:border-neutral-700'
                    : 'bg-neutral-200/60 text-neutral-850 placeholder-neutral-400 border border-transparent focus:border-neutral-300'
                }`}
                id="search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 text-neutral-500 hover:text-neutral-350 text-xs focus:outline-none cursor-pointer"
                  id="clear-search-btn"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Grouped Conversations Listing - ChatGPT-style */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4 mb-4 scrollbar-thin" id="sidebar-history-container">
          {isOpen && (
            timelineGroups.length > 0 ? (
              timelineGroups.map((group) => (
                <div key={group.label} className="space-y-1.5" id={`group-timeline-${group.label}`}>
                  {/* Timeline section header */}
                  <h4 className={`px-3 text-[11px] font-semibold tracking-wide font-sans select-none capitalize ${
                    theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400'
                  }`}>
                    {group.label}
                  </h4>
                  
                  {/* Conversations under target epoch */}
                  <div className="space-y-0.5">
                    {group.items.map((c) => {
                      const isActive = c.id === activeConversationId;
                      const isEditing = editingChatId === c.id;

                      if (isEditing) {
                        return (
                          <div
                            key={c.id}
                            id={`chat-item-wrapper-${c.id}`}
                            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 border transition-all ${
                              theme === 'dark'
                                ? 'bg-[#212121] border-neutral-700 text-white'
                                : 'bg-white border-neutral-300 text-neutral-900'
                            }`}
                          >
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  onRenameConversation(c.id, editTitle);
                                  setEditingChatId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingChatId(null);
                                }
                              }}
                              autoFocus
                              className="flex-1 bg-transparent text-[13px] outline-none border-none py-0.5 font-sans"
                              id={`edit-chat-input-${c.id}`}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRenameConversation(c.id, editTitle);
                                setEditingChatId(null);
                              }}
                              className="p-1 rounded text-emerald-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                              title="Save title"
                              id={`save-rename-btn-${c.id}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChatId(null);
                              }}
                              className="p-1 rounded text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                              title="Cancel"
                              id={`cancel-rename-btn-${c.id}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={c.id}
                          id={`chat-item-wrapper-${c.id}`}
                          className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-150 text-left cursor-pointer border border-transparent ${
                            isActive
                              ? theme === 'dark'
                                ? 'bg-[#212121]/90 text-white'
                                : 'bg-neutral-200/80 text-neutral-900'
                              : theme === 'dark'
                                ? 'text-neutral-350 hover:bg-[#212121]/40 hover:text-white'
                                : 'text-neutral-650 hover:bg-neutral-205/60 hover:text-neutral-900'
                          }`}
                        >
                          <button
                            onClick={() => onSelectConversation(c.id)}
                            className="flex-1 flex items-center gap-2.5 overflow-hidden text-left focus:outline-none cursor-pointer"
                            id={`chat-select-btn-${c.id}`}
                          >
                            <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-500' : 'text-neutral-500'}`} />
                            <span className="truncate font-sans font-medium text-[13px] leading-tight">
                              {c.title}
                            </span>
                          </button>
                          
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChatId(c.id);
                                setEditTitle(c.title);
                              }}
                              className={`p-1 rounded-md transition-all focus:outline-none cursor-pointer md:opacity-0 group-hover:opacity-100 ${
                                theme === 'dark' ? 'hover:bg-[#2f2f2f] text-neutral-400 hover:text-white' : 'hover:bg-neutral-200 text-neutral-500 hover:text-black'
                              }`}
                              title="Rename Conversation"
                              id={`rename-chat-btn-${c.id}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteConversation(c.id);
                              }}
                              className={`p-1 rounded-md transition-all focus:outline-none cursor-pointer md:opacity-0 group-hover:opacity-100 ${
                                theme === 'dark' ? 'hover:bg-[#2f2f2f] text-neutral-500 hover:text-red-400' : 'hover:bg-neutral-200 text-neutral-400 hover:text-red-500'
                              }`}
                              title="Delete Conversation"
                              id={`delete-chat-btn-${c.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-neutral-500 font-sans" id="no-history-msg">
                {searchTerm ? 'No results found' : 'No chat history'}
              </div>
            )
          )}
        </div>

        {/* Footer actions: upgrade and profile removed per user request */}
        <div className={`p-4 border-t flex items-center justify-between select-none ${
          theme === 'dark' ? 'border-[#2f2f2f]/30' : 'border-neutral-200'
        }`} id="sidebar-footer">
          {isOpen && (
            <>
              <span className={`text-[12px] font-sans font-medium tracking-wide ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-500'}`}>
                Simple AI Assistant
              </span>
              <button
                onClick={onToggleTheme}
                className={`p-2 rounded-xl transition-all cursor-pointer focus:outline-none flex items-center justify-center border ${
                  theme === 'dark'
                    ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-neutral-700'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:text-black hover:bg-neutral-50 hover:border-neutral-300'
                }`}
                title={theme === 'dark' ? "Toggle Light Mode" : "Toggle Dark Mode"}
                id="toggle-theme-btn"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-500" />
                )}
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Screen Backdrop Overlay on Mobile */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          id="mobile-sidebar-backdrop"
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-30 select-none cursor-pointer"
        />
      )}
    </>
  );
}
