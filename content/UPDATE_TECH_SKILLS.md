# Task: Generate the technology skills table

Aggregate technology experience from the experience data and write a Markdown
table. This file is the source of truth for the task — follow it exactly.

## Inputs

- Source file: `content/experience.yaml`
- Top-level key: `projects` — a list of entries.
- Each list item is a single-key map. The key is a period label; the labels
  currently present are:
  `2026-04`, `2023`, `2021-07`, `2021-01`, `2020-02`, `2018-06`, `2010-05`.
  (Labels vary — `YYYY` or `YYYY-MM` — so do not rely on them; key off the list
  structure, not the label text.)
- Each entry value is an object with these keys:
  - `company` (string)
  - `title` (string)
  - `url` (string) OR `urls` (list of strings) — some entries use one, some the
    other, and the `2010-05` entry has neither.
  - `period` (string, required for this task): `<start> - <end>`.
    - Dates are `YYYY`, `YYYY-MM`, or `YYYY-MM-DD` (missing month/day default to
      `01`).
    - The end may be an open-ended marker instead of a date: treat any of
      `now`, `till now`, or `present` (case-insensitive) as "ongoing".
  - `location` (string)
  - `description` (multi-line string)
  - `key_technologies` (list of technology name strings; may be absent — treat
    as empty).

Only `period` and `key_technologies` are needed to build the table; the other
keys are documented here so the schema is unambiguous.

## Output

- Target file: `content/TECH_SKILLS.md` (overwrite it completely).
- A Markdown document with a short heading and one table.
- Table columns, in order: `Skill`, `Count`, `Total Months`.

## Processing steps

1. For each entry, compute its duration in whole months:
   - Parse the `period` start and end dates.
   - If the end is an open-ended marker, use the current date as the end.
   - duration = months between start and end, rounded to the nearest whole
     month.
2. Build one record per distinct technology string found across all entries'
   `key_technologies`, as objects:
   `{ skill: <technology>, count: <number of entries it appears in>, total_months: <sum of those entries' durations> }`
   - Match technology names exactly as written (do not normalize case or
     spelling; do not merge near-duplicates). If the source has inconsistent
     names, they remain separate rows.
   - If a technology is listed more than once within the same entry, count each
     occurrence (the `2026-04` entry lists `Containers` twice).
3. Sort the records by `Total Months` descending, then by `skill` ascending
   (case-insensitive) as a tiebreaker.
4. Write the table to the target file.

## Notes for the agent

- `content/projects.yaml` does not exist; the data lives in
  `content/experience.yaml` under the `projects` key. Use that file.
- `js-yaml` is not installed. Either parse the file's regular structure directly
  or install a YAML parser if needed — do not add a dependency silently.
- The source data changes between runs; always re-read it rather than reusing a
  cached result.
- When finished, report: number of entries parsed and number of skills written.
