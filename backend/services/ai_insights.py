"""
AI Insights Service
====================

Two analyst-productivity capabilities, both grounded in the platform's live
metrics so the model never answers from thin air:

    generate_executive_summary(db)        -> narrative summary + risks + actions
    answer_question(db, question)          -> AI financial-analyst Q&A

Design
------
A compact "operating context" is built from the analytics service and passed to
the model as structured facts. When ``OPENROUTER_API_KEY`` is configured the
narrative is produced by an LLM via OpenRouter; otherwise a deterministic,
metric-driven fallback generates the same shape of output. Either way the
response includes ``source`` ("openrouter" | "rule-based") so the UI can label
it honestly.
"""

import json
import os
from typing import Any, Dict, List

from sqlalchemy.orm import Session

try:
    from . import analytics
except ImportError:  # pragma: no cover
    from services import analytics

try:
    import requests
except ImportError:  # pragma: no cover
    requests = None

try:
    from dotenv import load_dotenv

    # Load .env from the project root (one level up from backend/) so the key is
    # found regardless of the working directory uvicorn is launched from. Falls
    # back to a normal upward search.
    _ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    load_dotenv(os.path.join(_ROOT, ".env"))
    load_dotenv()  # also honour CWD / nearest .env
except ImportError:  # pragma: no cover
    pass


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-haiku")
SYSTEM_PROMPT = (
    "You are a senior financial analyst for an educational institution (a "
    "university) in India. You write for institutional management — the finance "
    "committee and leadership. Be concise, specific and quantitative — cite the "
    "figures you are given, explain the 'why', and recommend concrete actions for "
    "financial planning, budgeting and sustainability. All monetary amounts are "
    "in Indian Rupees (₹); use the ₹ symbol and Indian conventions (Lakh/Crore) "
    "and never use $ or 'dollars'. Never invent numbers that are not in the "
    "provided context. Use plain business English, not jargon."
)


# =============================================================================
# Operating context (shared grounding for every AI response)
# =============================================================================

def build_context(db: Session) -> Dict[str, Any]:
    """Assemble the structured facts the model is allowed to reason over."""
    summary = analytics.executive_summary(db)
    breakdown = analytics.expense_breakdown(db)
    variance = analytics.budget_variance(db)
    vendors = analytics.vendor_analysis(db)
    revenue_fc = analytics.revenue_forecast(db, periods=6)
    expense_fc = analytics.expense_forecast(db, periods=6)

    top_vendor = vendors[0] if vendors else None
    high_risk_vendors = [v for v in vendors if v["risk_tier"] == "High"]
    biggest_overrun = next((v for v in variance if v["status"] == "Over"), None)
    top_category = breakdown[0] if breakdown else None
    rising_category = max(breakdown, key=lambda d: d["yoy_change_pct"], default=None)

    def _fc_delta(fc):
        f = fc["forecast"]
        if not f:
            return 0.0
        return round((f[-1]["forecast"] - f[0]["forecast"]) / max(1.0, f[0]["forecast"]) * 100, 1)

    return {
        "kpis": summary,
        "revenue_forecast_6m_trend_pct": _fc_delta(revenue_fc),
        "expense_forecast_6m_trend_pct": _fc_delta(expense_fc),
        "top_expense_category": top_category,
        "fastest_rising_expense": rising_category,
        "largest_budget_overrun": biggest_overrun,
        "top_vendor": top_vendor,
        "high_risk_vendor_count": len(high_risk_vendors),
        "high_risk_vendors": [v["vendor"] for v in high_risk_vendors[:3]],
    }


def _inr(value: float) -> str:
    """Compact INR formatting (Cr / L)."""
    try:
        value = float(value)
    except (TypeError, ValueError):
        return str(value)
    a = abs(value)
    if a >= 1e7:
        return f"₹{value / 1e7:.2f} Cr"
    if a >= 1e5:
        return f"₹{value / 1e5:.2f} L"
    return f"₹{value:,.0f}"


# =============================================================================
# OpenRouter call
# =============================================================================

