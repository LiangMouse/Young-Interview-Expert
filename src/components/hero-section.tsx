import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
      {/* Background gradient effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-20 right-1/4 size-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text Content */}
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary w-fit">
              <Sparkles className="size-4" />
              <span>AI-Powered Interview Prep</span>
            </div>

            <h1 className="mb-6 text-balance text-5xl font-bold leading-tight tracking-tight text-foreground lg:text-6xl xl:text-7xl">
              Master Your Next{" "}
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Tech Interview
              </span>
            </h1>

            <p className="mb-8 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground lg:text-xl">
              The AI mentor that helps you grow. Resume parsing, mock
              interviews, and real-time code assessment.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="group relative overflow-hidden bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
              >
                Start Simulation
                <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border hover:bg-muted bg-transparent"
              >
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-12 flex flex-wrap items-center gap-8">
              <div>
                <div className="text-3xl font-bold text-foreground">
                  10,000+
                </div>
                <div className="text-sm text-muted-foreground">
                  Success Stories
                </div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-foreground">98%</div>
                <div className="text-sm text-muted-foreground">
                  Satisfaction Rate
                </div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-foreground">24/7</div>
                <div className="text-sm text-muted-foreground">
                  AI Availability
                </div>
              </div>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative">
              {/* Main visual placeholder */}
              <div className="relative aspect-square w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 shadow-2xl">
                <img
                  src="/abstract-tech-ai-interview-dashboard-with-code-and.jpg"
                  alt="AI Interview Platform"
                  className="size-full rounded-xl object-cover"
                />
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 rounded-xl border border-border bg-card p-4 shadow-lg animate-float-delayed">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium text-card-foreground">
                    AI Analyzing...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
