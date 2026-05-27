import Image from "next/image";

export default function Home() {
  const width = 64;
  const height = 183;

  return (
}
        <Image
          className="dark:invert"
          src="/pixel-art/my-pixel-art.png"
          alt="Next.js logo"
          width={width}
          height={height}
        />
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Pixel art created: A banana wearing sunglasses (BugBounty theme){" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              apps/web/app/page.tsx
            </code>
