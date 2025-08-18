// components/Agent.tsx
"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn, checkMicrophonePermission } from "@/lib/utils";
import { vapiWrapper as vapi } from "@/lib/vapi-wrapper";
import { interviewer } from "@/constants";
import {
  createFeedback,
  saveInterviewProgress,
  getInterviewProgress,
} from "@/lib/actions/general.action";
import { useConnectionMonitor } from "@/hooks/useConnectionMonitor";
import { NetworkIndicator } from "@/components/NetworkIndicator";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
  ERROR = "ERROR",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [connectionError, setConnectionError] = useState<string>("");
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const callStartTimeRef = useRef<number>();
  const autoSaveIntervalRef = useRef<NodeJS.Timeout>();
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  // Use connection monitor hook
  const { updateActivity } = useConnectionMonitor(
    callStatus === CallStatus.ACTIVE,
    () => handleDisconnect()
  );

  // Load previous progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      if (interviewId && userId && type === "interview") {
        setIsLoadingProgress(true);
        try {
          const progress = await getInterviewProgress({ interviewId, userId });
          if (progress?.transcript && progress.transcript.length > 0) {
            setMessages(progress.transcript);
            toast.info("Previous interview progress loaded");
          }
        } catch (error) {
          console.error("Error loading progress:", error);
        } finally {
          setIsLoadingProgress(false);
        }
      }
    };

    loadProgress();
  }, [interviewId, userId, type]);

  // Auto-save progress
  useEffect(() => {
    if (
      messages.length > 0 &&
      callStatus === CallStatus.ACTIVE &&
      interviewId &&
      userId &&
      type === "interview"
    ) {
      const saveProgress = async () => {
        try {
          await saveInterviewProgress({
            interviewId,
            userId,
            transcript: messages,
          });
          console.log("Progress saved");
        } catch (error) {
          console.error("Error saving progress:", error);
        }
      };

      // Save immediately when messages change
      saveProgress();

      // Then save every 30 seconds
      autoSaveIntervalRef.current = setInterval(saveProgress, 30000);

      return () => {
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current);
        }
      };
    }
  }, [messages, callStatus, interviewId, userId, type]);

  useEffect(() => {
    const onCallStart = () => {
      console.log("Call started");
      setCallStatus(CallStatus.ACTIVE);
      setConnectionError("");
      callStartTimeRef.current = Date.now();
      toast.success("Interview started successfully");
    };

    const onCallEnd = () => {
      console.log("Call ended");
      setCallStatus(CallStatus.FINISHED);

      // Check if call ended too early (less than 10 seconds)
      if (
        callStartTimeRef.current &&
        Date.now() - callStartTimeRef.current < 10000
      ) {
        setConnectionError("Call ended unexpectedly. Please try again.");
        setCallStatus(CallStatus.ERROR);
        toast.error("Interview ended too quickly. Please try again.");
      }
    };

    const onMessage = (message: Message) => {
      updateActivity(); // Track activity

      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = {
          role: message.role,
          content: message.transcript,
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      setIsSpeaking(true);
      updateActivity();
    };

    const onSpeechEnd = () => {
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.error(
        "VAPI Error:",
        error,
        JSON.stringify(error, Object.getOwnPropertyNames(error))
      );
      const errorMessage = error.message || "Connection error occurred";
      setConnectionError(errorMessage);
      setCallStatus(CallStatus.ERROR);
      toast.error(errorMessage);

      // Auto-retry after 3 seconds for certain errors
      if (
        error.message?.includes("network") ||
        error.message?.includes("connection")
      ) {
        reconnectTimeoutRef.current = setTimeout(() => {
          toast.info("Attempting to reconnect...");
          handleCall();
        }, 3000);
      }
    };

    // Set up event listeners
    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    // Cleanup
    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [updateActivity]);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }
  }, [messages]);

  useEffect(() => {
    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      if (messages.length < 3) {
        toast.error(
          "Interview too short. Please try again with a longer conversation."
        );
        router.push("/");
        return;
      }

      try {
        toast.loading("Generating your feedback...");

        const { success, feedbackId: id } = await createFeedback({
          interviewId: interviewId!,
          userId: userId!,
          transcript: messages,
          feedbackId,
        });

        if (success && id) {
          toast.success("Feedback generated successfully!");
          router.push(`/interview/${interviewId}/feedback`);
        } else {
          toast.error("Failed to generate feedback. Please try again.");
          router.push("/");
        }
      } catch (error) {
        console.error("Feedback generation error:", error);
        toast.error("Error generating feedback");
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED && type === "interview") {
      handleGenerateFeedback(messages);
    } else if (callStatus === CallStatus.FINISHED && type === "generate") {
      toast.success("Interview questions generated!");
      router.push("/");
    }
  }, [callStatus, messages, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    try {
      // Check microphone permission first
      const hasMicPermission = await checkMicrophonePermission();
      if (!hasMicPermission) {
        toast.error(
          "Microphone access is required for the interview. Please enable it in your browser settings."
        );
        return;
      }

      setCallStatus(CallStatus.CONNECTING);
      setConnectionError("");

      // Check for required environment variables
      if (type === "generate" && !process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID) {
        throw new Error(
          "Interview generation is not configured. Please contact support."
        );
      }

      // Check internet connection
      if (!navigator.onLine) {
        throw new Error(
          "No internet connection. Please check your connection and try again."
        );
      }

      if (type === "generate") {
        await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
          variableValues: {
            username: userName,
            userid: userId,
          },
        });
      } else {
        // Validate questions exist
        if (!questions || questions.length === 0) {
          throw new Error("No interview questions available");
        }

        const formattedQuestions = questions
          .map((question, index) => `${index + 1}. ${question}`)
          .join("\n");

        await vapi.start(interviewer, {
          variableValues: {
            questions: formattedQuestions,
          },
        });
      }
    } catch (error: any) {
      console.error("Failed to start call:", error);
      setCallStatus(CallStatus.ERROR);
      setConnectionError(
        error.message || "Failed to start the interview. Please try again."
      );
      toast.error(error.message || "Connection failed");
    }
  };

  const handleDisconnect = () => {
    try {
      vapi.stop();
      setCallStatus(CallStatus.FINISHED);
      toast.info("Interview ended");
    } catch (error) {
      console.error("Error disconnecting:", error);
      setCallStatus(CallStatus.FINISHED);
    }
  };

  const handleRetry = () => {
    setConnectionError("");
    setMessages([]);
    handleCall();
  };

  return (
    <>
      {/* Network Quality Indicator */}
      {callStatus === CallStatus.ACTIVE && (
        <div className="flex justify-end mb-4">
          <NetworkIndicator />
        </div>
      )}

      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="AI Interviewer"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && callStatus === CallStatus.ACTIVE && (
              <span className="animate-speak" />
            )}
          </div>
          <h3>AI Interviewer</h3>

          {/* Status indicator */}
          <div className="flex items-center gap-2 mt-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                callStatus === CallStatus.ACTIVE && "bg-green-500",
                callStatus === CallStatus.CONNECTING &&
                  "bg-yellow-500 animate-pulse",
                callStatus === CallStatus.ERROR && "bg-red-500",
                callStatus === CallStatus.INACTIVE && "bg-gray-500",
                callStatus === CallStatus.FINISHED && "bg-blue-500"
              )}
            />
            <p className="text-sm text-light-100">
              {callStatus === CallStatus.ACTIVE && "Connected"}
              {callStatus === CallStatus.CONNECTING && "Connecting..."}
              {callStatus === CallStatus.ERROR && "Disconnected"}
              {callStatus === CallStatus.INACTIVE && "Not connected"}
              {callStatus === CallStatus.FINISHED && "Interview completed"}
            </p>
          </div>

          {/* Progress indicator */}
          {messages.length > 0 && callStatus === CallStatus.ACTIVE && (
            <div className="mt-2 text-xs text-light-100">
              Questions answered: {Math.floor(messages.length / 2)}
            </div>
          )}
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="User"
              width={120}
              height={120}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>

            {/* Loading previous progress indicator */}
            {isLoadingProgress && (
              <p className="text-sm text-light-100 mt-2">
                Loading previous progress...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {connectionError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
          <p className="text-red-400">{connectionError}</p>
          {callStatus === CallStatus.ERROR && (
            <button
              onClick={handleRetry}
              className="mt-2 text-sm text-primary-200 hover:underline"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {/* Transcript */}
      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript max-h-32 overflow-y-auto">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      {/* Call Controls */}
      <div className="w-full flex justify-center">
        {callStatus === CallStatus.ACTIVE ? (
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End Interview
          </button>
        ) : (
          <button
            className="relative btn-call"
            onClick={handleCall}
            disabled={callStatus === CallStatus.CONNECTING || isLoadingProgress}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== CallStatus.CONNECTING && "hidden"
              )}
            />
            <span className="relative">
              {callStatus === CallStatus.INACTIVE && "Start Interview"}
              {callStatus === CallStatus.CONNECTING && "Connecting..."}
              {callStatus === CallStatus.FINISHED && "Interview Completed"}
              {callStatus === CallStatus.ERROR && "Retry"}
              {isLoadingProgress && "Loading..."}
            </span>
          </button>
        )}
      </div>

      {/* Instructions */}
      {callStatus === CallStatus.INACTIVE && !connectionError && (
        <div className="text-center text-sm text-light-100 mt-4 space-y-2">
          <p>Click "Start Interview" to begin your mock interview session.</p>
          <p>
            Make sure your microphone is enabled and you're in a quiet
            environment.
          </p>
          {type === "interview" && messages.length > 0 && (
            <p className="text-primary-200">
              You have a previous session with {Math.floor(messages.length / 2)}{" "}
              responses saved.
            </p>
          )}
        </div>
      )}

      {/* Interview Tips */}
      {callStatus === CallStatus.ACTIVE && (
        <div className="mt-4 p-3 bg-dark-200 rounded-lg">
          <p className="text-xs text-light-100">
            💡 Tips: Speak clearly, take your time to think before answering,
            and feel free to ask for clarification if needed.
          </p>
        </div>
      )}
    </>
  );
};

export default Agent;
