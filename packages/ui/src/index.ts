// @vibe-notes/ui - Shared UI components
export { cn } from "./lib/utils";
export { Button, buttonVariants, type ButtonProps } from "./components/ui/button";
export { Input } from "./components/ui/input";
export { Textarea } from "./components/ui/textarea";
export { Badge, badgeVariants, type BadgeProps } from "./components/ui/badge";
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "./components/ui/card";
export { Separator } from "./components/ui/separator";
export { Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "./components/ui/dialog";
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./components/ui/tooltip";
export { ScrollArea } from "./components/ui/scroll-area";
export { ReadAloudPlayer, parseMarkdownToSentences, type AudioSentence, type ReaderPreferences, DEFAULT_READER_PREFERENCES, READER_PREFERENCES_KEY } from "./components/read-aloud";
export { ExportMenu } from "./components/export-menu";
export { SyntaxHighlighter } from "./components/syntax-highlighter";
export { MarkdownTable, isMarkdownTableStart, isMarkdownTableSeparator } from "./components/markdown-table";
export { TableOfContents } from "./components/table-of-contents";
export { SpeechMarkdownRenderer, type SpeechMarkdownRendererProps } from "./components/speech-markdown-renderer";
export { DisclaimerBanner } from "./components/disclaimer-banner";

