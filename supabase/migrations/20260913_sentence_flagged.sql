alter table public.cards
add column if not exists sentence_flagged boolean not null default false;

create index if not exists cards_sentence_flagged_idx
on public.cards (sentence_flagged)
where sentence_flagged = true;
