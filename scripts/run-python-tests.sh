#!/usr/bin/env bash
# Run the pytest suites for the Python (FastAPI) services.
#
# These services (ai-orchestrator, analytics, memory) are standalone hatchling
# projects. Their unit tests target the pure-logic layers (Pydantic models and
# settings/config), which only need pydantic + pytest, so we provision a small
# dedicated virtualenv instead of installing the full AI/ML dependency tree.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${ROOT_DIR}/.venv"
SERVICES=(
  "${ROOT_DIR}/packages/services/ai-orchestrator-service"
  "${ROOT_DIR}/packages/services/analytics-service"
  "${ROOT_DIR}/packages/services/memory-service"
)

if [ ! -x "${VENV_DIR}/bin/python" ]; then
  echo ">> creating virtualenv at ${VENV_DIR}"
  python3 -m venv "${VENV_DIR}"
fi

echo ">> installing test dependencies"
"${VENV_DIR}/bin/python" -m pip install --quiet --upgrade pip
"${VENV_DIR}/bin/python" -m pip install --quiet \
  "pydantic>=2.5.0" \
  "pydantic-settings>=2.1.0" \
  "pytest>=8.0" \
  "pytest-asyncio>=0.23"

failures=0
for svc in "${SERVICES[@]}"; do
  echo
  echo "=== $(basename "${svc}") ==="
  if ! (cd "${svc}" && "${VENV_DIR}/bin/python" -m pytest tests -q); then
    failures=1
  fi
done

echo
if [ "${failures}" -ne 0 ]; then
  echo "Python tests FAILED"
  exit 1
fi
echo "Python tests passed"
