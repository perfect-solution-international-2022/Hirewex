"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { freelancerNav } from "@/lib/nav"; 
import AvatarEditor from "react-avatar-editor";
import { 
  Share, Eye, MapPin, MessageCircle, Plus, Briefcase, 
  Award, LayoutGrid, FolderGit2, Pen, User, Camera, Trash2, X, Info, Loader2,
  FileText, Upload, Download
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { 
  getProfileData, updateProfileBasic, saveWorkExperience, 
  deleteWorkExperience, saveSkill, deleteSkill, uploadAvatarAction,
  uploadPortfolioAction, deletePortfolioAction
} from "@/app/actions/profile";

type WorkExp = { id: string, title: string, type: string, company: string, current: boolean, start: string, end: string, desc: string, skills: string, industry: string };
type Skill = { id: string, name: string, level: string };

export default function ProfilePage() {
  const [isPending, startTransition] = useTransition();
  const { data: session, status } = useSession();
  const USER_ID = session?.user?.id as string;
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // --- AVATAR UPLOAD & CROP STATES ---
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const editorRef = useRef<AvatarEditor>(null);

  // --- PORTFOLIO PDF STATES ---
  const [portfolioUrl, setPortfolioUrl] = useState<string | null>(null);
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
  const [isDeletingPortfolio, setIsDeletingPortfolio] = useState(false);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("Add display name");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState("Add title");
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationText, setLocationText] = useState("Sri Lanka");
  const [isEditingLang, setIsEditingLang] = useState(false);
  const [langText, setLangText] = useState("English");
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [aboutText, setAboutText] = useState("");

  const [workList, setWorkList] = useState<WorkExp[]>([]);
  const [skillsList, setSkillsList] = useState<Skill[]>([]);

  const [isAddingWork, setIsAddingWork] = useState(false);
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);

  const [workTitle, setWorkTitle] = useState("");
  const [workType, setWorkType] = useState("");
  const [workCompany, setWorkCompany] = useState("");
  const [workStartDate, setWorkStartDate] = useState("");
  const [workEndDate, setWorkEndDate] = useState("");
  const [workCurrent, setWorkCurrent] = useState(false);
  const [workDesc, setWorkDesc] = useState("");
  const [workSkills, setWorkSkills] = useState("");
  const [workIndustry, setWorkIndustry] = useState("");
  
  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState("");

  const [bottomToast, setBottomToast] = useState(false);
  const [topToastMsg, setTopToastMsg] = useState("");

  useEffect(() => {
    if (!USER_ID) return;

    async function loadData() {
      const result = await getProfileData(USER_ID);
      
      if (result.success && result.data) {
        const dbData = result.data;
        if (dbData.displayName) setDisplayName(dbData.displayName);
        if (dbData.title) setTitleText(dbData.title);
        if (dbData.location) setLocationText(dbData.location);
        if (dbData.language) setLangText(dbData.language);
        if (dbData.aboutText) setAboutText(dbData.aboutText);
        if (dbData.avatarUrl) setAvatarUrl(dbData.avatarUrl);
        if (dbData.portfolioUrl) setPortfolioUrl(dbData.portfolioUrl);

        if (dbData.workExperiences) {
          const formattedWork = dbData.workExperiences.map((w: any) => ({
            id: w.id, title: w.title, type: w.type || "", company: w.company,
            current: w.current, start: w.startDate, end: w.endDate || "",
            desc: w.desc || "", skills: w.skills || "", industry: w.industry || ""
          }));
          setWorkList(formattedWork);
        }

        if (dbData.skills) setSkillsList(dbData.skills);
      }
      setIsLoadingProfile(false);
    }
    loadData();
  }, [USER_ID]);

  const triggerTopToast = (msg: string) => {
    setTopToastMsg(msg);
    setTimeout(() => setTopToastMsg(""), 3000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setBottomToast(true);
    setTimeout(() => setBottomToast(false), 3000);
  };

  const handleSaveBasic = (field: string, value: string | null, setEditState?: (val: boolean) => void) => {
    startTransition(async () => {
      const result = await updateProfileBasic({ [field]: value });
      if (result.success) {
        if (setEditState) setEditState(false);
        triggerTopToast("Profile updated!");
      } else {
        triggerTopToast("Error: Could not save to database!");
      }
    });
  };

  // --- AVATAR HANDLERS ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRawImage(URL.createObjectURL(file));
      setZoom(1);
      setIsCropModalOpen(true);
    }
    if (avatarInputRef.current) avatarInputRef.current.value = ""; 
  };

  const handleSaveCroppedImage = async () => {
    if (!editorRef.current) return;
    setIsUploadingAvatar(true);
    const canvas = editorRef.current.getImageScaledToCanvas();
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsUploadingAvatar(false);
        return triggerTopToast("Failed to process image.");
      }
      const file = new File([blob], "avatar.png", { type: "image/png" });
      const formData = new FormData();
      formData.append("avatar", file);

      try {
        const result = await uploadAvatarAction(formData);
        if (result.success && result.url) {
          setAvatarUrl(result.url);
          handleSaveBasic("avatarUrl", result.url);
          setIsCropModalOpen(false);
          setRawImage(null);
        } else {
          triggerTopToast("Failed to upload image.");
        }
      } catch (err) {
        triggerTopToast("Error uploading image.");
      } finally {
        setIsUploadingAvatar(false);
      }
    }, "image/png");
  };

  // --- PORTFOLIO PDF HANDLERS ---
  const handlePortfolioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      triggerTopToast("Only PDF files are allowed.");
      if (portfolioInputRef.current) portfolioInputRef.current.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      triggerTopToast("File must be under 10MB.");
      if (portfolioInputRef.current) portfolioInputRef.current.value = "";
      return;
    }

    setIsUploadingPortfolio(true);
    const formData = new FormData();
    formData.append("portfolio", file);

    try {
      const result = await uploadPortfolioAction(formData);
      if (result.success && result.url) {
        setPortfolioUrl(result.url);
        triggerTopToast("Portfolio uploaded!");
      } else {
        triggerTopToast(result.error || "Failed to upload portfolio.");
      }
    } catch (err) {
      triggerTopToast("Error uploading portfolio.");
    } finally {
      setIsUploadingPortfolio(false);
      if (portfolioInputRef.current) portfolioInputRef.current.value = "";
    }
  };

  const handleDeletePortfolio = async () => {
    setIsDeletingPortfolio(true);
    try {
      const result = await deletePortfolioAction();
      if (result.success) {
        setPortfolioUrl(null);
        triggerTopToast("Portfolio deleted!");
      } else {
        triggerTopToast(result.error || "Failed to delete portfolio.");
      }
    } catch (err) {
      triggerTopToast("Error deleting portfolio.");
    } finally {
      setIsDeletingPortfolio(false);
    }
  };

  // --- WORK & SKILL HANDLERS ---
  const isWorkFormValid = workTitle.trim() !== "" && workCompany.trim() !== "" && workStartDate !== "" && (workCurrent || workEndDate !== "");
  const resetWorkForm = () => { setWorkTitle(""); setWorkType(""); setWorkCompany(""); setWorkStartDate(""); setWorkEndDate(""); setWorkCurrent(false); setWorkDesc(""); setWorkSkills(""); setWorkIndustry(""); setEditingWorkId(null); setIsAddingWork(false); };
  const handleSaveWork = () => { const newWork: WorkExp = { id: editingWorkId || `temp_${Date.now()}`, title: workTitle, type: workType, company: workCompany, current: workCurrent, start: workStartDate, end: workEndDate, desc: workDesc, skills: workSkills, industry: workIndustry }; startTransition(async () => { const result = await saveWorkExperience(USER_ID, newWork); if (result.success) { if (editingWorkId) { setWorkList(workList.map(w => w.id === editingWorkId ? newWork : w)); triggerTopToast("Work experience updated!"); } else { setWorkList([...workList, newWork]); triggerTopToast("Work experience added!"); } resetWorkForm(); } else { triggerTopToast("Error: Database rejected work experience!"); } }); };
  const openEditWork = (work: WorkExp) => { setWorkTitle(work.title); setWorkType(work.type || ""); setWorkCompany(work.company); setWorkStartDate(work.start); setWorkEndDate(work.end || ""); setWorkCurrent(work.current); setWorkDesc(work.desc || ""); setWorkSkills(work.skills || ""); setWorkIndustry(work.industry || ""); setEditingWorkId(work.id); setIsAddingWork(true); };
  const handleDeleteWork = (id: string) => { startTransition(async () => { await deleteWorkExperience(id); setWorkList(workList.filter(w => w.id !== id)); triggerTopToast("Work experience deleted!"); }); };
  const isSkillFormValid = skillName.trim() !== "" && skillLevel !== "" && skillLevel !== "Experience level";
  const resetSkillForm = () => { setSkillName(""); setSkillLevel(""); setEditingSkillId(null); setIsAddingSkill(false); };
  const handleSaveSkill = () => { const newSkill: Skill = { id: editingSkillId || `temp_${Date.now()}`, name: skillName, level: skillLevel }; startTransition(async () => { const result = await saveSkill(USER_ID, newSkill); if (result.success) { if (editingSkillId) { setSkillsList(skillsList.map(s => s.id === editingSkillId ? newSkill : s)); triggerTopToast("Skill updated!"); } else { setSkillsList([...skillsList, newSkill]); triggerTopToast("Skill added!"); } resetSkillForm(); } else { triggerTopToast("Error: Database rejected skill!"); } }); };
  const openEditSkill = (skill: Skill) => { setSkillName(skill.name); setSkillLevel(skill.level); setEditingSkillId(skill.id); setIsAddingSkill(true); };
  const handleDeleteSkill = (id: string) => { startTransition(async () => { await deleteSkill(id); setSkillsList(skillsList.filter(s => s.id !== id)); triggerTopToast("Skill deleted!"); }); };

  if (status === "loading" || (USER_ID && isLoadingProfile)) {
    return (
      <DashboardShell title="Profile" groups={freelancerNav} role="freelancer">
        <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Profile" groups={freelancerNav} role="freelancer">
      {bottomToast && <div className="fixed bottom-4 right-4 z-50 rounded-md bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg animate-in slide-in-from-bottom-5">Link copied to clipboard!</div>}
      {topToastMsg && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg animate-in slide-in-from-top-4 fade-in">{topToastMsg}</div>}

      {/* --- CROP MODAL UI --- */}
      {isCropModalOpen && rawImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-foreground">Adjust Image</h3>
                <button onClick={() => { setIsCropModalOpen(false); setRawImage(null); }} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
              </div>
              
              <div className="flex flex-col items-center gap-6">
                <div className="rounded-full overflow-hidden border-2 border-primary/20">
                  <AvatarEditor
                    ref={editorRef}
                    image={rawImage}
                    width={250}
                    height={250}
                    border={20}
                    color={[0, 0, 0, 0.4]}
                    scale={zoom}
                    rotate={0}
                    borderRadius={150}
                    className="cursor-move"
                  />
                </div>

                <div className="w-full space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground font-medium">
                    <span>Zoom Out</span>
                    <span>Zoom In</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button variant="outline" onClick={() => { setIsCropModalOpen(false); setRawImage(null); }} disabled={isUploadingAvatar}>
                  Cancel
                </Button>
                <Button onClick={handleSaveCroppedImage} disabled={isUploadingAvatar}>
                  {isUploadingAvatar ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : "Save Avatar"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          
          <Card className="overflow-hidden border-border/50 bg-card shadow-sm">
            <CardContent className="p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-5 sm:flex-row">
                  
                  <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground border-2 border-transparent hover:border-border transition-all group">
                    {isUploadingAvatar ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 opacity-20" />
                    )}

                    <input 
                      type="file" 
                      ref={avatarInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileSelect} 
                    />

                    <button 
                      onClick={() => avatarInputRef.current?.click()} 
                      disabled={isUploadingAvatar}
                      className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-sm transition hover:bg-muted disabled:opacity-50"
                    >
                      <Camera className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {avatarUrl && !isUploadingAvatar && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setAvatarUrl(null); 
                          handleSaveBasic("avatarUrl", null); 
                        }} 
                        className="absolute top-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card shadow-sm transition hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-col justify-center space-y-2">
                    <div className="flex items-center gap-2">
                      {isEditingName ? (
                        <div className="flex items-center gap-2">
                          <input autoFocus className="h-7 w-48 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                          <Button size="sm" variant="secondary" className="h-7 text-xs" disabled={isPending} onClick={() => handleSaveBasic("displayName", displayName, setIsEditingName)}>{isPending ? "..." : "Save"}</Button>
                        </div>
                      ) : (
                        <><h1 className="text-2xl font-bold tracking-tight">{displayName}</h1><button onClick={() => setIsEditingName(true)} className="text-muted-foreground hover:text-foreground"><Pen className="h-4 w-4" /></button></>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">@shalomhettiarac</div>

                    <div className="flex items-center gap-2 text-sm font-medium">
                      {isEditingTitle ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input autoFocus className="h-7 w-48 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm" value={titleText} onChange={(e) => setTitleText(e.target.value)} />
                          <Button size="sm" variant="secondary" className="h-7 text-xs" disabled={isPending} onClick={() => handleSaveBasic("title", titleText, setIsEditingTitle)}>{isPending ? "..." : "Save"}</Button>
                        </div>
                      ) : (
                        <>{titleText} <button onClick={() => setIsEditingTitle(true)} className="text-muted-foreground hover:text-foreground"><Pen className="h-3 w-3" /></button></>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> 
                        {isEditingLocation ? (
                          <div className="flex items-center gap-2"><input autoFocus className="h-6 w-32 rounded border border-input bg-background px-2 py-1 text-xs shadow-sm text-foreground" value={locationText} onChange={(e) => setLocationText(e.target.value)} /><Button size="sm" variant="secondary" className="h-6 px-2 text-[10px]" disabled={isPending} onClick={() => handleSaveBasic("location", locationText, setIsEditingLocation)}>Save</Button></div>
                        ) : (
                          <>{locationText} <button onClick={() => setIsEditingLocation(true)} className="ml-0.5 hover:text-foreground"><Pen className="h-3 w-3" /></button></>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> Speaks 
                        {isEditingLang ? (
                          <div className="flex items-center gap-2 ml-1"><input autoFocus className="h-6 w-24 rounded border border-input bg-background px-2 py-1 text-xs shadow-sm text-foreground" value={langText} onChange={(e) => setLangText(e.target.value)} /><Button size="sm" variant="secondary" className="h-6 px-2 text-[10px]" disabled={isPending} onClick={() => handleSaveBasic("language", langText, setIsEditingLang)}>Save</Button></div>
                        ) : (
                          <>{" " + langText} <button onClick={() => setIsEditingLang(true)} className="ml-0.5 hover:text-foreground"><Pen className="h-3 w-3" /></button></>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-9 font-medium" onClick={handleShare}><Share className="mr-2 h-4 w-4" /> Share</Button>
                  <Button variant="outline" size="sm" className="h-9 font-medium" asChild>
                    <Link href={`/profile-preview/${USER_ID}`} target="_blank">
                      <Eye className="mr-2 h-4 w-4" /> Preview
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card shadow-sm">
            <CardContent className="p-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">About</h2>
                {!isEditingAbout && <Button variant="ghost" size="sm" onClick={() => setIsEditingAbout(true)} className="h-8 text-muted-foreground hover:text-foreground"><Pen className="mr-2 h-3.5 w-3.5" /> Edit</Button>}
              </div>
              {isEditingAbout ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                  <textarea autoFocus className="min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Describe your expertise..." value={aboutText} onChange={(e) => setAboutText(e.target.value)} />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingAbout(false)}>Cancel</Button>
                    <Button size="sm" disabled={isPending} onClick={() => handleSaveBasic("aboutText", aboutText, setIsEditingAbout)}>{isPending ? "Saving..." : "Save"}</Button>
                  </div>
                </div>
              ) : (
                <div onClick={() => setIsEditingAbout(true)} className="group cursor-pointer rounded-lg text-sm leading-relaxed transition-all">
                  {aboutText ? (
                    <div className="-mx-2 rounded-md p-2 transition-colors hover:bg-muted/50"><p className="whitespace-pre-wrap text-foreground">{aboutText}</p></div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 py-8 text-center transition hover:bg-muted/40"><p className="mb-4 text-sm text-muted-foreground">Tell potential clients what makes you a great fit for their projects.</p><div className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors group-hover:bg-accent group-hover:text-accent-foreground"><Plus className="mr-2 h-4 w-4" /> Add description</div></div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* --- PORTFOLIO PDF SECTION --- */}
          <Card className="border-border/50 bg-card shadow-sm">
            <CardContent className="p-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Portfolio</h2>
              </div>

              <input
                type="file"
                ref={portfolioInputRef}
                className="hidden"
                accept="application/pdf"
                onChange={handlePortfolioSelect}
              />

              {portfolioUrl ? (
                <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-muted/10 p-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Portfolio document</p>
                    <p className="text-xs text-muted-foreground">PDF · uploaded</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <a href={portfolioUrl} target="_blank" rel="noreferrer">
                        <Download className="h-3.5 w-3.5 mr-1.5" /> View
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => portfolioInputRef.current?.click()}
                      disabled={isUploadingPortfolio || isDeletingPortfolio}
                    >
                      {isUploadingPortfolio ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Replace"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={handleDeletePortfolio}
                      disabled={isUploadingPortfolio || isDeletingPortfolio}
                    >
                      {isDeletingPortfolio ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => !isUploadingPortfolio && portfolioInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/10 py-10 text-center cursor-pointer hover:bg-muted/30 hover:border-primary/40 transition-colors"
                >
                  {isUploadingPortfolio ? (
                    <>
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Upload your portfolio</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF only · max 10MB</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* WORK EXPERIENCE */}
          {isAddingWork ? (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold mb-4">{editingWorkId ? "Edit work experience" : "Work experience"}</h2>
              <Card className="border-2 border-border bg-card shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between border-b pb-4 mb-4">
                    <div className="flex items-center font-medium"><Plus className="mr-2 h-4 w-4" /> {editingWorkId ? "Edit" : "Add new"}</div>
                    <button onClick={resetWorkForm} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="space-y-4">
                    <input type="text" placeholder="Title" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" value={workTitle} onChange={(e) => setWorkTitle(e.target.value)} />
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm text-foreground" value={workType} onChange={(e) => setWorkType(e.target.value)}>
                      <option value="">Employment type (Optional)</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                    </select>
                    <input type="text" placeholder="Company name" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" value={workCompany} onChange={(e) => setWorkCompany(e.target.value)} />
                    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="rounded border-input text-primary focus:ring-primary h-4 w-4" checked={workCurrent} onChange={(e) => setWorkCurrent(e.target.checked)} />I currently work here</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1"><label className="text-xs text-muted-foreground">Start date</label><input type="date" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm text-foreground" value={workStartDate} onChange={(e) => setWorkStartDate(e.target.value)} /></div>
                      <div className="flex flex-col gap-1"><label className="text-xs text-muted-foreground">End date {workCurrent && "(Optional)"}</label><input type="date" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm text-foreground disabled:opacity-50" disabled={workCurrent} value={workEndDate} onChange={(e) => setWorkEndDate(e.target.value)} /></div>
                    </div>
                    <div><textarea className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground" placeholder="Add your job history and achievements to give clients insight into your expertise." value={workDesc} onChange={(e) => setWorkDesc(e.target.value)} /><div className="text-right text-xs text-muted-foreground mt-1">{workDesc.length}/2000 characters</div></div>
                    <input type="text" placeholder="Skills (Optional) e.g. React, Node.js" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" value={workSkills} onChange={(e) => setWorkSkills(e.target.value)} />
                    <input type="text" placeholder="Industry (Optional)" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" value={workIndustry} onChange={(e) => setWorkIndustry(e.target.value)} />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="secondary" onClick={resetWorkForm}>Cancel</Button>
                    <Button disabled={!isWorkFormValid || isPending} onClick={handleSaveWork}>{isPending ? "..." : (editingWorkId ? "Save" : "Add")}</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : workList.length > 0 ? (
            <Card className="border-border/50 bg-card shadow-sm">
              <CardContent className="p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Work experience</h2>
                  <Button variant="outline" size="sm" onClick={() => setIsAddingWork(true)} className="h-8 font-medium"><Plus className="mr-2 h-3.5 w-3.5" /> Add new</Button>
                </div>
                <div className="space-y-6">
                  {workList.map((work, idx) => (
                    <div key={work.id} className={`group relative flex justify-between gap-4 ${idx !== workList.length - 1 ? 'border-b border-border/50 pb-6' : ''}`}>
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Briefcase className="h-6 w-6" /></div>
                        <div className="space-y-1 text-sm">
                          <h4 className="font-bold text-base">{work.title}</h4>
                          <div className="text-foreground">{work.company} {work.type && <span className="text-muted-foreground">· {work.type}</span>}</div>
                          <div className="text-muted-foreground">{new Date(work.start).toLocaleDateString(undefined, {month: 'short', year: 'numeric'})} - {work.current ? "Present" : new Date(work.end).toLocaleDateString(undefined, {month: 'short', year: 'numeric'})}</div>
                          {work.desc && <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{work.desc}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button disabled={isPending} onClick={() => openEditWork(work)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-transparent bg-card text-muted-foreground shadow-sm transition-all hover:border-border hover:bg-muted" title="Edit"><Pen className="h-4 w-4" /></button>
                        <button disabled={isPending} onClick={() => handleDeleteWork(work.id)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-transparent bg-card text-muted-foreground shadow-sm transition-all hover:border-destructive hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-destructive" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <ActionCard title="Work experience" desc="Add your job history and achievements to give clients insight into your expertise." btnText="Add work experience" icon={<Briefcase className="h-8 w-8 text-primary" />} onClick={() => setIsAddingWork(true)} />
          )}

          {/* SKILLS */}
          {isAddingSkill ? (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold mb-4">{editingSkillId ? "Edit skill" : "Skills and expertise"}</h2>
              <Card className="border-2 border-border bg-card shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between border-b pb-4 mb-4">
                    <div className="flex items-center font-medium"><Plus className="mr-2 h-4 w-4" /> {editingSkillId ? "Edit" : "Add new"}</div>
                    <button onClick={resetSkillForm} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 p-3 text-sm text-blue-900 dark:text-blue-300"><Info className="h-4 w-4 shrink-0" /><p>Adding your specific skills helps to make sure the right clients reach you.</p></div>
                    <input type="text" placeholder="Add skill or expertise (For example JavaScript)" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" value={skillName} onChange={(e) => setSkillName(e.target.value)} />
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm text-foreground" value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)}>
                      <option value="">Experience level</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="secondary" onClick={resetSkillForm}>Cancel</Button>
                    <Button disabled={!isSkillFormValid || isPending} onClick={handleSaveSkill}>{isPending ? "..." : (editingSkillId ? "Save" : "Add")}</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : skillsList.length > 0 ? (
             <Card className="border-border/50 bg-card shadow-sm">
              <CardContent className="p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Skills and expertise</h2>
                  <Button variant="outline" size="sm" onClick={() => setIsAddingSkill(true)} className="h-8 font-medium"><Plus className="mr-2 h-3.5 w-3.5" /> Add new</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill) => (
                    <div key={skill.id} className="group flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm transition-colors hover:bg-muted">
                      <span className="font-medium">{skill.name}</span><span className="text-muted-foreground text-xs">· {skill.level}</span>
                      <div className="ml-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button disabled={isPending} onClick={() => openEditSkill(skill)} className="text-muted-foreground hover:text-foreground" title="Edit"><Pen className="h-3.5 w-3.5" /></button>
                        <button disabled={isPending} onClick={() => handleDeleteSkill(skill.id)} className="text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <ActionCard title="Skills and expertise" desc="Attract relevant clients by sharing your strengths and abilities" btnText="Add skills and expertise" icon={<Award className="h-8 w-8 text-primary" />} onClick={() => setIsAddingSkill(true)} />
          )}
          
        </div>

        {/* RIGHT COLUMN - SIDEBAR */}
        <div className="flex flex-col gap-6">
          <Card className="border-border/50 bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Profile Strength</h2>
                <span className="text-lg font-bold">7<span className="text-sm font-medium text-muted-foreground">/12</span></span>
              </div>
              <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[58%] rounded-full bg-primary" />
              </div>
              <div className="space-y-3">
                <StrengthItem text="Showcase portfolio" icon={<LayoutGrid className="h-4 w-4" />} />
                <StrengthItem text="List certifications" icon={<Award className="h-4 w-4" />} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function ActionCard({ title, desc, btnText, icon, onClick }: any) {
  return (
    <Card className="border-border/50 bg-card shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-8">
        <div className="flex flex-col-reverse justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col items-start"><h3 className="mb-2 text-lg font-bold">{title}</h3><p className="mb-6 max-w-md text-sm text-muted-foreground">{desc}</p><Button variant="outline" size="sm" className="font-medium" onClick={onClick}><Plus className="mr-2 h-4 w-4" /> {btnText}</Button></div>
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-primary/10">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function StrengthItem({ text, icon }: any) {
  return (
    <div className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 p-3 transition hover:bg-muted/30">
      <div className="text-muted-foreground">{icon}</div><span className="text-sm font-medium">{text}</span>
    </div>
  );
}
