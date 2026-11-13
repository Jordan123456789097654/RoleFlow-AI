import type { EmailTemplate } from "./types";

/** Community, Surveys & Roadmap (15 templates) */
export const COMMUNITY_TEMPLATES: EmailTemplate[] = [
  {
    id: "comm-founder-quarterly",
    title: "Founder's quarterly letter",
    category: "community",
    subject: "A letter from the founder: where RoleFlow is headed",
    tags: ["letter", "founder", "quarterly", "update", "vision"],
    emoji: "✉️",
    body: `Hi {{name}},

It has been a busy quarter, and I wanted to share where RoleFlow stands and where we are going.

What we shipped: improvements to model quality, a faster streaming experience, and more ways to organize your work with Projects.

What we learned: many of you want more control over how answers are produced, and more clarity when something goes wrong. Both are now high on our list.

What comes next: we are focusing on reliability, safety, and features that save you real time. I will share more in the next letter.

Thank you for trusting us with your work. Just reply to this email if something is on your mind. I read every message.`,
    ctaText: "Open RoleFlow",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "comm-nps-survey",
    title: "Two-minute NPS survey",
    category: "community",
    subject: "Two minutes to help us improve RoleFlow?",
    tags: ["nps", "survey", "feedback", "satisfaction"],
    emoji: "📝",
    body: `Hi {{name}},

Would you take two minutes to tell us how likely you are to recommend RoleFlow to a friend or colleague? It is one question, plus an optional comment, and your answer goes straight to the product team.

Your feedback helps us decide what to build next, and we read every response.`,
    ctaText: "Take the two-minute survey",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "comm-interview-invite",
    title: "1-on-1 customer interview invite",
    category: "community",
    subject: "Would you join a 30-minute conversation about RoleFlow?",
    tags: ["interview", "research", "customer", "invite", "feedback"],
    emoji: "🎙️",
    body: `Hi {{name}},

We are talking with a small group of RoleFlow users about how they work, and we would love to hear from you. The conversation takes about 30 minutes, on video or by phone, at a time that suits you.

We will ask about the tasks you use RoleFlow for and what gets in the way. We will not try to sell you anything. As a thank you, we will send a $50 gift card or a month of credit, whichever you prefer.

Reply with a few times that work for you and we will send an invitation.`,
    ctaText: "Pick a time",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "comm-beta-tester-call",
    title: "Beta tester call",
    category: "community",
    subject: "Invitation: join the RoleFlow beta program",
    tags: ["beta", "tester", "early access", "invite"],
    emoji: "🧪",
    body: `Hi {{name}},

We are looking for a small group of beta testers to try new features before they reach everyone. Beta features may change or be removed, and we will ask for specific feedback as you use them.

Beta testers get early access, a direct line to the product team, and a chance to shape what ships. If you are interested, reply to this email with a sentence about how you use RoleFlow.

Applications close on {{date}}.`,
    ctaText: "Join the beta",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "comm-feature-vote",
    title: "Feature voting round",
    category: "community",
    subject: "Vote for the next feature we build",
    tags: ["vote", "feature", "roadmap", "community", "poll"],
    emoji: "🗳️",
    body: `Hi {{name}},

It is time for another community voting round. We have shortlisted several features based on requests from our users. Pick the ones you most want to see.

Voting is open until {{date}}. The top-voted feature goes onto the roadmap for the next quarter, and we will report back on the results.`,
    ctaText: "Cast your votes",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "comm-user-spotlight",
    title: "User spotlight",
    category: "community",
    subject: "Meet a RoleFlow user: how they use it every day",
    tags: ["spotlight", "story", "community", "user", "feature"],
    emoji: "🌟",
    body: `Hi {{name}},

This month we are spotlighting a member of the RoleFlow community. They use RoleFlow to plan projects, check their drafts, and keep track of ideas across multiple teams.

Their workflow is a great example of how Projects and Custom Instructions can work together. If you would like to be featured in a future spotlight, reply to this email and tell us your story. We will ask permission before we publish anything.`,
    ctaText: "Read the spotlight",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "comm-year-end-review",
    title: "End-of-year review",
    category: "community",
    subject: "RoleFlow in review: our year in numbers and milestones",
    tags: ["year end", "review", "recap", "milestones", "community"],
    emoji: "🎆",
    body: `Hi {{name}},

As the year comes to a close on {{date}}, we wanted to thank you for being part of RoleFlow.

Highlights from the year: new models, new ways to organize your work, and steady improvements to reliability and speed. We also listened to a lot of feedback, and much of what we built was shaped by your suggestions.

Looking ahead, we will keep focusing on quality, safety and features that help you do your best work. Here is to the year ahead.`,
    ctaText: "Read the year in review",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "comm-roadmap-update",
    title: "Public roadmap update",
    category: "community",
    subject: "RoleFlow roadmap update",
    tags: ["roadmap", "update", "plans", "transparency"],
    emoji: "🗺️",
    body: `Hi {{name}},

Here is a short update on our public roadmap, as of {{date}}.

Now: work that is in progress, including reliability improvements and refinements to the model picker.
Next: features that are scoped and scheduled, which we will announce when they are ready.
Later: ideas we are still exploring and may change or drop.

Roadmap items are estimates, not promises, and we will update you when plans change.`,
    ctaText: "View the roadmap",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "comm-office-hours",
    title: "Community office hours invite",
    category: "community",
    subject: "Join our community office hours on {{date}}",
    tags: ["office hours", "community", "q&a", "event", "invite"],
    emoji: "🧑‍💻",
    body: `Hi {{name}},

We are hosting an open office hours session on {{date}}. Bring your questions about RoleFlow, your workflows, or features you would like to see. Members of the product team will be there to answer questions and take notes.

The session is open to all users, and you do not need to prepare anything. We will share a recording afterwards for anyone who cannot attend live.`,
    ctaText: "Save my spot",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "comm-onboarding-feedback",
    title: "Post-onboarding feedback request",
    category: "community",
    subject: "How was your first week with RoleFlow?",
    tags: ["onboarding", "feedback", "new user", "first week"],
    emoji: "🌱",
    body: `Hi {{name}},

Thanks for joining RoleFlow. We would love to know how your first week has gone. What did you try, what worked well, and what felt confusing?

Just reply to this email with a few sentences. Your answers help us make the first experience better for everyone who joins after you.`,
    ctaText: "Start a new chat",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "comm-welcome-new-user",
    title: "Welcome to RoleFlow",
    category: "community",
    subject: "Welcome to RoleFlow",
    tags: ["welcome", "onboarding", "new user", "getting started"],
    emoji: "👋",
    body: `Hi {{name}},

Welcome to RoleFlow. We are glad to have you.

To get started, ask a question in a new chat, try a different model in the model picker, and set up Custom Instructions so answers match the way you work. If you get stuck, reply to this email and a real person will help.`,
    ctaText: "Start your first chat",
    ctaUrl: "{{app_url}}",
  },
  {
    id: "comm-thank-you-feedback",
    title: "Thank you for your feedback",
    category: "community",
    subject: "Thank you for your feedback",
    tags: ["thanks", "feedback", "gratitude", "community"],
    emoji: "💛",
    body: `Hi {{name}},

Thank you for taking the time to send us your feedback. We read it, and it has been shared with the team that works on this area of RoleFlow.

We cannot promise every request will ship, but your input directly shapes what we build. We will let you know if we take action on something you raised.`,
  },
  {
    id: "comm-holiday-hours",
    title: "Holiday support hours",
    category: "community",
    subject: "RoleFlow support hours over the holidays",
    tags: ["holiday", "support", "hours", "schedule"],
    emoji: "🎄",
    body: `Hi {{name}},

Our support team will have reduced hours from {{date}} through the holiday period. We will still respond to urgent security and account issues, and our self-serve help center is available at any time.

Responses to other messages may take longer than usual. Thank you for your patience, and happy holidays from the RoleFlow team.`,
    ctaText: "Visit the help center",
    ctaUrl: "https://roleflow.site/help",
  },
  {
    id: "comm-community-event",
    title: "Community event invitation",
    category: "community",
    subject: "You are invited: a RoleFlow community event",
    tags: ["event", "community", "invite", "meetup"],
    emoji: "🎟️",
    body: `Hi {{name}},

You are invited to a RoleFlow community event on {{date}}. We will share how power users approach their workflows, demonstrate new features, and hear your ideas for what comes next.

Attendance is free, and space is limited. Reply to reserve your place.`,
    ctaText: "Reserve a spot",
    ctaUrl: "{{action_url}}",
  },
  {
    id: "comm-mid-year-check-in",
    title: "Mid-year check-in",
    category: "community",
    subject: "Halfway through the year: how is RoleFlow working for you?",
    tags: ["check-in", "mid-year", "feedback", "community"],
    emoji: "🧭",
    body: `Hi {{name}},

We are halfway through the year, and we wanted to check in. How is RoleFlow working for you? Has it saved you time, helped you think through hard problems, or gotten in your way?

Reply with your honest thoughts. Good or bad, your feedback guides what we focus on for the rest of the year.`,
    ctaText: "Share feedback",
    ctaUrl: "{{action_url}}",
  },
];
