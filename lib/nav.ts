// lib/nav.ts
import {
  Briefcase, FileText, LayoutGrid, Star,
  ArrowDownToLine, Receipt, MessageSquare,
  LifeBuoy, ShieldCheck, User, LayoutDashboard, Tags, Users as UsersIcon,
  UserCog, Wallet, BarChart3,
  Settings, FileBadge, Image as ImageIcon, Globe, Bell,
  CreditCard, Languages, Shield,
  ClipboardCheck, PartyPopper, Search, ClipboardList, ArrowRightLeft,
  Send, FolderKanban, ShoppingBag, PlusCircle, Inbox, UserCheck,
} from "lucide-react";

export const buyerNav = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard",    url: "/dashboard",  icon: LayoutGrid },
      { title: "Find Service", url: "/service",    icon: Search },
    ],
  },
  {
    label: "Hiring",
    items: [
      { title: "Post a Job",      url: "/post-projects",  icon: PlusCircle },
      { title: "My Jobs",         url: "/my-projects",    icon: Briefcase },
      { title: "Received Bids",   url: "/my-bids",        icon: Inbox },
      { title: "Submitted Work",  url: "/submitted-work", icon: ClipboardCheck },
    ],
  },
  {
    label: "Payments",
    items: [
      { title: "Purchased Services",  url: "/paid",               icon: ShoppingBag },
      { title: "Hired Freelancers",   url: "/hired-freelancers",  icon: UserCheck },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Messages", url: "/chat",             icon: MessageSquare },
      { title: "Profile",  url: "/settings/profile", icon: User },
    ],
  },
  {
    label: "Help",
    items: [
      { title: "Support", url: "/support", icon: LifeBuoy },
    ],
  },
];


export const freelancerNav = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/freelancer", icon: LayoutGrid },
      { title: "Find Jobs",  url: "/jobs",       icon: Search },
    ],
  },
  {
    label: "Active Work",
    items: [
      { title: "Projects",       url: "/freelancer/projects",       icon: FolderKanban },
      { title: "Orders",         url: "/freelancer/orders",         icon: ShoppingBag },
      { title: "Submitted Bids", url: "/freelancer/submitted-bids", icon: Send },
      { title: "Hired Jobs",     url: "/freelancer/hired",          icon: PartyPopper },
    ],
  },
  {
    label: "Earnings",
    items: [
      { title: "Wallet",        url: "/freelancer/wallet",        icon: Wallet },
      { title: "Transactions",  url: "/freelancer/transactions",  icon: Receipt },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Messages", url: "/chat",                  icon: MessageSquare },
      { title: "Reviews",  url: "/freelancer/reviews",   icon: Star },
      { title: "Profile",  url: "/settings/profile",     icon: User },
      { title: "Settings", url: "/freelancer/settings",  icon: Settings },
    ],
  },
  {
    label: "Help",
    items: [
      { title: "Support", url: "/support", icon: LifeBuoy },
    ],
  },
];


export const adminNav = [
  { label: "Overview", items: [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  ]},
  { label: "Users", items: [
    { title: "Freelancers", url: "/admin/freelancers", icon: UserCog },
    { title: "Buyers", url: "/admin/buyers", icon: UsersIcon },
    { title: "KYC Verification", url: "/admin/kyc", icon: Shield },
  ]},
  { label: "Catalog", items: [
    { title: "Jobs", url: "/admin/jobs", icon: Briefcase },
    { title: "Bids", url: "/admin/bids", icon: FileText },
    { title: "Services", url: "/admin/services", icon: Briefcase },
    { title: "Service Approval", url: "/admin/service-approval", icon: ClipboardCheck },
    { title: "Job Approval", url: "/admin/job-approval", icon: ClipboardCheck },
    { title: "Categories", url: "/admin/categories", icon: Tags },
  ]},
  { label: "Finance", items: [
    { title: "Wallet", url: "/admin/wallet", icon: Wallet },
    { title: "Payment Release", url: "/admin/payments", icon: ArrowRightLeft },
    { title: "Transactions", url: "/admin/transactions", icon: Receipt },
  ]},
  { label: "System", items: [
    { title: "General Settings", url: "/admin/settings", icon: Settings },
  ]},
];