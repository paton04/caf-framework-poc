"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addStatementEvidence,
  postStatementComment,
  updateStatementAssessment,
} from "@/app/actions/statement";
import {
  reviewStatusClass,
  reviewStatusLabel,
  statementStatusClass,
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
// To set the organisation-wide default for a statement, open this same
// panel on the Enterprise-wide scope item instead — there's no toggle
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

  return (
    <div className="field">
      <label>Sub-checks ({statements.length})</label>
      <p className="field-hint">
        The individual numbered statements behind this outcome&apos;s
        status (source: Ofgem&apos;s CAF Overlay for DGE Sector) — set
        each one, attach evidence, and discuss with the team. This
        outcome&apos;s status above is derived from these automatically.
        To set the organisation-wide default instead of just this scope
        item, do this on the{" "}
        <strong>Enterprise-wide</strong> scope item.
      </p>
      <div className="statement-list">
        {partial.length > 0 && <div className="statement-group-label">Partially achieved</div>}
        {partial.map(renderRow)}
        {achieved.length > 0 && <div className="statement-group-label">Achieved</div>}
        {achieved.map(renderRow)}
      </div>
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

  return (
    <div className={`statement-row ${expanded ? "expanded" : ""}`}>
      <button type="button" className="statement-row-head" onClick={onToggle}>
        <span className="statement-num mono">{statement.statementNumber}</span>
        <span className="statement-text">{statement.text}</span>
        {statement.isEnterpriseWide && (
          <span className="enterprise-badge" title="Inherited from the Enterprise-wide scope item's default">
            org default
          </span>
        )}
        <span className={`status ${statementStatusClass[statement.status]}`}>
          {statementStatusLabel[statement.status]}
        </span>
      </button>
      {expanded && (
        <div className="statement-row-body">
          <div className="field">
            <label>Status</label>
            <div className="status-select">
              {statementStatusOrder.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`status-opt ${
                    statement.status === s ? `sel-${statementStatusSelClass[s]}` : ""
                  }`}
                  disabled={pending}
                  onClick={() => onStatusChange(s)}
                >
                  {statementStatusLabel[s]}
                </button>
              ))}
            </div>
            {statement.isEnterpriseWide && (
              <p className="field-hint">
                Currently showing the organisation-wide default. Setting
                a status here creates this scope item&apos;s own answer,
                which takes over from the default from now on.
              </p>
            )}
          </div>

          <div className="field">
            <label>Note</label>
            <textarea
              className="narrative-box"
              rows={2}
              value={note}
              placeholder="Optional note for this statement."
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => {
                if (note !== statement.note) onSaveNote(note);
              }}
            />
          </div>

          <div className="field">
            <label>Evidence</label>
            {statement.evidence.length === 0 && <p className="fmeta">None yet.</p>}
            {statement.evidence.map((file) => (
              <div className="evidence-item" key={file.id}>
                <span className="fname">{file.name}</span>
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

          <div className="field">
            <label>Comments ({statement.comments.length})</label>
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
        </div>
      )}
    </div>
  );
}
