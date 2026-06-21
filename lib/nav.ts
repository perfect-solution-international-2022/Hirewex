// lib/nav.ts
import { 
  Briefcase, FileText, LayoutGrid, Star, 
  ArrowDownToLine, Receipt, MessageSquare, 
  LifeBuoy, ShieldCheck, User, LayoutDashboard, Tags, Users as UsersIcon, 
  UserCog, Wallet, BarChart3, 
  Settings, FileBadge, Image as ImageIcon, Globe, Bell, 
  CreditCard, Languages, Shield,
  ClipboardCheck, PartyPopper, Search 
} from "lucide-react";

export const buyerNav = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutGrid },
      { title: "Find Service", url: "/service", icon: Search },
    ],
  },
  {
    label: "Work",
    items: [
      { title: "My Jobs", url: "/my-projects", icon: Briefcase },
      { title: "Received Bids", url: "/my-bids", icon: FileText },
      { title: "Post a Job", url: "/post-projects", icon: FileText },
      
    ],
  },
  {
    label: "Money",
    items: [
      { title: "Paid", url: "/paid", icon: Briefcase },
      
    ],
  },
  
  {
    label: "Account",
    items: [
      { title: "Chat", url: "/chat", icon: MessageSquare },
      { title: "Profile", url: "/settings/profile", icon: User },
    ],
  },
];


export const freelancerNav = [
  {
    label: "Work",
    items: [
      { title: "Dashboard", url: "/freelancer", icon: LayoutGrid },
      { title: "Projects", url: "/freelancer/projects", icon: Briefcase },
      { title: "Orders", url: "/freelancer/orders", icon: FileText },
      { title: "Submitted Bids", url: "/freelancer/submitted-bids", icon: FileText },
      { title: "Hired Jobs", url: "/freelancer/hired", icon: PartyPopper },
    ],
  },
  {
    label: "Money",
    items: [
      { title: "Withdraw", url: "/freelancer/withdraw", icon: ArrowDownToLine },
      { title: "Transactions", url: "/freelancer/transactions", icon: Receipt },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Chat", url: "/chat", icon: MessageSquare },
      { title: "Reviews", url: "/freelancer/reviews", icon: Star },
      { title: "Profile", url: "/settings/profile", icon: User },
      { title: "Settings", url: "/freelancer/settings", icon: Settings },
    ],
  },
   {
    label: "Discover",
    items: [
      { title: "Find Jobs", url: "/jobs", icon: Search },
    ],
  },
  {
    label: "Help",
    items: [
      { title: "Support", url: "/freelancer/support", icon: LifeBuoy },
    ],
  },
];


export const adminNav = [
  { label: "Overview", items: [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard }, 
    { title: "Reports", url: "/admin/reports", icon: BarChart3 }
  ]},
  { label: "Catalog", items: [
    { title: "Categories", url: "/admin/categories", icon: Tags },
    { title: "Jobs", url: "/admin/jobs", icon: Briefcase },
    { title: "Bids", url: "/admin/bids", icon: FileText },
    { title: "Services", url: "/admin/services", icon: Briefcase },
    { title: "Service Approval", url: "/admin/service-approval", icon: ClipboardCheck },
    { title: "Job Approval", url: "/admin/job-approval", icon: ClipboardCheck },
    { title: "Hired Jobs", url: "/freelancer/hired", icon: PartyPopper },
  ]},
  { label: "Users", items: [
    { title: "Freelancers", url: "/admin/freelancers", icon: UserCog },
    { title: "Buyers", url: "/admin/buyers", icon: UsersIcon },
  ]},
  { label: "Finance", items: [
    { title: "Deposits", url: "/admin/deposits", icon: Wallet },
    { title: "Withdrawals", url: "/admin/withdrawals", icon: ArrowDownToLine },
    { title: "Payment Gateways", url: "/admin/gateways", icon: CreditCard },
    { title: "Charges", url: "/admin/charges", icon: Wallet },
  ]},
  { label: "Support", items: [
    { title: "Tickets", url: "/admin/tickets", icon: LifeBuoy }
  ]},
  { label: "System", items: [
    { title: "General Settings", url: "/admin/settings", icon: Settings },
    { title: "Logo & Favicon", url: "/admin/branding", icon: ImageIcon },
    { title: "Notifications", url: "/admin/notifications", icon: Bell },
    { title: "KYC", url: "/admin/kyc", icon: Shield },
    { title: "Policies", url: "/admin/policies", icon: FileText },
  ]},
];