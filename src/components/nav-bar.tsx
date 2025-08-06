"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

const NavBar = () => {
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    redirect("/auth");
  };

  return (
    <nav className="w-full flex items-center justify-between border-b py-2 px-4">
      <h2 className="font-bold text-lg text-primary">Expense.</h2>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarFallback className="bg-primary/60 text-primary-foreground">
              M
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="text-destructive" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
};

export default NavBar;
