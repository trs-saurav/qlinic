// components/NavLink.jsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const NavLink = ({ href, children, className = "", onClick }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  const baseClasses = "relative text-muted-foreground hover:text-foreground transition-all duration-200 font-medium";
  const activeClasses = isActive ? "text-primary font-semibold" : "";
  const combinedClasses = `${baseClasses} ${activeClasses} ${className}`.trim();

  return (
    <Link 
      href={href} 
      className={combinedClasses}
      onClick={onClick}
    >
      {children}
      {isActive && (
        <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full animate-in slide-in-from-left duration-300" />
      )}
    </Link>
  );
};
