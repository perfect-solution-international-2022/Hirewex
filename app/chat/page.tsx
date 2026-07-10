export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { conversations, users, messages } from "@/drizzle/schema";
import { eq, or, and, ne, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { auth } from "@/auth";
import { InboxClient } from "./InboxClient";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MessageSquare } from "lucide-react";

export default async function ChatListPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Please log in to view your messages.</p>
        </div>
      </div>
    );
  }

  const currentUserId = session.user.id;
  const userA_table = alias(users, "userA_table");
  const userB_table = alias(users, "userB_table");

  const rawChats = await db
    .select({ id: conversations.id, userA: userA_table, userB: userB_table })
    .from(conversations)
    .leftJoin(userA_table, eq(conversations.userA, userA_table.id))
    .leftJoin(userB_table, eq(conversations.userB, userB_table.id))
    .where(or(eq(conversations.userA, currentUserId), eq(conversations.userB, currentUserId)));

  const processedChats = await Promise.all(
    rawChats.map(async (chat) => {
      const otherUser = chat.userA?.id === currentUserId ? chat.userB : chat.userA;
      const finalName = otherUser?.displayName || otherUser?.name || "Unknown User";
      const unreadMsgs = await db
        .select({ id: messages.id })
        .from(messages)
        .where(and(eq(messages.conversationId, chat.id), ne(messages.senderId, currentUserId), isNull(messages.readAt)));
      return {
        id: chat.id,
        name: finalName,
        displayName: finalName,
        displayEmail: otherUser?.email || "",
        avatarUrl: otherUser?.avatarUrl || otherUser?.image || null,
        profilePic: otherUser?.avatarUrl || otherUser?.image || null,
        unreadCount: unreadMsgs.length,
      };
    })
  );

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      <SiteHeader />
      <div className="flex flex-1 overflow-hidden">
        {/* Left: conversation list */}
        <div className="w-full max-w-xs xl:max-w-sm shrink-0 border-r border-border/60 flex flex-col overflow-hidden">
          <InboxClient initialChats={processedChats} currentUserId={currentUserId} />
        </div>

        {/* Right: empty state */}
        <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-4 bg-muted/10">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <MessageSquare className="h-9 w-9 text-muted-foreground/30" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">Your messages</p>
            <p className="text-sm text-muted-foreground mt-1">Select a conversation to start chatting</p>
          </div>
        </div>
      </div>
    </div>
  );
}