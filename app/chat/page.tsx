export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { conversations, users, messages } from "@/drizzle/schema";
import { eq, or, and, ne, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { auth } from "@/auth";
import { InboxClient } from "./InboxClient";

// 1. Import your header and footer
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader";

export default async function ChatListPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return (
      // Added layout wrapper to the logged-out state as well
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Please log in to view your messages.</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const currentUserId = session.user.id;

  // 1. Create table aliases to join the users table twice (for sender and recipient)
  const userA_table = alias(users, "userA_table");
  const userB_table = alias(users, "userB_table");

  // 2. Fetch all conversations involving the current logged-in user
  const rawChats = await db
    .select({
      id: conversations.id,
      userA: userA_table,
      userB: userB_table,
    })
    .from(conversations)
    .leftJoin(userA_table, eq(conversations.userA, userA_table.id))
    .leftJoin(userB_table, eq(conversations.userB, userB_table.id))
    .where(
      or(
        eq(conversations.userA, currentUserId),
        eq(conversations.userB, currentUserId)
      )
    );

  // 3. Process each chat to find the other user's profile info and get the unread count
  const processedChats = await Promise.all(
    rawChats.map(async (chat) => {
      // Determine which participant is the other user
      const otherUser = chat.userA?.id === currentUserId ? chat.userB : chat.userA;
      
      // Also checking displayName just in case!
      const finalName = otherUser?.displayName || otherUser?.name || "Unknown User";
      const displayEmail = otherUser?.email || "No email available";
      
      // FIX: Check both avatarUrl AND image (where OAuth pictures are stored)
      const finalAvatar = otherUser?.avatarUrl || otherUser?.image || null;
      
      // Count unread messages in this conversation sent by the other user
      const unreadMsgs = await db
        .select({ id: messages.id })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, chat.id),
            ne(messages.senderId, currentUserId), 
            isNull(messages.readAt) // Uses the fixed camelCase property name            
          )
        );

      return {
        id: chat.id,
        // PASS BOTH KEYS: This bulletproofs it against the InboxClient
        name: finalName,
        displayName: finalName,
        displayEmail: displayEmail,
        avatarUrl: finalAvatar, 
        profilePic: finalAvatar,
        unreadCount: unreadMsgs.length,
      };
    })
  );

  return (
    // 2. Wrapped the inbox in the layout structure
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      
      <main className="container mx-auto p-6 max-w-4xl flex-1 flex flex-col h-full">
        <InboxClient 
          initialChats={processedChats} 
          currentUserId={currentUserId} 
        />
      </main>

      <SiteFooter />
    </div>
  );
}