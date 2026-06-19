"use server";

import { db } from "@/lib/db";
import { messages, conversations, users } from "@/drizzle/schema"; 
import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher";
import crypto from "crypto";
import { and, eq, ne, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- HELPER: Formats JS Date to MySQL DATETIME (YYYY-MM-DD HH:MM:SS) ---
const toMySQLDate = (date: Date) => date.toISOString().slice(0, 19).replace("T", " ");

export async function sendMessage(conversationId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const messageId = crypto.randomUUID();
  const now = new Date();
  
  // Safely formatted for MySQL
  const mysqlTimestamp = toMySQLDate(now);

  try {
    // 1. Insert into database
    await db.insert(messages).values({
      id: messageId,
      conversationId: conversationId,
      senderId: session.user.id,
      body: content, 
      content: content, 
    });

    const newMessage = {
      id: messageId,
      conversationId,
      senderId: session.user.id,
      content,
      body: content,
      createdAt: now.toISOString(), // Keep ISO for Pusher (frontend JS handles it fine)
    };

    // 2. Broadcast to the specific Chat Room (Wrapped in Try/Catch to prevent network crashes)
    try {
      await pusherServer.trigger(`chat-${conversationId}`, "new-message", newMessage);
    } catch (pusherError) {
      console.warn("Pusher chat room trigger failed, but message was saved to DB:", pusherError);
    }

    // 3. Fetch Recipient, Sender, and Ping the Inbox
    const [convo] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (convo) {
      const recipientId = convo.userA === session.user.id ? convo.userB : convo.userA;
      
      const [sender] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);
      
      // Trigger the inbox update (Wrapped in Try/Catch)
      try {
        await pusherServer.trigger(`user-${recipientId}`, "inbox-update", { 
          conversationId: conversationId,
          lastMessage: content,
          lastMessageTime: now.toISOString(),
          senderName: sender?.displayName || sender?.name || "Unknown User",
          senderEmail: sender?.email || "No email",
          senderAvatar: sender?.avatarUrl || sender?.image || null
        });
      } catch (pusherInboxError) {
        console.warn("Pusher inbox trigger failed:", pusherInboxError);
      }

      // --- Pass the safely formatted string ---
      await db.update(conversations)
        .set({ lastMessageAt: mysqlTimestamp })
        .where(eq(conversations.id, conversationId));
    }

    return { success: true, message: newMessage };

  } catch (error: any) {
    console.error("--- REAL DATABASE ERROR ---");
    console.error(error); 
    throw new Error(`Database Error: ${error.message || JSON.stringify(error)}`);
  }
}

export async function markMessagesAsRead(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  // Safely formatted for MySQL
  const mysqlTimestamp = toMySQLDate(new Date());

  try {
    await db.update(messages)
      .set({ readAt: mysqlTimestamp }) 
      .where(
        and(
          eq(messages.conversationId, conversationId),
          ne(messages.senderId, session.user.id),
          isNull(messages.readAt)
        )
      );

    revalidatePath("/chat");
  } catch (error) {
    console.error("Failed to mark as read:", error);
  }
}

export async function clearChatHistory(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    await db.delete(messages)
      .where(eq(messages.conversationId, conversationId));

    revalidatePath(`/chat/${conversationId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to clear chat:", error);
    return { success: false, error: "Failed to clear chat" };
  }
}