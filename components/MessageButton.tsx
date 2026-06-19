"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createOrGetConversation } from "@/app/actions/chat";

export function MessageButton({ 
  targetUserId, 
  targetRole, 
  serviceId, 
  jobId, 
  label, 
  className 
}: { 
  targetUserId: string; 
  targetRole: "seller" | "buyer"; 
  serviceId?: string; 
  jobId?: string; 
  label: string; 
  className?: string; 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleMessage = async () => {
   // Inside MessageButton.tsx -> handleMessage()
const result = await createOrGetConversation(targetUserId, targetRole, serviceId || jobId) as any;

if (result?.conversationId) {
  const contextParam = serviceId ? `serviceId=${serviceId}` : jobId ? `jobId=${jobId}` : "";
  const url = contextParam 
    ? `/chat/${result.conversationId}?${contextParam}` 
    : `/chat/${result.conversationId}`;
      
  router.push(url);
}
  };

  return (
    <Button 
      onClick={handleMessage} 
      disabled={isLoading}
      className={className}
      type="button"
    >
      {isLoading ? "Loading..." : label}
    </Button>
  );
}