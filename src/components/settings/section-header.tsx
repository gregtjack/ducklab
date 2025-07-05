import { LinkIcon, CheckIcon } from "lucide-react";
import { useState } from "react";

export function SectionHeader({ title, fragment }: { title: string, fragment: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = new URL(window.location.href);
    url.hash = fragment;
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <button className="flex items-center gap-2 group cursor-pointer" onClick={handleCopy}>
      <h1 className="text-lg font-semibold">{title}</h1>
      {copied ? <CheckIcon className="size-4" /> : <LinkIcon className="size-4 opacity-0 transition-all group-hover:opacity-100" />}
    </button>
  );
}
