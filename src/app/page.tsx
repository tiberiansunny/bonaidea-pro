import { Briefcase, Zap, Linkedin, Mail } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Visual-First Developer & Creative Technologist
        </h1>
        <p className="max-w-2xl text-lg text-gray-400 md:text-xl">
          Turning ideas into interactive products. Where clean code meets
          cinematic visuals.
        </p>
      </div>

      {/* Блок з посиланнями */}
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <a
          href="#" // TODO: Add Upwork link
          className="flex items-center justify-center gap-2 rounded-full border border-gray-700 px-6 py-3 font-semibold transition-colors hover:border-bona-purple hover:bg-bona-purple/10 hover:text-white"
        >
          <Briefcase className="h-5 w-5" />
          <span>Hire for Dev</span>
        </a>
        <a
          href="#" // TODO: Add Fiverr link
          className="flex items-center justify-center gap-2 rounded-full border border-gray-700 px-6 py-3 font-semibold transition-colors hover:border-bona-purple hover:bg-bona-purple/10 hover:text-white"
        >
          <Zap className="h-5 w-5" />
          <span>Quick Gigs</span>
        </a>
        <a
          href="#" // TODO: Add LinkedIn link
          className="flex items-center justify-center gap-2 rounded-full border border-gray-700 px-6 py-3 font-semibold transition-colors hover:border-bona-purple hover:bg-bona-purple/10 hover:text-white"
        >
          <Linkedin className="h-5 w-5" />
          <span>Connect</span>
        </a>
        <a
          href="mailto:your-email@example.com" // TODO: Add your email
          className="flex items-center justify-center gap-2 rounded-full border border-gray-700 px-6 py-3 font-semibold transition-colors hover:border-bona-purple hover:bg-bona-purple/10 hover:text-white"
        >
          <Mail className="h-5 w-5" />
          <span>Email</span>
        </a>
      </div>
    </main>
  );
}