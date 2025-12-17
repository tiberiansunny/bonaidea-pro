import Image from 'next/image';
import { Briefcase, Zap, Linkedin, Mail } from 'lucide-react';

/**
 * Configuration for the main call-to-action links displayed in the hero section.
 * TODO: Replace placeholder href values with actual production URLs.
 */
const connectLinks = [
  {
    label: "Upwork",
    href: "https://upwork.com/freelancers/~019c5030dade6e174d",
    icon: <Briefcase className="h-5 w-5" />
  },
  {
    label: "Fiverr",
    href: "#",
    icon: <Zap className="h-5 w-5" />
  },
  {
    label: "Connect",
    href: "https://www.linkedin.com/in/denyschernobaiev/",
    icon: <Linkedin className="h-5 w-5" />
  },
  {
    label: "Email",
    href: "mailto:dc@bonaidea.pro",
    icon: <Mail className="h-5 w-5" />
  }
];
export default function HeroSection() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      
      <div className="mb-8">
        <Image
          src="/assets/logo/Logo (BONA IDEA) M01.png"
          alt="Bona Idea Pro Logo"
          width={200}
          height={50}
          // The `priority` prop ensures this image, as a potential LCP element, is loaded faster.
          priority 
        />
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Visual-First Developer & Creative Technologist
        </h1>
        <p className="max-w-2xl text-lg text-gray-400 md:text-xl">
          Turning ideas into interactive products. Where clean code meets
          cinematic visuals.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        {connectLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer" // Security best practice for opening new tabs
            className="flex items-center justify-center gap-2 rounded-full border border-gray-700 px-6 py-3 font-semibold transition-colors hover:border-bona-purple hover:bg-bona-purple/10 hover:text-white"
          >
            {link.icon}
            <span>{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}