export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { conversations, users, messages } from "@/drizzle/schema";
import { eq, asc, or, and, ne, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { auth } from "@/auth";
import { ChatClient } from "./ChatClient";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Please log in to view this chat.</p>
        </div>
      </div>
    );
  }

  const currentUserId = session.user.id;
  const resolvedParams = await params;
  const conversationId = resolvedParams.conversationId;

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation || (conversation.userA !== currentUserId && conversation.userB !== currentUserId)) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Chat not found or unauthorized.</p>
        </div>
      </div>
    );
  }

  const otherUserId = conversation.userA === currentUserId ? conversation.userB : conversation.userA;

  // Fetch all three data sources in parallel
  const userA_table = alias(users, "userA_table");
  const userB_table = alias(users, "userB_table");

  const [otherUserResult, chatHistory, rawChats] = await Promise.all([
    db.select().from(users).where(eq(users.id, otherUserId)).limit(1),
    db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt)),
    db
      .select({ id: conversations.id, userA: userA_table, userB: userB_table })
      .from(conversations)
      .leftJoin(userA_table, eq(conversations.userA, userA_table.id))
      .leftJoin(userB_table, eq(conversations.userB, userB_table.id))
      .where(or(eq(conversations.userA, currentUserId), eq(conversations.userB, currentUserId))),
  ]);

  const otherUser = otherUserResult[0];

  // Process sidebar chats
  const sidebarChats = await Promise.all(
    rawChats.map(async (chat) => {
      const other = chat.userA?.id === currentUserId ? chat.userB : chat.userA;
      const unreadMsgs = await db
        .select({ id: messages.id })
        .from(messages)
        .where(and(eq(messages.conversationId, chat.id), ne(messages.senderId, currentUserId), isNull(messages.readAt)));
      return {
        id: chat.id,
        displayName: other?.displayName || other?.name || "Unknown User",
        displayEmail: other?.email || "",
        avatarUrl: other?.avatarUrl || other?.image || null,
        unreadCount: unreadMsgs.length,
      };
    })
  );

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      <SiteHeader />
      <main className="flex-1 overflow-hidden flex">
        <ChatClient
          conversationId={conversationId}
          initialMessages={chatHistory}
          otherUser={{
            name: otherUser?.name || "Unknown User",
            email: otherUser?.email || "No email",
            avatarUrl: otherUser?.avatarUrl || null,
          }}
          sidebarChats={sidebarChats}
          currentUserId={currentUserId}
        />
      </main>
    </div>
  );
}