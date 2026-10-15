import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { LatestFeed } from "@/components/LatestFeed";
import { ShipLog } from "@/components/ShipLog";
import { ToolsGrid } from "@/components/ToolsGrid";
import { MnemixSection } from "@/components/MnemixSection";
import { Library } from "@/components/Library";
import { Principles } from "@/components/Principles";
import { About } from "@/components/About";
import { Subscribe } from "@/components/Subscribe";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <LatestFeed />
        <ShipLog />
        <ToolsGrid />
        <MnemixSection />
        <Library />
        <Principles />
        <About />
        <Subscribe />
      </main>
      <Footer />
    </>
  );
}
