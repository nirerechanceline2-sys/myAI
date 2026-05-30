import React, { useState } from 'react';
import { 
  MessageSquare, Search, Trash2, Menu, X, 
  PanelLeftClose, PanelLeft, Sun, Moon, Sparkles, 
  LayoutGrid, SquarePen, Settings, LogOut, Check
} from 'lucide-react';
import { Conversation, Theme } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
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
  theme,
  onToggleTheme,
  isOpen,
  onToggleOpen
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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

        {/* Footer actions: Upgrade and User bio */}
        <div className={`p-3 border-t flex flex-col gap-2 relative ${
          theme === 'dark' ? 'border-[#2f2f2f]/30' : 'border-neutral-200'
        }`} id="sidebar-footer">
          {isOpen && (
            <>
              {/* Premium ChatGPT upgrade banner mock */}
              <button
                onClick={onNewConversation}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-left font-sans cursor-pointer transition-all border border-transparent ${
                  theme === 'dark'
                    ? 'hover:bg-neutral-800/60 text-[#ececec]'
                    : 'hover:bg-neutral-200/60 text-neutral-800'
                }`}
                id="upgrade-banner"
              >
                <div className={`p-1.5 rounded-full flex items-center justify-center border ${
                  theme === 'dark' ? 'bg-[#212121] border-[#2f2f2f]/50' : 'bg-neutral-100 border-neutral-300'
                }`}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-amber-500">Upgrade Plan</span>
                  <span className="text-[10px] text-neutral-500">Get GPT-4, o1, Dall-E and more</span>
                </div>
              </button>


              {/* Interactive Profile Modal Activator popover */}
              <div className="relative pt-1 border-t border-transparent" id="user-profile-badge-interactive">
                <button
                  onClick={() => setShowProfileMenu((prev) => !prev)}
                  className={`w-full flex items-center justify-between p-1.5 rounded-lg transition-all text-left cursor-pointer focus:outline-none ${
                    theme === 'dark' ? 'hover:bg-neutral-800/60' : 'hover:bg-neutral-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-[#10a37f] text-white flex items-center justify-center text-xs font-bold font-sans flex-shrink-0 shadow-sm uppercase">
                      NC
                    </div>
                    <div className="flex flex-col truncate" id="profile-details">
                      <span className={`text-[13px] font-semibold truncate ${theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>
                        Nirere Chanceline
                      </span>
                      <span className="text-[10px] text-neutral-500 truncate">nirerechanceline2@gmail.com</span>
                    </div>
                  </div>
                  <Settings className="w-4 h-4 text-neutral-500" />
                </button>

                {/* Popover Profile Menu */}
                {showProfileMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 cursor-default" 
                      onClick={() => setShowProfileMenu(false)} 
                    />
                    <div className={`absolute bottom-full left-0 w-full mb-2 p-1.5 rounded-xl border shadow-xl z-50 transition-all duration-200 ${
                      theme === 'dark' 
                        ? 'bg-[#212121] border-[#2f2f2f] text-[#ececec]' 
                        : 'bg-white border-neutral-200 text-neutral-800'
                    }`} id="profile-popover-menu">
                      <div className="px-2.5 py-1.5 border-b border-neutral-800/20 mb-1">
                        <span className="text-[11px] font-semibold text-neutral-500 font-sans tracking-tight block">MY ACCOUNT</span>
                        <span className="text-xs font-medium text-emerald-500 block">Plus Subscriber</span>
                      </div>
                      <button
                        onClick={() => {
                          onNewConversation();
                          setShowProfileMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-2.5 text-xs text-left rounded-lg cursor-pointer ${
                          theme === 'dark' ? 'hover:bg-[#2f2f2f]' : 'hover:bg-[#f4f4f4]'
                        }`}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      <div className="border-t my-1 border-neutral-800/15" />
                      <button
                        onClick={() => setShowProfileMenu(false)}
                        className={`w-full flex items-center gap-2 px-2.5 py-2.5 text-xs text-left rounded-lg cursor-pointer text-red-500 ${
                          theme === 'dark' ? 'hover:bg-[#2f2f2f]' : 'hover:bg-[#f4f4f4]'
                        }`}
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
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
