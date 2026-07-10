"use client";

import React, { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, CheckCheck, ArrowLeft, X, Briefcase, Pencil, Check, Search, MessageSquare } from "lucide-react";
import { sendMessage, markMessagesAsRead, editMessage } from "@/app/actions/messages";
import { getServiceContext, getJobContext } from "@/app/actions/chat";
import Link from "next/link";

interface SidebarChat {
  id: string;
  displayName: string;
  displayEmail: string;
  avatarUrl: string | null;
  unreadCount: number;
}

const getInitials = (name: string) =>
  name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

const avatarColor = (name: string) => {
  const colors = ["bg-red-500","bg-orange-500","bg-amber-500","bg-green-500","bg-emerald-500","bg-teal-500","bg-cyan-500","bg-blue-500","bg-indigo-500","bg-violet-500","bg-purple-500","bg-pink-500"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

function ChatSidebar({ chats, activeId }: { chats: SidebarChat[]; activeId: string }) {
  const [search, setSearch] = useState("");
  const filtered = chats.filter((c) => {
    const q = search.toLowerCase();
    return c.displayName.toLowerCase().includes(q) || c.displayEmail.toLowerCase().includes(q);
  });

  return (
    <div className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 border-r border-border/60 bg-card h-full">
      {/* Sidebar header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">Messages</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-9 pr-3 rounded-lg border border-input bg-muted/40 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/30">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
            <MessageSquare className="h-7 w-7 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">No conversations</p>
          </div>
        ) : (
          filtered.map((chat) => {
            const isActive = chat.id === activeId;
            const name = chat.displayName || "Unknown";
            return (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className={`flex items-center gap-3 px-4 py-3 transition-colors relative ${
                  isActive ? "bg-primary/10" : "hover:bg-muted/40"
                }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-primary rounded-r-full" />}
                <div className="relative shrink-0">
                  {chat.avatarUrl ? (
                    <img src={chat.avatarUrl} alt={name} className="h-10 w-10 rounded-full object-cover border border-border/50" />
                  ) : (
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white ${avatarColor(name)}`}>
                      {getInitials(name)}
                    </div>
                  )}
                  {chat.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-card">
                      {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${chat.unreadCount > 0 ? "font-bold text-foreground" : "font-medium text-foreground"} ${isActive ? "text-primary" : ""}`}>
                    {name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{chat.displayEmail}</p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

export function ChatClient({
  conversationId,
  initialMessages,
  otherUser,
  sidebarChats = [],
  currentUserId: _currentUserId,
}: {
  conversationId: string;
  initialMessages: any[];
  otherUser: { name: string; email: string; avatarUrl: string | null };
  sidebarChats?: SidebarChat[];
  currentUserId?: string;
}) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const searchParams = useSearchParams();
  const serviceId = searchParams?.get("serviceId");
  const jobId = searchParams?.get("jobId");
  const [context, setContext] = useState<any>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { if (conversationId) markMessagesAsRead(conversationId); }, [conversationId]);

  useEffect(() => {
    if (serviceId) getServiceContext(serviceId).then((d) => d && setContext({ ...d, type: "service" }));
    else if (jobId) getJobContext(jobId).then((d) => d && setContext(d));
  }, [serviceId, jobId]);

  // Pusher — real-time new messages + edits
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`chat-${conversationId}`);

    channel.bind("new-message", (newMsg: any) => {
      setMessages((prev) => prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
    });

    channel.bind("message-edited", ({ id, body, editedAt }: { id: string; body: string; editedAt: string }) => {
      setMessages((prev) => prev.map((m) => m.id === id ? { ...m, body, content: body, editedAt } : m));
    });

    return () => { pusher.unsubscribe(`chat-${conversationId}`); pusher.disconnect(); };
  }, [conversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!input.trim() || isSending) return;

    let messageText = input.trim();
    if (context) {
      const img = context.images?.[0] || context.image || "";
      messageText = `[SERVICE_CONTEXT]${context.title}|||${img}[/SERVICE_CONTEXT]\n${messageText}`;
    }

    const tempInput = input;
    setInput("");
    setIsSending(true);
    try {
      await sendMessage(conversationId, messageText);
      setContext(null);
    } catch {
      setInput(tempInput);
    } finally {
      setIsSending(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  const startEdit = (msg: any) => {
    setEditingId(msg.id);
    setEditInput(msg.body || msg.content || "");
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const cancelEdit = () => { setEditingId(null); setEditInput(""); };

  const handleSaveEdit = async (msgId: string) => {
    if (!editInput.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      await editMessage(msgId, editInput.trim());
      setMessages((prev) =>
        prev.map((m) => m.id === msgId ? { ...m, body: editInput.trim(), content: editInput.trim(), editedAt: new Date().toISOString() } : m)
      );
      cancelEdit();
    } catch (err: any) {
      alert(err?.message || "Could not edit message");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatTime = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ChatSidebar chats={sidebarChats} activeId={conversationId} />
    <div className="flex flex-col flex-1 bg-background border-x border-border/40 overflow-hidden lg:border-l-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-card/50 shadow-sm z-10">
        <Link href="/chat" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-border/50 shrink-0">
          {otherUser.avatarUrl
            ? <img src={otherUser.avatarUrl} className="h-full w-full object-cover" />
            : <span className="text-sm font-bold text-primary">{otherUser.name?.[0]?.toUpperCase()}</span>}
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground leading-none">{otherUser.name}</h2>
          <p className="text-xs text-muted-foreground">{otherUser.email}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-muted/10 px-4 py-6 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          let content = msg.body || msg.content || "";
          let attachedContext: { title: string; image: string } | null = null;

          if (typeof content === "string" && content.startsWith("[SERVICE_CONTEXT]")) {
            const [data, ...rest] = content.split("[/SERVICE_CONTEXT]\n");
            const [title, image] = data.replace("[SERVICE_CONTEXT]", "").split("|||");
            attachedContext = { title, image };
            content = rest.join("");
          }

          const canEdit = isMe && !msg.readAt;
          const isEditing = editingId === msg.id;

          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className="group relative max-w-[72%]">
                {/* Edit button — appears on hover for own unread messages */}
                {canEdit && !isEditing && (
                  <button
                    onClick={() => startEdit(msg)}
                    className={`absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted`}
                    title="Edit message"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}

                <div className={`px-3.5 py-2.5 text-sm rounded-2xl shadow-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-card border border-border/60"}`}>
                  {/* Attached service context card */}
                  {attachedContext && (
                    <div className={`mb-2.5 p-2 rounded-lg border flex items-center gap-3 ${isMe ? "bg-primary-foreground/10 border-primary-foreground/20" : "bg-muted/50 border-border/50"}`}>
                      <div className="h-10 w-14 rounded overflow-hidden bg-background/50 flex items-center justify-center shrink-0">
                        {attachedContext.image
                          ? <img src={attachedContext.image} className="h-full w-full object-cover" />
                          : <Briefcase className="h-4 w-4 opacity-50" />}
                      </div>
                      <div className="text-xs font-semibold truncate">{attachedContext.title}</div>
                    </div>
                  )}

                  {/* Inline edit input */}
                  {isEditing ? (
                    <div className="flex items-center gap-2 min-w-[180px]">
                      <input
                        ref={editInputRef}
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(msg.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="flex-1 bg-transparent border-b border-primary-foreground/40 outline-none text-sm text-primary-foreground placeholder:text-primary-foreground/50 py-0.5"
                      />
                      <button onClick={() => handleSaveEdit(msg.id)} disabled={isSavingEdit} className="opacity-80 hover:opacity-100">
                        {isSavingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={cancelEdit} className="opacity-80 hover:opacity-100">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    content
                  )}

                  {/* Timestamp + read receipt + edited label */}
                  <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                    {msg.editedAt && (
                      <span className="text-[10px] opacity-50 italic">edited</span>
                    )}
                    <span className="text-[10px] opacity-70">{formatTime(msg.createdAt)}</span>
                    {isMe && <CheckCheck className={`h-3 w-3 ${msg.readAt ? "text-green-500" : "opacity-40"}`} />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t border-border/60 bg-card p-4">
        {context && (
          <div className="mb-3 p-2.5 bg-muted/40 border border-border/60 rounded-lg flex items-center gap-3">
            <div className="h-10 w-14 bg-background rounded flex items-center justify-center shrink-0 border border-border/50 overflow-hidden">
              {(context.images?.[0] || context.image)
                ? <img src={context.images?.[0] || context.image} className="h-full w-full object-cover" />
                : <Briefcase className="h-4 w-4 opacity-50" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-primary uppercase">Replying to {context.type}</p>
              <p className="text-sm font-semibold truncate">{context.title}</p>
            </div>
            <Button variant="ghost" size="icon" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setContext(null); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="rounded-full h-10"
          />
          <Button type="submit" disabled={isSending} className="rounded-full h-10 w-10">
            {isSending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
    </div>
  );
}
