# Quillstone intern test

Quillstone Countertops is a 14-person countertop shop in Edmonton. It's made up for this test. A freelancer built their job system and has moved on, and now it's ours to look after. The owner, Dale, has sent us a list of problems. **Read [CLIENT_EMAIL.md](CLIENT_EMAIL.md) first.**

The code covers three workflows:

- **Email intake** (`src/intake.ts`): customer emails come in overnight, and an AI model turns each one into a lead for the office to review.
- **Booking** (`src/booking.ts`): the office books a crew for each install.
- **Reminders** (`src/reminders.ts`, `src/time.ts`): customers get a text at 9 a.m. the day before their install.

There's no UI on purpose. `npm run morning` plays one morning at the shop so you can see what Dale sees.

## Time

About 2 hours. Stop at 3, even if you're not done. You probably won't fix everything, so pick the order, and tell us why you picked it. Send it back within a week.

## Rules

- Use any AI tools you like. We expect you to, and we care about how you use them.
- Don't rename anything exported from `src/` or change its parameters. We run our own tests against them. Adding things is fine.
- Don't edit `fixtures/`. It's what customers actually sent and what the model actually answered. Fix the code that handles it.
- For each fix, write a test that fails before the fix and passes after.

## Run it

You need Node 24.21 or newer (`nvm install 24`, or nodejs.org). There's nothing to install and no API keys.

```
npm test          # the tests
npm run morning   # one morning at Quillstone
```

`npm install` only adds type definitions for your editor. You don't need it.

## What to send back

1. **Your code** in a private GitHub repo, shared with the username in our email. Commit the starting code as-is first, then at least one commit per fix.
2. **NOTES.md**, one page at most. For each problem you worked on: what caused it, what you changed, and which test proves it. Then what you didn't get to, and what you'd do next.
3. **AI_LOG.md**: the tools you used; two or three places where the AI was wrong or unhelpful, and how you noticed; anything you chose to do without it. Put your chat transcripts in an `ai/` folder or link them. If a tool doesn't keep transcripts, say what you asked it.
4. **REPLY.md**: your reply to Dale, under 150 words, in plain English.

## What we look at

Whether you found the real cause, whether your tests prove the fix, how you worked with the AI, and how clearly you explain things. Not polish.

## After that

A 30-minute video call. You'll walk us through one of your fixes, then fix something small live with your usual tools while sharing your screen.
