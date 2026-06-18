"""Static data-dictionary registry powering GET /exports/data_dictionary.csv.

One row per exported column: (export, column, type, allowed_values, description).
Aligned to the study ODS and the analysis CSV schema.
"""
from __future__ import annotations

DataDictRow = dict[str, str]

DATA_DICTIONARY: list[DataDictRow] = [
    # participants
    {"export": "participants", "column": "participant_code", "type": "string", "allowed_values": "", "description": "Anonymous participant key; merge key across all exports."},
    {"export": "participants", "column": "site_code", "type": "string", "allowed_values": "", "description": "Clinic site code."},
    {"export": "participants", "column": "batch_code", "type": "string", "allowed_values": "", "description": "Batch identifier YYYYMMDD_SITE_BATCH##."},
    {"export": "participants", "column": "group_assignment", "type": "enum", "allowed_values": "CONTROL|AI_ASSISTED", "description": "Experimental group."},
    {"export": "participants", "column": "assignment_method", "type": "enum", "allowed_values": "SUGGESTED_ACCEPTED|MANUAL_OVERRIDE", "description": "How the group was assigned."},
    {"export": "participants", "column": "auto_assigned", "type": "bool", "allowed_values": "true|false", "description": "True if the server auto-assigned the group (no proctor acted within the grace window); false if a proctor assigned it."},
    {"export": "participants", "column": "consent_given", "type": "boolean", "allowed_values": "true|false", "description": "Consent attestation captured at check-in."},
    {"export": "participants", "column": "age_band", "type": "enum", "allowed_values": "18_24|25_34|35_44|45_PLUS", "description": "Form 0 age band."},
    {"export": "participants", "column": "education_level", "type": "enum", "allowed_values": "SECONDARY|DIPLOMA|DEGREE|POSTGRAD", "description": "Form 0 highest education."},
    {"export": "participants", "column": "english_comfort", "type": "int", "allowed_values": "1..5", "description": "Form 0 English comfort Likert."},
    {"export": "participants", "column": "ai_use_frequency", "type": "enum", "allowed_values": "NEVER|MONTHLY|WEEKLY|DAILY", "description": "Form 0 AI use frequency."},
    {"export": "participants", "column": "ai_confidence", "type": "int", "allowed_values": "1..5", "description": "Form 0 AI confidence Likert."},
    {"export": "participants", "column": "warmup_auto_score", "type": "int", "allowed_values": "0..4", "description": "Auto-scored warm-up total."},
    {"export": "participants", "column": "warmup_final_score", "type": "int", "allowed_values": "0..4", "description": "Final warm-up score (proctor-overridable)."},
    {"export": "participants", "column": "warmup_score_overridden", "type": "boolean", "allowed_values": "true|false", "description": "Whether a proctor overrode the warm-up score."},
    {"export": "participants", "column": "device_category", "type": "enum", "allowed_values": "DESKTOP|MOBILE|TABLET", "description": "Device class (anonymity-safe)."},
    {"export": "participants", "column": "os_family", "type": "string", "allowed_values": "", "description": "Operating system family."},
    {"export": "participants", "column": "browser_family", "type": "string", "allowed_values": "", "description": "Browser family. (user_agent_raw is never exported.)"},
    {"export": "participants", "column": "status", "type": "enum", "allowed_values": "CHECKED_IN|FORM0|SESSION1|BREAK|SESSION2|SCALES_S2|COMPLETED|WITHDRAWN", "description": "Lifecycle status."},

    # task_responses
    {"export": "task_responses", "column": "participant_code", "type": "string", "allowed_values": "", "description": "Merge key."},
    {"export": "task_responses", "column": "session_number", "type": "int", "allowed_values": "1|2", "description": "Session this response belongs to."},
    {"export": "task_responses", "column": "task_code", "type": "string", "allowed_values": "A1..C2|A3..B4", "description": "Task identifier."},
    {"export": "task_responses", "column": "objective_answer", "type": "string", "allowed_values": "", "description": "Submitted objective answer (C2 stored as WEEKLY|5000)."},
    {"export": "task_responses", "column": "objective_auto_correct", "type": "boolean", "allowed_values": "true|false", "description": "Auto-scored against the fixed answer key."},
    {"export": "task_responses", "column": "text_justification", "type": "string", "allowed_values": "", "description": "Free-text justification (min 30 chars)."},
    {"export": "task_responses", "column": "task_familiarity", "type": "boolean", "allowed_values": "true|false", "description": "Self-reported familiarity check."},
    {"export": "task_responses", "column": "self_check", "type": "boolean", "allowed_values": "true|false", "description": "Self-check attestation."},
    {"export": "task_responses", "column": "confidence_rating", "type": "int", "allowed_values": "1..5", "description": "Confidence Likert."},
    {"export": "task_responses", "column": "control_compliance", "type": "boolean", "allowed_values": "true|false|", "description": "Control group S1 attestation (null otherwise)."},
    {"export": "task_responses", "column": "assistance_level", "type": "int", "allowed_values": "0..3|", "description": "Highest hint level revealed (AI S1 only)."},
    {"export": "task_responses", "column": "requests_count", "type": "int", "allowed_values": "", "description": "Number of hint unlock requests (AI S1 only)."},
    {"export": "task_responses", "column": "copy_used", "type": "boolean", "allowed_values": "true|false|", "description": "Copied assistance wording (AI S1 only)."},
    {"export": "task_responses", "column": "verified", "type": "boolean", "allowed_values": "true|false|", "description": "Reported verifying the answer (AI S1 only)."},
    {"export": "task_responses", "column": "verification_method", "type": "enum", "allowed_values": "RECOMPUTE|ESTIMATE|ALT_METHOD|CONSISTENCY|OTHER|", "description": "Verification method (AI S1 only)."},
    {"export": "task_responses", "column": "verification_method_other", "type": "string", "allowed_values": "", "description": "Free text when method=OTHER."},
    {"export": "task_responses", "column": "verification_evidence", "type": "string", "allowed_values": "", "description": "One-sentence verification evidence (required when verified)."},
    {"export": "task_responses", "column": "duration_objective_ms", "type": "int", "allowed_values": "", "description": "ms from task start to first committed answer."},
    {"export": "task_responses", "column": "duration_justification_ms", "type": "int", "allowed_values": "", "description": "ms from first answer to submit."},
    {"export": "task_responses", "column": "duration_total_ms", "type": "int", "allowed_values": "", "description": "ms from task start to submit."},
    {"export": "task_responses", "column": "answer_change_count", "type": "int", "allowed_values": "", "description": "Objective answer revision count."},
    {"export": "task_responses", "column": "participant_notes", "type": "string", "allowed_values": "", "description": "Optional notes."},
    {"export": "task_responses", "column": "needs_double_score", "type": "boolean", "allowed_values": "true|false", "description": "Flagged for a second independent rater."},
    {"export": "task_responses", "column": "submitted_at", "type": "timestamp", "allowed_values": "", "description": "Submission time."},

    # telemetry_events
    {"export": "telemetry_events", "column": "participant_code", "type": "string", "allowed_values": "", "description": "Merge key."},
    {"export": "telemetry_events", "column": "session_number", "type": "int", "allowed_values": "1|2", "description": "Session."},
    {"export": "telemetry_events", "column": "task_code", "type": "string", "allowed_values": "", "description": "Task context (nullable)."},
    {"export": "telemetry_events", "column": "event_type", "type": "enum", "allowed_values": "PASTE|PASTE_BLOCKED|TAB_BLUR|TAB_FOCUS|ANSWER_REVISION|HINT_UNLOCK|HINT_COPY|INFRACTION|BREAK_START|BREAK_END|SESSION_START|SESSION_END", "description": "Behavioral event type."},
    {"export": "telemetry_events", "column": "event_metadata", "type": "json", "allowed_values": "", "description": "Event-specific metadata (JSON)."},
    {"export": "telemetry_events", "column": "client_timestamp_ms", "type": "bigint", "allowed_values": "", "description": "Client-side event timestamp (ms)."},
    {"export": "telemetry_events", "column": "created_at", "type": "timestamp", "allowed_values": "", "description": "Server receipt time."},

    # hint_events
    {"export": "hint_events", "column": "participant_code", "type": "string", "allowed_values": "", "description": "Merge key."},
    {"export": "hint_events", "column": "task_code", "type": "string", "allowed_values": "", "description": "Task."},
    {"export": "hint_events", "column": "level", "type": "int", "allowed_values": "1..3", "description": "Hint level revealed."},
    {"export": "hint_events", "column": "request_number", "type": "int", "allowed_values": "", "description": "Sequential request index for the task."},
    {"export": "hint_events", "column": "viewed_duration_ms", "type": "int", "allowed_values": "", "description": "Time the hint was visible (ms)."},
    {"export": "hint_events", "column": "copied", "type": "boolean", "allowed_values": "true|false", "description": "Whether the hint text was copied."},

    # scale_responses
    {"export": "scale_responses", "column": "participant_code", "type": "string", "allowed_values": "", "description": "Merge key."},
    {"export": "scale_responses", "column": "session_number", "type": "int", "allowed_values": "1|2", "description": "Session."},
    {"export": "scale_responses", "column": "item_code", "type": "string", "allowed_values": "S1-E1..E3|S1-H1..H3|S1-C1|S1-U1|S1-AI1..AI4|S2-H1..H3|S2-I1..I3", "description": "Likert item code (proposal Appendix H: S1 8-item; AI-usage 4-item, AI-only; S2 6-item)."},
    {"export": "scale_responses", "column": "rating", "type": "int", "allowed_values": "1..5", "description": "Likert rating."},

    # rater_scores
    {"export": "rater_scores", "column": "participant_code", "type": "string", "allowed_values": "", "description": "Merge key (via task response)."},
    {"export": "rater_scores", "column": "session_number", "type": "int", "allowed_values": "1|2", "description": "Session of the scored response."},
    {"export": "rater_scores", "column": "task_code", "type": "string", "allowed_values": "", "description": "Task of the scored response."},
    {"export": "rater_scores", "column": "rater_display_code", "type": "string", "allowed_values": "", "description": "Anonymous rater code."},
    {"export": "rater_scores", "column": "correctness", "type": "int", "allowed_values": "0..2", "description": "Rubric: correctness."},
    {"export": "rater_scores", "column": "justification_quality", "type": "int", "allowed_values": "0..2", "description": "Rubric: justification quality."},
    {"export": "rater_scores", "column": "independence", "type": "int", "allowed_values": "0..2", "description": "Rubric: independence."},
    {"export": "rater_scores", "column": "is_double_score", "type": "boolean", "allowed_values": "true|false", "description": "Second independent score for reliability."},

    # session_meta
    {"export": "session_meta", "column": "participant_code", "type": "string", "allowed_values": "", "description": "Merge key."},
    {"export": "session_meta", "column": "session_number", "type": "int", "allowed_values": "1|2", "description": "Session."},
    {"export": "session_meta", "column": "started_at", "type": "timestamp", "allowed_values": "", "description": "Session start."},
    {"export": "session_meta", "column": "ended_at", "type": "timestamp", "allowed_values": "", "description": "Session end."},
    {"export": "session_meta", "column": "transfer_prompt_used", "type": "boolean", "allowed_values": "true|false|", "description": "Session 2 transfer prompt answer."},
    {"export": "session_meta", "column": "transfer_prompt_text", "type": "string", "allowed_values": "", "description": "Session 2 transfer prompt free text."},

    # deviation_logs
    {"export": "deviation_logs", "column": "participant_code", "type": "string", "allowed_values": "", "description": "Merge key (nullable for batch-level deviations)."},
    {"export": "deviation_logs", "column": "batch_code", "type": "string", "allowed_values": "", "description": "Batch."},
    {"export": "deviation_logs", "column": "proctor_display_code", "type": "string", "allowed_values": "", "description": "Anonymous proctor code."},
    {"export": "deviation_logs", "column": "description", "type": "string", "allowed_values": "", "description": "Deviation description."},
    {"export": "deviation_logs", "column": "created_at", "type": "timestamp", "allowed_values": "", "description": "When logged."},

    # layer2_logs
    {"export": "layer2_logs", "column": "participant_code", "type": "string", "allowed_values": "", "description": "Merge key."},
    {"export": "layer2_logs", "column": "prompt_log_id", "type": "string", "allowed_values": "", "description": "External AI tool log id."},
    {"export": "layer2_logs", "column": "model_name_shown", "type": "string", "allowed_values": "", "description": "Model name presented to participant."},
    {"export": "layer2_logs", "column": "prompt_count", "type": "int", "allowed_values": "", "description": "Number of prompts."},
    {"export": "layer2_logs", "column": "time_in_tool_minutes", "type": "numeric", "allowed_values": "", "description": "Minutes spent in the AI tool."},
    {"export": "layer2_logs", "column": "copy_similarity_note", "type": "string", "allowed_values": "", "description": "Observed copy similarity note."},
]
