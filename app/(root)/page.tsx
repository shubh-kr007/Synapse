// import Link from "next/link";
// import Image from "next/image";

// import { Button } from "@/components/ui/button";
// import InterviewCard from "@/components/InterviewCard";

// import { getCurrentUser } from "@/lib/actions/auth.action";
// import {
//   getInterviewsByUserId,
//   getLatestInterviews,
// } from "@/lib/actions/general.action";
// import Beams from '@/components/ui/Beams/Beams';

// <div style={{ width: '100%', height: '600px', position: 'relative' }}>
//   <Beams
//     beamWidth={2}
//     beamHeight={15}
//     beamNumber={12}
//     lightColor="#ffffff"
//     speed={2}
//     noiseIntensity={1.75}
//     scale={0.2}
//     rotation={0}
//   />
// </div>

// async function Home() {
//   const user = await getCurrentUser();

//   const [userInterviews, allInterview] = await Promise.all([
//     getInterviewsByUserId(user?.id!),
//     getLatestInterviews({ userId: user?.id! }),
//   ]);

//   const hasPastInterviews = userInterviews?.length! > 0;
//   const hasUpcomingInterviews = allInterview?.length! > 0;

//   return (
//     <>
//       <section className="card-cta">
//         <div className="flex flex-col gap-6 max-w-lg">
//           <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
//           <p className="text-lg">
//             Practice real interview questions & get instant feedback
//           </p>

//           <Button asChild className="btn-primary max-sm:w-full">
//             <Link href="/interview">Start an Interview</Link>
//           </Button>
//         </div>

//         <Image
//           src="/robot.png"
//           alt="robo-dude"
//           width={400}
//           height={400}
//           className="max-sm:hidden"
//         />
//       </section>

//       <section className="flex flex-col gap-6 mt-8">
//         <h2>Your Interviews</h2>

//         <div className="interviews-section">
//           {hasPastInterviews ? (
//             userInterviews?.map((interview) => (
//               <InterviewCard
//                 key={interview.id}
//                 userId={user?.id}
//                 interviewId={interview.id}
//                 role={interview.role}
//                 type={interview.type}
//                 techstack={interview.techstack}
//                 createdAt={interview.createdAt}
//               />
//             ))
//           ) : (
//             <p>You haven&apos;t taken any interviews yet</p>
//           )}
//         </div>
//       </section>

//       <section className="flex flex-col gap-6 mt-8">
//         <h2>Take Interviews</h2>

//         <div className="interviews-section">
//           {hasUpcomingInterviews ? (
//             allInterview?.map((interview) => (
//               <InterviewCard
//                 key={interview.id}
//                 userId={user?.id}
//                 interviewId={interview.id}
//                 role={interview.role}
//                 type={interview.type}
//                 techstack={interview.techstack}
//                 createdAt={interview.createdAt}
//               />
//             ))
//           ) : (
//             <p>There are no interviews available</p>
//           )}
//         </div>
//       </section>
//     </>
//   );
// }

// export default Home;
import Link from "next/link";
import Image from "next/image";
import React from "react";
import { BrainCircuit, MessageSquareQuote, Settings2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewsByUserId } from "@/lib/actions/general.action";

/**
 * RedesignedInterviewCard Component
 * A visually updated card to display recent interview sessions.
 */
interface InterviewCardProps {
  userId: string | undefined;
  interviewId: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt: string;
}
const RedesignedInterviewCard = ({ userId, interviewId, role, type, techstack, createdAt }: InterviewCardProps) => {
  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <Link href={`/interview/${interviewId}/feedback`} className="block group">
      <div className="h-full bg-slate-900/70 border border-slate-800 rounded-2xl p-6 hover:bg-slate-800/80 hover:border-cyan-500/50 transition-all duration-300 flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-sm font-medium">{type}</p>
            <h3 className="text-xl font-bold text-white mt-1">{role}</h3>
          </div>
          <div className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">{formattedDate}</div>
        </div>
        <div className="flex-grow mt-4 flex items-center gap-3">
          <DisplayTechIcons techStack={techstack} />
        </div>
        <div className="mt-6">
          <div className="flex items-center text-sm font-semibold text-cyan-400">
            View Feedback
            <ArrowRight className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
};

/**
 * Homepage
 * The main landing page, combining the new design with correct data fetching.
 */
