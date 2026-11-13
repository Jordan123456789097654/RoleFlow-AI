"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  PenLine,
  Plus,
  Search,
  Sparkles,
  Wand2,
  Trash2,
  Eye,
  EyeOff,
  Pencil,
  ExternalLink,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Tag,
  BookOpen,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Code2,
  Link2,
  Quote,
  List,
  Columns,
  Split,
  Maximize2,
  FileText,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { EMAIL_ICONS, emailIconUrl, isEmailIcon, EmailIconId } from "@/lib/email-icons";
import { BLOG_CATEGORIES, BlogCategory, BlogPost } from "@/lib/blog";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
const inputClass = `w-full rounded-xl border border-line bg-app px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent/60 transition-colors ${focusRing}`;
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted";
const primaryButtonClass = `inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const secondaryButtonClass = `inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const cardClass = "rounded-2xl border border-line bg-card";

interface BlogPostFormState {
  id: string; // slug
  title: string;
  summary: string;
  content: string;
  category: BlogCategory;
  icon: EmailIconId;
  author: string;
  authorRole: string;
  readTime: string;
  publishedAt: string;
  isPublished: boolean;
  tagsString: string;
}

const EMPTY_FORM: BlogPostFormState = {
  id: "",
  title: "",
  summary: "",
  content: "",
  category: "announcements",
  icon: "rocket",
  author: "Jordan Daniels",
  authorRole: "Founder & Lead Architect",
  readTime: "5 min read",
  publishedAt: new Date().toISOString(),
  isPublished: true,
  tagsString: "Engineering, RoleFlow",
};

