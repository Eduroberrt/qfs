"use client";
import React from "react";
import Hero from "@/components/Home/Hero";
import Work from "@/components/Home/work";
import TimeLine from "@/components/Home/timeline";
import Platform from "@/components/Home/platform";
import Upgrade from "@/components/Home/upgrade";
import Perks from "@/components/Home/perks";

export default function Home() {
  return (
    <main>
      <Hero />
      <Work />
      <TimeLine />
      <Platform />
      <Upgrade />
      <Perks />
    </main>
  );
}
