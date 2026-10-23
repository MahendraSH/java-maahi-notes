import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Note Not Found</h1>
      <p className="text-muted-foreground mb-6">
        This note doesn&apos;t exist or hasn&apos;t been published yet.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Knowledge Base
      </Link>
    </div>
  );
}