export default function AdminBlogPanel() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "published" | "draft">("all");

  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  // Editor Modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isNewPost, setIsNewPost] = useState(true);
  const [form, setForm] = useState<BlogPostFormState>(EMPTY_FORM);
  const [editorTab, setEditorTab] = useState<"edit" | "split" | "preview">("split");
  const [saving, setSaving] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconPickerFilter, setIconPickerFilter] = useState("");

  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  // AI Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiCategory, setAiCategory] = useState<BlogCategory>("announcements");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Delete Confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog");
      const data = await res.json();
      if (data?.posts && Array.isArray(data.posts)) {
        setPosts(data.posts);
      }
    } catch (err: any) {
      setNotice({ tone: "error", text: "Failed to load blog posts: " + (err?.message || "Unknown error") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
      if (selectedStatus === "published" && !p.isPublished) return false;
      if (selectedStatus === "draft" && p.isPublished) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchSummary = p.summary.toLowerCase().includes(q);
        const matchTags = (p.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchSummary && !matchTags) return false;
      }
      return true;
    });
  }, [posts, selectedCategory, selectedStatus, searchQuery]);

  const handleOpenNew = () => {
    setIsNewPost(true);
    setForm({
      ...EMPTY_FORM,
      publishedAt: new Date().toISOString(),
    });
    setEditorTab("split");
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (post: BlogPost) => {
    setIsNewPost(false);
    setForm({
      id: post.id,
      title: post.title,
      summary: post.summary,
      content: post.content,
      category: post.category,
      icon: isEmailIcon(post.icon) ? post.icon : "sparkle",
      author: post.author || "Jordan Daniels",
      authorRole: post.authorRole || "Founder & Lead Architect",
      readTime: post.readTime || "5 min read",
      publishedAt: post.publishedAt || new Date().toISOString(),
      isPublished: Boolean(post.isPublished),
      tagsString: (post.tags || []).join(", "),
    });
    setEditorTab("split");
    setIsEditorOpen(true);
  };

  const insertMarkdown = (prefix: string, suffix = "") => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = form.content.substring(start, end);
    const replacement = prefix + (selected || "sample text") + suffix;
    const newContent = form.content.substring(0, start) + replacement + form.content.substring(end);
    setForm({ ...form, content: newContent });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 11));
    }, 0);
  };

  const wordCount = useMemo(() => {
    return form.content.split(/\s+/).filter(Boolean).length;
  }, [form.content]);

  const estimatedMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  const handleSavePost = async () => {
    if (!form.title.trim()) {
      setNotice({ tone: "error", text: "Please enter an article title." });
      return;
    }
    if (!form.summary.trim()) {
      setNotice({ tone: "error", text: "Please enter an article summary." });
      return;
    }
    if (form.content.trim().length < 20) {
      setNotice({ tone: "error", text: "Article content must be at least 20 characters." });
      return;
    }

    setSaving(true);
    setNotice(null);

    const tags = form.tagsString
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          title: form.title,
          summary: form.summary,
          content: form.content,
          category: form.category,
          icon: form.icon,
          author: form.author,
          authorRole: form.authorRole,
          publishedAt: form.publishedAt,
          isPublished: form.isPublished,
          tags,
        }),
      });

      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || "Failed to save article");
      }

      setNotice({ tone: "ok", text: `Article "${data.post.title}" saved successfully.` });
      setIsEditorOpen(false);
      fetchPosts();
    } catch (err: any) {
      setNotice({ tone: "error", text: err?.message || "Failed to save article" });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...post,
          isPublished: !post.isPublished,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setNotice({
          tone: "ok",
          text: `Article is now ${!post.isPublished ? "Published" : "Draft"}.`,
        });
        fetchPosts();
      }
    } catch (err: any) {
      setNotice({ tone: "error", text: "Failed to update status." });
    }
  };

  const handleDeletePost = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/blog?id=${encodeURIComponent(deleteId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setNotice({ tone: "ok", text: "Article deleted successfully." });
        setDeleteId(null);
        fetchPosts();
      } else {
        throw new Error(data?.error || "Failed to delete article");
      }
    } catch (err: any) {
      setNotice({ tone: "error", text: err?.message || "Failed to delete article" });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/blog?all=true", { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data?.success) {
        setNotice({ tone: "ok", text: "All blog posts have been permanently deleted." });
        setIsDeleteAllConfirmOpen(false);
        fetchPosts();
      } else {
        throw new Error(data?.error || "Failed to delete all blog posts");
      }
    } catch (err: any) {
      setNotice({ tone: "error", text: err?.message || "Failed to delete all blog posts" });
    } finally {
      setDeleting(false);
    }
  };

  const handleReseed = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog?action=reseed", { method: "POST" });
      const data = await res.json();
      if (res.ok && data?.success) {
        setNotice({ tone: "ok", text: "Default technical articles restored." });
        fetchPosts();
      } else {
        throw new Error(data?.error || "Failed to restore default posts");
      }
    } catch (err: any) {
      setNotice({ tone: "error", text: err?.message || "Failed to restore default posts" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) {
      setAiError("Please provide an article brief or topic.");
      return;
    }
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch("/api/admin/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          category: aiCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || "AI generation failed");
      }

      const draft = data.draft;
      setIsAiModalOpen(false);
      setAiPrompt("");

      // Populate into editor
      setIsNewPost(true);
      setForm({
        id: draft.slug || "",
        title: draft.title || "",
        summary: draft.summary || "",
        content: draft.content || "",
        category: draft.category || "announcements",
        icon: isEmailIcon(draft.icon) ? draft.icon : "sparkle",
        author: draft.author || "Jordan Daniels",
        authorRole: draft.authorRole || "Founder & Lead Architect",
        readTime: draft.readTime || "5 min read",
        publishedAt: new Date().toISOString(),
        isPublished: true,
        tagsString: (draft.tags || []).join(", "),
      });
      setEditorTab("split");
      setIsEditorOpen(true);
      setNotice({ tone: "ok", text: "AI generated a new technical article draft. Review and edit below." });
    } catch (err: any) {
      setAiError(err?.message || "Failed to draft article with AI.");
    } finally {
      setAiLoading(false);
    }
  };

  const filteredIcons = useMemo(() => {
    if (!iconPickerFilter.trim()) return EMAIL_ICONS;
    const q = iconPickerFilter.toLowerCase();
    return EMAIL_ICONS.filter((i) => i.id.includes(q) || i.label.toLowerCase().includes(q));
  }, [iconPickerFilter]);

  return (
    <div className="space-y-6">
      {/* Policy Notice: Strict Web Publishing Only */}
      <div className="rounded-2xl border border-line bg-card/60 p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium text-ink">Blog Studio &amp; Editorial Desk</div>
            <div className="text-xs text-muted">
              Blog posts publish directly to{" "}
              <Link href="/blog" target="_blank" className="text-accent underline font-mono">
                roleflow.site/blog
              </Link>
              . Edit any post, draft with AI, or write new dispatches. <strong>No broadcast emails are dispatched.</strong>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {posts.length > 0 ? (
            <button
              type="button"
              onClick={() => setIsDeleteAllConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 px-3 py-2 text-xs font-medium transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete All
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReseed}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card hover:bg-hover px-3 py-2 text-xs font-medium text-ink transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Restore Default Posts
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-3.5 py-2 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Draft with AI
          </button>
          <button
            type="button"
            onClick={handleOpenNew}
            className={primaryButtonClass}
          >
            <Plus className="h-4 w-4" />
            New Post
          </button>
        </div>
      </div>

      {/* Global Notice Banner */}
      {notice && (
        <div
          className={`flex items-center justify-between rounded-xl border p-3.5 text-xs ${
            notice.tone === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-muted hover:text-ink transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts or tags..."
              className={`${inputClass} pl-9 py-1.5 text-xs`}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-line bg-app px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-accent/60"
          >
            <option value="all">All Categories</option>
            {BLOG_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="rounded-xl border border-line bg-app px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-accent/60"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <span className="text-xs text-muted">
            {filteredPosts.length} article{filteredPosts.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={fetchPosts}
            disabled={loading}
            className={`${secondaryButtonClass} p-2`}
            title="Refresh articles"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-muted">Loading blog posts...</div>
      ) : filteredPosts.length === 0 ? (
        <div className={`${cardClass} p-12 text-center`}>
          <PenLine className="mx-auto h-8 w-8 text-muted/40 mb-3" />
          <h3 className="text-sm font-medium text-ink mb-1">No articles found</h3>
          <p className="text-xs text-muted mb-4">
            {searchQuery || selectedCategory !== "all"
              ? "Try clearing your filters to see more articles."
              : "Create your first technical article or draft one using AI."}
          </p>
          <button type="button" onClick={handleOpenNew} className={primaryButtonClass}>
            <Plus className="h-4 w-4" />
            New Post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPosts.map((post) => {
            const iconUrl = emailIconUrl(post.icon);
            return (
              <div
                key={post.id}
                className={`${cardClass} p-5 flex flex-col justify-between hover:border-line-hover transition-colors`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-app border border-line flex items-center justify-center p-1.5">
                        <img
                          src={iconUrl}
                          alt={post.icon}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium uppercase tracking-wider text-accent">
                            {post.category}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                              post.isPublished
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            }`}
                          >
                            {post.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-ink line-clamp-1 mt-0.5">
                          {post.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted line-clamp-2 mb-3">
                    {post.summary}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted/80 mb-4">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-app border border-line px-1.5 py-0.5 text-[10px] text-muted"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-line/60">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/blog/${post.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink transition-colors font-mono"
                    >
                      <ExternalLink className="h-3 w-3" />
                      /{post.id}
                    </Link>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(post)}
                      className={`${secondaryButtonClass} p-1.5`}
                      title={post.isPublished ? "Set to Draft" : "Publish Live"}
                    >
                      {post.isPublished ? (
                        <EyeOff className="h-3.5 w-3.5 text-muted" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 text-accent" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(post)}
                      className={`${secondaryButtonClass} p-1.5`}
                      title="Edit article"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(post.id)}
                      className="inline-flex items-center p-1.5 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 transition-colors"
                      title="Delete article"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Editor Modal with Live Split Preview and Markdown Toolbar */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-6xl rounded-3xl border border-line bg-card p-6 shadow-2xl space-y-5 my-6 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-app border border-line flex items-center justify-center p-1.5">
                  <img
                    src={emailIconUrl(form.icon)}
                    alt={form.icon}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink">
                    {isNewPost ? "Create Technical Article" : "Edit Article: " + form.title}
                  </h3>
                  <p className="text-xs text-muted">
                    Publishes directly to roleflow.site/blog. No email broadcast will be dispatched.
                  </p>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center rounded-xl border border-line bg-app p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditorTab("edit")}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      editorTab === "edit" ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
                    }`}
                  >
                    Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab("split")}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      editorTab === "split" ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
                    }`}
                  >
                    Split View
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab("preview")}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      editorTab === "preview" ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
                    }`}
                  >
                    Preview
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="text-muted hover:text-ink p-1.5 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className={labelClass}>Article Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Introducing RoleFlow v5.0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>URL Slug</label>
                  <input
                    type="text"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    placeholder="introducing-roleflow-v5"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as BlogCategory })}
                    className={inputClass}
                  >
                    {BLOG_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Vector Icon (31 Choices)</label>
                  <button
                    type="button"
                    onClick={() => setIsIconPickerOpen(true)}
                    className="w-full flex items-center justify-between rounded-xl border border-line bg-app px-3.5 py-2 text-sm text-ink hover:border-accent/60 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={emailIconUrl(form.icon)}
                        alt={form.icon}
                        className="h-5 w-5 object-contain"
                      />
                      <span className="capitalize">{form.icon}</span>
                    </div>
                    <span className="text-xs text-muted">Change</span>
                  </button>
                </div>

                <div>
                  <label className={labelClass}>Publication Status</label>
                  <div className="flex items-center gap-2 pt-1.5">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.isPublished}
                      onClick={() => setForm({ ...form, isPublished: !form.isPublished })}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                        form.isPublished ? "bg-accent" : "bg-hover border border-line"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          form.isPublished ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                    <span className="text-xs text-ink font-medium">
                      {form.isPublished ? "Published (Live on web)" : "Draft (Hidden)"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Summary / Excerpt (1-2 sentences)</label>
                <textarea
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  rows={2}
                  placeholder="A short punchy summary that appears on index cards and social previews..."
                  className={inputClass}
                />
              </div>

              {/* Markdown Toolbar */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 bg-app p-2 rounded-xl border border-line">
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertMarkdown("**", "**")}
                      className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-card transition-colors"
                      title="Bold (**text**)"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("*", "*")}
                      className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-card transition-colors"
                      title="Italic (*text*)"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    <span className="h-4 w-[1px] bg-line mx-1" />
                    <button
                      type="button"
                      onClick={() => insertMarkdown("\n## ", "\n")}
                      className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-card transition-colors"
                      title="Heading 2 (## Title)"
                    >
                      <Heading2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("\n### ", "\n")}
                      className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-card transition-colors"
                      title="Heading 3 (### Subtitle)"
                    >
                      <Heading3 className="h-3.5 w-3.5" />
                    </button>
                    <span className="h-4 w-[1px] bg-line mx-1" />
                    <button
                      type="button"
                      onClick={() => insertMarkdown("```typescript\n", "\n```")}
                      className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-card transition-colors"
                      title="Code Block"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("[", "](https://)")}
                      className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-card transition-colors"
                      title="Hyperlink"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("\n> ", "\n")}
                      className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-card transition-colors"
                      title="Quote Block"
                    >
                      <Quote className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("\n- ", "\n")}
                      className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-card transition-colors"
                      title="Bullet List"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("\n| Feature | Status |\n|---|---|\n| Item 1 | Active |\n")}
                      className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-card transition-colors"
                      title="Markdown Table"
                    >
                      <Columns className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="text-[11px] text-muted flex items-center gap-2">
                    <span>{wordCount} words</span>
                    <span>·</span>
                    <span>~{estimatedMinutes} min read</span>
                  </div>
                </div>

                {/* Editor & Preview Panes */}
                <div
                  className={`grid gap-4 ${
                    editorTab === "split"
                      ? "grid-cols-1 lg:grid-cols-2"
                      : "grid-cols-1"
                  }`}
                >
                  {/* Editor Box */}
                  {(editorTab === "edit" || editorTab === "split") && (
                    <div>
                      <textarea
                        ref={contentRef}
                        value={form.content}
                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                        rows={16}
                        placeholder="# Article Title&#10;&#10;Write detailed technical markdown content here..."
                        className={`${inputClass} font-mono text-xs leading-relaxed h-[380px] resize-y`}
                      />
                    </div>
                  )}

                  {/* Live Rendered Markdown Preview */}
                  {(editorTab === "preview" || editorTab === "split") && (
                    <div className="rounded-xl border border-line bg-app/60 p-5 h-[380px] overflow-y-auto text-ink text-xs leading-relaxed [&_h1]:font-display [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mb-3 [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-semibold [&_h2]:border-b [&_h2]:border-line/60 [&_h2]:pb-1.5 [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:font-display [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-2 [&_p]:text-ink/90 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:rounded [&_code]:bg-card [&_code]:border [&_code]:border-line [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-amber-300 [&_pre]:my-3 [&_pre]:rounded-xl [&_pre]:bg-card [&_pre]:p-3 [&_pre]:overflow-x-auto [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-3 [&_blockquote]:italic [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-line [&_th]:bg-card [&_th]:p-1.5 [&_td]:border [&_td]:border-line [&_td]:p-1.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {form.content || "*Nothing written yet. Write content in the editor to see live rendering.*"}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className={labelClass}>Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={form.tagsString}
                    onChange={(e) => setForm({ ...form, tagsString: e.target.value })}
                    placeholder="Engineering, Launch, Design System"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Author &amp; Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={form.author}
                      onChange={(e) => setForm({ ...form, author: e.target.value })}
                      placeholder="Jordan Daniels"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={form.authorRole}
                      onChange={(e) => setForm({ ...form, authorRole: e.target.value })}
                      placeholder="Founder & Lead Architect"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-line shrink-0">
              <span className="text-xs text-muted">
                Blog posts are public on roleflow.site and never send emails.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className={secondaryButtonClass}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSavePost}
                  className={primaryButtonClass}
                >
                  {saving ? "Saving..." : isNewPost ? "Publish Article" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vector Icon Picker Modal (31 Icons) */}
      {isIconPickerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h4 className="text-sm font-semibold text-ink">Select Vector Icon</h4>
                <p className="text-xs text-muted">31 bespoke amber vector icons</p>
              </div>
              <button
                type="button"
                onClick={() => setIsIconPickerOpen(false)}
                className="text-muted hover:text-ink transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              value={iconPickerFilter}
              onChange={(e) => setIconPickerFilter(e.target.value)}
              placeholder="Search icons (terminal, rocket, code, cpu...)"
              className={`${inputClass} text-xs py-2`}
            />

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-72 overflow-y-auto p-1">
              {filteredIcons.map((ic) => {
                const isSelected = form.icon === ic.id;
                return (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, icon: ic.id });
                      setIsIconPickerOpen(false);
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-center ${
                      isSelected
                        ? "border-accent bg-accent/10"
                        : "border-line bg-app hover:border-line-hover"
                    }`}
                  >
                    <img
                      src={emailIconUrl(ic.id)}
                      alt={ic.id}
                      className="h-7 w-7 object-contain"
                    />
                    <span className="text-[10px] text-ink font-medium capitalize truncate w-full">
                      {ic.id}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setIsIconPickerOpen(false)}
                className={secondaryButtonClass}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Draft Generator Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-line bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                  <Wand2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink">Draft Article with AI</h4>
                  <p className="text-xs text-muted">Powered by OpenAI GPT-OSS-120B</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="text-muted hover:text-ink transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {aiError && (
              <div className="p-3 rounded-xl border border-danger/30 bg-danger/10 text-danger text-xs">
                {aiError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className={labelClass}>Preferred Category</label>
                <select
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value as BlogCategory)}
                  className={inputClass}
                >
                  {BLOG_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Article Topic / Brief</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  placeholder="e.g. Write an in-depth technical post explaining how RoleFlow compiles multi-file code into instant ZIP packages in the browser without server roundtrips..."
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-line">
              <span className="text-[11px] text-muted">
                Author will be automatically credited to Jordan Daniels.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className={secondaryButtonClass}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={handleGenerateAi}
                  className={primaryButtonClass}
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Draft
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-2xl space-y-4">
            <h4 className="text-sm font-semibold text-ink">Delete Blog Post?</h4>
            <p className="text-xs text-muted">
              Are you sure you want to permanently delete article{" "}
              <code className="text-ink font-mono">{deleteId}</code>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeletePost}
                className="inline-flex items-center gap-1.5 rounded-xl border border-danger/30 bg-danger px-3.5 py-2 text-xs font-medium text-white hover:bg-danger/80 transition-colors"
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete ALL Posts Confirmation Modal */}
      {isDeleteAllConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-danger/40 bg-card p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-semibold text-danger">Delete All Blog Posts?</h4>
            <p className="text-xs text-muted leading-relaxed">
              Are you sure you want to permanently delete <strong>all {posts.length} blog posts</strong>?
              The blog will be completely empty. You can write your own posts or restore defaults anytime.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setIsDeleteAllConfirmOpen(false)}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-danger/30 bg-danger px-4 py-2 text-xs font-medium text-white hover:bg-danger/80 transition-colors"
              >
                {deleting ? "Deleting All..." : "Delete All Posts"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
