"use client";

import { render } from "@/lib/markdown";

export default function Markdown({ text }: { text: string }) {
  return <div className="md" dangerouslySetInnerHTML={{ __html: render(text) }} />;
}
