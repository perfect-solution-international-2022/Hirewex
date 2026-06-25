export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { conversations, users, messages } from "@/drizzle/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/auth";
import { ChatClient } from "./ChatClient";

// Import your header and footer to match the Inbox layout
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader"; 

// NOTE: In Next.js 15, params is a Promise that must be awaited.
export default async function ChatRoomPage({ 
  params 
}: { 
  params: Promise<{ conversationId: string }> 
}) {
  const session = await auth();
  
  // 1. Not Logged In State
  if (!session?.user?.id) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Please log in to view this chat.</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const currentUserId = session.user.id;
  
  // 2. Await the params to prevent the "undefined ID" bug
  const resolvedParams = await params;
  const conversationId = resolvedParams.conversationId;

  // 3. Fetch the conversation details
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  // 4. Security Check: Does this chat exist, and is this user allowed in it?
  if (!conversation || (conversation.userA !== currentUserId && conversation.userB !== currentUserId)) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Chat not found or unauthorized.</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  // 5. Fetch the OTHER user's profile data for the Header
  const otherUserId = conversation.userA === currentUserId ? conversation.userB : conversation.userA;
  const [otherUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, otherUserId))
    .limit(1);

  // 6. Fetch the chat history, oldest messages first
  const chatHistory = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt)); 

  // 7. Render the Chat Room — full-viewport, no footer
  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      <SiteHeader />
      <main className="flex-1 overflow-hidden flex justify-center">
        <div className="w-full max-w-3xl flex flex-col overflow-hidden">
          <ChatClient
            conversationId={conversationId}
            initialMessages={chatHistory}
            otherUser={{
              name: otherUser?.name || "Unknown User",
              email: otherUser?.email || "No email",
              avatarUrl: otherUser?.avatarUrl || null,
            }}
          />
        </div>
      </main>
    </div>
  );
}