async function Home() {
  // Correctly fetch the user session and their interviews
  const user = await getCurrentUser();
  const interviews = user ? await getInterviewsByUserId(user.id) : [];

  const hasInterviews = interviews && interviews.length > 0;

  // List of companies for the dynamic marquee section
  const companies = [
    { name: "Amazon", logo: "/covers/amazon.png" },
    { name: "Adobe", logo: "/covers/adobe.png" },
    { name: "Facebook", logo: "/covers/facebook.png" },
    { name: "Hostinger", logo: "/covers/hostinger.png" },
    { name: "Pinterest", logo: "/covers/pinterest.png" },
    { name: "Quora", logo: "/covers/quora.png" },
    { name: "Reddit", logo: "/covers/reddit.png" },
    { name: "Skype", logo: "/covers/skype.png" },
    { name: "Spotify", logo: "/covers/spotify.png" },
    { name: "Telegram", logo: "/covers/telegram.png" },
    { name: "TikTok", logo: "/covers/tiktok.png" },
    { name: "Yahoo", logo: "/covers/yahoo.png" },
  ];

  // CSS for the infinite scrolling marquee animation.
  const marqueeStyle = `
    @keyframes scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-100%); }
    }
    .animate-scroll {
      animation: scroll 40s linear infinite;
    }
  `;

  return (
    <>
      <style>{marqueeStyle}</style>
      <main className="overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center justify-center text-center px-4 py-20 overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 py-2">
              Synapse
            </h1>
            <p className="mt-4 max-w-2xl text-lg md:text-xl text-slate-300/90 leading-relaxed">
              Your Personal AI Interview Coach. Practice, get instant feedback, and land your dream job in tech.
            </p>
            <div className="mt-10">
              <Link href="/interview">
                <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold text-base px-8 py-6 rounded-full shadow-lg shadow-cyan-500/20 transition-all duration-300 transform hover:scale-105">
                  Start a Free Interview
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex items-center gap-2 text-sm text-slate-400">
              <BrainCircuit className="w-5 h-5 text-cyan-400" />
              <span>Powered by cutting-edge voice AI</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-4 bg-slate-900/50 border-t border-slate-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold">Why Synapse?</h2>
                <p className="text-slate-400 mt-4 text-lg">A smarter way to prepare for your technical interviews.</p>
            </div>
            <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center p-8 bg-slate-800/50 rounded-xl border border-slate-700 transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-800">
                <div className="p-4 bg-slate-700/80 rounded-full mb-5">
                  <BrainCircuit className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Realistic Voice AI</h3>
                <p className="text-slate-400 text-base leading-relaxed">
                  Engage in natural conversations with an AI that understands context and asks relevant follow-up questions.
                </p>
              </div>
              <div className="flex flex-col items-center p-8 bg-slate-800/50 rounded-xl border border-slate-700 transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-800">
                <div className="p-4 bg-slate-700/80 rounded-full mb-5">
                  <MessageSquareQuote className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">In-depth Feedback</h3>
                <p className="text-slate-400 text-base leading-relaxed">
                  Receive detailed analysis of your answers, including technical accuracy, clarity, and delivery.
                </p>
              </div>
              <div className="flex flex-col items-center p-8 bg-slate-800/50 rounded-xl border border-slate-700 transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-800">
                <div className="p-4 bg-slate-700/80 rounded-full mb-5">
                  <Settings2 className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Customizable Sessions</h3>
                <p className="text-slate-400 text-base leading-relaxed">
                  Tailor your mock interviews to specific job roles, companies, and technologies you're targeting.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Company Marquee Section */}
        <section className="py-16">
          <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
            <div className="flex w-max">
              <div className="flex w-max items-center animate-scroll">
                {companies.concat(companies).map((company, index) => (
                  <div key={index} className="mx-10 flex-shrink-0" title={company.name}>
                    <Image src={company.logo} alt={company.name} width={120} height={40} className="object-contain aspect-[3/1] grayscale opacity-50 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Recent Interviews Section */}
        <section className="py-24 px-4 border-t border-slate-800">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 sm:mb-0">Your Practice Ground</h2>
              <Link href="/interview">
                <Button variant="outline" className="border-slate-700 hover:bg-slate-800 hover:text-white transition-colors">
                  + New Interview
                </Button>
              </Link>
            </div>
            
            {hasInterviews ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {interviews.map((interview) => (
                  <RedesignedInterviewCard
                    key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 px-6 bg-slate-900/50 border border-dashed border-slate-700 rounded-2xl">
                <h3 className="text-2xl font-semibold text-white">No interviews yet!</h3>
                <p className="text-slate-400 mt-3 mb-8 max-w-md mx-auto">
                  It's time to start your first mock interview and sharpen your skills.
                </p>
                <Link href="/interview">
                  <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold">
                    Start Your First Interview
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

export default Home;
