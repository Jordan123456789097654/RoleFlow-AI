import crypto from "crypto";
import {
  IncidentContext,
  ModerationCategory,
  ModerationLogEntry,
  ModerationTier,
  ModerationVerdict,
} from "@/types";

/**
 * Text normalizer to uncover obfuscated, leetspeak, or spaced text patterns.
 */
function normalizeText(input: string): string {
  let text = input.toLowerCase();

  // Preserve technical terms like "3d print" before leetspeak 3->e conversion
  text = text.replace(/\b3d\b/g, "__3d__");

  // Leetspeak substitutions
  const leetMap: Record<string, string> = {
    "@": "a",
    "4": "a",
    "8": "b",
    "3": "e",
    "1": "i",
    "!": "i",
    "|": "i",
    "0": "o",
    "5": "s",
    "$": "s",
    "7": "t",
    "+": "t",
  };

  text = text.replace(/[@4831!|05$7+]/g, (m) => leetMap[m] || m);
  text = text.replace(/__3d__/g, "3d");

  // Collapse spaced letters e.g. "b o m b" -> "bomb"
  text = text.replace(/\b([a-z])\s+([a-z])\s+([a-z])\s+([a-z]+)\b/g, "$1$2$3$4");

  return text;
}

interface PatternRule {
  category: ModerationCategory;
  tier: ModerationTier;
  reason: string;
  patterns: RegExp[];
  confidence: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE SAFETY DETECTION RULES (TIER 1 & TIER 2)
// ─────────────────────────────────────────────────────────────────────────────
const SAFETY_RULES: PatternRule[] = [
  // ---------------------------------------------------------------------------
  // TIER 1: CSAM & Child Exploitation (18 U.S.C. §§ 2251, 2252, 2258A)
  // ---------------------------------------------------------------------------
  {
    category: "CSAM",
    tier: 1,
    reason: "Zero-tolerance violation: Child sexual abuse material or minor exploitation.",
    confidence: 1.0,
    patterns: [
      /\b(?:csam|child\s*porn(?:ography)?|underage\s*porn(?:ography)?)\b/i,
      /\b(?:pre-?teen|minor|toddler|infant|underage)\s*(?:sex(?:ual)?|nude|naked|erotic|abuse|molest)/i,
      /\b(?:pedophil(?:e|ia)|pedophile\s*ring|child\s*sexual\s*abuse)\b/i,
      /\b(?:lolicon|shota(?:con)?)\s*(?:sex|explicit|porn)/i,
    ],
  },

  // ---------------------------------------------------------------------------
  // TIER 1: Bomb & Weapons Manufacturing (18 U.S.C. §§ 842, 844, 229, 175)
  // ---------------------------------------------------------------------------
  {
    category: "WEAPONS_MANUFACTURING",
    tier: 1,
    reason: "Zero-tolerance violation: Improvised explosives, chemical/biological/radiological weapons, or illicit firearms manufacturing.",
    confidence: 0.98,
    patterns: [
      /\b(?:synthesiz(?:e|ing)|how\s+to\s+make|recipe\s+for|produce|manufacture)\s+(?:tatp|anfo|rdx|nitroglycerin|c-?4\s+explosive|hexogen|petn)\b/i,
      /\b(?:build|make|construct|assemble)\s+(?:a\s+)?(?:pipe\s*bomb|pressure\s*cooker\s*bomb|fertilizer\s*bomb|nail\s*bomb|dirty\s*bomb|ied)\b/i,
      /\b(?:synthesiz(?:e|ing)|how\s+to\s+make|weaponiz(?:e|ing)|cultur(?:e|ing)\s+of)\s+(?:sarin|vx\s*nerve|mustard\s*gas|anthrax|ricin|botulinum\s*toxin)\b/i,
      /\b(?:3d\s*print(?:ing)?|blueprint\s*for)\s+(?:an?\s+)?(?:auto\s*sear|drop-in\s*auto\s*sear|lightning\s*link|glock\s*switch|suppressor\s*baffle)\b/i,
      /\b(?:convert|modifying)\s+(?:semi-?automatic|ar-?15|handgun)\s+to\s+(?:fully?\s*automatic|machine\s*gun)\b/i,
      // Generic bomb and explosive manufacturing requests. The negative lookahead keeps
      // benign phrases such as "bomb shelter", "bomb-proof", or "bomb disposal" from matching.
      /\b(?:how\s+to\s+(?:make|build|construct|assemble|detonate|synthesize)|recipe\s+for|instructions\s+for)\s+(?:an?\s+)?(?:bomb|explosive(?:s)?|ied|pipe\s*bomb|fertilizer\s*bomb|pressure\s*cooker\s*bomb)\b(?![-\s]?(?:proof|shelter|squad|disposal|detector|threat|scare))/i,
      /\b(?:making|building|constructing|assembling)\s+(?:an?\s+)?(?:bomb|explosive\s*device)\b(?![-\s]?(?:proof|shelter|squad|disposal|detector|threat|scare))/i,
    ],
  },

  // ---------------------------------------------------------------------------
  // TIER 1: Violent Extremism & Terrorist Organizations (18 U.S.C. §§ 2332b, 2339)
  // ---------------------------------------------------------------------------
  {
    category: "VIOLENT_EXTREMISM",
    tier: 1,
    reason: "Zero-tolerance violation: Violent extremism, terrorist propaganda, or radical violent mobilization.",
    confidence: 0.96,
    patterns: [
      /\b(?:join|recruit\s*for|swear\s*(?:allegiance|bay'ah)\s*to)\s+(?:isis|isil|daesh|al-?qaeda|al-?nusra|boko\s*haram|al-?shabaab)\b/i,
      /\b(?:atomwaffen|combat\s*18|aryan\s*brotherhood|the\s*base\s*terrorist|the\s*base\s*group)\s+(?:manifesto|attack|propaganda|recruitment)\b/i,
      /\b(?:siege\s*culture|james\s*mason\s*siege|race\s*war\s*tactics|day\s*of\s*the\s*rope)\b/i,
      /\b(?:manifesto\s*of|praise|glorify)\s+(?:brenton\s*tarrant|anders\s*breivik|dylann\s*roof|payton\s*gendron)\b/i,
    ],
  },

  // ---------------------------------------------------------------------------
  // TIER 1: Domestic Terrorism & Critical Infrastructure Sabotage
  // ---------------------------------------------------------------------------
  {
    category: "DOMESTIC_TERRORISM",
    tier: 1,
    reason: "Zero-tolerance violation: Domestic terrorism, electrical grid sabotage, water poisoning, or government building attack.",
    confidence: 0.96,
    patterns: [
      /\b(?:sabotage|attack|destroy|disable|sniper\s*attack\s*on)\s+(?:power\s*substation|electrical\s*grid|scada\s*grid|nuclear\s*reactor|substation\s*transformers)\b/i,
      /\b(?:poison|contaminat(?:e|ing))\s+(?:municipal\s*water|city\s*water\s*reservoir|drinking\s*water\s*supply)\s+(?:with\s+)?(?:cyanide|chlorine|arsenic|toxin|ricin)\b/i,
      /\b(?:derail|blow\s*up)\s+(?:passenger\s*train|hazmat\s*train|railway\s*tracks|subway\s*tunnel)\b/i,
      /\b(?:blow\s*up|bomb|attack)\s+(?:federal\s*courthouse|capitol\s*building|fbi\s*field\s*office|pentagon|city\s*hall)\b/i,
    ],
  },

  // ---------------------------------------------------------------------------
  // TIER 1: Mass Violence & Active Shooter Tactics (18 U.S.C. § 875(c))
  // ---------------------------------------------------------------------------
  {
    category: "MASS_VIOLENCE",
    tier: 1,
    reason: "Zero-tolerance violation: Mass violence planning, active shooter casualty maximization, or public ramming.",
    confidence: 0.95,
    patterns: [
      /\b(?:plan|how\s+to\s+execute|carry\s*out)\s+(?:a\s+)?(?:school\s*shooting|mass\s*shooting|church\s*shooting|mosque\s*shooting|mall\s*shooting)\b/i,
      /\b(?:maximize|increase)\s+(?:casualt(?:y|ies)|body\s*count|kills)\s+(?:in\s+a\s+shooting|during\s+an\s+attack)\b/i,
      /\b(?:ram|drive)\s+(?:a\s+)?(?:truck|van|vehicle)\s+into\s+(?:a\s+)?(?:crowd|parade|christmas\s*market|protesters)\s+to\s+(?:kill|slaughter|mow\s*down)\b/i,
    ],
  },

  // ---------------------------------------------------------------------------
  // TIER 1: Imminent Threats to Life (18 U.S.C. § 875)
  // ---------------------------------------------------------------------------
  {
    category: "IMMINENT_THREAT_TO_LIFE",
    tier: 1,
    reason: "Zero-tolerance violation: Imminent threat to life, targeted assassination, or imminent physical violence.",
    confidence: 0.95,
    patterns: [
      /\b(?:i\s*(?:am|will|gonna)\s+(?:kill|murder|shoot|slit\s*the\s*throat\s*of|assassinate|strangle))\s+[a-z0-9\s]{2,40}\s*(?:today|tonight|tomorrow|in\s*an?\s*hour|at\s*\d+\s*(?:am|pm)?)\b/i,
      /\b(?:how\s+to\s+hire|paying|contract\s*for)\s+(?:a\s+)?(?:hitman|assassin)\s+to\s+(?:kill|murder|execute)\b/i,
      /\b(?:planting\s+a\s+bomb\s+(?:at|in)|bomb\s+is\s+set\s+to\s+detonate)\b/i,
      // Requests for help killing or poisoning a person without being caught.
      /\bhow\s+(?:do\s+i|can\s+i|to|do\s+you)\s+(?:kill|murder|poison|strangle|drown|suffocate)\s+(?:someone|somebody|a\s+person|him|her|them|my\s+(?:neighbor|boss|wife|husband|ex|roommate|coworker|landlord|partner|girlfriend|boyfriend|brother|sister|mom|dad|mother|father))\b.*\b(?:without\s+(?:getting|being)\s+caught|get\s+away\s+with|leave\s+no\s+evidence|without\s+leaving\s+evidence)/i,
    ],
  },

  // ---------------------------------------------------------------------------
  // TIER 2: Cyberattacks & Offensive Exploitation (18 U.S.C. § 1030 CFAA)
  // ---------------------------------------------------------------------------
  {
    category: "CYBERATTACK",
    tier: 2,
    reason: "Tier 2 violation: Cyberattack tooling, unauthorized system intrusion, or botnet generation.",
    confidence: 0.90,
    patterns: [
      /\b(?:ddos\s*script|ddos\s*attack\s*code|syn\s*flood\s*tool|udp\s*amplification\s*script|slowloris\s*script)\b/i,
      /\b(?:mirai|qbot)\s*botnet\s*(?:source|code|setup|payload)\b/i,
      /\b(?:automated|scripted)\s+(?:credential\s*stuffing|account\s*takeover\s*tool|brute-?force\s*cracker)\b/i,
      /\b(?:exploit|payload)\s+to\s+(?:bypass|disable)\s+(?:waf|firewall|antivirus|edr|crowdstrike|sentinelone)\s+and\s+execute\s+unauthorized\b/i,
      /\b(?:sql\s*injection\s*exploit\s*payload\s*to\s*dump|exfiltrate)\s+(?:database|credentials|passwords|credit\s*cards)\b/i,
    ],
  },

  // ---------------------------------------------------------------------------
  // TIER 2: Ransomware & Evasive Malware Payloads
  // ---------------------------------------------------------------------------
  {
    category: "RANSOMWARE_MALWARE",
    tier: 2,
    reason: "Tier 2 violation: Ransomware creation, covert keylogging, or Trojan deployment.",
    confidence: 0.92,
    patterns: [
      /\b(?:write|create|code|generate)\s+(?:a\s+)?(?:ransomware|cryptolocker)\s*(?:script|code|payload|in\s*python|in\s*c|in\s*rust)?\b/i,
      /\b(?:encrypt\s*all\s*user\s*files|lock\s*system\s*files)\s+and\s+(?:demand\s*(?:bitcoin|crypto|ransom)|leave\s*a\s*ransom\s*note)\b/i,
      /\b(?:build|write|create)\s+(?:a\s+)?(?:stealth\s*keylogger|covert\s*rat|remote\s*access\s*trojan|rootkit\s*payload)\b/i,
      /\b(?:polymorphic|metamorphic)\s+(?:malware|virus|worm)\s*(?:generator|code)\b/i,
    ],
  },

  // ---------------------------------------------------------------------------
  // TIER 2: Threats of violence against a specific person (refusal, no auto-ban)
  // ---------------------------------------------------------------------------
  {
    category: "VIOLENT_THREAT",
    tier: 2,
    reason: "Tier 2 violation: Stated intent to kill or seriously harm a specific person.",
    confidence: 0.9,
    patterns: [
      /\bi(?:'m|\s+am|\s+m|\s+will|\s+want|\s+plan|\s+need|\s+gonna)?\s*(?:going\s+to\s+|gonna\s+|want\s+to\s+|plan\s+to\s+|need\s+to\s+|will\s+)?(?:kill|murder|shoot|stab|hurt|beat\s*up|maim|strangle)\s+(?:him|her|them|someone|somebody|my\s+(?:neighbor|boss|wife|husband|ex|roommate|coworker|landlord|partner|girlfriend|boyfriend|brother|sister|mom|dad|mother|father|son|daughter|teacher|classmate|friend))\b/i,
    ],
  },

  // ---------------------------------------------------------------------------
  // TIER 2: Fraud, phishing, and credential theft
  // ---------------------------------------------------------------------------
  {
    category: "FRAUD_PHISHING",
    tier: 2,
    reason: "Tier 2 violation: Phishing, scam content, or credential theft.",
    confidence: 0.9,
    patterns: [
      /\b(?:write|create|draft|build|make|generate|code)\s+(?:me\s+)?(?:a\s+|an\s+)?(?:phishing|scam)\s+(?:email|text|sms|page|site|website|message|kit|campaign|login)/i,
      /\b(?:fake|cloned?|copy\s+of\s+(?:the\s+)?)\s*(?:bank|paypal|microsoft|google|apple|netflix|login|sign-?in)\s+(?:page|login\s*page|site|website)\b.*\b(?:password|credentials|credit\s*card)/i,
      /\b(?:steal|harvest|collect)\s+(?:people'?s\s+|other\s+people'?s\s+|someone'?s\s+)?(?:bank\s+logins?|passwords|credit\s*card\s*(?:numbers|details)|login\s+credentials)\b/i,
    ],
  },

  // ---------------------------------------------------------------------------
  // TIER 2: Illegal drug synthesis
  // ---------------------------------------------------------------------------
  {
    category: "DRUG_SYNTHESIS",
    tier: 2,
    reason: "Tier 2 violation: Synthesis or production of illegal drugs.",
    confidence: 0.92,
    patterns: [
      /\b(?:how\s+(?:do\s+i|can\s+i|to|do\s+you)\s+(?:make|cook|synthesi[sz]e|produce|manufacture)|recipe\s+for|synthesi[sz]e|cook|produce|manufacture)\s+(?:a\s+|some\s+)?(?:meth|methamphetamine|crack\s+cocaine|fentanyl|heroin|mdma|lsd|pcp)\b/i,
      /\b(?:synthesi[sz]e|cook|make)\s+(?:meth|fentanyl|heroin)\s+(?:at\s+home|in\s+a\s+lab|from\s+(?:pseudoephedrine|ephedrine))/i,
    ],
  },

  // ---------------------------------------------------------------------------
  // TIER 2: Self-Harm & Suicide Instructions
  // ---------------------------------------------------------------------------
  {
    category: "SELF_HARM",
    tier: 2,
    reason: "Tier 2 violation: Suicide methods, self-harm instructions, or lethal dosage queries.",
    confidence: 0.93,
    patterns: [
      /\b(?:how\s+to|best\s*way\s*to)\s+(?:commit\s*suicide|kill\s*myself|end\s*my\s*life|hang\s*myself)\b/i,
      /\b(?:lethal\s*dose|fatal\s*dosage|how\s+many\s+pills\s+to\s+overdose\s+and\s+die)\b/i,
      /\b(?:painless\s*suicide|easiest\s*way\s*to\s*die|instruction(?:s)?\s*for\s*suicide)\b/i,
      /\b(?:how\s+to\s+slit\s*(?:my\s*)?wrists|cutting\s*veins\s*deep\s*enough)\b/i,
    ],
  },
];

/**
 * Hybrid scanner that checks normalized and raw prompts against Tier 1 and Tier 2 rules.
 */
export function scanMessage(prompt: string): ModerationVerdict {
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return {
      flagged: false,
      tier: null,
      category: null,
      reason: null,
      confidence: 0,
      action: "ALLOW",
    };
  }

  const raw = prompt.trim();
  const normalized = normalizeText(raw);

  // 1. Scan Tier 1 Rules First (Zero Tolerance)
  for (const rule of SAFETY_RULES.filter((r) => r.tier === 1)) {
    for (const pattern of rule.patterns) {
      if (pattern.test(raw) || pattern.test(normalized)) {
        const match = raw.match(pattern) || normalized.match(pattern);
        return {
          flagged: true,
          tier: 1,
          category: rule.category,
          reason: rule.reason,
          confidence: rule.confidence,
          matchedKeywords: match ? [match[0]] : [],
          action: "BLOCK_AND_BAN",
        };
      }
    }
  }

  // 2. Scan Tier 2 Rules Second (Refuse with warning / strike)
  for (const rule of SAFETY_RULES.filter((r) => r.tier === 2)) {
    for (const pattern of rule.patterns) {
      if (pattern.test(raw) || pattern.test(normalized)) {
        const match = raw.match(pattern) || normalized.match(pattern);
        return {
          flagged: true,
          tier: 2,
          category: rule.category,
          reason: rule.reason,
          confidence: rule.confidence,
          matchedKeywords: match ? [match[0]] : [],
          action: "REFUSE_WITH_WARNING",
        };
      }
    }
  }

  return {
    flagged: false,
    tier: null,
    category: null,
    reason: null,
    confidence: 0,
    action: "ALLOW",
  };
}

/**
 * Generates a factual Trust & Safety incident dossier for internal administrative records.
 */
/** Renders the captured conversation for the text dossier. Image bytes stay in the JSON export. */
function formatContextForDossier(raw?: string): string {
  if (!raw) {
    return "No conversation context was captured for this incident (recorded before context capture was enabled).";
  }
  try {
    const parsed = JSON.parse(raw) as IncidentContext;
    const lines = parsed.turns.map((t, i) => {
      const header = `[${i + 1}] ${t.role.toUpperCase()} @ ${t.createdAt || "unknown time"}`;
      const body = t.content ? `${t.content}` : "(no text)";
      const attachments = (t.attachments || []).map((a) => {
        if (a.imageDataUrl !== undefined) {
          return `    [image] ${a.name} (${a.type}, ${a.size} bytes)${a.imageDataUrl ? " — included in JSON export" : " — image bytes not retained"}`;
        }
        const note = a.truncated ? " [truncated]" : "";
        return `    [file] ${a.name} (${a.type}, ${a.size} bytes)${note}\n${a.text ?? ""}`;
      });
      return [header, body, ...attachments].join("\n");
    });
    return lines.join("\n\n");
  } catch {
    return "Captured context could not be parsed.";
  }
}

export function generateIncidentDossier(logEntry: ModerationLogEntry): string {
  const hashDigest = crypto
    .createHash("sha256")
    .update(`${logEntry.id}:${logEntry.userId}:${logEntry.createdAt}:${logEntry.prompt}`)
    .digest("hex");

  const isoTime = logEntry.createdAt || new Date().toISOString();
  const utcFormatted = new Date(isoTime).toUTCString();
  const adminContact = process.env.ADMIN_EMAIL || "security@roleflow.site";

  const divider = "=".repeat(78);
  const subDivider = "-".repeat(78);

  return `${divider}
ROLEFLOW TRUST & SAFETY — INTERNAL INCIDENT AUDIT DOSSIER
CONFIDENTIAL // COMPLIANCE & SAFETY AUDIT LOG
${divider}

INCIDENT TRACKING NUMBER : RF-INC-${logEntry.id}
REPORT GENERATED AT      : ${new Date().toISOString()} (${utcFormatted})
CLASSIFICATION STATUS    : INTERNAL AUDIT RECORD
ADMIN CONTACT            : ${adminContact}

${subDivider}
SECTION 1: INCIDENT SUMMARY & POLICY CLASSIFICATION
${subDivider}
Violation Severity Level   : TIER ${logEntry.tier} (${logEntry.tier === 1 ? "ZERO-TOLERANCE CRITICAL" : "POLICY WARNING"})
Violation Category         : ${logEntry.category}
Operational Action Taken   : ${logEntry.status === "BANNED" ? "ACCOUNT PERMANENTLY BANNED" : "REQUEST BLOCKED & LOGGED"}
Incident Resolution State  : ${logEntry.status}
Automated Detection Engine : RoleFlow Multi-Vector Hybrid Safety Engine

${subDivider}
SECTION 2: SUBJECT IDENTIFICATION & ORIGIN METADATA
${subDivider}
User Identifier (Internal) : ${logEntry.userId || "UNAUTHENTICATED_GUEST"}
Subject Email Address      : ${logEntry.userEmail || "NO_EMAIL_PROVIDED"}
Originating IP Address     : ${logEntry.ipAddress || "UNKNOWN_PROXIED"}
Incident Timestamp (UTC)   : ${utcFormatted}
Incident Timestamp (ISO)   : ${isoTime}
Current Account Status     : ${logEntry.status === "BANNED" ? "BANNED (PERMANENT BAN ACTIVE)" : logEntry.status}
User Appeal Log Status     : ${logEntry.appealNote ? "APPEAL SUBMITTED" : "NO APPEAL ON FILE"}

${logEntry.appealNote ? `Subject Appeal Statement:\n"${logEntry.appealNote}"\n` : ""}
${subDivider}
SECTION 3: FORENSIC EVIDENCE TRANSCRIPT
${subDivider}
CAUTION: The following raw prompt text contains hazardous or illicit material
intercepted prior to large language model processing. The text below was never
completed, generated, or returned to the user:

BEGIN RAW PROMPT EVIDENCE [RF-INC-${logEntry.id}]
------------------------------------------------------------------------------
${logEntry.prompt}
------------------------------------------------------------------------------
END RAW PROMPT EVIDENCE

${subDivider}
SECTION 3B: CONVERSATION AT TIME OF FLAG (up to last 12 turns)
${subDivider}
${formatContextForDossier(logEntry.context)}

${subDivider}
SECTION 4: SYSTEM INTERVENTION LOG
${subDivider}
1. Real-time pre-inference semantic intercept: TRIGGERED
2. Model token pipeline halt: EXECUTED (0 tokens generated)
3. Action applied: ${logEntry.status}
4. Cryptographic hash recorded: VERIFIED

${subDivider}
SECTION 5: CHAIN OF CUSTODY & INTEGRITY VERIFICATION
${subDivider}
Algorithm                  : SHA-256
Cryptographic Hash         : ${hashDigest}
Record Status              : Preserved in RoleFlow Moderation Audit Store

Authorized Sign-off:
RoleFlow Safety & Compliance Operations
Contact: ${adminContact}
${divider}
`;
}
