"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/app/actions/admin-categories";

export function CategoryManager({ initialCategories }: { initialCategories: any[] }) {
  const [isPending, startTransition] = useTransition();
  
  // Modal States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteData, setDeleteData] = useState<{ id: string, name: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const openAddModal = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setIsEditOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setIsEditOpen(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      if (editingId) {
        await updateCategory(editingId, name, slug);
      } else {
        await createCategory(name, slug);
      }
      setIsEditOpen(false);
    });
  };

  const confirmDelete = () => {
    if (!deleteData) return;
    startTransition(async () => {
      await deleteCategory(deleteData.id);
      setDeleteData(null);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Job Categories</h2>
          <p className="text-sm text-muted-foreground">Manage the categories available for freelancers and buyers.</p>
        </div>
        <Button onClick={openAddModal} disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="h-10 px-4 font-medium">Name</th>
                  <th className="h-10 px-4 font-medium">Slug</th>
                  <th className="h-10 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {initialCategories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-muted-foreground">No categories found.</td>
                  </tr>
                ) : (
                  initialCategories.map((cat) => (
                    <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4 font-medium">{cat.name}</td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">{cat.slug}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(cat)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setDeleteData({ id: cat.id, name: cat.name })} 
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* --- ADD / EDIT MODAL --- */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle>{editingId ? "Edit Category" : "Add New Category"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category Name</label>
                <Input 
                  placeholder="e.g. Web Development" 
                  value={name} 
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingId) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                  }} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL Slug</label>
                <Input 
                  placeholder="e.g. web-development" 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value)} 
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!name || !slug || isPending}>
                  {isPending ? "Saving..." : "Save Category"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <Card className="w-full max-w-sm shadow-lg border-destructive/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-lg">Are you absolutely sure?</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                This will permanently delete the <strong>{deleteData.name}</strong> category. This action cannot be undone.
              </p>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button variant="ghost" onClick={() => setDeleteData(null)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete} 
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  {isPending ? "Deleting..." : "Delete Category"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}