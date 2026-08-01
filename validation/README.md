# Independent validation package

This directory turns `VALIDATION_PROTOCOL.md` into an executable, auditable
benchmark. It intentionally contains **no claimed performance results**. Real
results may be reported only after an independently coded sample has been
completed and the frozen files have been archived.

## Files

- `gold_standard_template.csv`: adjudicated human reference data, including
  the two coders' pre-adjudication decisions.
- `predictions_template.csv`: untouched M-AIDA proposals and verification
  timing for the same `case_id` values.
- `analyze_validation.py`: dependency-free analysis that validates both files
  and writes JSON plus Markdown reports.
- `tests/fixtures/`: synthetic records used only to test the analysis code.

## Run

```bash
python validation/analyze_validation.py \
  --gold validation/gold_standard.csv \
  --predictions validation/predictions.csv \
  --json-out validation/results/validation_metrics.json \
  --markdown-out validation/results/VALIDATION_REPORT.md
```

Copy the templates to the input names shown above. Do not replace the template
files with thesis data. The script rejects duplicate, missing, or unexpected
`case_id` values and never modifies the source CSV files.

The generated report distinguishes machine proposals from PI-verified and
locked data. Passing software tests demonstrates that the metric calculations
work; it does **not** demonstrate that M-AIDA has met the research thresholds.
