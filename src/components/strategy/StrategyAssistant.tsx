import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, Loader2, Sparkles, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface StrategyAssistantProps {
  onApplyStrategy?: (entry: string, exit: string) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strategy-assistant`;

const suggestedPrompts = [
  "Create a momentum strategy using RSI",
  "Build a trend-following strategy with moving averages",
  "Design a mean reversion strategy",
  "Optimize my entry: RSI(14) < 30",
];

export function StrategyAssistant({ onApplyStrategy }: StrategyAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const extractStrategies = (content: string): { entry?: string; exit?: string } => {
    const entryMatch = content.match(/<entry>([\s\S]*?)<\/entry>/);
    const exitMatch = content.match(/<exit>([\s\S]*?)<\/exit>/);
    return {
      entry: entryMatch?.[1]?.trim(),
      exit: exitMatch?.[1]?.trim(),
    };
  };

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Strategy assistant error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get AI response",
      });
      setMessages((prev) => prev.filter((m) => m !== userMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyStrategy = (content: string) => {
    const strategies = extractStrategies(content);
    if (strategies.entry || strategies.exit) {
      onApplyStrategy?.(strategies.entry || "", strategies.exit || "");
      toast({
        title: "Strategy Applied",
        description: "The AI-generated strategy has been loaded into the editor.",
      });
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const hasStrategy = (content: string) => {
    return content.includes("<entry>") || content.includes("<exit>");
  };

  return (
    <div className="flex h-full flex-col border-2 border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b-2 border-border px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider">AI Strategy Assistant</h3>
          <p className="text-xs text-muted-foreground">Describe your strategy in plain language</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center">
              <Sparkles className="mx-auto h-8 w-8 text-primary mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Ask me to create or optimize trading strategies
              </p>
            </div>
            <div className="grid gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="w-full border-2 border-border p-3 text-left text-sm transition-colors hover:bg-muted/50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] border-2 p-3",
                    msg.role === "user"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/30"
                  )}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content.replace(/<\/?(?:entry|exit)>/g, "")}</p>
                  {msg.role === "assistant" && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => handleCopy(msg.content, i)}
                      >
                        {copiedIndex === i ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : (
                          <Copy className="h-3 w-3 mr-1" />
                        )}
                        Copy
                      </Button>
                      {hasStrategy(msg.content) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-2"
                          onClick={() => handleApplyStrategy(msg.content)}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Apply Strategy
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3">
                <div className="border-2 border-border bg-muted/30 p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t-2 border-border p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your strategy idea..."
            className="border-2"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
