import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Mic,
  MessageSquare,
  Activity,
  Code,
  Award,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Deep Resume Analysis",
    description:
      "AI-powered resume parsing that identifies strengths and gaps in your profile, with personalized recommendations for improvement.",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: MessageSquare,
    title: "Multi-Mode Interview",
    description:
      "Practice with voice or text-based interviews. Adaptive AI adjusts difficulty based on your performance and learning pace.",
    gradient: "from-accent/20 to-accent/5",
  },
  {
    icon: Activity,
    title: "Smart Scoring Report",
    description:
      "Detailed performance analytics with real-time feedback. Track your progress across technical skills, communication, and problem-solving.",
    gradient: "from-primary/20 to-accent/10",
  },
  {
    icon: Code,
    title: "Live Code Assessment",
    description:
      "Real-time code evaluation with syntax checking, best practices analysis, and optimization suggestions during mock interviews.",
    gradient: "from-accent/20 to-primary/10",
  },
  {
    icon: Mic,
    title: "Voice Interview Mode",
    description:
      "Natural conversation flow with speech recognition. Practice your verbal communication skills just like a real interview.",
    gradient: "from-primary/15 to-accent/15",
  },
  {
    icon: Award,
    title: "Achievement System",
    description:
      "Stay motivated with milestones, badges, and progress tracking. Celebrate your improvement journey with tangible rewards.",
    gradient: "from-accent/20 to-primary/5",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground lg:text-4xl xl:text-5xl">
            Everything You Need to <span className="text-primary">Succeed</span>
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
            Comprehensive tools designed to help you master technical interviews
            and land your dream job.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity group-hover:opacity-100`}
                />

                <CardHeader className="relative">
                  <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-6" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-card-foreground">
                    {feature.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="relative">
                  <CardDescription className="text-base leading-relaxed text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
