"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Wallet,
  Home,
  AlertTriangle,
} from "lucide-react";

const navItems = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/inventory", label: "المخزون", icon: Package },
  { href: "/purchases", label: "المشتريات", icon: ShoppingCart },
  { href: "/sales", label: "المبيعات", icon: TrendingUp },
  { href: "/expenses", label: "المصروفات", icon: Wallet },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        backgroundColor: "#1a1d27",
        borderLeft: "1px solid #2e3348",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "24px 16px",
          borderBottom: "1px solid #2e3348",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "22px",
            fontWeight: "800",
            color: "#f59e0b",
            lineHeight: 1.3,
            letterSpacing: "1px",
          }}
        >
          إبـــن عثمـــان
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#64748b",
            marginTop: "4px",
            letterSpacing: "1px",
          }}
        >
          نظام إدارة المخزون
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 8px" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "10px",
                marginBottom: "4px",
                textDecoration: "none",
                backgroundColor: isActive ? "rgba(245,158,11,0.15)" : "transparent",
                color: isActive ? "#f59e0b" : "#94a3b8",
                fontWeight: isActive ? "600" : "400",
                fontSize: "15px",
                transition: "all 0.2s",
                borderRight: isActive ? "3px solid #f59e0b" : "3px solid transparent",
              }}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "16px",
          borderTop: "1px solid #2e3348",
          fontSize: "11px",
          color: "#475569",
          textAlign: "center",
        }}
      >
        <AlertTriangle size={14} style={{ display: "inline", marginLeft: "4px", color: "#f59e0b" }} />
        إبن عثمان © 2025
      </div>
    </aside>
  );
}
