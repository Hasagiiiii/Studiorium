# Open-source reference matrix

Use this document before designing or refactoring a relevant Studiorium v4 feature. The goal is not to copy products. It is to study the strongest implementation patterns for each responsibility and adapt only what fits Studiorium's domain, contracts and UX.

| Studiorium capability | Primary references | What to study |
| --- | --- | --- |
| Social timeline | mastodon/mastodon, misskey-dev/misskey | timeline composition, filters, actions, threads, visibility, notifications |
| Photo/video publishing | pixelfed/pixelfed | media upload lifecycle, albums, captions, previews, video processing |
| Social profiles | pixelfed/pixelfed, mastodon/mastodon | identity hierarchy, follower relationships, profile tabs, privacy |
| Communities / Reddit-like model | Lemmy implementations, Reddit product behavior | community discovery, ranking, post sorting, vote semantics, comment trees |
| Forum discussions | discourse/discourse | topic lifecycle, replies, moderation, categories, unread/read state, topic controls |
| Lightweight forum UI | flarum/flarum | discussion density, navigation, composer ergonomics, mobile forum UX |
| Realtime community | NodeBB/NodeBB | realtime events, presence, notification flow, topic updates |
| Direct messages | mattermost/mattermost | inbox, unread state, threads, realtime delivery, conversation navigation |
| Notifications | misskey-dev/misskey | notification service boundaries, filtering, grouping, preferences |
| Social bookshelves | bookwyrm-social/bookwyrm | shelf states, reviews, reading activity, book discovery |
| Knowledge base | outline/outline | document hierarchy, permissions, search, collections, sharing |
| Search | meilisearch/meilisearch | ranking, typo tolerance, filters, facets, instant search |
| Projects | makeplane/plane | project activity, status, assignees, progress surfaces |
| Rich text editor | ueberdosis/tiptap | extensible editor model, mentions, links, media, structured content |
| Media pipeline | immich-app/immich | media metadata, thumbnails, background processing, resilient upload |
| Design system | shadcn-ui/ui | component states, spacing, typography, forms, dialogs, menus |
| Moderation | discourse/discourse, mastodon/mastodon, Lemmy implementations | reports, moderation states, auditability, user/content restrictions |

## Working rule

Before a meaningful feature change:

1. Identify the feature responsibility.
2. Check at least one primary reference above and one secondary reference when the feature has significant UX or security implications.
3. Record the useful pattern in the implementation or PR description.
4. Do not copy code without checking license compatibility and architectural fit.
5. Keep business rules in domain/contracts/services rather than reproducing reference-project coupling.
6. Do not expose UI controls for capabilities that do not yet exist server-side.
7. Verify the resulting GitHub commit and production deployment before calling a visible feature complete.

## Current gaps to prioritize

### Communities and discussions

The current public discussion contract still lacks reply counts, score/votes, community identity, richer author identity, pinned/locked state, tags/flairs and ranking metadata. The next backend cuts should add these as explicit contracts rather than fake them in the UI.

### Social publishing

Media contracts exist, but end-to-end upload, processing, persistence and feed rendering must be completed before photo/video publishing is considered implemented.

### Search and discovery

Discovery is still mostly client-side presentation over bootstrap data. A dedicated search contract and ranked backend search should come before advanced Explore filters are treated as complete.
