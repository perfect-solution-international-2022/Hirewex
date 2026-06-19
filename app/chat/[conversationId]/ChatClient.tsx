"use client";

import React, { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Smile, Paperclip, CheckCheck, ArrowLeft, X, Briefcase } from "lucide-react";
import { sendMessage, markMessagesAsRead, clearChatHistory } from "@/app/actions/messages";
import { getServiceContext, getJobContext } from "@/app/actions/chat"; 
import Link from "next/link";

export function ChatClient({
  conversationId,
  initialMessages,
  otherUser,
}: {
  conversationId: string;
  initialMessages: any[];
  otherUser: { name: string; email: string; avatarUrl: string | null };
}) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // 1. Read the URL parameters
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  const jobId = searchParams.get("jobId");
  const [context, setContext] = useState<any>(null);

  // FIX 1: We use a ref for the scrollable container instead of the invisible bottom div
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // FIX 2: Explicitly scroll ONLY the container, preventing the whole page from moving
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversationId) markMessagesAsRead(conversationId);
  }, [conversationId]);

  // 2. Fetch the Context Card data on load
  useEffect(() => {
    if (serviceId) {
      getServiceContext(serviceId).then((data) => {
        if (data) setContext({ ...data, type: 'service' });
      });
    } else if (jobId) {
      getJobContext(jobId).then((data) => {
        if (data) setContext(data); // Already includes type: 'job' from our new action
      });
    }
  }, [serviceId, jobId]);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`chat-${conversationId}`);
    channel.bind("new-message", (newMessage: any) => {
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    });
    return () => { pusher.unsubscribe(`chat-${conversationId}`); pusher.disconnect(); };
  }, [conversationId]);

  // 3. Send the message with the Context Card attached
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
      setContext(null); // Clear the card only after success
    } catch (err) {
      console.error("SendMessage action failed:", err);
      setInput(tempInput);
    } finally {
      setIsSending(false);
      // FIX 3: Add `preventScroll: true` so re-focusing the input doesn't jerk the page down
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  const formatTime = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  const formatDivider = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toDateString() === new Date().toDateString() ? `Today at ${formatTime(dateStr)}` : d.toLocaleDateString([], { month: "short", day: "numeric" }) + ` at ${formatTime(dateStr)}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-card/50 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="md:hidden text-muted-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-border/50">
            {otherUser.avatarUrl ? <img src={otherUser.avatarUrl} className="h-full w-full object-cover" /> : <span className="text-sm font-bold text-primary">{otherUser.name?.[0]?.toUpperCase()}</span>}
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground leading-none">{otherUser.name}</h2>
            <p className="text-xs text-muted-foreground">{otherUser.email}</p>
          </div>
        </div>
      </div>

      {/* FIX 4: Added the ref specifically to this scrollable div */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-muted/10 px-4 py-6 space-y-4">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUserId;
          let content = msg.content || msg.body || "";
          let attachedContext = null;
          
          // Parse context cards inside old messages
          if (typeof content === 'string' && content.startsWith("[SERVICE_CONTEXT]")) {
            const [data, ...rest] = content.split("[/SERVICE_CONTEXT]\n");
            const [title, image] = data.replace("[SERVICE_CONTEXT]", "").split("|||");
            attachedContext = { title, image };
            content = rest.join("");
          }

          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`px-3.5 py-2.5 text-sm rounded-2xl max-w-[72%] shadow-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-card border border-border/60"}`}>
                
                {/* Visual Card inside the chat bubble */}
                {attachedContext && (
                  <div className={`mb-2.5 p-2 rounded-lg border flex items-center gap-3 ${isMe ? "bg-primary-foreground/10 border-primary-foreground/20" : "bg-muted/50 border-border/50"}`}>
                    <div className="h-10 w-14 rounded overflow-hidden bg-background/50 flex items-center justify-center shrink-0">
                      {attachedContext.image ? <img src={attachedContext.image} className="h-full w-full object-cover" /> : <Briefcase className="h-4 w-4 opacity-50" />}
                    </div>
                    <div className="text-xs font-semibold truncate">{attachedContext.title}</div>
                  </div>
                )}
                
                {content}
                
                <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                   <span className="text-[10px] opacity-70">{formatTime(msg.createdAt)}</span>
                   {isMe && <CheckCheck className={`h-3 w-3 ${msg.readAt ? "text-green-500" : "opacity-40"}`} />}
                </div>
              </div>
            </div>
          );
        })}
        {/* We no longer need the empty div at the bottom! */}
      </div>

      <div className="border-t border-border/60 bg-card p-4">
        {/* 4. THE STICKY CONTEXT CARD UI */}
        {context && (
          <div className="mb-3 p-2.5 bg-muted/40 border border-border/60 rounded-lg flex items-center gap-3">
             <div className="h-10 w-14 bg-background rounded flex items-center justify-center shrink-0 border border-border/50 overflow-hidden">
               {(context.images?.[0] || context.image) ? (
                 <img src={context.images?.[0] || context.image} className="h-full w-full object-cover" />
               ) : (
                 <Briefcase className="h-4 w-4 opacity-50"/>
               )}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-[10px] font-bold text-primary uppercase">Replying to {context.type}</p>
               <p className="text-sm font-semibold truncate">{context.title}</p>
             </div>
             <Button variant="ghost" size="icon" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setContext(null); }}><X className="h-4 w-4"/></Button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…" className="rounded-full h-10" />
          <Button type="submit" disabled={isSending} className="rounded-full h-10 w-10">
            {isSending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}