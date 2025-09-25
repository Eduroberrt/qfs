"use client";
import React, { Suspense } from "react";
import Hero from "@/components/Home/Hero";
import Work from "@/components/Home/work";
import TimeLine from "@/components/Home/timeline";
import Platform from "@/components/Home/platform";
import Upgrade from "@/components/Home/upgrade";
import Perks from "@/components/Home/perks";

export default function Home() {
  return (
    <main>
      <Suspense fallback={<div>Loading...</div>}>
        <Hero />
      </Suspense>
      <Work />
      <TimeLine />
      <Platform />
      <Upgrade />
      <Perks />
    </main>
  );
}
