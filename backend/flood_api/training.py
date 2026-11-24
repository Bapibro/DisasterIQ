from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path
from typing import Any

import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import GroupShuffleSplit

FEATURES = (
    "rain_1h_mm",
    "rain_24h_mm",
    "rain_forecast_24h_mm",
    "elevation_m",
)
LABEL = "flood_label"
GROUP = "event_id"
MINIMUM_PER_CLASS = 10


def train_from_csv(dataset_path: Path, model_path: Path) -> dict[str, Any]:
    """Train and evaluate only on labeled records, holding complete events out."""
    with dataset_path.open(newline="", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        required = {*FEATURES, LABEL, GROUP}
        missing = required.difference(reader.fieldnames or [])
        if missing:
            raise ValueError(f"Dataset is missing required columns: {', '.join(sorted(missing))}")

        features: list[list[float]] = []
        labels: list[int] = []
        groups: list[str] = []
        for line_number, row in enumerate(reader, start=2):
            try:
                values = [float(row[name]) for name in FEATURES]
                label_value = int(row[LABEL])
                event_id = row[GROUP].strip()
            except (TypeError, ValueError) as error:
                raise ValueError(f"Invalid feature or label on CSV line {line_number}.") from error
            if not all(math.isfinite(value) for value in values):
                raise ValueError(f"Non-finite feature on CSV line {line_number}.")
            if label_value not in (0, 1) or not event_id:
                raise ValueError(f"Invalid flood_label or empty event_id on CSV line {line_number}.")
            features.append(values)
            labels.append(label_value)
            groups.append(event_id)

    class_counts = {label: labels.count(label) for label in (0, 1)}
    if min(class_counts.values()) < MINIMUM_PER_CLASS:
        raise ValueError(
            f"At least {MINIMUM_PER_CLASS} labeled examples of each class are required; "
            f"found no-flood={class_counts[0]}, flood={class_counts[1]}."
        )

    splitter = GroupShuffleSplit(n_splits=100, test_size=0.25, random_state=42)
    selected_split: tuple[Any, Any] | None = None
    for train_indices, test_indices in splitter.split(features, labels, groups):
        train_labels = {labels[index] for index in train_indices}
        test_labels = {labels[index] for index in test_indices}
        if train_labels == {0, 1} and test_labels == {0, 1}:
            selected_split = (train_indices, test_indices)
            break
    if selected_split is None:
        raise ValueError(
            "Could not create an event-separated holdout containing both classes. "
            "Add verified records across more independent events."
        )

    train_indices, test_indices = selected_split
    model = RandomForestClassifier(
        n_estimators=300,
        class_weight="balanced_subsample",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(
        [features[index] for index in train_indices],
        [labels[index] for index in train_indices],
    )
    predictions = model.predict([features[index] for index in test_indices])
    actual = [labels[index] for index in test_indices]
    matrix = confusion_matrix(actual, predictions, labels=[0, 1])

    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)
    return {
        "model": "RandomForestClassifier",
        "features": list(FEATURES),
        "positive_label": "flood",
        "split": "75/25 event-separated holdout",
        "seed": 42,
        "training_rows": len(train_indices),
        "evaluation_rows": len(test_indices),
        "event_groups": len(set(groups)),
        "class_counts": {"no_flood": class_counts[0], "flood": class_counts[1]},
        "precision": precision_score(actual, predictions, zero_division=0),
        "recall": recall_score(actual, predictions, zero_division=0),
        "f1": f1_score(actual, predictions, zero_division=0),
        "confusion_matrix": {
            "labels": ["no_flood", "flood"],
            "rows_actual_columns_predicted": matrix.tolist(),
        },
        "saved_model": str(model_path),
        "warning": "Evaluation metrics apply only to this dataset and held-out event split.",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Train on a verified, labeled flood dataset.")
    parser.add_argument("dataset", type=Path, help="CSV with the documented feature and label columns")
    parser.add_argument("--model-path", type=Path, default=Path("models/flood-risk.joblib"))
    arguments = parser.parse_args()
    try:
        result = train_from_csv(arguments.dataset, arguments.model_path)
    except (OSError, ValueError) as error:
        parser.error(str(error))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
