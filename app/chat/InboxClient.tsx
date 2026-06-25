"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Search, CheckCheck } from "lucide-react";
import Pusher from "pusher-js";
import { useRouter } from "next/navigation";

interface ChatProps {
  id: string;
  displayName: string;
  displayEmail: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
  profilePic?: string | null; 
  avatarUrl?: string | null;
}

export function InboxClient({
  initialChats,
  currentUserId,
}: {
  initialChats: ChatProps[];
  currentUserId: string;
}) {
  const router = useRouter(); // FIX: Added router initialization
  const [chats, setChats] = useState<ChatProps[]>(initialChats);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    
    const channel = pusher.subscribe(`user-${currentUserId}`);
    
    channel.bind("inbox-update", (data: any) => {
      // Force the server to fetch the real data in the background
      router.refresh();

      setChats((currentChats) => {
        const chatIndex = currentChats.findIndex(c => c.id === data.conversationId);
        
        // Clean up the context card string
        const cleanMessage = data.lastMessage?.includes("[SERVICE_CONTEXT]") 
          ? "Sent an inquiry about a service" 
          : data.lastMessage;

        // SAFEGUARD PUSHER DATA: Ensure the socket doesn't inject blank names
        const safeSenderName = data.senderName?.trim() ? data.senderName : "Unknown User";
        
        if (chatIndex > -1) {
          // --- SCENARIO A: Chat already exists. Update it and move to top. ---
          const updatedChat = {
            ...currentChats[chatIndex],
            unreadCount: currentChats[chatIndex].unreadCount + 1,
            lastMessage: cleanMessage,
            lastMessageTime: data.lastMessageTime
          };
          
          const newChats = [...currentChats];
          newChats.splice(chatIndex, 1);
          return [updatedChat, ...newChats];
          
        } else {
          // --- SCENARIO B: Brand new chat! Build a new card and put it at the top. ---
          const newChat: ChatProps = {
            id: data.conversationId,
            displayName: safeSenderName, // Uses the safeguarded name
            displayEmail: data.senderEmail || "No email",
            profilePic: data.senderAvatar || null,
            unreadCount: 1,
            lastMessage: cleanMessage,
            lastMessageTime: data.lastMessageTime
          };
          
          return [newChat, ...currentChats];
        }
      });
    });

    return () => {
      pusher.unsubscribe(`user-${currentUserId}`);
      pusher.disconnect();
    };
  }, [currentUserId, router]);

  const filtered = chats.filter((c) => {
    const safeSearch = (search || "").toLowerCase();
    const safeName = (c.displayName || "Unknown User").toLowerCase();
    const safeEmail = (c.displayEmail || "").toLowerCase();

    return safeName.includes(safeSearch) || safeEmail.includes(safeSearch);
  });

  const totalUnread = chats.reduce((sum, c) => sum + c.unreadCount, 0);

  // Get initials from name
  const getInitials = (name?: string | null) => {
    if (!name || !name.trim()) return "?";
    return name
      .trim()
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase(); 
  };

  // Consistent avatar colour per name
  const avatarColor = (name?: string | null) => {
    const safeName = name?.trim() ? name : "?"; 
    const colors = [
      "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-green-500", 
      "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-blue-500", 
      "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", 
      "bg-pink-500", "bg-rose-500"
    ];
    let hash = 0;
    for (let i = 0; i < safeName.length; i++) {
      hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">Inbox</h2>
            {totalUnread > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {totalUnread}
              </span>
            )}
          </div>
          
          <span className="text-xs text-muted-foreground">{chats.length} conversation{chats.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-muted/40 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-foreground">
              {search ? "No results found" : "No messages yet"}
            </p>
            <p className="text-sm text-muted-foreground max-w-xs">
              {search
                ? `No conversations match "${search}"`
                : "When someone messages you, they'll appear here."}
            </p>
          </div>
        ) : (
          filtered.map((chat) => {
            const hasUnread = chat.unreadCount > 0;
            
            // THE ULTIMATE SAFEGUARD: Guaranteed fallbacks before rendering
            const safeName = chat.displayName?.trim() ? chat.displayName : "Unknown User";
            const safeAvatar = chat.profilePic || chat.avatarUrl || null;

            return (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-muted/40 transition-colors relative group"
              >
                {/* Unread indicator bar */}
                {hasUnread && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-primary rounded-r-full" />
                )}

                {/* Avatar */}
                <div className="relative shrink-0">
                  {safeAvatar ? (
                    <img 
                      src={safeAvatar} 
                      alt={safeName}
                      className="h-11 w-11 rounded-full object-cover border border-border/50"
                    />
                  ) : (
                    <div className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold text-white ${avatarColor(safeName)}`}>
                      {getInitials(safeName)}
                    </div>
                  )}

                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-card">
                      {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <span className={`text-sm truncate ${hasUnread ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                      {safeName}
                    </span>
                    {chat.lastMessageTime && (
                      <span className={`text-[11px] shrink-0 ${hasUnread ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                        {formatTime(chat.lastMessageTime)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs truncate ${hasUnread ? "text-foreground" : "text-muted-foreground"}`}>
                      {chat.lastMessage || chat.displayEmail}
                    </p>
                    {!hasUnread && (
                      <CheckCheck className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Footer */}
      {chats.length > 0 && (
        <div className="px-5 py-3 border-t border-border/40 bg-muted/20">
          <p className="text-[11px] text-center text-muted-foreground/60">
            Messages are end-to-end encrypted
          </p>
        </div>
      )}

    </div>
  );
}