---
header-includes:
- \usepackage{multicol}
- \newcommand{\hideFromPandoc}[1]{#1}
- \hideFromPandoc{
\let\Begin\begin
\let\End\end
}
---

# Rule 1
Description for rule 1.

\Begin{multicols}{2}
## Good
```c
int foo (void)
{
int i;
}
```

## Bad
```c
int foo (void) {
int i;
}
```
\End{multicols}
