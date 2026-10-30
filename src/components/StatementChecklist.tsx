"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EvidenceLink } from "@/components/EvidenceLink";
import {
  addStatementEvidence,
  postStatementComment,
  updateStatementAssessment,
} from "@/app/actions/statement";
import {
  reviewStatusClass,
  reviewStatusLabel,
  statementStatusLabel,
  statementStatusOrder,
  statementStatusSelClass,
  type IgpStatement,
  type StatementStatus,
} from "@/lib/caf-data/types";

interface CommentableUser {
  id: string;
  email: string;
}

// The real numbered IGP statements behind an outcome (v2 rearchitecture).
// Renders nothing for an outcome that doesn't have statements populated
// yet — see docs/v2-rearchitecture-design.md §3.3, the outcome's own
// status just stays manually set in that case, same as today.
//
// Each statement shows its one-click answers up front; its note,
// evidence and comments open below it on demand, one at a time.
//
// To set the organisation-wide default for a statement, open this same
// outcome on the Enterprise-wide scope item instead — there's no toggle
// here any more (see 0020_enterprise_scope_item.sql).
export function StatementChecklist({
  scopeItemId,
  igpCode,
  statements,
  commentableUsers,
}: {
  scopeItemId: string;
  igpCode: string;
  statements: IgpStatement[];
  commentableUsers: CommentableUser[];
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (statements.length === 0) return null;

  const partial = statements.filter((s) => s.level === "partially_achieved");
  const achieved = statements.filter((s) => s.level === "achieved");

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  function renderRow(s: IgpStatement) {
    return (
      <StatementRow
        key={s.id}
        statement={s}
        expanded={expandedId === s.id}
        onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
        pending={isPending}
        commentableUsers={commentableUsers}
        onStatusChange={(status) => run(() => updateStatementAssessment(scopeItemId, s.id, status, s.note))}
        onSaveNote={(note) => run(() => updateStatementAssessment(scopeItemId, s.id, s.status, note))}
        onAddEvidence={(formData) =>
          run(() => addStatementEvidence(scopeItemId, s.id, s.status, s.note, igpCode, formData))
        }
        onPostComment={(body, mentionedUserIds) =>
          run(() => postStatementComment(scopeItemId, s.id, s.status, s.note, body, mentionedUserIds))
        }
      />
    );
  }

  const groups = [
    { key: "partial", title: "To reach Partially achieved", items: partial },
    { key: "achieved", title: "To reach Achieved", items: achieved },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="stack-lg">
      {groups.map((g) => (
        <section key={g.key} aria-labelledby={`group-${g.key}`} className="stack-sm">
          <div className="card-head">
            <h2 id={`group-${g.key}`} className="section-heading">
              {g.title}
            </h2>
            <span className="muted">
              {g.items.filter((s) => s.status !== "not_reviewed").length} of {g.items.length} answered
            </span>
          </div>
          {g.items.map(renderRow)}
        </section>
      ))}
    </div>
  );
}

function StatementRow({
  statement,
  expanded,
  onToggle,
  pending,
  commentableUsers,
  onStatusChange,
  onSaveNote,
  onAddEvidence,
  onPostComment,
}: {
  statement: IgpStatement;
  expanded: boolean;
  onToggle: () => void;
  pending: boolean;
  commentableUsers: CommentableUser[];
  onStatusChange: (status: StatementStatus) => void;
  onSaveNote: (note: string) => void;
  onAddEvidence: (formData: FormData) => void;
  onPostComment: (body: string, mentionedUserIds: string[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState(statement.note);
  const [commentBody, setCommentBody] = useState("");
  const [mentionedIds, setMentionedIds] = useState<string[]>([]);
  const [panel, setPanel] = useState<"note" | "evidence" | "comments">("note");

  // Reset the local note draft whenever this statement's own saved data
  // changes (a fresh fetch after a save) — same pattern IgpPanel uses
  // for its narrative/owner drafts.
  const [trackedUpdatedAt, setTrackedUpdatedAt] = useState(statement.updatedAt);
  if (statement.updatedAt !== trackedUpdatedAt) {
    setTrackedUpdatedAt(statement.updatedAt);
    setNote(statement.note);
  }

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    onAddEvidence(formData);
    e.target.value = "";
  }

  function toggleMention(user: CommentableUser) {
    const handle = `@${user.email.split("@")[0]}`;
    if (mentionedIds.includes(user.id)) {
      setMentionedIds(mentionedIds.filter((id) => id !== user.id));
      setCommentBody((b) => b.replace(`${handle} `, "").replace(handle, ""));
    } else {
      setMentionedIds([...mentionedIds, user.id]);
      setCommentBody((b) => (b ? `${b} ${handle} ` : `${handle} `));
    }
  }

  function handlePostComment() {
    if (!commentBody.trim()) return;
    onPostComment(commentBody, mentionedIds);
    setCommentBody("");
    setMentionedIds([]);
  }

  type Panel = "note" | "evidence" | "comments";
  const openPanel: Panel | null = expanded ? panel : null;
  function toggle(p: Panel) {
    if (expanded && panel === p) {
      onToggle();
    } else {
      setPanel(p);
      if (!expanded) onToggle();
    }
  }

  return (
    <div className="card statement-card">
      <div className="statement-head">
        <span className="statement-num mono">#{statement.statementNumber}</span>
        <p className="statement-text">
          {statement.text}
          {statement.isEnterpriseWide && (
            <span className="enterprise-badge" title="Inherited from the organisation-wide default">
              org default
            </span>
          )}
        </p>
      </div>
      <div className="statement-actions">
        <div className="answer-group" role="group" aria-label={`Answer for statement ${statement.statementNumber}`}>
          {statementStatusOrder
            .filter((s) => s !== "not_reviewed")
            .map((s) => {
              const selected = statement.status === s && !statement.isEnterpriseWide;
              const inherited = statement.status === s && statement.isEnterpriseWide;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={selected}
                  className={`answer-btn ${selected ? `sel-${statementStatusSelClass[s]}` : ""} ${
                    inherited ? "inherited" : ""
                  }`}
                  disabled={pending}
                  // Clicking the selected answer again clears it back to
                  // "not answered".
                  onClick={() => onStatusChange(selected ? "not_reviewed" : s)}
                >
                  {statementStatusLabel[s]}
                </button>
              );
            })}
        </div>
        <div className="statement-links">
          <button type="button" className="text-btn" aria-expanded={openPanel === "note"} onClick={() => toggle("note")}>
            {statement.note ? "Note ✓" : "Note"}
          </button>
          <button
            type="button"
            className="text-btn"
            aria-expanded={openPanel === "evidence"}
            onClick={() => toggle("evidence")}
          >
            Evidence{statement.evidence.length > 0 ? ` (${statement.evidence.length})` : ""}
          </button>
          <button
            type="button"
            className="text-btn"
            aria-expanded={openPanel === "comments"}
            onClick={() => toggle("comments")}
          >
            Comments{statement.comments.length > 0 ? ` (${statement.comments.length})` : ""}
          </button>
        </div>
      </div>

      {openPanel === "note" && (
        <div className="statement-panel">
          <textarea
            className="narrative-box"
            rows={2}
            value={note}
            aria-label="Note"
            placeholder="Optional note for this statement — saves when you click away."
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              if (note !== statement.note) onSaveNote(note);
            }}
          />
        </div>
      )}

      {openPanel === "evidence" && (
        <div className="statement-panel">
          {statement.evidence.length === 0 && <p className="fmeta">None yet.</p>}
          {statement.evidence.map((file) => (
            <div className="evidence-item" key={file.id}>
              <EvidenceLink storagePath={file.storagePath}>{file.name}</EvidenceLink>
              <span className={`status ${reviewStatusClass[file.reviewStatus]}`} style={{ marginTop: 0 }}>
                {reviewStatusLabel[file.reviewStatus]}
              </span>
              <span className="fmeta">{file.date}</span>
            </div>
          ))}
          <button
            type="button"
            className="add-evidence"
            disabled={pending}
            onClick={() => fileInputRef.current?.click()}
          >
            + Attach evidence
          </button>
          <input ref={fileInputRef} type="file" hidden onChange={handleFilePicked} />
        </div>
      )}

      {openPanel === "comments" && (
        <div className="statement-panel">
          {statement.comments.length > 0 && (
            <div className="comment-thread">
              {statement.comments.map((c) => (
                <div className="comment" key={c.id}>
                  <div className="comment-meta">
                    <span className="comment-author">{c.authorEmail ?? "Unknown"}</span>
                    <span className="fmeta">{c.createdAt}</span>
                  </div>
                  <div className="comment-body">{c.body}</div>
                </div>
              ))}
            </div>
          )}
          <textarea
            className="narrative-box"
            rows={2}
            aria-label="New comment"
            placeholder="Add a comment…"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
          />
          {commentableUsers.length > 0 && (
            <div className="mention-picker">
              <span className="field-hint" style={{ margin: 0 }}>
                Mention:
              </span>
              {commentableUsers.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  className={`mention-chip ${mentionedIds.includes(u.id) ? "sel" : ""}`}
                  onClick={() => toggleMention(u)}
                >
                  @{u.email.split("@")[0]}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className="btn-secondary"
            style={{ marginTop: 8 }}
            disabled={pending || !commentBody.trim()}
            onClick={handlePostComment}
          >
            Post comment
          </button>
        </div>
      )}
    </div>
  );
}
