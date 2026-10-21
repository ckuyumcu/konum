import Header from "../sections/Header";
import Hero from "../sections/Hero";
import Marquee from "../sections/Marquee";
import Problem from "../sections/Problem";
import Pipeline from "../sections/Pipeline";
import Teardown from "../sections/Teardown";
import Demo from "../sections/Demo";
import Metrics from "../sections/Metrics";
import Economics from "../sections/Economics";
import Roles from "../sections/Roles";
import Pilot from "../sections/Pilot";
import Faq from "../sections/Faq";
import Footer from "../sections/Footer";

// Landing page — kept per the brief; the app lives under /app.
export default function Landing() {
  return (
    <div className="min-h-dvh bg-background text-foreground overflow-x-clip">
      <div className="noise-layer" aria-hidden="true" />
      <Header />
      <main>
        <Hero />
        <Marquee />
        <Problem />
        <Pipeline />
        <Teardown />
        <Demo />
        <Metrics />
        <Roles />
        <Economics />
        <Pilot />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
