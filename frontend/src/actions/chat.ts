"use server"

import { ChatMessageUI } from "@/client/client/types.gen";
import { ChatService } from "@/client/sdk.gen";
import { ChatMessage } from "@/client/zod.gen";
import { get } from '@/utils'

export async function getChatHistory(courseId: string): Promise<ChatMessageUI[]> {
  try {
    const res = await ChatService.getApiV1ChatHistory({path: { course_id: courseId }});
    return res.data.map((msg: ChatMessage) => ({
      id: msg.id,
      is_system: msg.is_system,
      message: msg.message,
      created_at: msg.created_at,
      author: msg.is_system ? "Course Tutor" : undefined,
      avatar: msg.is_system ? "/tutor-session.png" : undefined,
    }));
  } catch (error) {
    console.log("Failed to fetch chat history:", error);
    const errorMsg = get(
      error as Record<string, never>,
      'detail',
      'API request failed'
    )
    throw new Error(errorMsg)
  }
}

export const createChatStream = async (courseId: string, message: string) => {
  try {
    const response = await ChatService.postApiV1ChatStream({
      path: { course_id: courseId },
      body: { message },
      credentials: 'include',
      responseValidator: async () => {},
    });

    if (!response.data) {
      throw new Error("No data received from chat stream");
    }

    return response.data;
  } catch (error) {
    console.log("Failed to create chat stream:", error);
    const errorMsg = get(
      error as Record<string, never>,
      'detail',
      'API request failed'
    );
    throw new Error(errorMsg);
  }
}
