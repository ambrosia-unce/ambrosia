"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Github, LayoutDashboard, LogOut, Upload } from "lucide-react";

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const initials = (session.user.username || session.user.name || "U")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/30 px-2.5 py-1.5 outline-none transition-all hover:border-border/60 hover:bg-card/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background">
        <Avatar className="size-6">
          <AvatarImage
            src={session.user.avatarUrl || session.user.image || ""}
            alt={session.user.username || ""}
          />
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden text-[12px] font-medium sm:inline">
          {session.user.username || session.user.name}
        </span>
        <ChevronDown className="size-3 text-muted-foreground/50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/40 bg-popover/95 p-1.5 backdrop-blur-xl">
        {/* User info */}
        <div className="mb-1 rounded-lg bg-muted/30 px-3 py-2.5">
          <p className="text-[13px] font-semibold">
            {session.user.username || session.user.name}
          </p>
          <p className="text-[11px] text-muted-foreground/60">
            {session.user.email}
          </p>
        </div>

        <DropdownMenuItem asChild className="rounded-lg px-3 py-2 text-[12px]">
          <Link href="/dashboard" className="cursor-pointer">
            <LayoutDashboard className="mr-2.5 size-3.5 text-muted-foreground" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-lg px-3 py-2 text-[12px]">
          <Link href="/submit" className="cursor-pointer">
            <Upload className="mr-2.5 size-3.5 text-muted-foreground" />
            Submit Pack
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-lg px-3 py-2 text-[12px]">
          <Link
            href={`https://github.com/${session.user.username}`}
            target="_blank"
            className="cursor-pointer"
          >
            <Github className="mr-2.5 size-3.5 text-muted-foreground" />
            GitHub Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 bg-border/30" />

        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="cursor-pointer rounded-lg px-3 py-2 text-[12px] text-red-400 focus:text-red-400"
        >
          <LogOut className="mr-2.5 size-3.5" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
