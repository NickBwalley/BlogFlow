"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StylesPage() {
  // Color tokens from globals.css
  const colorTokens = {
    semantic: [
      {
        name: "Background",
        cssVar: "--background",
        description: "Main background color",
      },
      {
        name: "Foreground",
        cssVar: "--foreground",
        description: "Main text color",
      },
      {
        name: "Primary",
        cssVar: "--primary",
        description: "Primary brand color",
      },
      {
        name: "Primary Foreground",
        cssVar: "--primary-foreground",
        description: "Text on primary",
      },
      {
        name: "Secondary",
        cssVar: "--secondary",
        description: "Secondary background",
      },
      {
        name: "Secondary Foreground",
        cssVar: "--secondary-foreground",
        description: "Text on secondary",
      },
      { name: "Accent", cssVar: "--accent", description: "Accent background" },
      {
        name: "Accent Foreground",
        cssVar: "--accent-foreground",
        description: "Text on accent",
      },
      { name: "Muted", cssVar: "--muted", description: "Muted background" },
      {
        name: "Muted Foreground",
        cssVar: "--muted-foreground",
        description: "Muted text",
      },
      {
        name: "Destructive",
        cssVar: "--destructive",
        description: "Error/danger color",
      },
    ],
    ui: [
      { name: "Card", cssVar: "--card", description: "Card background" },
      {
        name: "Card Foreground",
        cssVar: "--card-foreground",
        description: "Card text",
      },
      {
        name: "Popover",
        cssVar: "--popover",
        description: "Popover background",
      },
      {
        name: "Popover Foreground",
        cssVar: "--popover-foreground",
        description: "Popover text",
      },
      { name: "Border", cssVar: "--border", description: "Border color" },
      { name: "Input", cssVar: "--input", description: "Input border" },
      { name: "Ring", cssVar: "--ring", description: "Focus ring color" },
    ],
    chart: [
      { name: "Chart 1", cssVar: "--chart-1", description: "Chart color 1" },
      { name: "Chart 2", cssVar: "--chart-2", description: "Chart color 2" },
      { name: "Chart 3", cssVar: "--chart-3", description: "Chart color 3" },
      { name: "Chart 4", cssVar: "--chart-4", description: "Chart color 4" },
      { name: "Chart 5", cssVar: "--chart-5", description: "Chart color 5" },
    ],
  };

  const typographyScales = [
    { name: "text-xs", class: "text-xs", size: "12px" },
    { name: "text-sm", class: "text-sm", size: "14px" },
    { name: "text-base", class: "text-base", size: "16px" },
    { name: "text-lg", class: "text-lg", size: "18px" },
    { name: "text-xl", class: "text-xl", size: "20px" },
    { name: "text-2xl", class: "text-2xl", size: "24px" },
    { name: "text-3xl", class: "text-3xl", size: "30px" },
    { name: "text-4xl", class: "text-4xl", size: "36px" },
    { name: "text-5xl", class: "text-5xl", size: "48px" },
  ];

  const fontWeights = [
    { name: "font-thin", class: "font-thin", weight: "100" },
    { name: "font-light", class: "font-light", weight: "300" },
    { name: "font-normal", class: "font-normal", weight: "400" },
    { name: "font-medium", class: "font-medium", weight: "500" },
    { name: "font-semibold", class: "font-semibold", weight: "600" },
    { name: "font-bold", class: "font-bold", weight: "700" },
  ];

  const spacingScale = [
    { name: "xs", class: "p-1", size: "4px" },
    { name: "sm", class: "p-2", size: "8px" },
    { name: "md", class: "p-3", size: "12px" },
    { name: "lg", class: "p-4", size: "16px" },
    { name: "xl", class: "p-6", size: "24px" },
    { name: "2xl", class: "p-8", size: "32px" },
    { name: "3xl", class: "p-10", size: "40px" },
    { name: "4xl", class: "p-12", size: "48px" },
  ];

  const radiusScale = [
    { name: "sm", class: "rounded-sm", var: "calc(var(--radius) - 4px)" },
    { name: "md", class: "rounded-md", var: "calc(var(--radius) - 2px)" },
    { name: "lg", class: "rounded-lg", var: "var(--radius)" },
    { name: "xl", class: "rounded-xl", var: "calc(var(--radius) + 4px)" },
  ];

  return (
    <>
      <Header variant="light" />
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto p-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              BlogFlow Design System
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive guide to the colors, typography, spacing, and
              components that make up our design language.
            </p>
          </div>

          {/* Color Palette */}
          <section className="space-y-6">
            <h2 className="text-3xl font-semibold">Color Palette</h2>
            <p className="text-muted-foreground">
              Our color system uses OKLCH format for consistent and accessible
              colors across light and dark themes.
            </p>

            {/* Semantic Colors */}
            <div className="space-y-4">
              <h3 className="text-2xl font-medium">Semantic Colors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {colorTokens.semantic.map((color) => (
                  <Card key={color.name} className="overflow-hidden">
                    <div
                      className="h-20 border-b"
                      style={{ backgroundColor: `hsl(var(${color.cssVar}))` }}
                    />
                    <CardContent className="pt-4 space-y-2">
                      <h4 className="font-medium">{color.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {color.description}
                      </p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {color.cssVar}
                      </code>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* UI Colors */}
            <div className="space-y-4">
              <h3 className="text-2xl font-medium">UI Colors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {colorTokens.ui.map((color) => (
                  <Card key={color.name} className="overflow-hidden">
                    <div
                      className="h-20 border-b"
                      style={{ backgroundColor: `hsl(var(${color.cssVar}))` }}
                    />
                    <CardContent className="pt-4 space-y-2">
                      <h4 className="font-medium">{color.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {color.description}
                      </p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {color.cssVar}
                      </code>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Chart Colors */}
            <div className="space-y-4">
              <h3 className="text-2xl font-medium">Chart Colors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {colorTokens.chart.map((color) => (
                  <Card key={color.name} className="overflow-hidden">
                    <div
                      className="h-20 border-b"
                      style={{ backgroundColor: `hsl(var(${color.cssVar}))` }}
                    />
                    <CardContent className="pt-4 space-y-2">
                      <h4 className="font-medium">{color.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {color.description}
                      </p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {color.cssVar}
                      </code>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Typography */}
          <section className="space-y-6">
            <h2 className="text-3xl font-semibold">Typography</h2>
            <p className="text-muted-foreground">
              Our typography system uses Inter for body text and Geist Mono for
              code, with a modular scale for consistent sizing.
            </p>

            {/* Font Families */}
            <div className="space-y-4">
              <h3 className="text-2xl font-medium">Font Families</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-sans">Inter</CardTitle>
                    <CardDescription>
                      Primary font for headings and body text
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-sans text-lg">
                      The quick brown fox jumps over the lazy dog.
                    </p>
                    <code className="text-sm bg-muted px-2 py-1 rounded mt-2 block">
                      font-family: var(--font-inter)
                    </code>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-mono">Geist Mono</CardTitle>
                    <CardDescription>
                      Monospace font for code and technical content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-mono text-lg">
                      const hello = &quot;world&quot;;
                    </p>
                    <code className="text-sm bg-muted px-2 py-1 rounded mt-2 block">
                      font-family: var(--font-geist-mono)
                    </code>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Font Sizes */}
            <div className="space-y-4">
              <h3 className="text-2xl font-medium">Font Sizes</h3>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {typographyScales.map((scale) => (
                    <div
                      key={scale.name}
                      className="flex items-center justify-between border-b pb-3"
                    >
                      <div className="flex items-center gap-6">
                        <code className="text-sm bg-muted px-2 py-1 rounded w-20 text-center">
                          {scale.name}
                        </code>
                        <span className="text-sm text-muted-foreground w-12">
                          {scale.size}
                        </span>
                      </div>
                      <div className={scale.class}>The quick brown fox</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Font Weights */}
            <div className="space-y-4">
              <h3 className="text-2xl font-medium">Font Weights</h3>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {fontWeights.map((weight) => (
                    <div
                      key={weight.name}
                      className="flex items-center justify-between border-b pb-3"
                    >
                      <div className="flex items-center gap-6">
                        <code className="text-sm bg-muted px-2 py-1 rounded w-24 text-center">
                          {weight.name}
                        </code>
                        <span className="text-sm text-muted-foreground w-12">
                          {weight.weight}
                        </span>
                      </div>
                      <div className={`${weight.class} text-lg`}>
                        The quick brown fox
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Spacing */}
          <section className="space-y-6">
            <h2 className="text-3xl font-semibold">Spacing Scale</h2>
            <p className="text-muted-foreground">
              Consistent spacing using a modular scale based on multiples of
              4px.
            </p>

            <Card>
              <CardContent className="pt-6 space-y-6">
                {spacingScale.map((spacing) => (
                  <div key={spacing.name} className="space-y-2">
                    <div className="flex items-center gap-4">
                      <code className="text-sm bg-muted px-2 py-1 rounded w-16 text-center">
                        {spacing.name}
                      </code>
                      <span className="text-sm text-muted-foreground">
                        {spacing.size}
                      </span>
                    </div>
                    <div className="flex">
                      <div
                        className="bg-primary"
                        style={{
                          width: spacing.size,
                          height: spacing.size,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Border Radius */}
          <section className="space-y-6">
            <h2 className="text-3xl font-semibold">Border Radius</h2>
            <p className="text-muted-foreground">
              Border radius scale based on the --radius custom property (10px
              base).
            </p>

            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {radiusScale.map((radius) => (
                    <div key={radius.name} className="text-center space-y-3">
                      <div
                        className={`${radius.class} bg-primary h-16 w-16 mx-auto`}
                      />
                      <div>
                        <code className="text-sm bg-muted px-2 py-1 rounded block">
                          {radius.name}
                        </code>
                        <p className="text-xs text-muted-foreground mt-1">
                          {radius.var}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Components Showcase */}
          <section className="space-y-6">
            <h2 className="text-3xl font-semibold">Components</h2>
            <p className="text-muted-foreground">
              Live examples of our UI components in action.
            </p>

            {/* Buttons */}
            <div className="space-y-4">
              <h3 className="text-2xl font-medium">Buttons</h3>
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Variants</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="default">Default</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="link">Link</Button>
                      <Button variant="destructive">Destructive</Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Sizes</h4>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button size="sm">Small</Button>
                      <Button size="default">Default</Button>
                      <Button size="lg">Large</Button>
                      <Button size="icon">
                        <span className="sr-only">Icon</span>✨
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form Elements */}
            <div className="space-y-4">
              <h3 className="text-2xl font-medium">Form Elements</h3>
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                    />
                  </div>

                  <Button className="w-full">Submit</Button>
                </CardContent>
              </Card>
            </div>

            {/* Cards */}
            <div className="space-y-4">
              <h3 className="text-2xl font-medium">Cards</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Card</CardTitle>
                    <CardDescription>
                      This is a simple card component with header and content.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Cards are flexible containers for grouping related content
                      and actions.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Feature Card</CardTitle>
                    <CardDescription>
                      Another variation of the card component.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full" />
                      <span className="text-sm">Active feature</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full" />
                      <span className="text-sm">Beta feature</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                      <span className="text-sm">Coming soon</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Usage Guidelines */}
          <section className="space-y-6">
            <h2 className="text-3xl font-semibold">Usage Guidelines</h2>

            <Card>
              <CardHeader>
                <CardTitle>Design Principles</CardTitle>
                <CardDescription>
                  Key principles that guide our design system decisions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Consistency</h4>
                  <p className="text-sm text-muted-foreground">
                    Use design tokens consistently across all components and
                    pages.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Accessibility</h4>
                  <p className="text-sm text-muted-foreground">
                    All colors meet WCAG contrast requirements, and components
                    support keyboard navigation.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Scalability</h4>
                  <p className="text-sm text-muted-foreground">
                    The system is built to scale with your application as it
                    grows.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Flexibility</h4>
                  <p className="text-sm text-muted-foreground">
                    Components can be composed and customized while maintaining
                    consistency.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}
