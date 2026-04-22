"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import {
  BookOpenIcon,
  BoxesIcon,
  SearchIcon,
  SparklesIcon,
  WrenchIcon,
  XIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { AddResourceDialog } from "@/components/AddResourceDialog";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  categories,
  getFavicon,
  getHostname,
  type Category,
  type Resource,
} from "@/lib/resources";
import { useLinkPreview } from "@/lib/use-link-preview";

const categoryIcons: Record<Category, React.ComponentType<{ className?: string }>> = {
  tools: WrenchIcon,
  skills: SparklesIcon,
  projects: BoxesIcon,
  knowledge: BookOpenIcon,
};

function ResourceThumbnail({ resource }: { resource: Resource }) {
  const preview = useLinkPreview(resource.url);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const showImage = Boolean(preview?.image) && !imageFailed;
  const showFavicon = Boolean(preview && !preview.image);

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-muted transition-transform duration-300 group-hover/link:scale-105">
      {showImage && (
        <Image
          src={preview!.image!}
          alt={`${resource.name} preview`}
          width={800}
          height={450}
          unoptimized
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageFailed(true)}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
          style={{ opacity: imageLoaded ? 1 : 0 }}
        />
      )}
      {showFavicon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={getFavicon(resource.url, 128)}
            alt=""
            width={64}
            height={64}
            unoptimized
            className="size-12 rounded-md ring-1 ring-border/40"
          />
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group/link block h-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full pt-0 transition-all duration-200 group-hover/link:-translate-y-0.5 group-hover/link:ring-foreground/30 group-hover/link:shadow-lg">
        <ResourceThumbnail resource={resource} />
        <CardHeader>
          <CardTitle className="truncate">{resource.name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {resource.description}
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">{getHostname(resource.url)}</Badge>
          </CardAction>
        </CardHeader>
      </Card>
    </a>
  );
}

function Grid({ items, tabKey }: { items: Resource[]; tabKey: string }) {
  if (items.length === 0) {
    return (
      <p className="mt-12 text-center text-sm text-muted-foreground">
        No resources match your search.
      </p>
    );
  }
  return (
    <motion.div
      key={tabKey}
      className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 mt-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.04 } },
      }}
    >
      {items.map((r) => (
        <motion.div
          key={r.url}
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <ResourceCard resource={r} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Category>("tools");
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/resources")
      .then((r) => r.json() as Promise<{ resources: Resource[] }>)
      .then((data) => {
        if (active) setResources(data.resources ?? []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const q = query.trim().toLowerCase();

  const matches = (r: Resource) =>
    !q ||
    r.name.toLowerCase().includes(q) ||
    r.description.toLowerCase().includes(q) ||
    getHostname(r.url).toLowerCase().includes(q);

  const handleAdd = (added: Resource) => {
    setResources((prev) => {
      if (prev.some((r) => r.url === added.url)) return prev;
      return [added, ...prev];
    });
    setTab(added.category);
  };

  return (
    <main>
      <Tabs
        value={tab}
        onValueChange={(v) => v && setTab(v as Category)}
        className="gap-0"
      >
        <header className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl supports-backdrop-filter:bg-background/75">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
            <TabsList className="gap-2">
              {categories.map((c) => {
                const Icon = categoryIcons[c.value];
                const isActive = tab === c.value;
                return (
                  <TabsTrigger
                    key={c.value}
                    value={c.value}
                    className="relative data-active:bg-transparent data-active:shadow-none dark:data-active:bg-transparent dark:data-active:border-transparent"
                  >
                    {isActive && (
                      <motion.span
                        layoutId="active-tab-indicator"
                        className="absolute inset-0 rounded-md bg-background ring-1 ring-border shadow-sm dark:bg-input/60 dark:ring-input"
                        transition={{
                          type: "spring",
                          bounce: 0.18,
                          duration: 0.45,
                        }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon />
                      {c.label}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="flex items-center gap-2">
              <InputGroup className="w-64">
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  placeholder="Search resources..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                {query && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      aria-label="Clear search"
                      onClick={() => setQuery("")}
                    >
                      <XIcon />
                    </InputGroupButton>
                  </InputGroupAddon>
                )}
              </InputGroup>
              <AddResourceDialog onAdd={handleAdd} />
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl px-6 pt-24 pb-12">
          {categories.map((c) => {
            const items = resources.filter(
              (r) => r.category === c.value && matches(r),
            );
            return (
              <TabsContent key={c.value} value={c.value}>
                <Grid items={items} tabKey={c.value} />
              </TabsContent>
            );
          })}
        </div>
      </Tabs>
    </main>
  );
}