def _call_openrouter(messages: List[Dict[str, str]]) -> str | None:
    """Call OpenRouter. Returns content string, or None on any failure."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key or requests is None:
        return None
    try:
        resp = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Institutional Financial Analytics",
            },
            data=json.dumps(
                {
                    "model": DEFAULT_MODEL,
                    "messages": messages,
                    "temperature": 0.3,
                    "max_tokens": 700,
                }
            ),
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        return None


# =============================================================================
# Executive summary
# =============================================================================

def generate_executive_summary(db: Session) -> Dict[str, Any]:
    """AI-written executive summary with observations, risks and actions."""
    ctx = build_context(db)

    prompt = (
        "Write a leadership briefing for institutional management from this "
        "financial operating context. Return STRICT JSON with keys: 'headline' "
        "(one sentence), 'observations' (3-4 strings), 'risks' (2-3 strings), "
        "'opportunities' (2 strings), 'actions' (3 strings). "
        "Ground every point in the figures.\n\n"
        f"CONTEXT:\n{json.dumps(ctx, indent=2)}"
    )
    raw = _call_openrouter(
        [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": prompt}]
    )

    if raw:
        parsed = _extract_json(raw)
        if parsed and "observations" in parsed:
            parsed["source"] = "openrouter"
            parsed["model"] = DEFAULT_MODEL
            return parsed

    fallback = _fallback_summary(ctx)
    fallback["source"] = "rule-based"
    return fallback


def _extract_json(text: str) -> Dict[str, Any] | None:
    """Best-effort JSON extraction from a model response."""
    try:
        return json.loads(text)
    except Exception:
        pass
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1:
        try:
            return json.loads(text[start : end + 1])
        except Exception:
            return None
    return None


def _fallback_summary(ctx: Dict[str, Any]) -> Dict[str, Any]:
    """Deterministic, metric-driven executive summary (no external calls)."""
    k = ctx["kpis"]
    category = ctx.get("top_expense_category") or {}
    rising = ctx.get("fastest_rising_expense") or {}
    overrun = ctx.get("largest_budget_overrun")
    top_vendor = ctx.get("top_vendor") or {}

    margin_dir = "improving" if k["revenue_growth_pct"] >= k["expense_growth_pct"] else "narrowing"

    observations = [
        f"Total revenue is {_inr(k['total_revenue'])} (~{k['student_fee_count']:,} fee payments) "
        f"with revenue {('up' if k['revenue_growth_pct'] >= 0 else 'down')} "
        f"{abs(k['revenue_growth_pct'])}% year-over-year.",
        f"Total expenses are {_inr(k['total_expenses'])}; the largest category is "
        f"{category.get('category', 'n/a')} at {category.get('share_pct', 0)}% of spend.",
        f"Operating margin stands at {k['operating_margin_pct']}% and is {margin_dir} "
        f"as expenses move {('up' if k['expense_growth_pct'] >= 0 else 'down')} {abs(k['expense_growth_pct'])}% YoY.",
        f"Net worth is {_inr(k['net_worth'])} with a liquidity ratio of {k['liquidity_ratio']}; "
        f"forecast confidence is {k['forecast_confidence_pct']}%.",
    ]

    risks = []
    if rising and rising.get("yoy_change_pct", 0) > 5:
        risks.append(
            f"{rising['category']} expense is rising fast (+{rising['yoy_change_pct']}% YoY) "
            f"and will pressure surplus if unaddressed."
        )
    if overrun:
        risks.append(
            f"{overrun['category']} spend is {overrun['variance_pct']}% over budget "
            f"({_inr(overrun['variance'])} unfavourable)."
        )
    if ctx.get("high_risk_vendor_count", 0):
        names = ", ".join(ctx.get("high_risk_vendors", []))
        risks.append(
            f"Spend is concentrated on {ctx['high_risk_vendor_count']} vendor(s) ({names}), "
            f"a procurement-governance risk."
        )
    if not risks:
        risks.append("No critical expense, budget or vendor-concentration risks this period.")

    opportunities = [
        f"Diversifying procurement could reduce the "
        f"{top_vendor.get('spend_share_pct', 0)}% spend concentration on {top_vendor.get('vendor', 'the top vendor')}.",
        f"Revenue is forecast to trend {ctx.get('revenue_forecast_6m_trend_pct', 0)}% over 6 months — "
        f"align budgeting and reserves accordingly.",
    ]

    actions = [
        f"Launch a cost-review on {(rising or category).get('category', 'the largest expense category')} "
        f"to offset the recent increase.",
        "Re-tender or add alternate vendors where spend concentration is high.",
        f"Maintain the liquidity ratio above {max(1.5, round(k['liquidity_ratio'], 1))} and protect the "
        f"{k['operating_margin_pct']}% operating margin through disciplined budgeting.",
    ]

    return {
        "headline": (
            f"Institutional finances are {k['health_status'].lower()} "
            f"(health {k['health_score']}/100) with a {k['operating_margin_pct']}% margin "
            f"and {k['risk_level'].lower()} risk."
        ),
        "observations": observations,
        "risks": risks,
        "opportunities": opportunities,
        "actions": actions,
    }


# =============================================================================
# Financial-analyst Q&A
# =============================================================================

SUGGESTED_QUESTIONS = [
    "Why are expenses increasing?",
    "What is causing margin pressure this period?",
    "Which expense category is the largest risk?",
    "Summarize this period's financial performance.",
    "Where should we focus cost-reduction efforts?",
]


def answer_question(db: Session, question: str) -> Dict[str, Any]:
    """Answer a management question grounded in current metrics."""
    ctx = build_context(db)
    prompt = (
        "Answer the management question using ONLY the operating context. "
        "Be concise (3-5 sentences), quantitative, and end with one recommended action.\n\n"
        f"CONTEXT:\n{json.dumps(ctx, indent=2)}\n\nQUESTION: {question}"
    )
    raw = _call_openrouter(
        [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": prompt}]
    )
    if raw:
        return {"answer": raw, "source": "openrouter", "model": DEFAULT_MODEL}

    return {"answer": _fallback_answer(ctx, question), "source": "rule-based"}


def _fallback_answer(ctx: Dict[str, Any], question: str) -> str:
    """Deterministic answer routed by keyword to the relevant metrics."""
    k = ctx["kpis"]
    q = question.lower()
    category = ctx.get("top_expense_category") or {}
    rising = ctx.get("fastest_rising_expense") or {}
    overrun = ctx.get("largest_budget_overrun")
    top_vendor = ctx.get("top_vendor") or {}

    if any(w in q for w in ["expense", "cost", "spend", "increase", "rising"]):
        msg = (
            f"Total expenses are {_inr(k['total_expenses'])}, moving {k['expense_growth_pct']}% YoY. "
            f"The dominant category is {category.get('category', 'n/a')} ({category.get('share_pct', 0)}% of spend)."
        )
        if rising and rising.get("yoy_change_pct", 0) > 0:
            msg += (
                f" The fastest-rising category is {rising['category']} at +{rising['yoy_change_pct']}% YoY, "
                f"which is the main pressure point."
            )
        msg += f" Recommended action: open a cost-review on {(rising or category).get('category', 'the largest category')}."
        return msg

    if "margin" in q or "surplus" in q or "profit" in q:
        return (
            f"Operating margin is {k['operating_margin_pct']}% (net surplus {_inr(k['net_surplus'])}). "
            f"Revenue grew {k['revenue_growth_pct']}% YoY while expenses moved {k['expense_growth_pct']}% — "
            f"the gap drives the margin. "
            f"Recommended action: protect fee revenue and contain {rising.get('category', category.get('category', 'variable expenses'))} to defend surplus."
        )

    if any(w in q for w in ["vendor", "supplier", "procurement", "concentration"]):
        if ctx.get("high_risk_vendor_count", 0):
            names = ", ".join(ctx.get("high_risk_vendors", []))
            return (
                f"Spend is concentrated on {ctx['high_risk_vendor_count']} vendor(s) ({names}). "
                f"{top_vendor.get('vendor', 'The top vendor')} alone accounts for "
                f"{top_vendor.get('spend_share_pct', 0)}% of vendor spend ({_inr(top_vendor.get('spend', 0))}). "
                f"Recommended action: add alternate vendors to reduce concentration risk."
            )
        return (
            f"No single vendor is over-concentrated this period. The largest is "
            f"{top_vendor.get('vendor', 'n/a')} at {top_vendor.get('spend_share_pct', 0)}% of vendor spend. "
            f"Recommended action: keep monitoring concentration as spend grows."
        )

    if any(w in q for w in ["position", "asset", "liabilit", "worth", "liquid"]):
        return (
            f"Net worth is {_inr(k['net_worth'])} on total assets of {_inr(k['total_assets'])}, "
            f"with a liquidity ratio of {k['liquidity_ratio']}. "
            f"Recommended action: maintain liquidity above 1.5x to comfortably cover obligations."
        )

    # Generic summary.
    parts = [
        f"Institutional finances are {k['health_status'].lower()} (health {k['health_score']}/100, risk {k['risk_level'].lower()}).",
        f"Revenue {_inr(k['total_revenue'])}, expenses {_inr(k['total_expenses'])}, margin {k['operating_margin_pct']}%.",
    ]
    if overrun:
        parts.append(f"Largest budget overrun: {overrun['category']} ({overrun['variance_pct']}% over).")
    parts.append(
        f"Recommended action: focus on {(rising or category).get('category', 'top expense categories')} and budget discipline."
    )
    return " ".join(parts)
